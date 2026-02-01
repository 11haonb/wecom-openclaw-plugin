/**
 * WeCom @提及检测
 *
 * 企业微信群聊中，用户可以通过 @机器人名称 来提及机器人
 */

export interface MentionConfig {
  /** 机器人名称 */
  botName?: string;
  /** 机器人别名列表 */
  botAliases?: string[];
}

/**
 * 检测消息中是否包含 @提及
 * @param content 消息内容
 * @param config 提及配置
 * @returns 是否被提及
 */
export function hasMention(content: string, config: MentionConfig): boolean {
  if (!content) return false;

  const names = getMentionNames(config);
  if (names.length === 0) return false;

  // 构建正则表达式匹配 @名称
  for (const name of names) {
    // 匹配 @名称 (名称后面可以是空格、标点或结尾)
    const pattern = new RegExp(`@${escapeRegex(name)}(?:\\s|$|[，。！？,\\.!?])`, "i");
    if (pattern.test(content)) {
      return true;
    }
  }

  return false;
}

/**
 * 从消息中移除 @提及
 * @param content 消息内容
 * @param config 提及配置
 * @returns 移除提及后的内容
 */
export function removeMention(content: string, config: MentionConfig): string {
  if (!content) return content;

  const names = getMentionNames(config);
  if (names.length === 0) return content;

  let result = content;
  for (const name of names) {
    // 移除 @名称 及其后面的空格
    const pattern = new RegExp(`@${escapeRegex(name)}\\s*`, "gi");
    result = result.replace(pattern, "");
  }

  return result.trim();
}

/**
 * 获取所有可能的机器人名称
 */
function getMentionNames(config: MentionConfig): string[] {
  const names: string[] = [];

  if (config.botName) {
    names.push(config.botName);
  }

  if (config.botAliases && config.botAliases.length > 0) {
    names.push(...config.botAliases);
  }

  // 添加一些默认的通用名称
  if (names.length === 0) {
    names.push("机器人", "助手", "AI", "Bot");
  }

  return names;
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 检测消息是否需要响应
 * @param content 消息内容
 * @param isGroup 是否是群聊
 * @param requireMention 群聊是否需要 @提及
 * @param config 提及配置
 * @returns 是否需要响应
 */
export function shouldRespond(
  content: string,
  isGroup: boolean,
  requireMention: boolean,
  config: MentionConfig
): boolean {
  // 单聊总是响应
  if (!isGroup) return true;

  // 群聊不需要 @提及时总是响应
  if (!requireMention) return true;

  // 群聊需要 @提及时检测是否被提及
  return hasMention(content, config);
}

/**
 * 处理消息内容，移除 @提及并返回处理后的内容
 * @param content 原始消息内容
 * @param isGroup 是否是群聊
 * @param config 提及配置
 * @returns 处理后的消息内容
 */
export function processMessageContent(
  content: string,
  isGroup: boolean,
  config: MentionConfig
): string {
  // 单聊不处理
  if (!isGroup) return content;

  // 群聊移除 @提及
  return removeMention(content, config);
}
