/**
 * WeCom Channel Plugin for OpenClaw
 *
 * 实现 OpenClaw 的 ChannelPlugin 接口
 */
import { type ChannelDock, type ChannelPlugin } from "openclaw/plugin-sdk";
import type { WeComAccountConfig, WeComResolvedAccount } from "./types.js";
export declare const wecomDock: ChannelDock;
export declare const wecomPlugin: ChannelPlugin<WeComResolvedAccount>;
/**
 * 从环境变量创建账户配置
 */
export declare function createAccountFromEnv(): WeComAccountConfig | null;
/**
 * 验证账户配置
 */
export declare function validateAccountConfig(config: WeComAccountConfig): string[];
//# sourceMappingURL=channel.d.ts.map