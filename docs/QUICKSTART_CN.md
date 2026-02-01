# 快速入门指南

本文档帮助你在 5 分钟内完成 WeCom OpenClaw 集成的配置。

---

## 前置条件

- 一台有公网 IP 的服务器（或使用内网穿透）
- 企业微信管理员权限
- Node.js 18+ 已安装

---

## 第一步：获取企业微信凭证

### 1.1 获取企业 ID

1. 登录 [企业微信管理后台](https://work.weixin.qq.com/)
2. 点击 **我的企业** → 找到 **企业ID**
3. 复制保存（格式如：`ww1234567890abcdef`）

### 1.2 创建应用

1. 进入 **应用管理** → **自建** → **创建应用**
2. 填写应用名称（如：AI助手）
3. 选择可见范围
4. 创建后记录：
   - **AgentId**（应用ID）
   - **Secret**（应用密钥，点击查看）

### 1.3 配置消息接收

1. 在应用详情页，找到 **接收消息** → **设置API接收**
2. 点击 **随机获取** 生成 Token 和 EncodingAESKey
3. **先不要点确定！** 需要先启动服务器

记录以下信息：
| 字段 | 示例值 |
|------|--------|
| 企业ID | `ww1234567890abcdef` |
| AgentId | `1000001` |
| Secret | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| Token | `xxxxxxxxxxxxxx` |
| EncodingAESKey | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

---

## 第二步：配置服务器

### 2.1 安装 OpenClaw

```bash
# 克隆项目
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 安装依赖
pnpm install

# 构建
pnpm build
```

### 2.2 创建配置文件

创建 `~/.openclaw/openclaw.json`：

```json
{
  "env": {
    "OPENROUTER_API_KEY": "你的OpenRouter密钥",
    "WECOM_CORP_ID": "你的企业ID",
    "WECOM_CORP_SECRET": "你的应用Secret",
    "WECOM_AGENT_ID": "你的AgentId",
    "WECOM_CALLBACK_TOKEN": "你的Token",
    "WECOM_CALLBACK_AES_KEY": "你的EncodingAESKey"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openrouter/qwen/qwen3-max"
      }
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "lan"
  },
  "plugins": {
    "entries": {
      "wecom": {
        "enabled": true
      }
    }
  }
}
```

### 2.3 启动服务

```bash
node dist/entry.js gateway
```

看到以下日志说明启动成功：
```
[WeCom] Plugin registered
[WeCom] Corp ID: ww1234567890abcdef
[WeCom] Agent ID: 1000001
[WeCom] Callback path: /wecom/callback
```

---

## 第三步：完成企业微信配置

### 3.1 设置回调 URL

回到企业微信管理后台的 **接收消息** 设置页面：

1. 填写 URL：`http://你的服务器IP:18789/wecom/callback`
2. 点击 **保存**

如果显示 **验证成功**，恭喜你配置完成！

### 3.2 常见错误

| 错误 | 解决方案 |
|------|----------|
| 回调地址请求不通 | 检查服务器防火墙是否开放 18789 端口 |
| 签名校验失败 | 检查 Token 和 EncodingAESKey 是否正确 |
| 解密失败 | EncodingAESKey 必须是 43 位 |

---

## 第四步：测试

1. 打开手机企业微信 APP
2. 找到你创建的应用
3. 发送一条消息，如："你好"
4. 等待 AI 回复

---

## 下一步

- [配置远程浏览器控制](./README.md#remote-browser-control)
- [配置群聊支持](./README.md#group-chat)
- [配置多账号](./README.md#multi-account-support)

---

## 获取帮助

- 查看日志：`tail -f /tmp/gateway.log`
- 联系作者：[liujinqi@bit.edu.cn](mailto:liujinqi@bit.edu.cn)
