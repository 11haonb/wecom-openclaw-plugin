# 回调接口

企业微信通过回调接口向服务器发送消息和事件通知。

## URL 验证

当配置回调 URL 时，企业微信会发送 GET 请求验证。

### 请求

```http
GET /wecom/callback?msg_signature={signature}&timestamp={timestamp}&nonce={nonce}&echostr={echostr}
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `msg_signature` | string | 消息签名 |
| `timestamp` | string | 时间戳 |
| `nonce` | string | 随机字符串 |
| `echostr` | string | 加密的随机字符串 |

### 验证流程

1. 将 `[token, timestamp, nonce, echostr]` 按字典序排序
2. 拼接后计算 SHA1 哈希
3. 与 `msg_signature` 比较
4. 验证通过后，解密 `echostr` 并返回明文

### 响应

**成功**：返回解密后的 echostr

**失败**：返回错误信息

---

## 消息接收

用户发送消息时，企业微信 POST 加密消息到回调 URL。

### 请求

```http
POST /wecom/callback?msg_signature={signature}&timestamp={timestamp}&nonce={nonce}
Content-Type: application/xml
```

### 请求体

```xml
<xml>
  <ToUserName><![CDATA[ww1234567890abcdef]]></ToUserName>
  <AgentID>1000001</AgentID>
  <Encrypt><![CDATA[加密的消息内容]]></Encrypt>
</xml>
```

### 解密后的消息格式

**文本消息**：

```xml
<xml>
  <ToUserName><![CDATA[ww1234567890abcdef]]></ToUserName>
  <FromUserName><![CDATA[user_id]]></FromUserName>
  <CreateTime>1234567890</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[消息内容]]></Content>
  <MsgId>1234567890123456</MsgId>
  <AgentID>1000001</AgentID>
</xml>
```

**图片消息**：

```xml
<xml>
  <ToUserName><![CDATA[ww1234567890abcdef]]></ToUserName>
  <FromUserName><![CDATA[user_id]]></FromUserName>
  <CreateTime>1234567890</CreateTime>
  <MsgType><![CDATA[image]]></MsgType>
  <PicUrl><![CDATA[图片URL]]></PicUrl>
  <MediaId><![CDATA[media_id]]></MediaId>
  <MsgId>1234567890123456</MsgId>
  <AgentID>1000001</AgentID>
</xml>
```

**事件消息**：

```xml
<xml>
  <ToUserName><![CDATA[ww1234567890abcdef]]></ToUserName>
  <FromUserName><![CDATA[user_id]]></FromUserName>
  <CreateTime>1234567890</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[enter_agent]]></Event>
  <AgentID>1000001</AgentID>
</xml>
```

### 响应

必须在 5 秒内返回 `success` 字符串：

```
success
```

> ⚠️ 如果不在 5 秒内响应，企业微信会重试最多 3 次。

---

## 消息字段说明

### 通用字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `ToUserName` | string | 企业 ID |
| `FromUserName` | string | 发送者用户 ID |
| `CreateTime` | number | 消息创建时间戳 |
| `MsgType` | string | 消息类型 |
| `AgentID` | number | 应用 ID |

### 文本消息字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `Content` | string | 文本内容 |
| `MsgId` | string | 消息 ID |

### 图片消息字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `PicUrl` | string | 图片 URL（临时） |
| `MediaId` | string | 媒体 ID |
| `MsgId` | string | 消息 ID |

### 事件字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `Event` | string | 事件类型 |
| `EventKey` | string | 事件 Key（可选） |

---

## 事件类型

| 事件 | 说明 |
|------|------|
| `enter_agent` | 用户进入应用 |
| `subscribe` | 用户关注应用 |
| `unsubscribe` | 用户取消关注 |
| `click` | 点击菜单按钮 |
| `view` | 点击菜单链接 |

---

## 测试

### 使用 curl 测试

```bash
curl "http://localhost:18789/wecom/callback?\
msg_signature=test&\
timestamp=1234567890&\
nonce=test&\
echostr=test"
```

### 查看日志

```bash
tail -f /tmp/gateway.log | grep -i wecom
```
