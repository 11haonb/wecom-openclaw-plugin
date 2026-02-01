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
export type WeComMsgType = 'text' | 'image' | 'voice' | 'video' | 'location' | 'link' | 'file' | 'emotion' | 'event';

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
  fileName?: string;
  fileSize?: number;
  emotionType?: number;
  locationX?: number;
  locationY?: number;
  scale?: number;
  label?: string;
  title?: string;
  description?: string;
  url?: string;
  event?: WeComEventType;
  eventKey?: string;
  /** 群聊 ID (仅群聊消息) */
  chatId?: string;
  /** 群聊类型: single=单聊, group=群聊 */
  chatType?: WeComChatType;
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

/**
 * 聊天类型
 */
export type WeComChatType = 'single' | 'group';

/**
 * 群聊配置
 */
export interface WeComGroupConfig {
  /** 群聊 ID */
  chatId: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 是否需要 @提及才响应 */
  requireMention?: boolean;
  /** 允许的用户列表 */
  allowFrom?: string[];
}

/**
 * WeCom 扩展配置
 */
export interface WeComExtendedConfig {
  /** 群聊配置 */
  groups?: Record<string, WeComGroupConfig>;
  /** 群聊默认是否需要 @提及 */
  groupRequireMention?: boolean;
  /** 群聊允许列表 (群 ID) */
  groupAllowList?: string[];
  /** 机器人名称 (用于 @提及检测) */
  botName?: string;
  /** 机器人别名列表 */
  botAliases?: string[];
}

/**
 * 文本卡片消息
 */
export interface WeComTextCard {
  /** 标题 (不超过128字节) */
  title: string;
  /** 描述 (不超过512字节) */
  description: string;
  /** 点击后跳转的链接 */
  url: string;
  /** 按钮文字 (默认"详情") */
  btntxt?: string;
}

/**
 * 图文消息文章
 */
export interface WeComNewsArticle {
  /** 标题 (不超过128字节) */
  title: string;
  /** 描述 (不超过512字节) */
  description?: string;
  /** 点击后跳转的链接 */
  url: string;
  /** 图文消息的图片链接 (支持JPG、PNG格式) */
  picurl?: string;
  /** 按钮文字 (仅在图文数为1条时有效) */
  btntxt?: string;
}

/**
 * 图文消息 (mpnews)
 */
export interface WeComMpNewsArticle {
  /** 标题 (不超过128字节) */
  title: string;
  /** 图文消息缩略图的media_id */
  thumb_media_id: string;
  /** 作者 (不超过64字节) */
  author?: string;
  /** 图文消息点击"阅读原文"之后的页面链接 */
  content_source_url?: string;
  /** 图文消息的内容 (支持html标签，不超过666K字节) */
  content: string;
  /** 图文消息的描述 (不超过512字节) */
  digest?: string;
}

/**
 * 模板卡片按钮
 */
export interface WeComTemplateCardButton {
  /** 按钮文案 */
  text: string;
  /** 按钮样式: 1=蓝色, 2=灰色 */
  style?: 1 | 2;
  /** 按钮key值 */
  key: string;
}

/**
 * 模板卡片跳转
 */
export interface WeComTemplateCardJump {
  /** 跳转链接类型: 0=不跳转, 1=跳转url, 2=跳转小程序 */
  type: 0 | 1 | 2;
  /** 跳转链接的url */
  url?: string;
  /** 跳转链接的小程序appid */
  appid?: string;
  /** 跳转链接的小程序pagepath */
  pagepath?: string;
  /** 跳转链接的标题 */
  title?: string;
}

/**
 * 撤回消息响应
 */
export interface WeComRecallResponse extends WeComApiResponse {}
