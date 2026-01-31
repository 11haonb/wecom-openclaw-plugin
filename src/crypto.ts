/**
 * WeCom 消息加解密
 */
import crypto from "node:crypto";

export interface CryptoConfig {
  token: string;
  aesKey: string;
  corpId: string;
}

export class WeComCrypto {
  private readonly token: string;
  private readonly aesKey: Buffer;
  private readonly iv: Buffer;
  private readonly corpId: string;

  constructor(config: CryptoConfig) {
    this.token = config.token;
    this.corpId = config.corpId;
    this.aesKey = Buffer.from(config.aesKey + "=", "base64");
    this.iv = this.aesKey.subarray(0, 16);
  }

  /**
   * 验证签名
   */
  verifySignature(
    signature: string,
    timestamp: string,
    nonce: string,
    encrypted?: string
  ): boolean {
    const calculated = this.calculateSignature(timestamp, nonce, encrypted);
    return calculated === signature;
  }

  /**
   * 计算签名
   */
  calculateSignature(timestamp: string, nonce: string, encrypted?: string): string {
    const parts = [this.token, timestamp, nonce];
    if (encrypted) {
      parts.push(encrypted);
    }
    parts.sort();
    return crypto.createHash("sha1").update(parts.join("")).digest("hex");
  }

  /**
   * 解密消息
   */
  decrypt(encrypted: string): { message: string; corpId: string } {
    const encryptedBuffer = Buffer.from(encrypted, "base64");

    const decipher = crypto.createDecipheriv("aes-256-cbc", this.aesKey, this.iv);
    decipher.setAutoPadding(false);

    const decryptedRaw = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);

    const decrypted = this.pkcs7Unpad(decryptedRaw);

    const msgLen = decrypted.readUInt32BE(16);
    const message = decrypted.subarray(20, 20 + msgLen).toString("utf8");
    const corpId = decrypted.subarray(20 + msgLen).toString("utf8");

    if (corpId !== this.corpId) {
      throw new Error(`CorpId mismatch: expected ${this.corpId}, got ${corpId}`);
    }

    return { message, corpId };
  }

  /**
   * 加密消息
   */
  encrypt(message: string): string {
    const random = crypto.randomBytes(16);
    const msgBuffer = Buffer.from(message, "utf8");
    const msgLen = Buffer.alloc(4);
    msgLen.writeUInt32BE(msgBuffer.length, 0);
    const corpIdBuffer = Buffer.from(this.corpId, "utf8");

    const plaintext = Buffer.concat([random, msgLen, msgBuffer, corpIdBuffer]);
    const padded = this.pkcs7Pad(plaintext);

    const cipher = crypto.createCipheriv("aes-256-cbc", this.aesKey, this.iv);
    cipher.setAutoPadding(false);

    const encryptedData = Buffer.concat([cipher.update(padded), cipher.final()]);
    return encryptedData.toString("base64");
  }

  /**
   * 生成加密回复
   */
  encryptReply(replyMsg: string, timestamp: string, nonce: string): string {
    const encrypted = this.encrypt(replyMsg);
    const signature = this.calculateSignature(timestamp, nonce, encrypted);

    return `<xml>
<Encrypt><![CDATA[${encrypted}]]></Encrypt>
<MsgSignature><![CDATA[${signature}]]></MsgSignature>
<TimeStamp>${timestamp}</TimeStamp>
<Nonce><![CDATA[${nonce}]]></Nonce>
</xml>`;
  }

  private pkcs7Pad(data: Buffer): Buffer {
    const blockSize = 32;
    const padLen = blockSize - (data.length % blockSize);
    const pad = Buffer.alloc(padLen, padLen);
    return Buffer.concat([data, pad]);
  }

  private pkcs7Unpad(data: Buffer): Buffer {
    const padLen = data[data.length - 1];
    if (padLen === undefined || padLen < 1 || padLen > 32) {
      throw new Error("Invalid PKCS#7 padding");
    }
    return data.subarray(0, data.length - padLen);
  }
}

export function generateNonce(): string {
  return crypto.randomBytes(8).toString("hex");
}

export function getTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}
