import http from "node:http";
import { WeComCrypto } from "./crypto.js";
import { parseMessage, getMessageId, isEventMessage } from "./parser.js";
import { WeComApiClient } from "./api.js";
// OpenClaw imports
import { dispatchReplyWithBufferedBlockDispatcher } from "../../../src/auto-reply/reply/provider-dispatcher.js";
import { resolveEffectiveMessagesConfig } from "../../../src/agents/identity.js";
import { chunkMarkdownText } from "../../../src/auto-reply/chunk.js";
import { resolveAgentRoute } from "../../../src/routing/resolve-route.js";
import { loadConfig } from "../../../src/config/config.js";
// ============================================
// 消息去重
// ============================================
const seenMessages = new Map();
const DEDUP_TTL = 5 * 60 * 1000; // 5 分钟
export function isDuplicate(msgId) {
    if (!msgId)
        return false;
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
export function clearDedupCache() {
    seenMessages.clear();
}
// ============================================
// API 客户端缓存
// ============================================
const apiClients = new Map();
export function getApiClient(config) {
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
export function clearApiClientCache() {
    apiClients.clear();
}
// ============================================
// 配置获取
// ============================================
export function getWeComConfig() {
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
export async function handleWeComWebhookRequest(req, res) {
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
    }
    catch (err) {
        console.error("[WeCom] Webhook error:", err);
        if (!res.headersSent) {
            res.writeHead(500);
            res.end("Internal Server Error");
        }
        return true;
    }
}
async function handleRequest(req, res) {
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
        }
        catch (err) {
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
        let xml;
        try {
            const result = crypto.decrypt(encrypted);
            xml = result.message;
        }
        catch (err) {
            console.error("[WeCom] Message decrypt failed:", err);
            res.writeHead(400);
            res.end("Decrypt failed");
            return;
        }
        // 解析消息
        let msg;
        try {
            msg = parseMessage(xml);
        }
        catch (err) {
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
export async function processInboundMessage(accountConfig, msg) {
    // 跳过事件消息
    if (isEventMessage(msg)) {
        console.log(`[WeCom] Event: ${msg.event} from ${msg.fromUserName}`);
        return;
    }
    // 目前只处理文本消息
    if (msg.msgType !== "text" || !msg.content) {
        console.log(`[WeCom] Unsupported message type: ${msg.msgType}`);
        return;
    }
    const userId = msg.fromUserName;
    const content = msg.content.trim();
    const accountId = `wecom:${accountConfig.corpId}:${accountConfig.agentId}`;
    console.log(`[WeCom] Processing message from ${userId}: ${content}`);
    try {
        // 加载 OpenClaw 配置
        const cfg = await loadConfig();
        // 解析路由
        const route = resolveAgentRoute({
            cfg,
            channel: "wecom",
            accountId,
            chatId: userId,
            chatType: "direct",
        });
        console.log(`[WeCom] Route resolved: agentId=${route.agentId}`);
        // 构建消息上下文
        const ctx = {
            Body: content,
            BodyForAgent: content,
            RawBody: content,
            CommandBody: content,
            BodyForCommands: content,
            From: userId,
            To: accountId,
            SessionKey: `wecom:${userId}`,
            AccountId: accountId,
            MessageSid: msg.msgId || `wecom-${Date.now()}`,
            channel: "wecom",
            accountId,
            chatId: userId,
            chatType: "direct",
            senderId: userId,
            senderLabel: userId,
            messageId: msg.msgId || `wecom-${Date.now()}`,
            timestamp: new Date(msg.createTime * 1000),
            text: content,
            raw: msg,
        };
        // 使用 OpenClaw 的消息分发系统
        console.log(`[WeCom] Dispatching to AI agent...`);
        const { queuedFinal } = await dispatchReplyWithBufferedBlockDispatcher({
            ctx,
            cfg,
            dispatcherOptions: {
                responsePrefix: resolveEffectiveMessagesConfig(cfg, route.agentId).responsePrefix,
                deliver: async (payload) => {
                    const client = getApiClient(accountConfig);
                    const text = payload.text || "";
                    console.log(`[WeCom] Delivering reply: ${text.substring(0, 100)}...`);
                    // 分块发送长消息
                    const chunks = chunkMarkdownText(text, 2000);
                    for (const chunk of chunks) {
                        const response = await client.sendText(userId, chunk);
                        if (response.errcode !== 0) {
                            throw new Error(`[${response.errcode}] ${response.errmsg}`);
                        }
                    }
                    console.log(`[WeCom] Reply delivered successfully`);
                },
                onError: (err, info) => {
                    console.error(`[WeCom] ${info.kind} reply failed:`, err);
                },
            },
            replyOptions: {},
        });
        if (queuedFinal) {
            console.log(`[WeCom] Response queued for ${userId}`);
        }
        else {
            console.log(`[WeCom] No response generated for message from ${userId}`);
        }
    }
    catch (err) {
        console.error("[WeCom] Dispatch failed:", err);
        // 发送错误提示
        const client = getApiClient(accountConfig);
        await client.sendText(userId, `抱歉，处理消息时出错: ${err instanceof Error ? err.message : String(err)}`);
    }
}
export function createMonitorServer(config) {
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
        }
        catch (error) {
            config.onError?.(error);
            res.writeHead(500);
            res.end("Internal Server Error");
        }
    });
    return server;
}
export async function startMonitor(accountConfig, onMessage, onError) {
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
function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}
