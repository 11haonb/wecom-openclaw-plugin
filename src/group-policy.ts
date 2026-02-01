/**
 * WeCom 群策略配置
 *
 * 管理群聊的访问控制和响应策略
 */

import type { WeComExtendedConfig, WeComGroupConfig } from "./types.js";

/**
 * 默认群策略配置
 */
export const DEFAULT_GROUP_CONFIG: Partial<WeComExtendedConfig> = {
  // 群聊默认需要 @提及才响应
  groupRequireMention: true,
  // 默认机器人名称
  botName: "助手",
  botAliases: ["机器人", "AI", "Bot"],
};

/**
 * 检查群聊是否在允许列表中
 * @param chatId 群聊 ID
 * @param config 扩展配置
 * @returns 是否允许
 */
export function isGroupAllowed(chatId: string, config?: WeComExtendedConfig): boolean {
  // 没有配置时默认允许所有群
  if (!config) return true;

  // 检查群聊特定配置
  const groupConfig = config.groups?.[chatId];
  if (groupConfig?.enabled === false) {
    return false;
  }

  // 检查群聊允许列表
  if (config.groupAllowList && config.groupAllowList.length > 0) {
    return config.groupAllowList.includes(chatId);
  }

  // 默认允许
  return true;
}

/**
 * 检查用户是否在群聊允许列表中
 * @param userId 用户 ID
 * @param chatId 群聊 ID
 * @param config 扩展配置
 * @returns 是否允许
 */
export function isUserAllowedInGroup(
  userId: string,
  chatId: string,
  config?: WeComExtendedConfig
): boolean {
  // 没有配置时默认允许所有用户
  if (!config) return true;

  // 检查群聊特定配置
  const groupConfig = config.groups?.[chatId];
  if (!groupConfig?.allowFrom || groupConfig.allowFrom.length === 0) {
    // 没有用户限制，允许所有用户
    return true;
  }

  return groupConfig.allowFrom.includes(userId);
}

/**
 * 获取群聊配置
 * @param chatId 群聊 ID
 * @param config 扩展配置
 * @returns 群聊配置
 */
export function getGroupConfig(
  chatId: string,
  config?: WeComExtendedConfig
): WeComGroupConfig | undefined {
  return config?.groups?.[chatId];
}

/**
 * 检查群聊是否需要 @提及
 * @param chatId 群聊 ID
 * @param config 扩展配置
 * @returns 是否需要 @提及
 */
export function groupRequiresMention(chatId: string, config?: WeComExtendedConfig): boolean {
  // 检查群聊特定配置
  const groupConfig = config?.groups?.[chatId];
  if (groupConfig?.requireMention !== undefined) {
    return groupConfig.requireMention;
  }

  // 使用全局配置
  return config?.groupRequireMention ?? DEFAULT_GROUP_CONFIG.groupRequireMention ?? true;
}

/**
 * 合并配置
 * @param base 基础配置
 * @param override 覆盖配置
 * @returns 合并后的配置
 */
export function mergeConfig(
  base: WeComExtendedConfig,
  override?: Partial<WeComExtendedConfig>
): WeComExtendedConfig {
  if (!override) return base;

  return {
    ...base,
    ...override,
    groups: {
      ...base.groups,
      ...override.groups,
    },
    botAliases: override.botAliases ?? base.botAliases,
  };
}

/**
 * 从环境变量加载扩展配置
 * @returns 扩展配置
 */
export function loadExtendedConfigFromEnv(): WeComExtendedConfig {
  const config: WeComExtendedConfig = {};

  // 机器人名称
  if (process.env.WECOM_BOT_NAME) {
    config.botName = process.env.WECOM_BOT_NAME;
  }

  // 机器人别名 (逗号分隔)
  if (process.env.WECOM_BOT_ALIASES) {
    config.botAliases = process.env.WECOM_BOT_ALIASES.split(",").map((s) => s.trim());
  }

  // 群聊是否需要 @提及
  if (process.env.WECOM_GROUP_REQUIRE_MENTION) {
    config.groupRequireMention = process.env.WECOM_GROUP_REQUIRE_MENTION !== "false";
  }

  // 群聊允许列表 (逗号分隔)
  if (process.env.WECOM_GROUP_ALLOW_LIST) {
    config.groupAllowList = process.env.WECOM_GROUP_ALLOW_LIST.split(",").map((s) => s.trim());
  }

  return config;
}
