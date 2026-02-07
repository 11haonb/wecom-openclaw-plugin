/**
 * WeCom 消息解析
 */
import { XMLParser } from "fast-xml-parser";
import type { WeComParsedMessage, WeComMsgType, WeComEventType, WeComChatType } from "./types.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
});

/**
 * 解析 XML 消息
 */
export function parseMessage(xml: string): WeComParsedMessage {
  const result = parser.parse(xml);
  const msg = result.xml;

  if (!msg) {
    throw new Error("Invalid XML message format");
  }

  // 解析群聊信息
  // 企业微信群聊消息中，ChatId 字段表示群聊 ID
  // 如果没有 ChatId，则为单聊
  const chatId = msg.ChatId ? getString(msg.ChatId) : undefined;
  const chatType: WeComChatType = chatId ? "group" : "single";

  const base: WeComParsedMessage = {
    toUserName: getString(msg.ToUserName),
    fromUserName: getString(msg.FromUserName),
    createTime: getNumber(msg.CreateTime),
    msgType: getString(msg.MsgType) as WeComMsgType,
    agentId: getNumber(msg.AgentID),
    chatId,
    chatType,
  };

  switch (base.msgType) {
    case "text":
      return {
        ...base,
        content: getString(msg.Content),
        msgId: getString(msg.MsgId),
      };

    case "image":
      return {
        ...base,
        picUrl: getString(msg.PicUrl),
        mediaId: getString(msg.MediaId),
        msgId: getString(msg.MsgId),
      };

    case "voice":
      return {
        ...base,
        mediaId: getString(msg.MediaId),
        format: getString(msg.Format),
        msgId: getString(msg.MsgId),
      };

    case "video":
      return {
        ...base,
        mediaId: getString(msg.MediaId),
        thumbMediaId: getString(msg.ThumbMediaId),
        msgId: getString(msg.MsgId),
      };

    case "file":
      return {
        ...base,
        mediaId: getString(msg.MediaId),
        fileName: getString(msg.FileName),
        fileSize: getNumber(msg.FileSize),
        msgId: getString(msg.MsgId),
      };

    case "emotion":
      return {
        ...base,
        mediaId: getString(msg.MediaId),
        emotionType: getNumber(msg.Type),
        msgId: getString(msg.MsgId),
      };

    case "location":
      return {
        ...base,
        locationX: getNumber(msg.Location_X),
        locationY: getNumber(msg.Location_Y),
        scale: getNumber(msg.Scale),
        label: getString(msg.Label),
        msgId: getString(msg.MsgId),
      };

    case "link":
      return {
        ...base,
        title: getString(msg.Title),
        description: getString(msg.Description),
        url: getString(msg.Url),
        picUrl: msg.PicUrl ? getString(msg.PicUrl) : undefined,
        msgId: getString(msg.MsgId),
      };

    case "event":
      return {
        ...base,
        event: getString(msg.Event) as WeComEventType,
        eventKey: msg.EventKey ? getString(msg.EventKey) : undefined,
      };

    default:
      return base;
  }
}

function getString(value: any): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

function getNumber(value: any): number {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * 获取消息 ID
 */
export function getMessageId(msg: WeComParsedMessage): string | undefined {
  return msg.msgId;
}

/**
 * 是否是事件消息
 */
export function isEventMessage(msg: WeComParsedMessage): boolean {
  return msg.msgType === "event";
}

/**
 * 是否是群聊消息
 */
export function isGroupMessage(msg: WeComParsedMessage): boolean {
  return msg.chatType === "group";
}

/**
 * 获取会话 ID (群聊返回群 ID，单聊返回用户 ID)
 */
export function getSessionId(msg: WeComParsedMessage): string {
  return msg.chatId || msg.fromUserName;
}

/**
 * 获取发送者 ID
 */
export function getSenderId(msg: WeComParsedMessage): string {
  return msg.fromUserName;
}
