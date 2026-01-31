import type { WeComParsedMessage } from "./types.js";
/**
 * 解析 XML 消息
 */
export declare function parseMessage(xml: string): WeComParsedMessage;
/**
 * 获取消息 ID
 */
export declare function getMessageId(msg: WeComParsedMessage): string | undefined;
/**
 * 是否是事件消息
 */
export declare function isEventMessage(msg: WeComParsedMessage): boolean;
//# sourceMappingURL=parser.d.ts.map