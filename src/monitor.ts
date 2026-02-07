/**
 * WeCom Monitor - 消息处理管道
 *
 * 负责接收企业微信回调，解析消息，并路由到 OpenClaw AI Agent
 *
 * Refactored to use only public openclaw/plugin-sdk APIs
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import http from "node:http";
import type { OpenClawConfig, RuntimeEnv, HistoryEntry } from "openclaw/plugin-sdk";
import {
  buildPendingHistoryContextFromMap,
  recordPendingHistoryEntryIfEnabled,
  clearHistoryEntriesIfEnabled,
  DEFAULT_GROUP_HISTORY_LIMIT,
} from "openclaw/plugin-sdk";
import type { WeComAccountConfig, WeComParsedMessage, WeComExtendedConfig } from "./types.js";
import { WeComCrypto } from "./crypto.js";
import { parseMessage, getMessageId, isEventMessage, isGroupMessage, getSessionId, getSenderId } from "./parser.js";
import { WeComApiClient } from "./api.js";
import { shouldRespond, processMessageContent, type MentionConfig } from "./mention.js";
import { isGroupAllowed, isUserAllowedInGroup, groupRequiresMention, DEFAULT_GROUP_CONFIG } from "./group-policy.js";
import { getWeComRuntime } from "./runtime.js";
import { createWeComReplyDispatcher } from "./reply-dispatcher.js";

// ============================================
// 消息去重
// ============================================
const seenMessages = new Map<string, number>();
const DEDUP_TTL = 5 * 60 * 1000; // 5 分钟
const DEDUP_MAX_SIZE = 10000; // 最大缓存数量

export function isDuplicate(msgId: string | undefined): boolean {
  if (!msgId) return false;
  const now = Date.now();

  // 清理过期消息
  for (const [id, time] of seenMessages) {
    if (now - time > DEDUP_TTL) {
      seenMessages.delete(id);
    }
  }

  // 防止内存泄漏：如果缓存过大，清理最旧的条目
  if (seenMessages.size >= DEDUP_MAX_SIZE) {
    const entries = Array.from(seenMessages.entries());
    entries.sort((a, b) => a[1] - b[1]);
    const toDelete = entries.slice(0, Math.floor(DEDUP_MAX_SIZE / 2));
    for (const [id] of toDelete) {
      seenMessages.delete(id);
    }
  }

  if (seenMessages.has(msgId)) {
    return true;
  }

  seenMessages.set(msgId, now);
  return false;
}

export function clearDedupCache(): void {
  seenMessages.clear();
}

// ============================================
// API 客户端缓存
// ============================================
const apiClients = new Map<string, WeComApiClient>();

export function getApiClient(config: WeComAccountConfig): WeComApiClient {
  const key = `${config.corpId}:${config.agentId}`;
  let client = apiClients.get(key);
  if (!client) {
    client = new WeComApiClient({
      corpId: config.corpId,
      corpSecret: config.corpSecret,
      agentId: config.agentId,
    });
    apiClients.set(key, client);
  }
  return client;
}

export function clearApiClientCache(): void {
  apiClients.clear();
}

// ============================================
// 配置获取
// ============================================
export function getWeComConfig(): WeComAccountConfig | null {
  const corpId = process.env.WECOM_CORP_ID;
  const corpSecret = process.env.WECOM_CORP_SECRET;
  const agentId = process.env.WECOM_AGENT_ID;
  const callbackToken = process.env.WECOM_CALLBACK_TOKEN;
  const callbackAesKey = process.env.WECOM_CALLBACK_AES_KEY;

  if (!corpId || !corpSecret || !agentId || !callbackToken || !callbackAesKey) {
    return null;
  }

  return {
    corpId,
    corpSecret,
    agentId: parseInt(agentId, 10),
    callbackToken,
    callbackAesKey,
    callbackPort: parseInt(process.env.WECOM_CALLBACK_PORT || "8080", 10),
    callbackPath: process.env.WECOM_CALLBACK_PATH || "/wecom/callback",
  };
}

// ============================================
// HTTP Webhook 处理器 (用于 OpenClaw 插件系统)
// ============================================
export async function handleWeComWebhookRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const urlStr = req.url || "/";

  // 健康检查
  if (urlStr.startsWith("/wecom/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      channel: "wecom",
      timestamp: new Date().toISOString()
    }));
    return true;
  }

  // 只处理 /wecom/callback 路径
  if (!urlStr.startsWith("/wecom/callback")) {
    return false;
  }

  // 处理请求
  try {
    await handleRequest(req, res);
    return true;
  } catch (err) {
    console.error("[WeCom] Webhook error:", err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end("Internal Server Error");
    }
    return true;
  }
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  // 获取配置
  const config = getWeComConfig();
  if (!config) {
    console.error("[WeCom] Not configured. Set WECOM_* environment variables.");
    res.writeHead(500);
    res.end("WeCom not configured");
    return;
  }

  const crypto = new WeComCrypto({
    token: config.callbackToken,
    aesKey: config.callbackAesKey,
    corpId: config.corpId,
  });

  const msgSignature = url.searchParams.get("msg_signature") || "";
  const timestamp = url.searchParams.get("timestamp") || "";
  const nonce = url.searchParams.get("nonce") || "";
  const echostr = url.searchParams.get("echostr") || "";

  // GET: URL 验证（企业微信后台配置回调时的验证请求）
  if (req.method === "GET") {
    if (!crypto.verifySignature(msgSignature, timestamp, nonce, echostr)) {
      console.warn("[WeCom] URL verification failed: invalid signature");
      res.writeHead(403);
      res.end("Invalid Signature");
      return;
    }

    try {
      const { message } = crypto.decrypt(echostr);
      console.log("[WeCom] URL verification successful");
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(message);
    } catch (err) {
      console.error("[WeCom] URL verification decrypt failed:", err);
      res.writeHead(400);
      res.end("Decrypt failed");
    }
    return;
  }

  // POST: 消息接收
  if (req.method === "POST") {
    const body = await readBody(req);

    // 提取加密内容
    const encryptMatch = body.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/);
    if (!encryptMatch) {
      console.warn("[WeCom] Invalid message format: no Encrypt field");
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }

    const encrypted = encryptMatch[1];

    // 验证签名
    if (!crypto.verifySignature(msgSignature, timestamp, nonce, encrypted)) {
      console.warn("[WeCom] Message signature verification failed");
      res.writeHead(403);
      res.end("Invalid Signature");
      return;
    }

    // 解密消息
    let xml: string;
    try {
      const result = crypto.decrypt(encrypted);
      xml = result.message;
    } catch (err) {
      console.error("[WeCom] Message decrypt failed:", err);
      res.writeHead(400);
      res.end("Decrypt failed");
      return;
    }

    // 解析消息
    let msg: WeComParsedMessage;
    try {
      msg = parseMessage(xml);
    } catch (err) {
      console.error("[WeCom] Message parse failed:", err);
      res.writeHead(400);
      res.end("Parse failed");
      return;
    }

    const msgId = getMessageId(msg);

    // 必须在 5 秒内响应，先返回 success
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("success");

    // 去重检查
    if (isDuplicate(msgId)) {
      console.log(`[WeCom] Duplicate message ignored: ${msgId}`);
      return;
    }

    // 异步处理消息
    processInboundMessage(config, msg).catch((err) => {
      console.error("[WeCom] Error processing message:", err);
    });
    return;
  }

  res.writeHead(405);
  res.end("Method Not Allowed");
}

// ============================================
// 消息处理核心
// ============================================
export interface ProcessMessageOptions {
  /** 扩展配置 (群聊策略等) */
  extendedConfig?: WeComExtendedConfig;
  /** 是否处理事件消息 */
  handleEvents?: boolean;
  /** OpenClaw 配置 */
  cfg?: OpenClawConfig;
  /** Runtime 环境 */
  runtime?: RuntimeEnv;
  /** 聊天历史记录 */
  chatHistories?: Map<string, HistoryEntry[]>;
}

// 事件处理器 (延迟导入避免循环依赖)
let eventDispatcher: ((msg: WeComParsedMessage, config: WeComAccountConfig) => Promise<void>) | null = null;

/**
 * 设置事件分发器
 */
export function setEventDispatcher(
  dispatcher: (msg: WeComParsedMessage, config: WeComAccountConfig) => Promise<void>
): void {
  eventDispatcher = dispatcher;
}

export async function processInboundMessage(
  accountConfig: WeComAccountConfig,
  msg: WeComParsedMessage,
  options: ProcessMessageOptions = {}
): Promise<void> {
  // 处理事件消息
  if (isEventMessage(msg)) {
    console.log(`[WeCom] Event: ${msg.event} from ${msg.fromUserName}`);
    if (options.handleEvents !== false && eventDispatcher) {
      try {
        await eventDispatcher(msg, accountConfig);
      } catch (err) {
        console.error(`[WeCom] Event dispatch error:`, err);
      }
    }
    return;
  }

  const senderId = getSenderId(msg);
  const sessionId = getSessionId(msg);
  const isGroup = isGroupMessage(msg);
  const extConfig = options.extendedConfig;

  // 群聊日志
  if (isGroup) {
    console.log(`[WeCom] Group message from ${senderId} in group ${msg.chatId}`);

    // 群聊访问控制检查
    if (msg.chatId && !isGroupAllowed(msg.chatId, extConfig)) {
      console.log(`[WeCom] Group ${msg.chatId} is not allowed, ignoring message`);
      return;
    }

    // 用户访问控制检查
    if (msg.chatId && !isUserAllowedInGroup(senderId, msg.chatId, extConfig)) {
      console.log(`[WeCom] User ${senderId} is not allowed in group ${msg.chatId}, ignoring message`);
      return;
    }
  }

  // 构建提及配置
  const mentionConfig: MentionConfig = {
    botName: extConfig?.botName ?? DEFAULT_GROUP_CONFIG.botName,
    botAliases: extConfig?.botAliases ?? DEFAULT_GROUP_CONFIG.botAliases,
  };

  // 群聊 @提及检测
  const requireMention = isGroup && msg.chatId ? groupRequiresMention(msg.chatId, extConfig) : false;

  // 检查是否需要响应
  const rawContent = msg.content?.trim() || "";
  if (isGroup && !shouldRespond(rawContent, isGroup, requireMention, mentionConfig)) {
    console.log(`[WeCom] Group message ignored (no mention): ${rawContent.substring(0, 50)}`);
    return;
  }

  // 处理不同类型的消息
  let content = "";
  const mediaPayloads: Array<{ kind: string; url?: string; buffer?: Buffer; contentType?: string }> = [];

  const client = getApiClient(accountConfig);

  switch (msg.msgType) {
    case "text":
      // 处理文本内容，移除 @提及
      content = processMessageContent(msg.content?.trim() || "", isGroup, mentionConfig);
      break;

    case "image":
      if (msg.mediaId) {
        try {
          console.log(`[WeCom] Downloading image from user ${senderId}...`);
          const filePath = await client.downloadMedia(msg.mediaId);
          content = `[用户发送了一张图片]`;
          mediaPayloads.push({ kind: "image", url: filePath });
          console.log(`[WeCom] Image downloaded: ${filePath}`);
        } catch (err) {
          console.error(`[WeCom] Failed to download image:`, err);
          content = "[用户发送了一张图片，但下载失败]";
        }
      }
      break;

    case "voice":
      if (msg.mediaId) {
        try {
          console.log(`[WeCom] Downloading voice from user ${senderId}...`);
          const filePath = await client.downloadMedia(msg.mediaId);
          content = `[用户发送了一条语音消息]`;
          mediaPayloads.push({ kind: "audio", url: filePath });
          console.log(`[WeCom] Voice downloaded: ${filePath}`);
        } catch (err) {
          console.error(`[WeCom] Failed to download voice:`, err);
          content = "[用户发送了一条语音消息，但下载失败]";
        }
      }
      break;

    case "video":
      if (msg.mediaId) {
        try {
          console.log(`[WeCom] Downloading video from user ${senderId}...`);
          const filePath = await client.downloadMedia(msg.mediaId);
          content = `[用户发送了一个视频]`;
          mediaPayloads.push({ kind: "video", url: filePath });
          console.log(`[WeCom] Video downloaded: ${filePath}`);
        } catch (err) {
          console.error(`[WeCom] Failed to download video:`, err);
          content = "[用户发送了一个视频，但下载失败]";
        }
      }
      break;

    case "file":
      if (msg.mediaId) {
        try {
          const fileName = msg.fileName || "未知文件";
          const fileSize = msg.fileSize ? `${Math.round(msg.fileSize / 1024)}KB` : "未知大小";
          console.log(`[WeCom] Downloading file from user ${senderId}: ${fileName} (${fileSize})...`);
          const filePath = await client.downloadMedia(msg.mediaId);
          content = `[用户发送了文件: ${fileName} (${fileSize})]`;
          mediaPayloads.push({ kind: "document", url: filePath });
          console.log(`[WeCom] File downloaded: ${filePath}`);
        } catch (err) {
          console.error(`[WeCom] Failed to download file:`, err);
          content = `[用户发送了文件: ${msg.fileName || "未知文件"}，但下载失败]`;
        }
      }
      break;

    case "location":
      content = `[用户发送了位置: ${msg.label || "未知位置"}, 坐标: (${msg.locationX}, ${msg.locationY})]`;
      break;

    case "link":
      content = `[用户发送了链接: ${msg.title || "无标题"} - ${msg.url || "无URL"}]`;
      break;

    case "emotion":
      if (msg.mediaId) {
        try {
          const emotionTypeName = msg.emotionType === 1 ? "GIF" : "PNG";
          console.log(`[WeCom] Downloading ${emotionTypeName} emotion from user ${senderId}...`);
          const filePath = await client.downloadMedia(msg.mediaId);
          content = `[用户发送了${emotionTypeName}表情]`;
          mediaPayloads.push({ kind: "image", url: filePath });
          console.log(`[WeCom] Emotion downloaded: ${filePath}`);
        } catch (err) {
          console.error(`[WeCom] Failed to download emotion:`, err);
          content = "[用户发送了一个表情，但下载失败]";
        }
      } else {
        content = "[用户发送了一个表情]";
      }
      break;

    default:
      console.log(`[WeCom] Unsupported message type: ${msg.msgType}`);
      return;
  }

  if (!content) {
    console.log(`[WeCom] Empty message content, skipping`);
    return;
  }

  console.log(`[WeCom] Processing ${msg.msgType} message from ${senderId}${isGroup ? ` in group ${msg.chatId}` : ""}: ${content.substring(0, 100)}`);

  // 群聊必须有 chatId
  if (isGroup && !msg.chatId) {
    console.error("[WeCom] Group message missing chatId, skipping");
    return;
  }

  try {
    const core = getWeComRuntime();
    const cfg = options.cfg ?? await loadConfigFromRuntime(core);
    const runtime = options.runtime ?? createRuntimeFromCore(core);

    // 确定回复目标 (群聊回复到群，单聊回复给用户)
    // 注意：群聊时 msg.chatId 已在上面校验过不为空
    const replyTarget: string = isGroup ? msg.chatId! : senderId;

    // WeCom 标识符
    const wecomFrom = `wecom:${senderId}`;
    const wecomTo = isGroup ? `chat:${msg.chatId}` : `user:${senderId}`;

    // 解析路由
    const route = core.channel.routing.resolveAgentRoute({
      cfg,
      channel: "wecom",
      peer: {
        kind: isGroup ? "group" : "dm",
        id: isGroup ? msg.chatId : senderId,
      },
    });

    console.log(`[WeCom] Route resolved: agentId=${route.agentId}, sessionKey=${route.sessionKey}`);

    const preview = content.replace(/\s+/g, " ").slice(0, 160);
    const inboundLabel = isGroup
      ? `WeCom message in group ${msg.chatId}`
      : `WeCom DM from ${senderId}`;

    core.system.enqueueSystemEvent(`${inboundLabel}: ${preview}`, {
      sessionKey: route.sessionKey,
      contextKey: `wecom:message:${sessionId}:${msg.msgId}`,
    });

    // 格式化消息体
    const envelopeOptions = core.channel.reply.resolveEnvelopeFormatOptions(cfg);
    const speaker = senderId;
    let messageBody = `${speaker}: ${content}`;

    const envelopeFrom = isGroup ? `${msg.chatId}:${senderId}` : senderId;

    const body = core.channel.reply.formatAgentEnvelope({
      channel: "WeCom",
      from: envelopeFrom,
      timestamp: new Date(msg.createTime * 1000),
      envelope: envelopeOptions,
      body: messageBody,
    });

    // 处理群聊历史记录
    let combinedBody = body;
    const historyKey = isGroup ? msg.chatId : undefined;
    const chatHistories = options.chatHistories ?? new Map<string, HistoryEntry[]>();
    const historyLimit = DEFAULT_GROUP_HISTORY_LIMIT;

    if (isGroup && historyKey && chatHistories) {
      combinedBody = buildPendingHistoryContextFromMap({
        historyMap: chatHistories,
        historyKey,
        limit: historyLimit,
        currentMessage: combinedBody,
        formatEntry: (entry) =>
          core.channel.reply.formatAgentEnvelope({
            channel: "WeCom",
            from: `${msg.chatId}:${entry.sender}`,
            timestamp: entry.timestamp,
            body: entry.body,
            envelope: envelopeOptions,
          }),
      });
    }

    // 构建上下文
    const ctxPayload = core.channel.reply.finalizeInboundContext({
      Body: combinedBody,
      RawBody: rawContent,
      CommandBody: content,
      From: wecomFrom,
      To: wecomTo,
      SessionKey: route.sessionKey,
      AccountId: route.accountId,
      ChatType: isGroup ? "group" : "direct",
      GroupSubject: isGroup ? msg.chatId : undefined,
      SenderName: senderId,
      SenderId: senderId,
      Provider: "wecom" as const,
      Surface: "wecom" as const,
      MessageSid: msg.msgId || `wecom-${Date.now()}`,
      Timestamp: msg.createTime * 1000,
      WasMentioned: isGroup && requireMention,
      CommandAuthorized: true,
      OriginatingChannel: "wecom" as const,
      OriginatingTo: wecomTo,
      Media: mediaPayloads.length > 0 ? mediaPayloads : undefined,
    });

    // 创建回复分发器
    const { dispatcher, replyOptions, markDispatchIdle } = createWeComReplyDispatcher({
      cfg,
      agentId: route.agentId,
      runtime,
      accountConfig,
      replyTarget,
    });

    console.log(`[WeCom] Dispatching to agent (session=${route.sessionKey})`);

    // 分发到 AI 代理
    const { queuedFinal, counts } = await core.channel.reply.dispatchReplyFromConfig({
      ctx: ctxPayload,
      cfg,
      dispatcher,
      replyOptions,
    });

    markDispatchIdle();

    // 记录历史
    if (isGroup && historyKey) {
      recordPendingHistoryEntryIfEnabled({
        historyMap: chatHistories,
        historyKey,
        limit: historyLimit,
        entry: {
          sender: senderId,
          body: content,
          timestamp: msg.createTime * 1000,
        },
      });

      if (queuedFinal) {
        clearHistoryEntriesIfEnabled({
          historyMap: chatHistories,
          historyKey,
          limit: historyLimit,
        });
      }
    }

    if (queuedFinal) {
      console.log(`[WeCom] Response queued for ${replyTarget}, counts:`, counts);
    } else {
      console.log(`[WeCom] No response generated for message from ${senderId}`);
    }
  } catch (err) {
    console.error("[WeCom] Dispatch failed:", err);

    // 发送错误提示
    const client = getApiClient(accountConfig);
    const replyTarget = isGroup ? msg.chatId! : senderId;
    await client.sendText(
      replyTarget,
      `抱歉，处理消息时出错: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ============================================
// 辅助函数
// ============================================
async function readBody(req: IncomingMessage): Promise<string> {
  const MAX_BODY_SIZE = 1024 * 1024; // 1MB
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error("Request body too large"));
        return;
      }
      body += chunk.toString();
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", reject);
  });
}

async function loadConfigFromRuntime(core: any): Promise<OpenClawConfig> {
  // Try legacy API: core.config.get() (older versions)
  if (core?.config?.get) {
    try {
      return await core.config.get();
    } catch (err) {
      console.warn("[WeCom] Failed to load config from runtime via config.get():", err);
    }
  }

  // Try current PluginRuntime API: core.config.loadConfig() (sync)
  if (core?.config?.loadConfig) {
    try {
      return core.config.loadConfig();
    } catch (err) {
      console.warn("[WeCom] Failed to load config from runtime via config.loadConfig():", err);
    }
  }

  // 尝试从 runtime.cfg 获取
  if (core?.cfg) {
    return core.cfg;
  }

  // 从环境变量构建基本配置
  const config: OpenClawConfig = {
    env: {},
    agents: {
      defaults: {
        model: {
          primary: process.env.OPENROUTER_API_KEY
            ? "openrouter/qwen/qwen3-max"
            : process.env.OPENAI_API_KEY
              ? "openai/gpt-4o"
              : "anthropic/claude-sonnet-4-5-20251101",
        },
      },
    },
    gateway: {
      mode: "local",
      bind: "lan",
      port: 18789,
    },
  } as OpenClawConfig;

  return config;
}

function createRuntimeFromCore(core: any): RuntimeEnv {
  // 如果 core 已经是完整的 RuntimeEnv，直接返回
  if (core?.log && core?.error && core?.channel) {
    return core as RuntimeEnv;
  }

  // 从 core 构建 RuntimeEnv
  return {
    log: core?.log ?? console.log,
    error: core?.error ?? console.error,
    warn: core?.warn ?? console.warn,
    debug: core?.debug ?? console.debug,
    channel: core?.channel,
    config: core?.config,
    system: core?.system,
  } as RuntimeEnv;
}

// ============================================
// 独立服务器模式 (用于测试或独立部署)
// ============================================

/**
 * 启动独立的 WeCom 回调监听服务器
 * 用于测试或独立部署场景
 */
export async function startMonitor(
  accountConfig: WeComAccountConfig,
  onMessage: (msg: WeComParsedMessage, rawXml: string) => void | Promise<void>,
  onError?: (error: Error) => void
): Promise<http.Server> {
  const crypto = new WeComCrypto({
    token: accountConfig.callbackToken,
    aesKey: accountConfig.callbackAesKey,
    corpId: accountConfig.corpId,
  });

  const port = accountConfig.callbackPort || 8080;
  const path = accountConfig.callbackPath || "/wecom/callback";

  const server = createMonitorServer({
    port,
    path,
    crypto,
    onMessage,
    onError,
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, "0.0.0.0", () => {
      console.log(`[WeCom] Callback server started on port ${port}`);
      resolve(server);
    });
  });
}

export interface MonitorConfig {
  port: number;
  path: string;
  crypto: WeComCrypto;
  onMessage: (msg: WeComParsedMessage, rawXml: string) => void | Promise<void>;
  onError?: (error: Error) => void;
}

export function createMonitorServer(config: MonitorConfig): http.Server {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);

      // 健康检查
      if (url.pathname === "/health" || url.pathname === "/wecom/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", channel: "wecom", timestamp: new Date().toISOString() }));
        return;
      }

      // 回调路径检查
      if (url.pathname !== config.path) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const msgSignature = url.searchParams.get("msg_signature") || "";
      const timestamp = url.searchParams.get("timestamp") || "";
      const nonce = url.searchParams.get("nonce") || "";
      const echostr = url.searchParams.get("echostr") || "";

      // GET: URL 验证
      if (req.method === "GET") {
        if (!config.crypto.verifySignature(msgSignature, timestamp, nonce, echostr)) {
          res.writeHead(403);
          res.end("Invalid Signature");
          return;
        }

        const { message } = config.crypto.decrypt(echostr);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(message);
        return;
      }

      // POST: 消息接收
      if (req.method === "POST") {
        const body = await readBody(req);

        // 提取加密内容
        const encryptMatch = body.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/);
        if (!encryptMatch) {
          res.writeHead(400);
          res.end("Bad Request");
          return;
        }

        const encrypted = encryptMatch[1];

        // 验证签名
        if (!config.crypto.verifySignature(msgSignature, timestamp, nonce, encrypted)) {
          res.writeHead(403);
          res.end("Invalid Signature");
          return;
        }

        // 解密消息
        const { message: xml } = config.crypto.decrypt(encrypted);

        // 解析消息
        const msg = parseMessage(xml);

        // 必须在 5 秒内响应
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("success");

        // 异步处理消息
        Promise.resolve(config.onMessage(msg, xml)).catch((err) => {
          if (config.onError) {
            config.onError(err);
          } else {
            console.error("[WeCom] Message handler error:", err);
          }
        });
        return;
      }

      res.writeHead(405);
      res.end("Method Not Allowed");
    } catch (err) {
      console.error("[WeCom] Server error:", err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Internal Server Error");
      }
      if (config.onError) {
        config.onError(err as Error);
      }
    }
  });

  return server;
}
