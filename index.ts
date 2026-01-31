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
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

import { wecomPlugin, wecomDock } from "./src/channel.js";
import { setWeComRuntime } from "./src/runtime.js";
import { handleWeComWebhookRequest, getWeComConfig } from "./src/monitor.js";

/**
 * 插件定义
 */
const plugin: OpenClawPlugin = {
  id: "wecom",
  name: "WeCom",
  description: "OpenClaw WeCom (企业微信) channel plugin",
  configSchema: emptyPluginConfigSchema(),

  register(api) {
    // 设置运行时
    setWeComRuntime(api.runtime);

    // 注册渠道
    api.registerChannel({ plugin: wecomPlugin, dock: wecomDock });

    // 注册 HTTP 处理器
    api.registerHttpHandler(handleWeComWebhookRequest);

    // 检查配置
    const config = getWeComConfig();
    if (config) {
      console.log("[WeCom] Plugin registered");
      console.log(`[WeCom] Corp ID: ${config.corpId}`);
      console.log(`[WeCom] Agent ID: ${config.agentId}`);
      console.log(`[WeCom] Callback path: ${config.callbackPath || "/wecom/callback"}`);
    } else {
      console.warn("[WeCom] Plugin registered but not configured.");
      console.warn("[WeCom] Set environment variables: WECOM_CORP_ID, WECOM_CORP_SECRET, WECOM_AGENT_ID, WECOM_CALLBACK_TOKEN, WECOM_CALLBACK_AES_KEY");
    }
  },
};

export default plugin;

// 导出类型和工具函数，方便外部使用
export { WeComCrypto, generateNonce, getTimestamp } from "./src/crypto.js";
export { WeComApiClient } from "./src/api.js";
export { parseMessage, getMessageId, isEventMessage } from "./src/parser.js";
export { handleWeComWebhookRequest, getWeComConfig, startMonitor, createMonitorServer } from "./src/monitor.js";
export { wecomPlugin, wecomDock } from "./src/channel.js";
export type {
  WeComAccountConfig,
  WeComResolvedAccount,
  WeComParsedMessage,
  WeComMsgType,
  WeComEventType,
  WeComApiResponse,
  WeComTokenResponse,
  WeComSendMessageResponse,
} from "./src/types.js";
