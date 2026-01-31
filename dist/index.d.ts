/**
 * WeCom Extension for OpenClaw
 *
 * 企业微信渠道插件，支持：
 * - 消息加解密 (AES-256-CBC)
 * - 签名验证 (SHA1)
 * - 消息去重
 * - 接入 OpenClaw AI Agent
 */
import type { OpenClawPlugin } from "openclaw/plugin-sdk";
/**
 * 插件定义
 */
declare const plugin: OpenClawPlugin;
export default plugin;
export { WeComCrypto, generateNonce, getTimestamp } from "./src/crypto.js";
export { WeComApiClient } from "./src/api.js";
export { parseMessage, getMessageId, isEventMessage } from "./src/parser.js";
export { handleWeComWebhookRequest, getWeComConfig, startMonitor, createMonitorServer } from "./src/monitor.js";
export { wecomPlugin, wecomDock } from "./src/channel.js";
export type { WeComAccountConfig, WeComResolvedAccount, WeComParsedMessage, WeComMsgType, WeComEventType, WeComApiResponse, WeComTokenResponse, WeComSendMessageResponse, } from "./src/types.js";
//# sourceMappingURL=index.d.ts.map