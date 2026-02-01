/**
 * WeCom 消息引用/回复功能
 *
 * 企业微信应用消息 API 不直接支持引用回复，
 * 但可以通过在消息内容中添加引用格式来模拟
 */

/**
 * 引用消息格式化选项
 */
export interface QuoteOptions {
  /** 原消息发送者 */
  sender?: string;
  /** 原消息内容 */
  content: string;
  /** 原消息时间 */
  timestamp?: Date;
  /** 最大引用长度 */
  maxLength?: number;
}

/**
 * 格式化引用消息 (纯文本格式)
 * @param quote 引用选项
 * @param reply 回复内容
 * @returns 格式化后的消息
 */
export function formatQuotedReply(quote: QuoteOptions, reply: string): string {
  const maxLen = quote.maxLength ?? 50;
  let quotedContent = quote.content;

  // 截断过长的引用内容
  if (quotedContent.length > maxLen) {
    quotedContent = quotedContent.substring(0, maxLen) + "...";
  }

  // 移除换行符
  quotedContent = quotedContent.replace(/\n/g, " ");

  const parts: string[] = [];

  // 添加引用头
  if (quote.sender) {
    parts.push(`> ${quote.sender}:`);
  } else {
    parts.push(">");
  }

  // 添加引用内容
  parts.push(`> ${quotedContent}`);

  // 添加空行分隔
  parts.push("");

  // 添加回复内容
  parts.push(reply);

  return parts.join("\n");
}

/**
 * 格式化引用消息 (Markdown 格式)
 * @param quote 引用选项
 * @param reply 回复内容
 * @returns 格式化后的 Markdown 消息
 */
export function formatQuotedReplyMarkdown(quote: QuoteOptions, reply: string): string {
  const maxLen = quote.maxLength ?? 100;
  let quotedContent = quote.content;

  // 截断过长的引用内容
  if (quotedContent.length > maxLen) {
    quotedContent = quotedContent.substring(0, maxLen) + "...";
  }

  const parts: string[] = [];

  // 添加引用块
  if (quote.sender) {
    parts.push(`> **${quote.sender}**:`);
  }

  // 引用内容每行添加 > 前缀
  const quotedLines = quotedContent.split("\n").map((line) => `> ${line}`);
  parts.push(...quotedLines);

  // 添加空行分隔
  parts.push("");

  // 添加回复内容
  parts.push(reply);

  return parts.join("\n");
}

/**
 * 从消息中提取引用内容
 * @param content 消息内容
 * @returns 引用内容和剩余内容
 */
export function extractQuote(content: string): { quote?: string; body: string } {
  const lines = content.split("\n");
  const quoteLines: string[] = [];
  let bodyStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(">") || line.startsWith("＞")) {
      // 移除引用前缀
      quoteLines.push(line.replace(/^[>＞]\s*/, ""));
      bodyStartIndex = i + 1;
    } else if (line.trim() === "" && quoteLines.length > 0) {
      // 空行，继续查找
      bodyStartIndex = i + 1;
    } else {
      // 非引用行，停止
      break;
    }
  }

  if (quoteLines.length === 0) {
    return { body: content };
  }

  return {
    quote: quoteLines.join("\n").trim(),
    body: lines.slice(bodyStartIndex).join("\n").trim(),
  };
}

/**
 * 构建带引用的文本卡片
 * @param quote 引用选项
 * @param reply 回复内容
 * @param url 点击跳转链接
 * @returns 文本卡片参数
 */
export function buildQuotedTextCard(
  quote: QuoteOptions,
  reply: string,
  url: string
): { title: string; description: string; url: string } {
  const maxLen = quote.maxLength ?? 30;
  let quotedContent = quote.content;

  if (quotedContent.length > maxLen) {
    quotedContent = quotedContent.substring(0, maxLen) + "...";
  }

  // 标题使用回复内容的前20个字符
  const title = reply.length > 20 ? reply.substring(0, 20) + "..." : reply;

  // 描述包含引用和完整回复
  let description = "";
  if (quote.sender) {
    description += `引用 ${quote.sender}: ${quotedContent}\n\n`;
  } else {
    description += `引用: ${quotedContent}\n\n`;
  }
  description += reply;

  // 截断描述
  if (description.length > 500) {
    description = description.substring(0, 497) + "...";
  }

  return { title, description, url };
}
