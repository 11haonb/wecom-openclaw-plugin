/**
 * WeCom Crypto 单元测试
 */
import { describe, it, expect, beforeEach } from "vitest";
import { WeComCrypto, generateNonce, getTimestamp } from "../src/crypto.js";

describe("WeComCrypto", () => {
  // 测试用的配置
  const testConfig = {
    token: "test_token_123",
    aesKey: "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG", // 43 字符
    corpId: "wx1234567890abcdef",
  };

  let crypto: WeComCrypto;

  beforeEach(() => {
    crypto = new WeComCrypto(testConfig);
  });

  describe("constructor", () => {
    it("should create instance with valid config", () => {
      expect(crypto).toBeInstanceOf(WeComCrypto);
    });

    it("should handle 43-character AES key", () => {
      const key43 = "a".repeat(43);
      const c = new WeComCrypto({ ...testConfig, aesKey: key43 });
      expect(c).toBeInstanceOf(WeComCrypto);
    });
  });

  describe("verifySignature", () => {
    it("should verify valid signature", () => {
      const timestamp = "1409659813";
      const nonce = "1372623149";
      const encrypted = "test_encrypted_content";

      // 计算预期签名
      const expectedSignature = crypto.calculateSignature(timestamp, nonce, encrypted);

      expect(crypto.verifySignature(expectedSignature, timestamp, nonce, encrypted)).toBe(true);
    });

    it("should reject invalid signature", () => {
      const timestamp = "1409659813";
      const nonce = "1372623149";
      const encrypted = "test_encrypted_content";

      expect(crypto.verifySignature("invalid_signature", timestamp, nonce, encrypted)).toBe(false);
    });

    it("should verify signature without encrypted content", () => {
      const timestamp = "1409659813";
      const nonce = "1372623149";

      const expectedSignature = crypto.calculateSignature(timestamp, nonce);

      expect(crypto.verifySignature(expectedSignature, timestamp, nonce)).toBe(true);
    });
  });

  describe("calculateSignature", () => {
    it("should calculate consistent signature", () => {
      const timestamp = "1409659813";
      const nonce = "1372623149";

      const sig1 = crypto.calculateSignature(timestamp, nonce);
      const sig2 = crypto.calculateSignature(timestamp, nonce);

      expect(sig1).toBe(sig2);
    });

    it("should return 40-character hex string (SHA1)", () => {
      const sig = crypto.calculateSignature("123", "456");
      expect(sig).toMatch(/^[a-f0-9]{40}$/);
    });

    it("should produce different signatures for different inputs", () => {
      const sig1 = crypto.calculateSignature("123", "456");
      const sig2 = crypto.calculateSignature("123", "789");

      expect(sig1).not.toBe(sig2);
    });
  });

  describe("encrypt and decrypt", () => {
    it("should encrypt and decrypt message correctly", () => {
      const originalMessage = "Hello, WeCom!";

      const encrypted = crypto.encrypt(originalMessage);
      const { message, corpId } = crypto.decrypt(encrypted);

      expect(message).toBe(originalMessage);
      expect(corpId).toBe(testConfig.corpId);
    });

    it("should handle Chinese characters", () => {
      const originalMessage = "你好，企业微信！这是一条测试消息。";

      const encrypted = crypto.encrypt(originalMessage);
      const { message } = crypto.decrypt(encrypted);

      expect(message).toBe(originalMessage);
    });

    it("should handle long messages", () => {
      const originalMessage = "A".repeat(2000);

      const encrypted = crypto.encrypt(originalMessage);
      const { message } = crypto.decrypt(encrypted);

      expect(message).toBe(originalMessage);
    });

    it("should handle empty message", () => {
      const originalMessage = "";

      const encrypted = crypto.encrypt(originalMessage);
      const { message } = crypto.decrypt(encrypted);

      expect(message).toBe(originalMessage);
    });

    it("should handle special characters", () => {
      const originalMessage = '<xml>test</xml>&"\'<>';

      const encrypted = crypto.encrypt(originalMessage);
      const { message } = crypto.decrypt(encrypted);

      expect(message).toBe(originalMessage);
    });

    it("should produce different ciphertext for same message (random IV)", () => {
      const originalMessage = "test message";

      const encrypted1 = crypto.encrypt(originalMessage);
      const encrypted2 = crypto.encrypt(originalMessage);

      // 由于随机前缀，加密结果应该不同
      expect(encrypted1).not.toBe(encrypted2);

      // 但解密结果应该相同
      expect(crypto.decrypt(encrypted1).message).toBe(originalMessage);
      expect(crypto.decrypt(encrypted2).message).toBe(originalMessage);
    });

    it("should throw error for wrong corpId", () => {
      const otherCrypto = new WeComCrypto({
        ...testConfig,
        corpId: "different_corp_id",
      });

      const encrypted = crypto.encrypt("test");

      expect(() => otherCrypto.decrypt(encrypted)).toThrow(/CorpId mismatch/);
    });
  });

  describe("encryptReply", () => {
    it("should generate valid encrypted reply XML", () => {
      const replyMsg = "<xml><Content>Hello</Content></xml>";
      const timestamp = "1409659813";
      const nonce = "1372623149";

      const result = crypto.encryptReply(replyMsg, timestamp, nonce);

      expect(result).toContain("<xml>");
      expect(result).toContain("</xml>");
      expect(result).toContain("<Encrypt>");
      expect(result).toContain("<MsgSignature>");
      expect(result).toContain("<TimeStamp>");
      expect(result).toContain("<Nonce>");
      expect(result).toContain(timestamp);
      expect(result).toContain(nonce);
    });

    it("should produce verifiable signature in reply", () => {
      const replyMsg = "<xml><Content>Hello</Content></xml>";
      const timestamp = "1409659813";
      const nonce = "1372623149";

      const result = crypto.encryptReply(replyMsg, timestamp, nonce);

      // 提取加密内容和签名
      const encryptMatch = result.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/);
      const sigMatch = result.match(/<MsgSignature><!\[CDATA\[(.*?)\]\]><\/MsgSignature>/);

      expect(encryptMatch).not.toBeNull();
      expect(sigMatch).not.toBeNull();

      const encrypted = encryptMatch![1];
      const signature = sigMatch![1];

      // 验证签名
      expect(crypto.verifySignature(signature, timestamp, nonce, encrypted)).toBe(true);
    });
  });
});

describe("generateNonce", () => {
  it("should generate 16-character hex string", () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^[a-f0-9]{16}$/);
  });

  it("should generate different nonces", () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 100; i++) {
      nonces.add(generateNonce());
    }
    expect(nonces.size).toBe(100);
  });
});

describe("getTimestamp", () => {
  it("should return numeric string", () => {
    const ts = getTimestamp();
    expect(ts).toMatch(/^\d+$/);
  });

  it("should return current timestamp in seconds", () => {
    const ts = parseInt(getTimestamp(), 10);
    const now = Math.floor(Date.now() / 1000);

    // 允许 1 秒误差
    expect(Math.abs(ts - now)).toBeLessThanOrEqual(1);
  });
});
