/**
 * WeCom API Client 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WeComApiClient } from "../src/api.js";

// Mock https module
vi.mock("node:https", () => ({
  default: {
    get: vi.fn(),
    request: vi.fn(),
  },
}));

import https from "node:https";

describe("WeComApiClient", () => {
  const testConfig = {
    corpId: "test_corp_id",
    corpSecret: "test_corp_secret",
    agentId: 1000003,
  };

  let client: WeComApiClient;

  beforeEach(() => {
    client = new WeComApiClient(testConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with valid config", () => {
      expect(client).toBeInstanceOf(WeComApiClient);
    });
  });

  describe("getToken", () => {
    it("should fetch token from API", async () => {
      const mockResponse = {
        errcode: 0,
        errmsg: "ok",
        access_token: "test_access_token",
        expires_in: 7200,
      };

      // Mock https.get
      const mockGet = vi.mocked(https.get);
      mockGet.mockImplementation((url: any, callback: any) => {
        const mockRes = {
          on: vi.fn((event: string, handler: Function) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify(mockResponse)));
            }
            if (event === "end") {
              handler();
            }
            return mockRes;
          }),
        };
        callback(mockRes);
        return { on: vi.fn().mockReturnThis(), setTimeout: vi.fn() } as any;
      });

      const token = await client.getToken();

      expect(token).toBe("test_access_token");
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet.mock.calls[0][0]).toContain("gettoken");
      expect(mockGet.mock.calls[0][0]).toContain(testConfig.corpId);
    });

    it("should cache token and reuse it", async () => {
      const mockResponse = {
        errcode: 0,
        errmsg: "ok",
        access_token: "cached_token",
        expires_in: 7200,
      };

      const mockGet = vi.mocked(https.get);
      mockGet.mockImplementation((url: any, callback: any) => {
        const mockRes = {
          on: vi.fn((event: string, handler: Function) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify(mockResponse)));
            }
            if (event === "end") {
              handler();
            }
            return mockRes;
          }),
        };
        callback(mockRes);
        return { on: vi.fn().mockReturnThis(), setTimeout: vi.fn() } as any;
      });

      // First call
      const token1 = await client.getToken();
      // Second call should use cache
      const token2 = await client.getToken();

      expect(token1).toBe("cached_token");
      expect(token2).toBe("cached_token");
      // Should only call API once
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it("should throw error on API failure", async () => {
      const mockResponse = {
        errcode: 40013,
        errmsg: "invalid corpid",
      };

      const mockGet = vi.mocked(https.get);
      mockGet.mockImplementation((url: any, callback: any) => {
        const mockRes = {
          on: vi.fn((event: string, handler: Function) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify(mockResponse)));
            }
            if (event === "end") {
              handler();
            }
            return mockRes;
          }),
        };
        callback(mockRes);
        return { on: vi.fn().mockReturnThis(), setTimeout: vi.fn() } as any;
      });

      await expect(client.getToken()).rejects.toThrow(/invalid corpid/);
    });
  });

  describe("sendText", () => {
    it("should send text message", async () => {
      // Mock getToken
      const mockTokenResponse = {
        errcode: 0,
        errmsg: "ok",
        access_token: "test_token",
        expires_in: 7200,
      };

      const mockSendResponse = {
        errcode: 0,
        errmsg: "ok",
        msgid: "msg_123",
      };

      const mockGet = vi.mocked(https.get);
      mockGet.mockImplementation((url: any, callback: any) => {
        const mockRes = {
          on: vi.fn((event: string, handler: Function) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify(mockTokenResponse)));
            }
            if (event === "end") {
              handler();
            }
            return mockRes;
          }),
        };
        callback(mockRes);
        return { on: vi.fn().mockReturnThis(), setTimeout: vi.fn() } as any;
      });

      const mockRequest = vi.mocked(https.request);
      mockRequest.mockImplementation((options: any, callback: any) => {
        const mockRes = {
          on: vi.fn((event: string, handler: Function) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify(mockSendResponse)));
            }
            if (event === "end") {
              handler();
            }
            return mockRes;
          }),
        };
        callback(mockRes);
        return {
          on: vi.fn().mockReturnThis(),
          setTimeout: vi.fn(),
          write: vi.fn(),
          end: vi.fn(),
        } as any;
      });

      const response = await client.sendText("user_id", "Hello World");

      expect(response.errcode).toBe(0);
      expect(response.msgid).toBe("msg_123");
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    it("should include correct message body", async () => {
      const mockTokenResponse = {
        errcode: 0,
        errmsg: "ok",
        access_token: "test_token",
        expires_in: 7200,
      };

      const mockSendResponse = {
        errcode: 0,
        errmsg: "ok",
      };

      const mockGet = vi.mocked(https.get);
      mockGet.mockImplementation((url: any, callback: any) => {
        const mockRes = {
          on: vi.fn((event: string, handler: Function) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify(mockTokenResponse)));
            }
            if (event === "end") {
              handler();
            }
            return mockRes;
          }),
        };
        callback(mockRes);
        return { on: vi.fn().mockReturnThis(), setTimeout: vi.fn() } as any;
      });

      let capturedBody = "";
      const mockRequest = vi.mocked(https.request);
      mockRequest.mockImplementation((options: any, callback: any) => {
        const mockRes = {
          on: vi.fn((event: string, handler: Function) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify(mockSendResponse)));
            }
            if (event === "end") {
              handler();
            }
            return mockRes;
          }),
        };
        callback(mockRes);
        return {
          on: vi.fn().mockReturnThis(),
          setTimeout: vi.fn(),
          write: vi.fn((body: string) => {
            capturedBody = body;
          }),
          end: vi.fn(),
        } as any;
      });

      await client.sendText("test_user", "Test message");

      const body = JSON.parse(capturedBody);
      expect(body.touser).toBe("test_user");
      expect(body.msgtype).toBe("text");
      expect(body.agentid).toBe(testConfig.agentId);
      expect(body.text.content).toBe("Test message");
    });
  });

  describe("sendMarkdown", () => {
    it("should send markdown message", async () => {
      const mockTokenResponse = {
        errcode: 0,
        errmsg: "ok",
        access_token: "test_token",
        expires_in: 7200,
      };

      const mockSendResponse = {
        errcode: 0,
        errmsg: "ok",
        msgid: "msg_md_123",
      };

      const mockGet = vi.mocked(https.get);
      mockGet.mockImplementation((url: any, callback: any) => {
        const mockRes = {
          on: vi.fn((event: string, handler: Function) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify(mockTokenResponse)));
            }
            if (event === "end") {
              handler();
            }
            return mockRes;
          }),
        };
        callback(mockRes);
        return { on: vi.fn().mockReturnThis(), setTimeout: vi.fn() } as any;
      });

      let capturedBody = "";
      const mockRequest = vi.mocked(https.request);
      mockRequest.mockImplementation((options: any, callback: any) => {
        const mockRes = {
          on: vi.fn((event: string, handler: Function) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify(mockSendResponse)));
            }
            if (event === "end") {
              handler();
            }
            return mockRes;
          }),
        };
        callback(mockRes);
        return {
          on: vi.fn().mockReturnThis(),
          setTimeout: vi.fn(),
          write: vi.fn((body: string) => {
            capturedBody = body;
          }),
          end: vi.fn(),
        } as any;
      });

      const response = await client.sendMarkdown("user_id", "# Hello\n**World**");

      expect(response.errcode).toBe(0);

      const body = JSON.parse(capturedBody);
      expect(body.msgtype).toBe("markdown");
      expect(body.markdown.content).toBe("# Hello\n**World**");
    });
  });

  describe("getUser", () => {
    it("should fetch user info", async () => {
      const mockTokenResponse = {
        errcode: 0,
        errmsg: "ok",
        access_token: "test_token",
        expires_in: 7200,
      };

      const mockUserResponse = {
        errcode: 0,
        errmsg: "ok",
        userid: "test_user",
        name: "Test User",
        department: [1, 2],
      };

      const mockGet = vi.mocked(https.get);
      let callCount = 0;
      mockGet.mockImplementation((url: any, callback: any) => {
        callCount++;
        const response = callCount === 1 ? mockTokenResponse : mockUserResponse;
        const mockRes = {
          on: vi.fn((event: string, handler: Function) => {
            if (event === "data") {
              handler(Buffer.from(JSON.stringify(response)));
            }
            if (event === "end") {
              handler();
            }
            return mockRes;
          }),
        };
        callback(mockRes);
        return { on: vi.fn().mockReturnThis(), setTimeout: vi.fn() } as any;
      });

      const user = await client.getUser("test_user");

      expect(user.userid).toBe("test_user");
      expect(user.name).toBe("Test User");
    });
  });
});
