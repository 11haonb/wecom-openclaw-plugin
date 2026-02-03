/**
 * WeCom Channel Plugin for OpenClaw
 *
 * 实现 OpenClaw 的 ChannelPlugin 接口
 */
import {
  type ChannelDock,
  type ChannelPlugin,
  DEFAULT_ACCOUNT_ID,
} from "openclaw/plugin-sdk";
import type { WeComAccountConfig, WeComResolvedAccount, WeComSendMessageResponse } from "./types.js";
import { WeComApiClient } from "./api.js";
import { wecomOutbound } from "./outbound.js";

// ============================================
// API 客户端缓存
// ============================================
const apiClients = new Map<string, WeComApiClient>();

function getApiClient(account: WeComResolvedAccount): WeComApiClient {
  const key = `${account.corpId}:${account.agentId}`;
  let client = apiClients.get(key);
  if (!client) {
    client = new WeComApiClient({
      corpId: account.config.corpId,
      corpSecret: account.config.corpSecret,
      agentId: account.config.agentId,
    });
    apiClients.set(key, client);
  }
  return client;
}

// ============================================
// Channel Dock 定义
// ============================================
export const wecomDock: ChannelDock = {
  id: "wecom",
  capabilities: {
    chatTypes: ["direct"],
    reactions: false,
    media: true,
    threads: false,
    blockStreaming: false,
  },
  outbound: {
    textChunkLimit: 2048,
  },
};

// ============================================
// Channel Plugin 定义
// ============================================
export const wecomPlugin: ChannelPlugin<WeComResolvedAccount> = {
  id: "wecom",

  meta: {
    id: "wecom",
    label: "WeCom",
    selectionLabel: "WeCom (企业微信)",
    detailLabel: "WeCom Bot",
    docsPath: "/channels/wecom",
    docsLabel: "wecom",
    blurb: "企业微信应用消息，支持消息加解密和回调。通过企业微信与 AI 助手对话。",
    systemImage: "building.2",
    aliases: ["wework", "企业微信", "qywx", "weixin-work"],
  },

  capabilities: {
    chatTypes: ["direct", "group"],
    polls: false,
    threads: false,
    media: true,
    reactions: false,
    edit: false,
    reply: false,
  },

  config: {
    listAccountIds: () => [DEFAULT_ACCOUNT_ID],
    resolveAccount: (cfg, accountId) => {
      const config = createAccountFromEnv();

      // Always return an account object, but mark as not configured if missing credentials
      if (!config?.corpId || !config?.corpSecret || !config?.agentId) {
        return {
          accountId: accountId?.trim() || DEFAULT_ACCOUNT_ID,
          enabled: false,
          configured: false,
          config: {
            corpId: "",
            corpSecret: "",
            agentId: 0,
            callbackToken: "",
            callbackAesKey: "",
            callbackPort: 8080,
            callbackPath: "/wecom/callback",
          },
          corpId: "",
          agentId: 0,
        };
      }

      if (!config?.callbackToken || !config?.callbackAesKey) {
        return {
          accountId: accountId?.trim() || DEFAULT_ACCOUNT_ID,
          enabled: false,
          configured: false,
          config,
          corpId: config.corpId,
          agentId: config.agentId,
        };
      }

      // 验证 AES Key 长度
      if (config.callbackAesKey.length !== 43) {
        console.warn("[WeCom] Invalid callbackAesKey length, expected 43 characters");
        return {
          accountId: accountId?.trim() || DEFAULT_ACCOUNT_ID,
          enabled: false,
          configured: false,
          config,
          corpId: config.corpId,
          agentId: config.agentId,
        };
      }

      return {
        accountId: accountId?.trim() || DEFAULT_ACCOUNT_ID,
        enabled: true,
        configured: true,
        config,
        corpId: config.corpId,
        agentId: config.agentId,
      };
    },
    defaultAccountId: () => DEFAULT_ACCOUNT_ID,
  },

  outbound: wecomOutbound,
};

// ============================================
// 辅助函数
// ============================================

/**
 * 从环境变量创建账户配置
 */
export function createAccountFromEnv(): WeComAccountConfig | null {
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

/**
 * 验证账户配置
 */
export function validateAccountConfig(config: WeComAccountConfig): string[] {
  const errors: string[] = [];

  if (!config.corpId) {
    errors.push("corpId is required");
  }

  if (!config.corpSecret) {
    errors.push("corpSecret is required");
  }

  if (!config.agentId || config.agentId <= 0) {
    errors.push("agentId must be a positive integer");
  }

  if (!config.callbackToken) {
    errors.push("callbackToken is required");
  }

  if (!config.callbackAesKey) {
    errors.push("callbackAesKey is required");
  } else if (config.callbackAesKey.length !== 43) {
    errors.push("callbackAesKey must be exactly 43 characters");
  }

  return errors;
}
