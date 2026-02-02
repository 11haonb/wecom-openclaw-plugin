# API 概览

WeCom OpenClaw Plugin 提供回调接口接收企业微信消息，并使用企业微信 API 发送回复。

## 回调接口

### URL

```
POST /wecom/callback
GET /wecom/callback
```

- **GET 请求**：用于企业微信验证回调 URL
- **POST 请求**：接收用户消息

### 验证流程

1. 企业微信发送 GET 请求验证 URL
2. 服务器验证签名
3. 解密 echostr 并返回

### 消息流程

1. 用户在企业微信发送消息
2. 企业微信服务器 POST 加密消息到回调 URL
3. 服务器解密消息，调用 AI 处理
4. 通过企业微信 API 发送回复

---

## 支持的消息类型

### 接收消息

| 类型 | MsgType | 说明 |
|------|---------|------|
| 文本 | `text` | 文本消息 |
| 图片 | `image` | 图片消息 |
| 语音 | `voice` | 语音消息 |
| 视频 | `video` | 视频消息 |
| 文件 | `file` | 文件消息 |
| 事件 | `event` | 事件通知 |

### 发送消息

| 类型 | msgtype | 说明 |
|------|---------|------|
| 文本 | `text` | 纯文本消息 |
| Markdown | `markdown` | 支持格式化 |
| 图片 | `image` | 需要先上传 |
| 文件 | `file` | 需要先上传 |
| 卡片 | `textcard` | 带链接的卡片 |

---

## 加密说明

### 算法

企业微信使用 AES-256-CBC 加密，PKCS#7 填充。

### 密钥

`EncodingAESKey` 是 Base64 编码的 43 位字符串，解码后得到 32 字节 AES 密钥。

### 签名验证

签名算法：
1. 将 `[token, timestamp, nonce, encrypt]` 按字典序排序
2. 拼接后计算 SHA1 哈希
3. 与 `msg_signature` 比较

---

## 错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| `40001` | 无效凭证 | 检查 Corp ID 和 Secret |
| `40014` | 无效 access_token | 刷新 token |
| `42001` | token 过期 | 刷新 token |
| `45009` | 接口调用超限 | 等待后重试 |
| `60011` | 无权限 | 检查应用可见范围 |

---

## 速率限制

| API | 限制 |
|-----|------|
| 发送消息 | 200 次/分钟/应用 |
| 上传媒体 | 1000 次/天 |
| 获取 Token | 2000 次/天 |

---

## 更多信息

- [回调接口详情](callback.md)
- [消息接口详情](messages.md)
- [企业微信官方文档](https://developer.work.weixin.qq.com/document/)
