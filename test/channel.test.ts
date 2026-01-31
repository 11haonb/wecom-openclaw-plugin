/**
 * WeCom Channel 单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  wecomPlugin,
  wecomDock,
  createAccountFromEnv,
  validateAccountConfig,
} from "../src/channel.js";
import type { WeComAccountConfig } from "../src/types.js";

describe("wecomDock", () => {
  it("should have correct id", () => {
    expect(wecomDock.id).toBe("wecom");
  });

  it("should support direct chat type", () => {
    expect(wecomDock.capabilities.chatTypes).toContain("direct");
  });

  it("should not support reactions", () => {
    expect(wecomDock.capabilities.reactions).toBe(false);
  });

  it("should support media", () => {
    expect(wecomDock.capabilities.media).toBe(true);
  });

  it("should not support threads", () => {
    expect(wecomDock.capabilities.threads).toBe(false);
  });

  it("should have text chunk limit", () => {
    expect(wecomDock.outbound?.textChunkLimit).toBe(2048);
  });
});

describe("wecomPlugin", () => {
  describe("meta", () => {
    it("should have correct id", () => {
      expect(wecomPlugin.id).toBe("wecom");
    });

    it("should have correct label", () => {
      expect(wecomPlugin.meta.label).toBe("WeCom");
    });

    it("should have selection label with Chinese", () => {
      expect(wecomPlugin.meta.selectionLabel).toContain("企业微信");
    });

    it("should have aliases", () => {
      expect(wecomPlugin.meta.aliases).toContain("wework");
      expect(wecomPlugin.meta.aliases).toContain("企业微信");
      expect(wecomPlugin.meta.aliases).toContain("qywx");
    });
  });

  describe("capabilities", () => {
    it("should not support threading", () => {
      expect(wecomPlugin.capabilities.supportsThreading).toBe(false);
    });

    it("should not support editing", () => {
      expect(wecomPlugin.capabilities.supportsEditing).toBe(false);
    });

    it("should not support deleting", () => {
      expect(wecomPlugin.capabilities.supportsDeleting).toBe(false);
    });

    it("should not support reactions", () => {
      expect(wecomPlugin.capabilities.supportsReactions).toBe(false);
    });

    it("should support media", () => {
      expect(wecomPlugin.capabilities.supportsMedia).toBe(true);
    });

    it("should support markdown", () => {
      expect(wecomPlugin.capabilities.supportsMarkdown).toBe(true);
    });

    it("should have max message length of 2048", () => {
      expect(wecomPlugin.capabilities.maxMessageLength).toBe(2048);
    });
  });

  describe("config.resolveAccount", () => {
    it("should resolve valid config", () => {
      const config: WeComAccountConfig = {
        corpId: "test_corp",
        corpSecret: "test_secret",
        agentId: 1000003,
        callbackToken: "test_token",
        callbackAesKey: "a".repeat(43),
      };

      const account = wecomPlugin.config.resolveAccount(config);

      expect(account).not.toBeNull();
      expect(account!.corpId).toBe("test_corp");
      expect(account!.agentId).toBe(1000003);
    });

    it("should return null for missing corpId", () => {
      const config = {
        corpSecret: "test_secret",
        agentId: 1000003,
        callbackToken: "test_token",
        callbackAesKey: "a".repeat(43),
      };

      const account = wecomPlugin.config.resolveAccount(config);
      expect(account).toBeNull();
    });

    it("should return null for missing corpSecret", () => {
      const config = {
        corpId: "test_corp",
        agentId: 1000003,
        callbackToken: "test_token",
        callbackAesKey: "a".repeat(43),
      };

      const account = wecomPlugin.config.resolveAccount(config);
      expect(account).toBeNull();
    });

    it("should return null for missing agentId", () => {
      const config = {
        corpId: "test_corp",
        corpSecret: "test_secret",
        callbackToken: "test_token",
        callbackAesKey: "a".repeat(43),
      };

      const account = wecomPlugin.config.resolveAccount(config);
      expect(account).toBeNull();
    });

    it("should return null for missing callbackToken", () => {
      const config = {
        corpId: "test_corp",
        corpSecret: "test_secret",
        agentId: 1000003,
        callbackAesKey: "a".repeat(43),
      };

      const account = wecomPlugin.config.resolveAccount(config);
      expect(account).toBeNull();
    });

    it("should return null for missing callbackAesKey", () => {
      const config = {
        corpId: "test_corp",
        corpSecret: "test_secret",
        agentId: 1000003,
        callbackToken: "test_token",
      };

      const account = wecomPlugin.config.resolveAccount(config);
      expect(account).toBeNull();
    });

    it("should return null for invalid AES key length", () => {
      const config: WeComAccountConfig = {
        corpId: "test_corp",
        corpSecret: "test_secret",
        agentId: 1000003,
        callbackToken: "test_token",
        callbackAesKey: "too_short",
      };

      const account = wecomPlugin.config.resolveAccount(config);
      expect(account).toBeNull();
    });

    it("should return null for null input", () => {
      const account = wecomPlugin.config.resolveAccount(null);
      expect(account).toBeNull();
    });

    it("should return null for undefined input", () => {
      const account = wecomPlugin.config.resolveAccount(undefined);
      expect(account).toBeNull();
    });
  });

  describe("config.getAccountId", () => {
    it("should return formatted account id", () => {
      const account = {
        config: {} as WeComAccountConfig,
        corpId: "corp_123",
        agentId: 1000003,
      };

      const id = wecomPlugin.config.getAccountId(account);
      expect(id).toBe("wecom:corp_123:1000003");
    });
  });

  describe("config.getAccountLabel", () => {
    it("should return formatted label", () => {
      const account = {
        config: {} as WeComAccountConfig,
        corpId: "corp_123",
        agentId: 1000003,
      };

      const label = wecomPlugin.config.getAccountLabel(account);
      expect(label).toBe("WeCom Agent 1000003");
    });
  });
});

describe("createAccountFromEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return null when env vars are missing", () => {
    delete process.env.WECOM_CORP_ID;
    expect(createAccountFromEnv()).toBeNull();
  });

  it("should create config from env vars", () => {
    process.env.WECOM_CORP_ID = "env_corp";
    process.env.WECOM_CORP_SECRET = "env_secret";
    process.env.WECOM_AGENT_ID = "1000005";
    process.env.WECOM_CALLBACK_TOKEN = "env_token";
    process.env.WECOM_CALLBACK_AES_KEY = "env_aes_key";

    const config = createAccountFromEnv();

    expect(config).not.toBeNull();
    expect(config!.corpId).toBe("env_corp");
    expect(config!.agentId).toBe(1000005);
  });

  it("should use default port and path", () => {
    process.env.WECOM_CORP_ID = "env_corp";
    process.env.WECOM_CORP_SECRET = "env_secret";
    process.env.WECOM_AGENT_ID = "1000005";
    process.env.WECOM_CALLBACK_TOKEN = "env_token";
    process.env.WECOM_CALLBACK_AES_KEY = "env_aes_key";

    const config = createAccountFromEnv();

    expect(config!.callbackPort).toBe(8080);
    expect(config!.callbackPath).toBe("/wecom/callback");
  });
});

describe("validateAccountConfig", () => {
  it("should return empty array for valid config", () => {
    const config: WeComAccountConfig = {
      corpId: "test_corp",
      corpSecret: "test_secret",
      agentId: 1000003,
      callbackToken: "test_token",
      callbackAesKey: "a".repeat(43),
    };

    const errors = validateAccountConfig(config);
    expect(errors).toHaveLength(0);
  });

  it("should return error for missing corpId", () => {
    const config = {
      corpId: "",
      corpSecret: "test_secret",
      agentId: 1000003,
      callbackToken: "test_token",
      callbackAesKey: "a".repeat(43),
    } as WeComAccountConfig;

    const errors = validateAccountConfig(config);
    expect(errors).toContain("corpId is required");
  });

  it("should return error for missing corpSecret", () => {
    const config = {
      corpId: "test_corp",
      corpSecret: "",
      agentId: 1000003,
      callbackToken: "test_token",
      callbackAesKey: "a".repeat(43),
    } as WeComAccountConfig;

    const errors = validateAccountConfig(config);
    expect(errors).toContain("corpSecret is required");
  });

  it("should return error for invalid agentId", () => {
    const config = {
      corpId: "test_corp",
      corpSecret: "test_secret",
      agentId: 0,
      callbackToken: "test_token",
      callbackAesKey: "a".repeat(43),
    } as WeComAccountConfig;

    const errors = validateAccountConfig(config);
    expect(errors).toContain("agentId must be a positive integer");
  });

  it("should return error for negative agentId", () => {
    const config = {
      corpId: "test_corp",
      corpSecret: "test_secret",
      agentId: -1,
      callbackToken: "test_token",
      callbackAesKey: "a".repeat(43),
    } as WeComAccountConfig;

    const errors = validateAccountConfig(config);
    expect(errors).toContain("agentId must be a positive integer");
  });

  it("should return error for missing callbackToken", () => {
    const config = {
      corpId: "test_corp",
      corpSecret: "test_secret",
      agentId: 1000003,
      callbackToken: "",
      callbackAesKey: "a".repeat(43),
    } as WeComAccountConfig;

    const errors = validateAccountConfig(config);
    expect(errors).toContain("callbackToken is required");
  });

  it("should return error for missing callbackAesKey", () => {
    const config = {
      corpId: "test_corp",
      corpSecret: "test_secret",
      agentId: 1000003,
      callbackToken: "test_token",
      callbackAesKey: "",
    } as WeComAccountConfig;

    const errors = validateAccountConfig(config);
    expect(errors).toContain("callbackAesKey is required");
  });

  it("should return error for invalid callbackAesKey length", () => {
    const config = {
      corpId: "test_corp",
      corpSecret: "test_secret",
      agentId: 1000003,
      callbackToken: "test_token",
      callbackAesKey: "too_short",
    } as WeComAccountConfig;

    const errors = validateAccountConfig(config);
    expect(errors).toContain("callbackAesKey must be exactly 43 characters");
  });

  it("should return multiple errors", () => {
    const config = {
      corpId: "",
      corpSecret: "",
      agentId: 0,
      callbackToken: "",
      callbackAesKey: "",
    } as WeComAccountConfig;

    const errors = validateAccountConfig(config);
    expect(errors.length).toBeGreaterThan(1);
  });
});
