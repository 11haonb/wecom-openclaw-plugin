/**
 * WeCom Outbound Adapter
 *
 * Handles sending messages through WeCom API
 */
import type { ChannelOutboundAdapter } from "openclaw/plugin-sdk";
import { getWeComRuntime } from "./runtime.js";
import { getApiClient } from "./monitor.js";
import { getWeComConfig } from "./monitor.js";
import type { WeComAccountConfig, WeComSendMessageResponse } from "./types.js";

// API 客户端缓存
const outboundClients = new Map<string, ReturnType<typeof getApiClient>>();

function getCachedClient(config: WeComAccountConfig) {
  const key = `${config.corpId}:${config.agentId}`;
  let client = outboundClients.get(key);
  if (!client) {
    client = getApiClient(config);
    outboundClients.set(key, client);
  }
  return client;
}

export const wecomOutbound: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  chunker: (text, limit) => getWeComRuntime().channel.text.chunkMarkdownText(text, limit),
  chunkerMode: "markdown",
  textChunkLimit: 2000,
  sendText: async ({ cfg, to, text }) => {
    const config = getWeComConfig();
    if (!config) {
      throw new Error("WeCom not configured");
    }

    const client = getCachedClient(config);

    const result = await client.sendText(to, text);
    return {
      channel: "wecom",
      success: result.errcode === 0,
      messageId: result.msgid || "",
      error: result.errcode !== 0 ? `[${result.errcode}] ${result.errmsg}` : undefined,
    };
  },
  sendMedia: async ({ cfg, to, text, mediaUrl }) => {
    const config = getWeComConfig();
    if (!config) {
      throw new Error("WeCom not configured");
    }

    const client = getCachedClient(config);

    // Send text first if provided
    let textResult: WeComSendMessageResponse | undefined;
    if (text?.trim()) {
      textResult = await client.sendText(to, text);
    }

    // Upload and send media if URL provided
    if (mediaUrl) {
      try {
        const result = await client.sendImageFromUrl(to, mediaUrl);
        return {
          channel: "wecom",
          success: result.errcode === 0,
          messageId: result.msgid || "",
          error: result.errcode !== 0 ? `[${result.errcode}] ${result.errmsg}` : undefined,
        };
      } catch (err) {
        console.error(`[WeCom] sendMedia failed:`, err);
        // Fallback to URL link if upload fails
        const fallbackText = `📎 ${mediaUrl}`;
        const result = await client.sendText(to, fallbackText);
        return {
          channel: "wecom",
          success: result.errcode === 0,
          messageId: result.msgid || "",
          error: result.errcode !== 0 ? `[${result.errcode}] ${result.errmsg}` : undefined,
        };
      }
    }

    // No media URL, return text result if we sent text
    if (textResult) {
      return {
        channel: "wecom",
        success: textResult.errcode === 0,
        messageId: textResult.msgid || "",
        error: textResult.errcode !== 0 ? `[${textResult.errcode}] ${textResult.errmsg}` : undefined,
      };
    }

    // Nothing to send
    return {
      channel: "wecom",
      success: true,
      messageId: "",
    };
  },
};
