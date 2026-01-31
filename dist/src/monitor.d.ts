/**
 * WeCom Monitor - 消息处理管道
 *
 * 负责接收企业微信回调，解析消息，并路由到 OpenClaw AI Agent
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import http from "node:http";
import type { WeComAccountConfig, WeComParsedMessage } from "./types.js";
import { WeComCrypto } from "./crypto.js";
import { WeComApiClient } from "./api.js";
export declare function isDuplicate(msgId: string | undefined): boolean;
export declare function clearDedupCache(): void;
export declare function getApiClient(config: WeComAccountConfig): WeComApiClient;
export declare function clearApiClientCache(): void;
export declare function getWeComConfig(): WeComAccountConfig | null;
export declare function handleWeComWebhookRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean>;
export declare function processInboundMessage(accountConfig: WeComAccountConfig, msg: WeComParsedMessage): Promise<void>;
export interface MonitorConfig {
    port: number;
    path: string;
    crypto: WeComCrypto;
    onMessage: (msg: WeComParsedMessage, rawXml: string) => void | Promise<void>;
    onError?: (error: Error) => void;
}
export declare function createMonitorServer(config: MonitorConfig): http.Server;
export declare function startMonitor(accountConfig: WeComAccountConfig, onMessage: (msg: WeComParsedMessage, rawXml: string) => void | Promise<void>, onError?: (error: Error) => void): Promise<http.Server>;
//# sourceMappingURL=monitor.d.ts.map