/**
 * WeCom 多账号支持
 *
 * 支持同时运行多个企业微信应用，每个应用有独立的配置
 */

import type { WeComAccountConfig, WeComExtendedConfig } from "./types.js";
import { WeComCrypto } from "./crypto.js";
import { WeComApiClient } from "./api.js";

/**
 * 多账号配置
 */
export interface WeComMultiAccountConfig {
  /** 账号列表 */
  accounts: WeComAccountEntry[];
  /** 默认账号 ID (可选) */
  defaultAccountId?: string;
}

/**
 * 单个账号配置
 */
export interface WeComAccountEntry {
  /** 账号 ID (唯一标识) */
  id: string;
  /** 账号名称 (显示用) */
  name?: string;
  /** 账号配置 */
  config: WeComAccountConfig;
  /** 扩展配置 */
  extendedConfig?: WeComExtendedConfig;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 账号管理器
 */
export class WeComAccountManager {
  private accounts = new Map<string, WeComAccountEntry>();
  private cryptoCache = new Map<string, WeComCrypto>();
  private clientCache = new Map<string, WeComApiClient>();
  private defaultAccountId?: string;

  constructor(config?: WeComMultiAccountConfig) {
    if (config) {
      this.loadConfig(config);
    }
  }

  /**
   * 加载配置
   */
  loadConfig(config: WeComMultiAccountConfig): void {
    this.accounts.clear();
    this.cryptoCache.clear();
    this.clientCache.clear();

    for (const entry of config.accounts) {
      if (entry.enabled !== false) {
        this.accounts.set(entry.id, entry);
      }
    }

    this.defaultAccountId = config.defaultAccountId;
  }

  /**
   * 添加账号
   */
  addAccount(entry: WeComAccountEntry): void {
    this.accounts.set(entry.id, entry);
    // 清除缓存
    this.cryptoCache.delete(entry.id);
    this.clientCache.delete(entry.id);
  }

  /**
   * 移除账号
   */
  removeAccount(accountId: string): boolean {
    this.cryptoCache.delete(accountId);
    this.clientCache.delete(accountId);
    return this.accounts.delete(accountId);
  }

  /**
   * 获取账号
   */
  getAccount(accountId: string): WeComAccountEntry | undefined {
    return this.accounts.get(accountId);
  }

  /**
   * 获取默认账号
   */
  getDefaultAccount(): WeComAccountEntry | undefined {
    if (this.defaultAccountId) {
      return this.accounts.get(this.defaultAccountId);
    }
    // 返回第一个账号
    return this.accounts.values().next().value;
  }

  /**
   * 获取所有账号
   */
  getAllAccounts(): WeComAccountEntry[] {
    return Array.from(this.accounts.values());
  }

  /**
   * 根据 AgentId 查找账号
   */
  findByAgentId(agentId: number): WeComAccountEntry | undefined {
    for (const entry of this.accounts.values()) {
      if (entry.config.agentId === agentId) {
        return entry;
      }
    }
    return undefined;
  }

  /**
   * 根据 CorpId 查找账号
   */
  findByCorpId(corpId: string): WeComAccountEntry[] {
    const results: WeComAccountEntry[] = [];
    for (const entry of this.accounts.values()) {
      if (entry.config.corpId === corpId) {
        results.push(entry);
      }
    }
    return results;
  }

  /**
   * 根据 CorpId 和 AgentId 查找账号
   */
  findByCorpAndAgent(corpId: string, agentId: number): WeComAccountEntry | undefined {
    for (const entry of this.accounts.values()) {
      if (entry.config.corpId === corpId && entry.config.agentId === agentId) {
        return entry;
      }
    }
    return undefined;
  }

  /**
   * 获取加密器
   */
  getCrypto(accountId: string): WeComCrypto | undefined {
    let crypto = this.cryptoCache.get(accountId);
    if (crypto) return crypto;

    const entry = this.accounts.get(accountId);
    if (!entry) return undefined;

    crypto = new WeComCrypto({
      token: entry.config.callbackToken,
      aesKey: entry.config.callbackAesKey,
      corpId: entry.config.corpId,
    });
    this.cryptoCache.set(accountId, crypto);
    return crypto;
  }

  /**
   * 获取 API 客户端
   */
  getClient(accountId: string): WeComApiClient | undefined {
    let client = this.clientCache.get(accountId);
    if (client) return client;

    const entry = this.accounts.get(accountId);
    if (!entry) return undefined;

    client = new WeComApiClient({
      corpId: entry.config.corpId,
      corpSecret: entry.config.corpSecret,
      agentId: entry.config.agentId,
    });
    this.clientCache.set(accountId, client);
    return client;
  }

  /**
   * 账号数量
   */
  get size(): number {
    return this.accounts.size;
  }

  /**
   * 是否为空
   */
  get isEmpty(): boolean {
    return this.accounts.size === 0;
  }
}

/**
 * 从环境变量加载多账号配置
 *
 * 支持两种格式:
 * 1. 单账号: WECOM_CORP_ID, WECOM_CORP_SECRET, ...
 * 2. 多账号: WECOM_ACCOUNTS (JSON 数组)
 */
export function loadMultiAccountConfigFromEnv(): WeComMultiAccountConfig {
  const accounts: WeComAccountEntry[] = [];

  // 尝试加载 JSON 格式的多账号配置
  const accountsJson = process.env.WECOM_ACCOUNTS;
  if (accountsJson) {
    try {
      const parsed = JSON.parse(accountsJson);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (isValidAccountConfig(item)) {
            accounts.push({
              id: item.id || `${item.corpId}:${item.agentId}`,
              name: item.name,
              config: {
                corpId: item.corpId,
                corpSecret: item.corpSecret,
                agentId: typeof item.agentId === "string" ? parseInt(item.agentId, 10) : item.agentId,
                callbackToken: item.callbackToken,
                callbackAesKey: item.callbackAesKey,
                callbackPort: item.callbackPort,
                callbackPath: item.callbackPath,
              },
              extendedConfig: item.extendedConfig,
              enabled: item.enabled !== false,
            });
          }
        }
      }
    } catch (err) {
      console.error("[WeCom] Failed to parse WECOM_ACCOUNTS:", err);
    }
  }

  // 加载单账号配置 (兼容旧格式)
  const corpId = process.env.WECOM_CORP_ID;
  const corpSecret = process.env.WECOM_CORP_SECRET;
  const agentId = process.env.WECOM_AGENT_ID;
  const callbackToken = process.env.WECOM_CALLBACK_TOKEN;
  const callbackAesKey = process.env.WECOM_CALLBACK_AES_KEY;

  if (corpId && corpSecret && agentId && callbackToken && callbackAesKey) {
    const agentIdNum = parseInt(agentId, 10);
    const accountId = `${corpId}:${agentIdNum}`;

    // 检查是否已存在
    const exists = accounts.some((a) => a.id === accountId);
    if (!exists) {
      accounts.push({
        id: accountId,
        name: process.env.WECOM_ACCOUNT_NAME || "Default",
        config: {
          corpId,
          corpSecret,
          agentId: agentIdNum,
          callbackToken,
          callbackAesKey,
          callbackPort: parseInt(process.env.WECOM_CALLBACK_PORT || "8080", 10),
          callbackPath: process.env.WECOM_CALLBACK_PATH || "/wecom/callback",
        },
        enabled: true,
      });
    }
  }

  return {
    accounts,
    defaultAccountId: process.env.WECOM_DEFAULT_ACCOUNT,
  };
}

function isValidAccountConfig(item: any): boolean {
  return (
    item &&
    typeof item.corpId === "string" &&
    typeof item.corpSecret === "string" &&
    (typeof item.agentId === "number" || typeof item.agentId === "string") &&
    typeof item.callbackToken === "string" &&
    typeof item.callbackAesKey === "string"
  );
}

/**
 * 全局账号管理器实例
 */
let globalManager: WeComAccountManager | null = null;

/**
 * 获取全局账号管理器
 */
export function getAccountManager(): WeComAccountManager {
  if (!globalManager) {
    globalManager = new WeComAccountManager(loadMultiAccountConfigFromEnv());
  }
  return globalManager;
}

/**
 * 重置全局账号管理器
 */
export function resetAccountManager(): void {
  globalManager = null;
}
