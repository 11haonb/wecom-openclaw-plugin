/**
 * WeCom Outbound Adapter
 *
 * Handles sending messages through WeCom API
 */
import type { ChannelOutboundAdapter } from "openclaw/plugin-sdk";
import { getWeComRuntime } from "./runtime.js";
import { WeComApiClient } from "./api.js";
import { getWeComConfig } from "./monitor.js";

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

    const client = new WeComApiClient({
      corpId: config.corpId,
      corpSecret: config.corpSecret,
      agentId: config.agentId,
    });

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

    const client = new WeComApiClient({
      corpId: config.corpId,
      corpSecret: config.corpSecret,
      agentId: config.agentId,
    });

    // Send text first if provided
    if (text?.trim()) {
      await client.sendText(to, text);
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

    // No media URL, just return text result
    const result = await client.sendText(to, text ?? "");
    return {
      channel: "wecom",
      success: result.errcode === 0,
      messageId: result.msgid || "",
      error: result.errcode !== 0 ? `[${result.errcode}] ${result.errmsg}` : undefined,
    };
  },
};
