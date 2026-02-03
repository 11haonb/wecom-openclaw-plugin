/**
 * WeCom Reply Dispatcher
 *
 * Creates a dispatcher for sending replies back to WeCom
 */
import {
  createReplyPrefixContext,
  createTypingCallbacks,
  logTypingFailure,
  type OpenClawConfig,
  type RuntimeEnv,
  type ReplyPayload,
} from "openclaw/plugin-sdk";
import { getWeComRuntime } from "./runtime.js";
import { WeComApiClient } from "./api.js";
import type { WeComAccountConfig } from "./types.js";

export type CreateWeComReplyDispatcherParams = {
  cfg: OpenClawConfig;
  agentId: string;
  runtime: RuntimeEnv;
  accountConfig: WeComAccountConfig;
  replyTarget: string;
};

export type WeComReplyDispatcherResult = {
  dispatcher: {
    sendToolResult: (payload: ReplyPayload) => boolean;
    sendBlockReply: (payload: ReplyPayload) => boolean;
    sendFinalReply: (payload: ReplyPayload) => boolean;
    waitForIdle: () => Promise<void>;
    getQueuedCounts: () => Record<string, number>;
  };
  replyOptions: Record<string, any>;
  markDispatchIdle: () => void;
};

export function createWeComReplyDispatcher(params: CreateWeComReplyDispatcherParams): WeComReplyDispatcherResult {
  const core = getWeComRuntime();
  const { cfg, agentId, accountConfig, replyTarget } = params;

  const prefixContext = createReplyPrefixContext({
    cfg,
    agentId,
  });

  // WeCom doesn't have a native typing indicator
  const typingCallbacks = createTypingCallbacks({
    start: async () => {
      // No typing indicator for WeCom
    },
    stop: async () => {
      // No typing indicator for WeCom
    },
    onStartError: (err) => {
      logTypingFailure({
        log: (message) => params.runtime.log?.(message),
        channel: "wecom",
        action: "start",
        error: err,
      });
    },
    onStopError: (err) => {
      logTypingFailure({
        log: (message) => params.runtime.log?.(message),
        channel: "wecom",
        action: "stop",
        error: err,
      });
    },
  });

  // Use fixed values for text processing
  const textChunkLimit = 2000;
  const chunkMode: "length" | "newline" = "length";
  const tableMode: "off" | "bullets" | "code" = "bullets";

  const client = new WeComApiClient({
    corpId: accountConfig.corpId,
    corpSecret: accountConfig.corpSecret,
    agentId: accountConfig.agentId,
  });

  const { dispatcher, replyOptions, markDispatchIdle } =
    core.channel.reply.createReplyDispatcherWithTyping({
      responsePrefix: prefixContext.responsePrefix,
      responsePrefixContextProvider: prefixContext.responsePrefixContextProvider,
      humanDelay: core.channel.reply.resolveHumanDelayConfig(cfg, agentId),
      onReplyStart: typingCallbacks.onReplyStart,
      deliver: async (payload: ReplyPayload) => {
        params.runtime.log?.(`[WeCom] deliver called: text=${payload.text?.slice(0, 100)}, mediaUrl=${payload.mediaUrl ?? "none"}, mediaUrls=${payload.mediaUrls?.length ?? 0}`);

        // Collect all media URLs
        const allMediaUrls: string[] = [];
        if (payload.mediaUrl) {
          allMediaUrls.push(payload.mediaUrl);
        }
        if (payload.mediaUrls && payload.mediaUrls.length > 0) {
          allMediaUrls.push(...payload.mediaUrls);
        }

        // Send media files first
        for (const mediaUrl of allMediaUrls) {
          try {
            params.runtime.log?.(`[WeCom] deliver: sending media ${mediaUrl.slice(0, 50)}...`);
            await client.sendImageFromUrl(replyTarget, mediaUrl);
            params.runtime.log?.(`[WeCom] deliver: media sent successfully`);
          } catch (err) {
            params.runtime.error?.(`[WeCom] Failed to send media: ${String(err)}`);
            // Send URL as fallback text
            try {
              await client.sendText(replyTarget, `📎 ${mediaUrl}`);
            } catch (textErr) {
              params.runtime.error?.(`[WeCom] Failed to send media URL as text: ${String(textErr)}`);
            }
          }
        }

        // Send text if present
        const text = payload.text ?? "";
        if (!text.trim()) {
          if (allMediaUrls.length === 0) {
            params.runtime.log?.(`[WeCom] deliver: empty payload, skipping`);
          }
          return;
        }

        // Send text in chunks
        const converted = core.channel.text.convertMarkdownTables(text, tableMode);
        const chunks = core.channel.text.chunkTextWithMode(converted, textChunkLimit, chunkMode);
        params.runtime.log?.(`[WeCom] deliver: sending ${chunks.length} text chunks to ${replyTarget}`);

        for (const chunk of chunks) {
          try {
            await client.sendText(replyTarget, chunk);
          } catch (err) {
            params.runtime.error?.(`[WeCom] Failed to send text chunk: ${String(err)}`);
          }
        }
      },
      onError: (err, info) => {
        params.runtime.error?.(`[WeCom] ${info.kind} reply failed: ${String(err)}`);
        typingCallbacks.onIdle?.();
      },
      onIdle: typingCallbacks.onIdle,
    });

  return {
    dispatcher,
    replyOptions: {
      ...replyOptions,
      onModelSelected: prefixContext.onModelSelected,
    },
    markDispatchIdle,
  };
}
