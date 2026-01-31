/**
 * WeCom 配置类型
 */
export interface WeComAccountConfig {
  /** 企业 ID */
  corpId: string;
  /** 应用 Secret */
  corpSecret: string;
  /** 应用 ID */
  agentId: number;
  /** 回调 Token */
  callbackToken: string;
  /** 回调 EncodingAESKey (43位) */
  callbackAesKey: string;
  /** 回调端口 */
  callbackPort?: number;
  /** 回调路径 */
  callbackPath?: string;
}

export interface WeComResolvedAccount {
  config: WeComAccountConfig;
  corpId: string;
  agentId: number;
}

/**
 * 企业微信消息类型
 */
export type WeComMsgType = 'text' | 'image' | 'voice' | 'video' | 'location' | 'link' | 'event';

/**
 * 企业微信事件类型
 */
export type WeComEventType =
  | 'subscribe'
  | 'unsubscribe'
  | 'enter_agent'
  | 'click'
  | 'view'
  | 'scancode_push'
  | 'scancode_waitmsg'
  | 'location_select';

/**
 * 解析后的企业微信消息
 */
export interface WeComParsedMessage {
  toUserName: string;
  fromUserName: string;
  createTime: number;
  msgType: WeComMsgType;
  agentId: number;
  msgId?: string;
  content?: string;
  picUrl?: string;
  mediaId?: string;
  format?: string;
  thumbMediaId?: string;
  locationX?: number;
  locationY?: number;
  scale?: number;
  label?: string;
  title?: string;
  description?: string;
  url?: string;
  event?: WeComEventType;
  eventKey?: string;
}

/**
 * 企业微信 API 响应
 */
export interface WeComApiResponse {
  errcode: number;
  errmsg: string;
}

/**
 * 获取 Token 响应
 */
export interface WeComTokenResponse extends WeComApiResponse {
  access_token: string;
  expires_in: number;
}

/**
 * 发送消息响应
 */
export interface WeComSendMessageResponse extends WeComApiResponse {
  invaliduser?: string;
  msgid?: string;
}

/**
 * 上传媒体响应
 */
export interface WeComUploadMediaResponse extends WeComApiResponse {
  type: string;
  media_id: string;
  created_at: string;
}

/**
 * 媒体类型
 */
export type WeComMediaType = 'image' | 'voice' | 'video' | 'file';
