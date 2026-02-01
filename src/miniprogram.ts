/**
 * WeCom 小程序集成
 *
 * 支持发送小程序消息和处理小程序相关事件
 */

import type { WeComSendMessageResponse, WeComApiResponse } from "./types.js";
import { WeComApiClient } from "./api.js";

/**
 * 小程序消息配置
 */
export interface MiniProgramMessage {
  /** 小程序 appid */
  appid: string;
  /** 小程序页面路径 */
  pagepath: string;
  /** 小程序标题 */
  title?: string;
  /** 小程序封面图 media_id */
  thumbMediaId?: string;
}

/**
 * 小程序卡片消息
 */
export interface MiniProgramCard {
  /** 小程序 appid */
  appid: string;
  /** 小程序页面路径 */
  pagepath: string;
  /** 卡片标题 */
  title: string;
  /** 卡片描述 */
  description?: string;
  /** 封面图 URL */
  picUrl?: string;
}

/**
 * 小程序通知消息
 */
export interface MiniProgramNotice {
  /** 小程序 appid */
  appid: string;
  /** 小程序页面路径 */
  pagepath?: string;
  /** 通知标题 */
  title: string;
  /** 通知描述 */
  description?: string;
  /** 是否放大第一个 content_item */
  emphasisFirstItem?: boolean;
  /** 内容项列表 */
  contentItems?: Array<{ key: string; value: string }>;
}

/**
 * 扩展 WeComApiClient 以支持小程序消息
 */
export class WeComMiniProgramClient {
  private client: WeComApiClient;

  constructor(client: WeComApiClient) {
    this.client = client;
  }

  /**
   * 发送小程序通知消息
   * @param target 目标 ID (用户 ID 或群聊 ID)
   * @param notice 小程序通知配置
   */
  async sendMiniProgramNotice(
    target: string,
    notice: MiniProgramNotice
  ): Promise<WeComSendMessageResponse> {
    console.log(`[WeCom] Sending miniprogram notice to ${target}: ${notice.title}`);

    const token = await this.client.getToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;

    const isGroupChat = target.startsWith("wr");

    const body = JSON.stringify({
      ...(isGroupChat ? { chatid: target } : { touser: target }),
      msgtype: "miniprogram_notice",
      agentid: (this.client as any).config.agentId,
      miniprogram_notice: {
        appid: notice.appid,
        page: notice.pagepath,
        title: notice.title,
        description: notice.description,
        emphasis_first_item: notice.emphasisFirstItem,
        content_item: notice.contentItems,
      },
    });

    return this.httpPost<WeComSendMessageResponse>(url, body);
  }

  /**
   * 发送文本卡片消息 (带小程序跳转)
   * @param target 目标 ID
   * @param card 卡片配置
   * @param miniProgram 小程序配置
   */
  async sendTextCardWithMiniProgram(
    target: string,
    card: { title: string; description: string; btntxt?: string },
    miniProgram: { appid: string; pagepath: string }
  ): Promise<WeComSendMessageResponse> {
    console.log(`[WeCom] Sending text card with miniprogram to ${target}: ${card.title}`);

    const token = await this.client.getToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;

    const isGroupChat = target.startsWith("wr");

    // 构建小程序跳转 URL
    const mpUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${miniProgram.appid}&redirect_uri=${encodeURIComponent(miniProgram.pagepath)}&response_type=code&scope=snsapi_base#wechat_redirect`;

    const body = JSON.stringify({
      ...(isGroupChat ? { chatid: target } : { touser: target }),
      msgtype: "textcard",
      agentid: (this.client as any).config.agentId,
      textcard: {
        title: card.title,
        description: card.description,
        url: mpUrl,
        btntxt: card.btntxt || "打开小程序",
      },
    });

    return this.httpPost<WeComSendMessageResponse>(url, body);
  }

  /**
   * 发送模板卡片消息 (带小程序跳转)
   * @param target 目标 ID
   * @param template 模板配置
   */
  async sendTemplateCardWithMiniProgram(
    target: string,
    template: {
      cardType: "text_notice" | "news_notice" | "button_interaction";
      source?: { iconUrl?: string; desc?: string; descColor?: number };
      mainTitle: { title: string; desc?: string };
      subTitleText?: string;
      horizontalContentList?: Array<{
        keyname: string;
        value?: string;
        type?: 0 | 1 | 2 | 3;
        url?: string;
        mediaId?: string;
      }>;
      jumpList?: Array<{
        type: 1 | 2;
        title: string;
        url?: string;
        appid?: string;
        pagepath?: string;
      }>;
      cardAction: {
        type: 1 | 2;
        url?: string;
        appid?: string;
        pagepath?: string;
      };
    }
  ): Promise<WeComSendMessageResponse> {
    console.log(`[WeCom] Sending template card to ${target}: ${template.mainTitle.title}`);

    const token = await this.client.getToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;

    const isGroupChat = target.startsWith("wr");

    const body = JSON.stringify({
      ...(isGroupChat ? { chatid: target } : { touser: target }),
      msgtype: "template_card",
      agentid: (this.client as any).config.agentId,
      template_card: {
        card_type: template.cardType,
        source: template.source,
        main_title: template.mainTitle,
        sub_title_text: template.subTitleText,
        horizontal_content_list: template.horizontalContentList,
        jump_list: template.jumpList,
        card_action: template.cardAction,
      },
    });

    return this.httpPost<WeComSendMessageResponse>(url, body);
  }

  /**
   * 便捷方法: 发送简单的小程序卡片
   */
  async sendSimpleMiniProgramCard(
    target: string,
    config: {
      appid: string;
      pagepath: string;
      title: string;
      description?: string;
    }
  ): Promise<WeComSendMessageResponse> {
    return this.sendTemplateCardWithMiniProgram(target, {
      cardType: "text_notice",
      mainTitle: {
        title: config.title,
        desc: config.description,
      },
      cardAction: {
        type: 2, // 小程序跳转
        appid: config.appid,
        pagepath: config.pagepath,
      },
    });
  }

  private async httpPost<T>(url: string, body: string): Promise<T> {
    // 复用 client 的 httpPost 方法
    return (this.client as any).httpPost(url, body);
  }
}

/**
 * 创建小程序客户端
 */
export function createMiniProgramClient(client: WeComApiClient): WeComMiniProgramClient {
  return new WeComMiniProgramClient(client);
}

/**
 * 小程序消息解析
 */
export interface ParsedMiniProgramMessage {
  /** 小程序 appid */
  appid: string;
  /** 小程序标题 */
  title: string;
  /** 小程序页面路径 */
  pagepath?: string;
  /** 小程序封面图 URL */
  thumbUrl?: string;
}

/**
 * 从消息中解析小程序信息
 * (企业微信目前不支持接收小程序消息，此函数预留)
 */
export function parseMiniProgramMessage(_xml: string): ParsedMiniProgramMessage | null {
  // 企业微信应用目前不支持接收用户发送的小程序消息
  // 此函数预留，以备将来支持
  console.warn("[WeCom] Receiving miniprogram messages is not supported yet");
  return null;
}

/**
 * 小程序配置管理
 */
export interface MiniProgramConfig {
  /** 小程序 appid */
  appid: string;
  /** 小程序名称 */
  name: string;
  /** 默认页面路径 */
  defaultPage?: string;
  /** 是否启用 */
  enabled?: boolean;
}

const miniProgramConfigs = new Map<string, MiniProgramConfig>();

/**
 * 注册小程序配置
 */
export function registerMiniProgram(config: MiniProgramConfig): void {
  miniProgramConfigs.set(config.appid, config);
}

/**
 * 获取小程序配置
 */
export function getMiniProgramConfig(appid: string): MiniProgramConfig | undefined {
  return miniProgramConfigs.get(appid);
}

/**
 * 获取所有小程序配置
 */
export function getAllMiniProgramConfigs(): MiniProgramConfig[] {
  return Array.from(miniProgramConfigs.values());
}

/**
 * 从环境变量加载小程序配置
 */
export function loadMiniProgramConfigFromEnv(): void {
  const configJson = process.env.WECOM_MINIPROGRAM_CONFIG;
  if (!configJson) return;

  try {
    const configs = JSON.parse(configJson);
    if (Array.isArray(configs)) {
      for (const config of configs) {
        if (config.appid && config.name) {
          registerMiniProgram(config);
        }
      }
    }
  } catch (err) {
    console.error("[WeCom] Failed to parse WECOM_MINIPROGRAM_CONFIG:", err);
  }
}
