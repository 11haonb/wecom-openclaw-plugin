import type { WeComSendMessageResponse } from "./types.js";
export interface ApiClientConfig {
    corpId: string;
    corpSecret: string;
    agentId: number;
}
export declare class WeComApiClient {
    private readonly config;
    private token;
    private tokenExpiresAt;
    private refreshPromise;
    constructor(config: ApiClientConfig);
    /**
     * 获取 access_token
     */
    getToken(): Promise<string>;
    /**
     * 刷新 token
     */
    private refreshToken;
    /**
     * 发送文本消息
     */
    sendText(touser: string, content: string): Promise<WeComSendMessageResponse>;
    /**
     * 发送 Markdown 消息
     */
    sendMarkdown(touser: string, content: string): Promise<WeComSendMessageResponse>;
    /**
     * 获取用户信息
     */
    getUser(userid: string): Promise<any>;
    private httpGet;
    private httpPost;
}
//# sourceMappingURL=api.d.ts.map