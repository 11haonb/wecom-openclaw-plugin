/**
 * WeCom Channel Plugin for OpenClaw
 *
 * 实现 OpenClaw 的 ChannelPlugin 接口
 */
import {
  type ChannelDock,
  type ChannelPlugin,
} from "openclaw/plugin-sdk";
import type { WeComAccountConfig, WeComResolvedAccount, WeComSendMessageResponse } from "./types.js";
import { WeComApiClient } from "./api.js";

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
    supportsThreading: false,
    supportsEditing: false,
    supportsDeleting: false,
    supportsReactions: false,
    supportsReplies: false,
    supportsForwarding: false,
    supportsMedia: true,
    supportsMarkdown: true,
    maxMessageLength: 2048,
  },

  config: {
    /**
     * 列出所有账户 ID
     */
    listAccountIds(): string[] {
      const config = createAccountFromEnv();
      if (!config) {
        return [];
      }
      return [`wecom:${config.corpId}:${config.agentId}`];
    },

    /**
     * 解析账户配置
     */
    resolveAccount(raw: unknown): WeComResolvedAccount | null {
      const config = raw as WeComAccountConfig;

      // 验证必需字段
      if (!config?.corpId || !config?.corpSecret || !config?.agentId) {
        return null;
      }

      if (!config?.callbackToken || !config?.callbackAesKey) {
        return null;
      }

      // 验证 AES Key 长度
      if (config.callbackAesKey.length !== 43) {
        console.warn("[WeCom] Invalid callbackAesKey length, expected 43 characters");
        return null;
      }

      return {
        config,
        corpId: config.corpId,
        agentId: config.agentId,
      };
    },

    /**
     * 获取账户唯一标识
     */
    getAccountId(account: WeComResolvedAccount): string {
      return `wecom:${account.corpId}:${account.agentId}`;
    },

    /**
     * 获取账户显示标签
     */
    getAccountLabel(account: WeComResolvedAccount): string {
      return `WeCom Agent ${account.agentId}`;
    },
  },

  outbound: {
    /**
     * 发送消息
     */
    async send(ctx: {
      account: WeComResolvedAccount;
      target: string;
      content: string;
      options?: {
        markdown?: boolean;
      };
    }): Promise<{
      success: boolean;
      messageId?: string;
      error?: string;
    }> {
      const { account, target, content, options } = ctx;
      const client = getApiClient(account);

      try {
        let response: WeComSendMessageResponse;

        // 根据选项决定发送文本还是 Markdown
        if (options?.markdown) {
          response = await client.sendMarkdown(target, content);
        } else {
          response = await client.sendText(target, content);
        }

        if (response.errcode !== 0) {
          return {
            success: false,
            error: `[${response.errcode}] ${response.errmsg}`,
          };
        }

        return {
          success: true,
          messageId: response.msgid,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },
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
