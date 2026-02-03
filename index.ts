/**
 * WeCom OpenClaw Integration
 *
 * Connect your OpenClaw AI agent to WeCom (企业微信)
 *
 * Features:
 * - Message encryption/decryption (AES-256-CBC)
 * - Signature verification (SHA1)
 * - Message deduplication
 * - Full AI agent integration
 * - Remote browser control via Node Host
 * - Multi-account support
 * - Event handling
 * - Mini program integration
 *
 * @see https://github.com/liujinqi/wecom-openclaw-integration
 */
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

import { wecomPlugin, wecomDock } from "./src/channel.js";
import { setWeComRuntime } from "./src/runtime.js";
import { handleWeComWebhookRequest, getWeComConfig, setEventDispatcher } from "./src/monitor.js";
import { dispatchEvent, initDefaultEventHandlers } from "./src/events.js";
import { getAccountManager } from "./src/multi-account.js";
import { loadMiniProgramConfigFromEnv } from "./src/miniprogram.js";

/**
 * 插件定义
 */
const plugin: {
  id: string;
  name: string;
  description: string;
  configSchema: any;
  register: (api: OpenClawPluginApi) => void;
} = {
  id: "wecom-openclaw-integration",
  name: "WeCom",
  description: "OpenClaw WeCom (企业微信) channel plugin",
  configSchema: emptyPluginConfigSchema(),

  register(api: OpenClawPluginApi) {
    // 设置运行时
    setWeComRuntime(api.runtime);

    // 初始化事件处理
    initDefaultEventHandlers();
    setEventDispatcher(dispatchEvent);

    // 加载小程序配置
    loadMiniProgramConfigFromEnv();

    // 注册渠道
    api.registerChannel({ plugin: wecomPlugin, dock: wecomDock });

    // 注册 HTTP 处理器
    api.registerHttpHandler(handleWeComWebhookRequest);

    // 检查配置
    const config = getWeComConfig();
    const accountManager = getAccountManager();

    if (config) {
      console.log("[WeCom] Plugin registered");
      console.log(`[WeCom] Corp ID: ${config.corpId}`);
      console.log(`[WeCom] Agent ID: ${config.agentId}`);
      console.log(`[WeCom] Callback path: ${config.callbackPath || "/wecom/callback"}`);
    } else if (!accountManager.isEmpty) {
      console.log("[WeCom] Plugin registered with multi-account support");
      console.log(`[WeCom] Accounts: ${accountManager.size}`);
      for (const account of accountManager.getAllAccounts()) {
        console.log(`[WeCom]   - ${account.name || account.id} (Agent ID: ${account.config.agentId})`);
      }
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
export { wecomOutbound } from "./src/outbound.js";

// 多账号支持
export {
  WeComAccountManager,
  getAccountManager,
  loadMultiAccountConfigFromEnv,
  type WeComMultiAccountConfig,
  type WeComAccountEntry,
} from "./src/multi-account.js";

// 事件处理
export {
  onEvent,
  offEvent,
  clearEventHandlers,
  dispatchEvent,
  initDefaultEventHandlers,
  setWelcomeMessage,
  registerMenuAction,
  EVENT_TYPE_DESCRIPTIONS,
} from "./src/events.js";

// 小程序集成
export {
  WeComMiniProgramClient,
  createMiniProgramClient,
  registerMiniProgram,
  getMiniProgramConfig,
  getAllMiniProgramConfigs,
  type MiniProgramMessage,
  type MiniProgramCard,
  type MiniProgramNotice,
  type MiniProgramConfig,
} from "./src/miniprogram.js";

// 类型导出
export type {
  WeComAccountConfig,
  WeComResolvedAccount,
  WeComParsedMessage,
  WeComMsgType,
  WeComEventType,
  WeComApiResponse,
  WeComTokenResponse,
  WeComSendMessageResponse,
  WeComExtendedConfig,
  WeComGroupConfig,
} from "./src/types.js";
