/**
 * WeCom 事件处理
 *
 * 处理企业微信的各种事件回调
 */

import type { WeComParsedMessage, WeComEventType, WeComAccountConfig } from "./types.js";
import { getApiClient } from "./monitor.js";

/**
 * 事件处理器类型
 */
export type WeComEventHandler = (
  event: WeComParsedMessage,
  accountConfig: WeComAccountConfig
) => void | Promise<void>;

/**
 * 事件处理器注册表
 */
const eventHandlers = new Map<WeComEventType | "*", WeComEventHandler[]>();

/**
 * 注册事件处理器
 * @param eventType 事件类型，"*" 表示所有事件
 * @param handler 处理器函数
 */
export function onEvent(eventType: WeComEventType | "*", handler: WeComEventHandler): void {
  const handlers = eventHandlers.get(eventType) || [];
  handlers.push(handler);
  eventHandlers.set(eventType, handlers);
}

/**
 * 移除事件处理器
 */
export function offEvent(eventType: WeComEventType | "*", handler: WeComEventHandler): boolean {
  const handlers = eventHandlers.get(eventType);
  if (!handlers) return false;

  const index = handlers.indexOf(handler);
  if (index === -1) return false;

  handlers.splice(index, 1);
  return true;
}

/**
 * 清除所有事件处理器
 */
export function clearEventHandlers(): void {
  eventHandlers.clear();
}

/**
 * 分发事件到处理器
 */
export async function dispatchEvent(
  event: WeComParsedMessage,
  accountConfig: WeComAccountConfig
): Promise<void> {
  if (event.msgType !== "event" || !event.event) {
    return;
  }

  const eventType = event.event;
  console.log(`[WeCom] Event received: ${eventType} from ${event.fromUserName}`);

  // 获取特定事件的处理器
  const specificHandlers = eventHandlers.get(eventType) || [];
  // 获取通配符处理器
  const wildcardHandlers = eventHandlers.get("*") || [];

  const allHandlers = [...specificHandlers, ...wildcardHandlers];

  for (const handler of allHandlers) {
    try {
      await handler(event, accountConfig);
    } catch (err) {
      console.error(`[WeCom] Event handler error for ${eventType}:`, err);
    }
  }
}

/**
 * 默认事件处理器 - 用户关注
 */
export async function handleSubscribe(
  event: WeComParsedMessage,
  accountConfig: WeComAccountConfig
): Promise<void> {
  const userId = event.fromUserName;
  console.log(`[WeCom] User subscribed: ${userId}`);

  // 发送欢迎消息
  const client = getApiClient(accountConfig);
  const welcomeMessage = getWelcomeMessage();

  if (welcomeMessage) {
    try {
      await client.sendText(userId, welcomeMessage);
      console.log(`[WeCom] Welcome message sent to ${userId}`);
    } catch (err) {
      console.error(`[WeCom] Failed to send welcome message:`, err);
    }
  }
}

/**
 * 默认事件处理器 - 用户取消关注
 */
export async function handleUnsubscribe(
  event: WeComParsedMessage,
  _accountConfig: WeComAccountConfig
): Promise<void> {
  const userId = event.fromUserName;
  console.log(`[WeCom] User unsubscribed: ${userId}`);
  // 可以在这里清理用户相关的数据
}

/**
 * 默认事件处理器 - 进入应用
 */
export async function handleEnterAgent(
  event: WeComParsedMessage,
  _accountConfig: WeComAccountConfig
): Promise<void> {
  const userId = event.fromUserName;
  console.log(`[WeCom] User entered agent: ${userId}`);
}

/**
 * 默认事件处理器 - 菜单点击
 */
export async function handleMenuClick(
  event: WeComParsedMessage,
  accountConfig: WeComAccountConfig
): Promise<void> {
  const userId = event.fromUserName;
  const eventKey = event.eventKey;
  console.log(`[WeCom] Menu click: ${eventKey} by ${userId}`);

  // 根据 eventKey 执行不同操作
  const menuAction = getMenuAction(eventKey);
  if (menuAction) {
    try {
      await menuAction(event, accountConfig);
    } catch (err) {
      console.error(`[WeCom] Menu action error for ${eventKey}:`, err);
    }
  }
}

/**
 * 默认事件处理器 - 菜单跳转
 */
export async function handleMenuView(
  event: WeComParsedMessage,
  _accountConfig: WeComAccountConfig
): Promise<void> {
  const userId = event.fromUserName;
  const eventKey = event.eventKey; // URL
  console.log(`[WeCom] Menu view: ${eventKey} by ${userId}`);
}

/**
 * 默认事件处理器 - 扫码推送
 */
export async function handleScancodePush(
  event: WeComParsedMessage,
  accountConfig: WeComAccountConfig
): Promise<void> {
  const userId = event.fromUserName;
  const eventKey = event.eventKey;
  console.log(`[WeCom] Scancode push: ${eventKey} by ${userId}`);

  // 可以在这里处理扫码结果
  const client = getApiClient(accountConfig);
  await client.sendText(userId, `扫码成功: ${eventKey}`);
}

/**
 * 默认事件处理器 - 扫码等待
 */
export async function handleScancodeWaitmsg(
  event: WeComParsedMessage,
  accountConfig: WeComAccountConfig
): Promise<void> {
  const userId = event.fromUserName;
  const eventKey = event.eventKey;
  console.log(`[WeCom] Scancode waitmsg: ${eventKey} by ${userId}`);

  const client = getApiClient(accountConfig);
  await client.sendText(userId, `正在处理扫码结果: ${eventKey}`);
}

/**
 * 默认事件处理器 - 位置选择
 */
export async function handleLocationSelect(
  event: WeComParsedMessage,
  accountConfig: WeComAccountConfig
): Promise<void> {
  const userId = event.fromUserName;
  const location = {
    x: event.locationX,
    y: event.locationY,
    label: event.label,
    scale: event.scale,
  };
  console.log(`[WeCom] Location select by ${userId}:`, location);

  const client = getApiClient(accountConfig);
  await client.sendText(
    userId,
    `收到位置: ${location.label || "未知"}\n坐标: (${location.x}, ${location.y})`
  );
}

// ============================================
// 配置
// ============================================

let welcomeMessage: string | null = null;
const menuActions = new Map<string, WeComEventHandler>();

/**
 * 设置欢迎消息
 */
export function setWelcomeMessage(message: string | null): void {
  welcomeMessage = message;
}

/**
 * 获取欢迎消息
 */
export function getWelcomeMessage(): string | null {
  return welcomeMessage ?? process.env.WECOM_WELCOME_MESSAGE ?? null;
}

/**
 * 注册菜单动作
 */
export function registerMenuAction(eventKey: string, handler: WeComEventHandler): void {
  menuActions.set(eventKey, handler);
}

/**
 * 获取菜单动作
 */
export function getMenuAction(eventKey?: string): WeComEventHandler | undefined {
  if (!eventKey) return undefined;
  return menuActions.get(eventKey);
}

/**
 * 初始化默认事件处理器
 */
export function initDefaultEventHandlers(): void {
  onEvent("subscribe", handleSubscribe);
  onEvent("unsubscribe", handleUnsubscribe);
  onEvent("enter_agent", handleEnterAgent);
  onEvent("click", handleMenuClick);
  onEvent("view", handleMenuView);
  onEvent("scancode_push", handleScancodePush);
  onEvent("scancode_waitmsg", handleScancodeWaitmsg);
  onEvent("location_select", handleLocationSelect);

  console.log("[WeCom] Default event handlers initialized");
}

/**
 * 事件类型描述
 */
export const EVENT_TYPE_DESCRIPTIONS: Record<WeComEventType, string> = {
  subscribe: "用户关注",
  unsubscribe: "用户取消关注",
  enter_agent: "进入应用",
  click: "菜单点击",
  view: "菜单跳转",
  scancode_push: "扫码推送",
  scancode_waitmsg: "扫码等待",
  location_select: "位置选择",
};
