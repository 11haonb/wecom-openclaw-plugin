/**
 * WeCom API 客户端
 */
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import type {
  WeComApiResponse,
  WeComTokenResponse,
  WeComSendMessageResponse,
  WeComUploadMediaResponse,
  WeComMediaType,
} from "./types.js";

export interface ApiClientConfig {
  corpId: string;
  corpSecret: string;
  agentId: number;
}

export class WeComApiClient {
  private readonly config: ApiClientConfig;
  private token: string | null = null;
  private tokenExpiresAt = 0;
  private refreshPromise: Promise<string> | null = null;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * 获取 access_token
   */
  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 300000) {
      return this.token;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshToken();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * 刷新 token
   */
  private async refreshToken(): Promise<string> {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(
      this.config.corpId
    )}&corpsecret=${encodeURIComponent(this.config.corpSecret)}`;

    const response = await this.httpGet<WeComTokenResponse>(url);

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
  async sendText(touser: string, content: string): Promise<WeComSendMessageResponse> {
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
    const result = await this.httpPost<WeComSendMessageResponse>(url, body);
    console.log(`[WeCom API] Response: errcode=${result.errcode}, errmsg=${result.errmsg}`);
    return result;
  }

  /**
   * 发送 Markdown 消息
   */
  async sendMarkdown(touser: string, content: string): Promise<WeComSendMessageResponse> {
    const token = await this.getToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;

    const body = JSON.stringify({
      touser,
      msgtype: "markdown",
      agentid: this.config.agentId,
      markdown: { content },
    });

    return this.httpPost<WeComSendMessageResponse>(url, body);
  }

  /**
   * 获取用户信息
   */
  async getUser(userid: string): Promise<any> {
    const token = await this.getToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${token}&userid=${encodeURIComponent(userid)}`;
    return this.httpGet(url);
  }

  /**
   * 上传临时素材
   * @param filePath 文件路径
   * @param type 媒体类型: image, voice, video, file
   * @returns media_id (3天有效)
   */
  async uploadMedia(filePath: string, type: WeComMediaType = "image"): Promise<WeComUploadMediaResponse> {
    console.log(`[WeCom API] Uploading ${type}: ${filePath}`);
    const token = await this.getToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/media/upload?access_token=${token}&type=${type}`;

    const result = await this.httpPostMultipart<WeComUploadMediaResponse>(url, filePath);
    console.log(`[WeCom API] Upload response: errcode=${result.errcode}, media_id=${result.media_id}`);
    return result;
  }

  /**
   * 发送图片消息
   * @param touser 接收者用户ID
   * @param mediaId 媒体ID (通过 uploadMedia 获取)
   */
  async sendImage(touser: string, mediaId: string): Promise<WeComSendMessageResponse> {
    console.log(`[WeCom API] Sending image to ${touser}, mediaId=${mediaId.substring(0, 20)}...`);
    const token = await this.getToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;

    const body = JSON.stringify({
      touser,
      msgtype: "image",
      agentid: this.config.agentId,
      image: { media_id: mediaId },
    });

    const result = await this.httpPost<WeComSendMessageResponse>(url, body);
    console.log(`[WeCom API] Send image response: errcode=${result.errcode}, errmsg=${result.errmsg}`);
    return result;
  }

  /**
   * 上传并发送图片 (便捷方法)
   * @param touser 接收者用户ID
   * @param filePath 图片文件路径
   */
  async sendImageFile(touser: string, filePath: string): Promise<WeComSendMessageResponse> {
    const uploadResult = await this.uploadMedia(filePath, "image");
    if (uploadResult.errcode !== 0) {
      throw new Error(`Upload failed: [${uploadResult.errcode}] ${uploadResult.errmsg}`);
    }
    return this.sendImage(touser, uploadResult.media_id);
  }

  /**
   * 从 URL 下载图片并发送
   * @param touser 接收者用户ID
   * @param imageUrl 图片URL
   */
  async sendImageFromUrl(touser: string, imageUrl: string): Promise<WeComSendMessageResponse> {
    console.log(`[WeCom API] Downloading image from URL: ${imageUrl.substring(0, 60)}...`);

    // 下载图片到临时文件
    const tempDir = "/tmp/wecom-media";
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const ext = this.getImageExtension(imageUrl);
    const tempFile = path.join(tempDir, `img-${Date.now()}${ext}`);

    await this.downloadFile(imageUrl, tempFile);
    console.log(`[WeCom API] Downloaded to: ${tempFile}`);

    try {
      const result = await this.sendImageFile(touser, tempFile);
      return result;
    } finally {
      // 清理临时文件
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // ignore
      }
    }
  }

  private getImageExtension(url: string): string {
    const urlPath = url.split("?")[0].toLowerCase();
    if (urlPath.endsWith(".png")) return ".png";
    if (urlPath.endsWith(".gif")) return ".gif";
    if (urlPath.endsWith(".webp")) return ".webp";
    return ".jpg";
  }

  private downloadFile(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destPath);
      const protocol = url.startsWith("https") ? https : require("http");

      protocol.get(url, { family: 4, timeout: 30000 }, (res: any) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // Handle redirect
          file.close();
          fs.unlinkSync(destPath);
          this.downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          return;
        }

        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      }).on("error", (err: Error) => {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        reject(err);
      });
    });
  }

  private httpGet<T>(url: string): Promise<T> {
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
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            console.log(`[WeCom API] httpGet response: ${body.substring(0, 100)}`);
            resolve(JSON.parse(body) as T);
          } catch (error) {
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

  private httpPost<T>(url: string, body: string): Promise<T> {
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
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          try {
            const responseBody = Buffer.concat(chunks).toString("utf8");
            console.log(`[WeCom API] httpPost response: ${responseBody.substring(0, 200)}`);
            resolve(JSON.parse(responseBody) as T);
          } catch (error) {
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

  /**
   * HTTP POST multipart/form-data (用于文件上传)
   */
  private httpPostMultipart<T>(url: string, filePath: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const boundary = `----WebKitFormBoundary${Date.now().toString(16)}`;
      const fileName = path.basename(filePath);
      const fileContent = fs.readFileSync(filePath);

      // 构建 multipart body
      const header = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="media"; filename="${fileName}"\r\n` +
        `Content-Type: ${this.getMimeType(filePath)}\r\n\r\n`
      );
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      const bodyBuffer = Buffer.concat([header, fileContent, footer]);

      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": bodyBuffer.length,
        },
        timeout: 120000, // 2 minutes for upload
        family: 4,
      };

      console.log(`[WeCom API] httpPostMultipart starting: ${urlObj.hostname}${urlObj.pathname}, size=${bodyBuffer.length}`);

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          try {
            const responseBody = Buffer.concat(chunks).toString("utf8");
            console.log(`[WeCom API] httpPostMultipart response: ${responseBody.substring(0, 200)}`);
            resolve(JSON.parse(responseBody) as T);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error}`));
          }
        });
      });

      req.on("error", (err) => {
        console.error(`[WeCom API] httpPostMultipart error: ${err.message}`);
        reject(err);
      });

      req.on("timeout", () => {
        console.error(`[WeCom API] httpPostMultipart timeout after 120s`);
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.write(bodyBuffer);
      req.end();
    });
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
      ".mp3": "audio/mpeg",
      ".amr": "audio/amr",
      ".mp4": "video/mp4",
      ".pdf": "application/pdf",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }
}
