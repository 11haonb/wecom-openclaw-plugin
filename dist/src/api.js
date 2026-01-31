/**
 * WeCom API 客户端
 */
import https from "node:https";
export class WeComApiClient {
    config;
    token = null;
    tokenExpiresAt = 0;
    refreshPromise = null;
    constructor(config) {
        this.config = config;
    }
    /**
     * 获取 access_token
     */
    async getToken() {
        if (this.token && Date.now() < this.tokenExpiresAt - 300000) {
            return this.token;
        }
        if (this.refreshPromise) {
            return this.refreshPromise;
        }
        this.refreshPromise = this.refreshToken();
        try {
            return await this.refreshPromise;
        }
        finally {
            this.refreshPromise = null;
        }
    }
    /**
     * 刷新 token
     */
    async refreshToken() {
        const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(this.config.corpId)}&corpsecret=${encodeURIComponent(this.config.corpSecret)}`;
        const response = await this.httpGet(url);
        if (response.errcode !== 0) {
            throw new Error(`Failed to get token: [${response.errcode}] ${response.errmsg}`);
        }
        this.token = response.access_token;
        this.tokenExpiresAt = Date.now() + response.expires_in * 1000;
        return this.token;
    }
    /**
     * 发送文本消息
     */
    async sendText(touser, content) {
        console.log(`[WeCom API] Sending text to ${touser}, length=${content.length}`);
        const token = await this.getToken();
        console.log(`[WeCom API] Got token: ${token.substring(0, 20)}...`);
        const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;
        const body = JSON.stringify({
            touser,
            msgtype: "text",
            agentid: this.config.agentId,
            text: { content },
        });
        console.log(`[WeCom API] POST to ${url.substring(0, 60)}...`);
        const result = await this.httpPost(url, body);
        console.log(`[WeCom API] Response: errcode=${result.errcode}, errmsg=${result.errmsg}`);
        return result;
    }
    /**
     * 发送 Markdown 消息
     */
    async sendMarkdown(touser, content) {
        const token = await this.getToken();
        const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;
        const body = JSON.stringify({
            touser,
            msgtype: "markdown",
            agentid: this.config.agentId,
            markdown: { content },
        });
        return this.httpPost(url, body);
    }
    /**
     * 获取用户信息
     */
    async getUser(userid) {
        const token = await this.getToken();
        const url = `https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${token}&userid=${encodeURIComponent(userid)}`;
        return this.httpGet(url);
    }
    httpGet(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname + urlObj.search,
                method: "GET",
                timeout: 30000,
                family: 4, // Force IPv4 to avoid IPv6 timeout issues
            };
            console.log(`[WeCom API] httpGet starting: ${urlObj.hostname}${urlObj.pathname}`);
            const req = https.request(options, (res) => {
                const chunks = [];
                res.on("data", (chunk) => chunks.push(chunk));
                res.on("end", () => {
                    try {
                        const body = Buffer.concat(chunks).toString("utf8");
                        console.log(`[WeCom API] httpGet response: ${body.substring(0, 100)}`);
                        resolve(JSON.parse(body));
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse response: ${error}`));
                    }
                });
            });
            req.on("error", (err) => {
                console.error(`[WeCom API] httpGet error: ${err.message}`);
                reject(err);
            });
            req.on("timeout", () => {
                console.error(`[WeCom API] httpGet timeout after 30s`);
                req.destroy();
                reject(new Error("Request timeout"));
            });
            req.end();
        });
    }
    httpPost(url, body) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname + urlObj.search,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(body),
                },
                timeout: 60000, // 60 seconds
                family: 4, // Force IPv4 to avoid IPv6 timeout issues
            };
            console.log(`[WeCom API] httpPost starting: ${urlObj.hostname}${urlObj.pathname}`);
            const req = https.request(options, (res) => {
                const chunks = [];
                res.on("data", (chunk) => chunks.push(chunk));
                res.on("end", () => {
                    try {
                        const responseBody = Buffer.concat(chunks).toString("utf8");
                        console.log(`[WeCom API] httpPost response: ${responseBody.substring(0, 200)}`);
                        resolve(JSON.parse(responseBody));
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse response: ${error}`));
                    }
                });
            });
            req.on("error", (err) => {
                console.error(`[WeCom API] httpPost error: ${err.message}`);
                reject(err);
            });
            req.setTimeout(60000, () => {
                console.error(`[WeCom API] httpPost timeout after 60s`);
                req.destroy();
                reject(new Error("Request timeout"));
            });
            req.write(body);
            req.end();
        });
    }
}
