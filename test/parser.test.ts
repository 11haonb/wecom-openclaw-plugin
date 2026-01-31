/**
 * WeCom Parser 单元测试
 */
import { describe, it, expect } from "vitest";
import { parseMessage, getMessageId, isEventMessage } from "../src/parser.js";

describe("parseMessage", () => {
  describe("text message", () => {
    it("should parse text message correctly", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp_id]]></ToUserName>
          <FromUserName><![CDATA[user_id]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[Hello World]]></Content>
          <MsgId>1234567890123456</MsgId>
          <AgentID>1000003</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);

      expect(msg.toUserName).toBe("corp_id");
      expect(msg.fromUserName).toBe("user_id");
      expect(msg.createTime).toBe(1348831860);
      expect(msg.msgType).toBe("text");
      expect(msg.content).toBe("Hello World");
      expect(msg.msgId).toBe("1234567890123456");
      expect(msg.agentId).toBe(1000003);
    });

    it("should handle Chinese content", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp]]></ToUserName>
          <FromUserName><![CDATA[user]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[你好，世界！]]></Content>
          <MsgId>123</MsgId>
          <AgentID>1</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);
      expect(msg.content).toBe("你好，世界！");
    });

    it("should handle special characters in content", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp]]></ToUserName>
          <FromUserName><![CDATA[user]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[<script>alert('xss')</script>]]></Content>
          <MsgId>123</MsgId>
          <AgentID>1</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);
      expect(msg.content).toBe("<script>alert('xss')</script>");
    });
  });

  describe("image message", () => {
    it("should parse image message correctly", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp]]></ToUserName>
          <FromUserName><![CDATA[user]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[image]]></MsgType>
          <PicUrl><![CDATA[http://example.com/image.jpg]]></PicUrl>
          <MediaId><![CDATA[media_id_123]]></MediaId>
          <MsgId>123456</MsgId>
          <AgentID>1</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);

      expect(msg.msgType).toBe("image");
      expect(msg.picUrl).toBe("http://example.com/image.jpg");
      expect(msg.mediaId).toBe("media_id_123");
    });
  });

  describe("voice message", () => {
    it("should parse voice message correctly", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp]]></ToUserName>
          <FromUserName><![CDATA[user]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[voice]]></MsgType>
          <MediaId><![CDATA[media_id_voice]]></MediaId>
          <Format><![CDATA[amr]]></Format>
          <MsgId>123456</MsgId>
          <AgentID>1</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);

      expect(msg.msgType).toBe("voice");
      expect(msg.mediaId).toBe("media_id_voice");
      expect(msg.format).toBe("amr");
    });
  });

  describe("video message", () => {
    it("should parse video message correctly", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp]]></ToUserName>
          <FromUserName><![CDATA[user]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[video]]></MsgType>
          <MediaId><![CDATA[media_id_video]]></MediaId>
          <ThumbMediaId><![CDATA[thumb_media_id]]></ThumbMediaId>
          <MsgId>123456</MsgId>
          <AgentID>1</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);

      expect(msg.msgType).toBe("video");
      expect(msg.mediaId).toBe("media_id_video");
      expect(msg.thumbMediaId).toBe("thumb_media_id");
    });
  });

  describe("location message", () => {
    it("should parse location message correctly", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp]]></ToUserName>
          <FromUserName><![CDATA[user]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[location]]></MsgType>
          <Location_X>23.134521</Location_X>
          <Location_Y>113.358803</Location_Y>
          <Scale>20</Scale>
          <Label><![CDATA[广州市海珠区]]></Label>
          <MsgId>123456</MsgId>
          <AgentID>1</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);

      expect(msg.msgType).toBe("location");
      expect(msg.locationX).toBeCloseTo(23.134521, 5);
      expect(msg.locationY).toBeCloseTo(113.358803, 5);
      expect(msg.scale).toBe(20);
      expect(msg.label).toBe("广州市海珠区");
    });
  });

  describe("link message", () => {
    it("should parse link message correctly", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp]]></ToUserName>
          <FromUserName><![CDATA[user]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[link]]></MsgType>
          <Title><![CDATA[Test Title]]></Title>
          <Description><![CDATA[Test Description]]></Description>
          <Url><![CDATA[http://example.com]]></Url>
          <PicUrl><![CDATA[http://example.com/pic.jpg]]></PicUrl>
          <MsgId>123456</MsgId>
          <AgentID>1</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);

      expect(msg.msgType).toBe("link");
      expect(msg.title).toBe("Test Title");
      expect(msg.description).toBe("Test Description");
      expect(msg.url).toBe("http://example.com");
      expect(msg.picUrl).toBe("http://example.com/pic.jpg");
    });
  });

  describe("event message", () => {
    it("should parse subscribe event", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp]]></ToUserName>
          <FromUserName><![CDATA[user]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[event]]></MsgType>
          <Event><![CDATA[subscribe]]></Event>
          <AgentID>1</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);

      expect(msg.msgType).toBe("event");
      expect(msg.event).toBe("subscribe");
    });

    it("should parse click event with EventKey", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp]]></ToUserName>
          <FromUserName><![CDATA[user]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[event]]></MsgType>
          <Event><![CDATA[click]]></Event>
          <EventKey><![CDATA[menu_key_1]]></EventKey>
          <AgentID>1</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);

      expect(msg.msgType).toBe("event");
      expect(msg.event).toBe("click");
      expect(msg.eventKey).toBe("menu_key_1");
    });

    it("should parse enter_agent event", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp]]></ToUserName>
          <FromUserName><![CDATA[user]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[event]]></MsgType>
          <Event><![CDATA[enter_agent]]></Event>
          <AgentID>1</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);

      expect(msg.msgType).toBe("event");
      expect(msg.event).toBe("enter_agent");
    });
  });

  describe("edge cases", () => {
    it("should handle missing optional fields", () => {
      const xml = `
        <xml>
          <ToUserName><![CDATA[corp]]></ToUserName>
          <FromUserName><![CDATA[user]]></FromUserName>
          <CreateTime>1348831860</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <AgentID>1</AgentID>
        </xml>
      `;

      const msg = parseMessage(xml);

      expect(msg.content).toBe("");
      expect(msg.msgId).toBe("");
    });

    it("should throw error for invalid XML", () => {
      const xml = "not valid xml";

      expect(() => parseMessage(xml)).toThrow();
    });

    it("should throw error for missing xml root", () => {
      const xml = "<root><data>test</data></root>";

      expect(() => parseMessage(xml)).toThrow(/Invalid XML message format/);
    });
  });
});

describe("getMessageId", () => {
  it("should return msgId for text message", () => {
    const xml = `
      <xml>
        <ToUserName><![CDATA[corp]]></ToUserName>
        <FromUserName><![CDATA[user]]></FromUserName>
        <CreateTime>1348831860</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[test]]></Content>
        <MsgId>123456789</MsgId>
        <AgentID>1</AgentID>
      </xml>
    `;

    const msg = parseMessage(xml);
    expect(getMessageId(msg)).toBe("123456789");
  });

  it("should return undefined for event message", () => {
    const xml = `
      <xml>
        <ToUserName><![CDATA[corp]]></ToUserName>
        <FromUserName><![CDATA[user]]></FromUserName>
        <CreateTime>1348831860</CreateTime>
        <MsgType><![CDATA[event]]></MsgType>
        <Event><![CDATA[subscribe]]></Event>
        <AgentID>1</AgentID>
      </xml>
    `;

    const msg = parseMessage(xml);
    expect(getMessageId(msg)).toBeUndefined();
  });
});

describe("isEventMessage", () => {
  it("should return true for event message", () => {
    const xml = `
      <xml>
        <ToUserName><![CDATA[corp]]></ToUserName>
        <FromUserName><![CDATA[user]]></FromUserName>
        <CreateTime>1348831860</CreateTime>
        <MsgType><![CDATA[event]]></MsgType>
        <Event><![CDATA[subscribe]]></Event>
        <AgentID>1</AgentID>
      </xml>
    `;

    const msg = parseMessage(xml);
    expect(isEventMessage(msg)).toBe(true);
  });

  it("should return false for text message", () => {
    const xml = `
      <xml>
        <ToUserName><![CDATA[corp]]></ToUserName>
        <FromUserName><![CDATA[user]]></FromUserName>
        <CreateTime>1348831860</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[test]]></Content>
        <MsgId>123</MsgId>
        <AgentID>1</AgentID>
      </xml>
    `;

    const msg = parseMessage(xml);
    expect(isEventMessage(msg)).toBe(false);
  });
});
