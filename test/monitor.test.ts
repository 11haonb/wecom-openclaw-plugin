/**
 * WeCom Monitor 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isDuplicate,
  clearDedupCache,
  getWeComConfig,
  getApiClient,
  clearApiClientCache,
} from "../src/monitor.js";
import type { WeComAccountConfig } from "../src/types.js";

describe("isDuplicate", () => {
  beforeEach(() => {
    clearDedupCache();
  });

  it("should return false for first occurrence", () => {
    expect(isDuplicate("msg_001")).toBe(false);
  });

  it("should return true for duplicate message", () => {
    isDuplicate("msg_002");
    expect(isDuplicate("msg_002")).toBe(true);
  });

  it("should return false for undefined msgId", () => {
    expect(isDuplicate(undefined)).toBe(false);
    expect(isDuplicate(undefined)).toBe(false);
  });

  it("should handle multiple different messages", () => {
    expect(isDuplicate("msg_a")).toBe(false);
    expect(isDuplicate("msg_b")).toBe(false);
    expect(isDuplicate("msg_c")).toBe(false);
    expect(isDuplicate("msg_a")).toBe(true);
    expect(isDuplicate("msg_b")).toBe(true);
  });

  it("should expire old messages after TTL", async () => {
    // 使用 vi.useFakeTimers 来模拟时间
    vi.useFakeTimers();

    isDuplicate("msg_expire");
    expect(isDuplicate("msg_expire")).toBe(true);

    // 前进 6 分钟 (超过 5 分钟 TTL)
    vi.advanceTimersByTime(6 * 60 * 1000);

    // 应该不再是重复的
    expect(isDuplicate("msg_expire")).toBe(false);

    vi.useRealTimers();
  });
});

describe("getWeComConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return null when env vars are missing", () => {
    delete process.env.WECOM_CORP_ID;
    delete process.env.WECOM_CORP_SECRET;
    delete process.env.WECOM_AGENT_ID;
    delete process.env.WECOM_CALLBACK_TOKEN;
    delete process.env.WECOM_CALLBACK_AES_KEY;

    expect(getWeComConfig()).toBeNull();
  });

  it("should return config when all env vars are set", () => {
    process.env.WECOM_CORP_ID = "test_corp";
    process.env.WECOM_CORP_SECRET = "test_secret";
    process.env.WECOM_AGENT_ID = "1000003";
    process.env.WECOM_CALLBACK_TOKEN = "test_token";
    process.env.WECOM_CALLBACK_AES_KEY = "test_aes_key_43_chars_long_xxxxxxxxxxxxxxx";

    const config = getWeComConfig();

    expect(config).not.toBeNull();
    expect(config!.corpId).toBe("test_corp");
    expect(config!.corpSecret).toBe("test_secret");
    expect(config!.agentId).toBe(1000003);
    expect(config!.callbackToken).toBe("test_token");
    expect(config!.callbackAesKey).toBe("test_aes_key_43_chars_long_xxxxxxxxxxxxxxx");
  });

  it("should use default port and path", () => {
    process.env.WECOM_CORP_ID = "test_corp";
    process.env.WECOM_CORP_SECRET = "test_secret";
    process.env.WECOM_AGENT_ID = "1000003";
    process.env.WECOM_CALLBACK_TOKEN = "test_token";
    process.env.WECOM_CALLBACK_AES_KEY = "test_aes_key";

    const config = getWeComConfig();

    expect(config!.callbackPort).toBe(8080);
    expect(config!.callbackPath).toBe("/wecom/callback");
  });

  it("should use custom port and path from env", () => {
    process.env.WECOM_CORP_ID = "test_corp";
    process.env.WECOM_CORP_SECRET = "test_secret";
    process.env.WECOM_AGENT_ID = "1000003";
    process.env.WECOM_CALLBACK_TOKEN = "test_token";
    process.env.WECOM_CALLBACK_AES_KEY = "test_aes_key";
    process.env.WECOM_CALLBACK_PORT = "9090";
    process.env.WECOM_CALLBACK_PATH = "/custom/callback";

    const config = getWeComConfig();

    expect(config!.callbackPort).toBe(9090);
    expect(config!.callbackPath).toBe("/custom/callback");
  });

  it("should return null if corpId is missing", () => {
    process.env.WECOM_CORP_SECRET = "test_secret";
    process.env.WECOM_AGENT_ID = "1000003";
    process.env.WECOM_CALLBACK_TOKEN = "test_token";
    process.env.WECOM_CALLBACK_AES_KEY = "test_aes_key";

    expect(getWeComConfig()).toBeNull();
  });

  it("should return null if agentId is missing", () => {
    process.env.WECOM_CORP_ID = "test_corp";
    process.env.WECOM_CORP_SECRET = "test_secret";
    process.env.WECOM_CALLBACK_TOKEN = "test_token";
    process.env.WECOM_CALLBACK_AES_KEY = "test_aes_key";

    expect(getWeComConfig()).toBeNull();
  });
});

describe("getApiClient", () => {
  beforeEach(() => {
    clearApiClientCache();
  });

  it("should create new client for new config", () => {
    const config: WeComAccountConfig = {
      corpId: "corp_1",
      corpSecret: "secret_1",
      agentId: 1001,
      callbackToken: "token",
      callbackAesKey: "aes_key",
    };

    const client = getApiClient(config);
    expect(client).toBeDefined();
  });

  it("should return same client for same config", () => {
    const config: WeComAccountConfig = {
      corpId: "corp_2",
      corpSecret: "secret_2",
      agentId: 1002,
      callbackToken: "token",
      callbackAesKey: "aes_key",
    };

    const client1 = getApiClient(config);
    const client2 = getApiClient(config);

    expect(client1).toBe(client2);
  });

  it("should return different clients for different configs", () => {
    const config1: WeComAccountConfig = {
      corpId: "corp_a",
      corpSecret: "secret_a",
      agentId: 1001,
      callbackToken: "token",
      callbackAesKey: "aes_key",
    };

    const config2: WeComAccountConfig = {
      corpId: "corp_b",
      corpSecret: "secret_b",
      agentId: 1002,
      callbackToken: "token",
      callbackAesKey: "aes_key",
    };

    const client1 = getApiClient(config1);
    const client2 = getApiClient(config2);

    expect(client1).not.toBe(client2);
  });

  it("should cache by corpId and agentId", () => {
    const config1: WeComAccountConfig = {
      corpId: "corp_x",
      corpSecret: "secret_1",
      agentId: 1001,
      callbackToken: "token",
      callbackAesKey: "aes_key",
    };

    const config2: WeComAccountConfig = {
      corpId: "corp_x",
      corpSecret: "secret_2", // Different secret
      agentId: 1001, // Same agentId
      callbackToken: "token",
      callbackAesKey: "aes_key",
    };

    const client1 = getApiClient(config1);
    const client2 = getApiClient(config2);

    // Should return same client because corpId:agentId is the same
    expect(client1).toBe(client2);
  });
});
