/**
 * WeCom Monitor - 消息处理管道
 *
 * 负责接收企业微信回调，解析消息，并路由到 OpenClaw AI Agent
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import http from "node:http";
import type { WeComAccountConfig, WeComParsedMessage, WeComExtendedConfig } from "./types.js";
import { WeComCrypto } from "./crypto.js";
import { parseMessage, getMessageId, isEventMessage, isGroupMessage, getSessionId, getSenderId } from "./parser.js";
import { WeComApiClient } from "./api.js";
import { shouldRespond, processMessageContent, type MentionConfig } from "./mention.js";
import { isGroupAllowed, isUserAllowedInGroup, groupRequiresMention, DEFAULT_GROUP_CONFIG } from "./group-policy.js";

// OpenClaw imports
import { dispatchReplyWithBufferedBlockDispatcher } from "../../../src/auto-reply/reply/provider-dispatcher.js";
import { resolveEffectiveMessagesConfig } from "../../../src/agents/identity.js";
import { chunkMarkdownText } from "../../../src/auto-reply/chunk.js";
import { resolveAgentRoute } from "../../../src/routing/resolve-route.js";
import { loadConfig } from "../../../src/config/config.js";
import { loadWebMedia } from "../../../src/web/media.js";
import { mediaKindFromMime } from "../../../src/media/constants.js";
import type { MsgContext } from "../../../src/auto-reply/types.js";

// ============================================
// 消息去重
// ============================================
const seenMessages = new Map<string, number>();
const DEDUP_TTL = 5 * 60 * 1000; // 5 分钟

export function isDuplicate(msgId: string | undefined): boolean {
  if (!msgId) return false;
  const now = Date.now();

  // 清理过期消息
  for (const [id, time] of seenMessages) {
    if (now - time > DEDUP_TTL) {
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
  const accountId = `wecom:${accountConfig.corpId}:${accountConfig.agentId}`;
  const client = getApiClient(accountConfig);
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
  const mediaFiles: string[] = [];

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
          mediaFiles.push(filePath);
          content = `[用户发送了一张图片: ${filePath}]`;
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
          mediaFiles.push(filePath);
          content = `[用户发送了一条语音消息: ${filePath}]`;
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
          mediaFiles.push(filePath);
          content = `[用户发送了一个视频: ${filePath}]`;
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
          mediaFiles.push(filePath);
          content = `[用户发送了文件: ${fileName} (${fileSize}), 路径: ${filePath}]`;
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
          // emotionType: 1=gif表情, 2=png表情
          const emotionTypeName = msg.emotionType === 1 ? "GIF" : "PNG";
          console.log(`[WeCom] Downloading ${emotionTypeName} emotion from user ${senderId}...`);
          const filePath = await client.downloadMedia(msg.mediaId);
          mediaFiles.push(filePath);
          content = `[用户发送了${emotionTypeName}表情: ${filePath}]`;
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

  try {
    // 加载 OpenClaw 配置
    const cfg = await loadConfig();

    // 解析路由 - 群聊使用群 ID，单聊使用用户 ID
    const chatType = isGroup ? "group" : "direct";
    const route = resolveAgentRoute({
      cfg,
      channel: "wecom",
      accountId,
      chatId: sessionId,
      chatType,
    });

    console.log(`[WeCom] Route resolved: agentId=${route.agentId}, chatType=${chatType}`);

    // 构建发送者标签 (群聊显示用户 ID，单聊显示用户 ID)
    const senderLabel = isGroup ? `${senderId}@${msg.chatId}` : senderId;

    // 构建消息上下文
    const ctx: MsgContext = {
      Body: content,
      BodyForAgent: content,
      RawBody: content,
      CommandBody: content,
      BodyForCommands: content,
      From: senderId,
      To: accountId,
      SessionKey: `wecom:${sessionId}`,
      AccountId: accountId,
      MessageSid: msg.msgId || `wecom-${Date.now()}`,
      channel: "wecom",
      accountId,
      chatId: sessionId,
      chatType,
      senderId,
      senderLabel,
      messageId: msg.msgId || `wecom-${Date.now()}`,
      timestamp: new Date(msg.createTime * 1000),
      text: content,
      raw: msg,
      // 群聊相关字段
      ...(isGroup && { groupId: msg.chatId }),
      // 添加媒体文件路径供 agent 使用
      ...(mediaFiles.length > 0 && { mediaFiles }),
    };

    // 确定回复目标 (群聊回复到群，单聊回复给用户)
    const replyTarget = isGroup ? msg.chatId! : senderId;

    // 使用 OpenClaw 的消息分发系统
    console.log(`[WeCom] Dispatching to AI agent...`);

    const { queuedFinal } = await dispatchReplyWithBufferedBlockDispatcher({
      ctx,
      cfg,
      dispatcherOptions: {
        responsePrefix: resolveEffectiveMessagesConfig(cfg, route.agentId).responsePrefix,
        deliver: async (payload) => {
          const client = getApiClient(accountConfig);

          // 处理媒体文件
          const mediaUrls = payload.mediaUrls || (payload.mediaUrl ? [payload.mediaUrl] : []);
          if (mediaUrls.length > 0) {
            console.log(`[WeCom] Delivering ${mediaUrls.length} media file(s) to ${replyTarget}...`);
            for (const url of mediaUrls) {
              try {
                // 加载媒体并检测类型
                const media = await loadWebMedia(url);
                const kind = mediaKindFromMime(media.contentType ?? undefined);
                console.log(`[WeCom] Sending ${kind}: ${url.substring(0, 80)}...`);

                let response;
                switch (kind) {
                  case "image":
                    response = await client.sendImageFromUrl(replyTarget, url);
                    break;
                  case "video":
                    response = await client.sendVideoFromUrl(replyTarget, url);
                    break;
                  case "audio":
                    // 企业微信语音需要 AMR 格式，暂时作为文件发送
                    // TODO: 添加音频格式转换支持
                    response = await client.sendFileFromUrl(replyTarget, url, media.fileName);
                    break;
                  case "document":
                  default:
                    response = await client.sendFileFromUrl(replyTarget, url, media.fileName);
                    break;
                }

                if (response.errcode !== 0) {
                  console.error(`[WeCom] ${kind} send failed: [${response.errcode}] ${response.errmsg}`);
                } else {
                  console.log(`[WeCom] ${kind} sent successfully`);
                }
              } catch (mediaErr) {
                console.error(`[WeCom] Media send error:`, mediaErr);
              }
            }
          }

          // 处理文本
          const text = payload.text || "";
          if (text) {
            console.log(`[WeCom] Delivering reply to ${replyTarget}: ${text.substring(0, 100)}...`);

            // 分块发送长消息
            const chunks = chunkMarkdownText(text, 2000);

            for (const chunk of chunks) {
              const response = await client.sendText(replyTarget, chunk);
              if (response.errcode !== 0) {
                throw new Error(`[${response.errcode}] ${response.errmsg}`);
              }
            }

            console.log(`[WeCom] Reply delivered successfully`);
          }
        },
        onError: (err, info) => {
          console.error(`[WeCom] ${info.kind} reply failed:`, err);
        },
      },
      replyOptions: {},
    });

    if (queuedFinal) {
      console.log(`[WeCom] Response queued for ${replyTarget}`);
    } else {
      console.log(`[WeCom] No response generated for message from ${senderId}`);
    }
  } catch (err) {
    console.error("[WeCom] Dispatch failed:", err);

    // 发送错误提示
    const client = getApiClient(accountConfig);
    await client.sendText(
      replyTarget,
      `抱歉，处理消息时出错: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ============================================
// 独立服务器模式 (用于测试或独立部署)
// ============================================
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

        // 解密
        const { message: xml } = config.crypto.decrypt(encrypted);

        // 解析消息
        const msg = parseMessage(xml);

        // 去重
        const msgId = getMessageId(msg);
        if (!isDuplicate(msgId)) {
          // 异步处理消息，不阻塞响应
          Promise.resolve(config.onMessage(msg, xml)).catch((err) => {
            config.onError?.(err);
          });
        }

        // 必须在 5 秒内响应
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("success");
        return;
      }

      res.writeHead(405);
      res.end("Method Not Allowed");
    } catch (error) {
      config.onError?.(error as Error);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });

  return server;
}

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

// ============================================
// 工具函数
// ============================================
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
