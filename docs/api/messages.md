# 消息接口

本文档介绍如何使用企业微信 API 发送消息。

## 获取 Access Token

所有 API 调用都需要 `access_token`。

### 请求

```http
GET https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid={corpid}&corpsecret={corpsecret}
```

### 响应

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "access_token": "accesstoken000001",
  "expires_in": 7200
}
```

> 💡 Access token 有效期 2 小时，插件会自动刷新。

---

## 发送消息

### 请求

```http
POST https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token={access_token}
```

### 通用参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `touser` | string | 否* | 用户 ID，多个用 `\|` 分隔 |
| `toparty` | string | 否* | 部门 ID |
| `totag` | string | 否* | 标签 ID |
| `msgtype` | string | 是 | 消息类型 |
| `agentid` | number | 是 | 应用 ID |

> *`touser`、`toparty`、`totag` 至少指定一个。

---

## 消息类型

### 文本消息

```json
{
  "touser": "user1|user2",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "Hello! 这是来自 AI 助手的消息。"
  }
}
```

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `content` | string | 是 | 消息内容（最大 2048 字节） |

### Markdown 消息

```json
{
  "touser": "user1",
  "msgtype": "markdown",
  "agentid": 1000001,
  "markdown": {
    "content": "# 标题\n\n这是 **粗体** 和 *斜体*。\n\n> 引用\n\n- 列表项 1\n- 列表项 2"
  }
}
```

**支持的 Markdown 语法**：
- 标题：`# ## ###`
- 粗体：`**text**`
- 斜体：`*text*`
- 链接：`[text](url)`
- 引用：`> text`
- 列表：`- item`
- 代码：`` `code` ``

### 图片消息

```json
{
  "touser": "user1",
  "msgtype": "image",
  "agentid": 1000001,
  "image": {
    "media_id": "MEDIA_ID"
  }
}
```

> 需要先上传图片获取 `media_id`。

### 文件消息

```json
{
  "touser": "user1",
  "msgtype": "file",
  "agentid": 1000001,
  "file": {
    "media_id": "MEDIA_ID"
  }
}
```

### 卡片消息

```json
{
  "touser": "user1",
  "msgtype": "textcard",
  "agentid": 1000001,
  "textcard": {
    "title": "卡片标题",
    "description": "卡片描述文本",
    "url": "https://example.com",
    "btntxt": "更多"
  }
}
```

---

## 响应

### 成功

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "msgid": "msgid_123456"
}
```

### 失败

```json
{
  "errcode": 40014,
  "errmsg": "invalid access_token"
}
```

---

## 上传媒体文件

### 请求

```http
POST https://qyapi.weixin.qq.com/cgi-bin/media/upload?access_token={token}&type={type}
Content-Type: multipart/form-data
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `type` | string | `image`, `voice`, `video`, `file` |

### 限制

| 类型 | 最大大小 | 格式 |
|------|----------|------|
| 图片 | 10MB | JPG, PNG |
| 语音 | 2MB | AMR |
| 视频 | 10MB | MP4 |
| 文件 | 20MB | 任意 |

### 响应

```json
{
  "errcode": 0,
  "errmsg": "ok",
  "type": "image",
  "media_id": "MEDIA_ID",
  "created_at": 1234567890
}
```

---

## 错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| `0` | 成功 | - |
| `40001` | 无效凭证 | 检查 Corp ID 和 Secret |
| `40014` | 无效 access_token | 刷新 token |
| `41001` | 缺少 access_token | 添加 token 参数 |
| `42001` | token 过期 | 刷新 token |
| `45009` | 接口调用超限 | 等待后重试 |
| `60011` | 无权限 | 检查应用可见范围 |
| `81013` | 用户不在可见范围 | 添加用户到应用 |

---

## 代码示例

### Node.js

```javascript
const axios = require('axios');

async function sendMessage(accessToken, userId, content) {
  const response = await axios.post(
    `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
    {
      touser: userId,
      msgtype: 'text',
      agentid: 1000001,
      text: { content }
    }
  );

  if (response.data.errcode !== 0) {
    throw new Error(response.data.errmsg);
  }

  return response.data.msgid;
}
```

### Python

```python
import requests

def send_message(access_token, user_id, content):
    url = f"https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token={access_token}"
    data = {
        "touser": user_id,
        "msgtype": "text",
        "agentid": 1000001,
        "text": {"content": content}
    }
    response = requests.post(url, json=data)
    result = response.json()

    if result["errcode"] != 0:
        raise Exception(result["errmsg"])

    return result["msgid"]
```
