# FAQ

## 基础问题

### WeCom OpenClaw Plugin 是什么？

WeCom OpenClaw Plugin 是一个企业微信集成插件，让你可以：
- 在企业微信中与 AI 助手对话
- 远程控制连接到 Gateway 的电脑
- 在群聊中使用 AI 助手

它基于 [OpenClaw](https://github.com/openclaw/openclaw) 开源项目构建。

### 支持哪些 AI 模型？

支持多种 AI 模型提供商：
- **OpenRouter**：GPT-4、Claude、Qwen 等
- **OpenAI**：GPT-4o、GPT-4 Turbo
- **Anthropic**：Claude 3.5 Sonnet、Claude 3 Opus
- **阿里云**：通义千问系列

推荐使用 OpenRouter，可以灵活切换不同模型。

### 需要什么服务器配置？

**最低配置**：
- CPU：1 核
- 内存：1GB
- 存储：10GB
- 网络：有公网 IP 或内网穿透

**推荐配置**：
- CPU：2 核
- 内存：2GB
- 存储：20GB

### 支持哪些操作系统？

**Gateway 支持**：
- Linux（推荐 Ubuntu 20.04+）
- macOS 12+
- Windows 10+（不推荐作为 Gateway）

**Node 支持**：
- Windows 10+
- macOS 12+
- Linux

---

## 费用问题

### 使用这个插件需要付费吗？

**插件本身免费开源**。

但你需要支付：
- AI 模型 API 费用（按使用量计费）
- 服务器费用（如果使用云服务器）

企业微信本身对企业用户免费。

### AI API 费用大概多少？

以 OpenRouter 为例（参考价格）：
- Qwen-Max：约 $0.002/1K tokens
- GPT-4o：约 $0.005/1K tokens
- Claude 3.5：约 $0.003/1K tokens

一般日常使用，每月费用在 $5-20 左右。

### 有免费的 AI 模型吗？

部分模型提供免费额度：
- OpenRouter 新用户有免费额度
- 阿里云通义千问有免费调用次数
- 部分开源模型可以本地部署

但免费额度通常有限，建议准备付费 API。

---

## 安全问题

### 我的消息会被第三方看到吗？

消息流向：
1. 企业微信 APP → 企业微信服务器（腾讯）
2. 企业微信服务器 → 你的 Gateway（你控制）
3. Gateway → AI 模型 API（模型提供商）

**你的消息会经过**：
- 腾讯（企业微信）
- AI 模型提供商（如 OpenAI、Anthropic）

如果对隐私有严格要求，可以：
- 使用本地部署的开源模型
- 选择有数据保护承诺的提供商

### 远程控制安全吗？

远程控制功能需要：
1. Gateway Token 认证
2. 节点主动连接 Gateway
3. 可配置的命令执行权限

安全建议：
- 使用强 Token
- 只在内网部署
- 配置命令白名单
- 定期审计日志

---

## 功能问题

### 可以发送图片吗？

目前支持：
- 接收用户发送的图片（AI 可以分析）
- 发送文本回复

图片发送功能正在开发中。

### 支持语音消息吗？

目前不支持语音消息。计划在未来版本中添加语音转文字功能。

### 可以同时连接多台电脑吗？

可以。每台电脑作为一个 Node 连接到 Gateway。

在 TOOLS.md 中配置多个节点：
```markdown
你有以下已连接的电脑：
- **office-pc**：办公室电脑
- **home-pc**：家里电脑
```

### 支持多个企业微信应用吗？

目前一个 Gateway 只支持一个企业微信应用。

如果需要多个应用，可以部署多个 Gateway 实例。

---

## 部署问题

### 可以用 Docker 部署吗？

可以。创建 Dockerfile：

```dockerfile
FROM node:18-alpine
RUN npm install -g openclaw
EXPOSE 18789
CMD ["openclaw", "gateway", "run", "--bind", "lan"]
```

运行：
```bash
docker build -t openclaw-gateway .
docker run -d -p 18789:18789 \
  -v ~/.openclaw:/root/.openclaw \
  openclaw-gateway
```

### 可以用内网穿透吗？

可以。推荐使用：
- frp
- ngrok
- Cloudflare Tunnel

### 需要域名吗？

不需要。企业微信回调支持 IP 地址。

但如果要使用 HTTPS，建议配置域名。

---

## 使用问题

### 如何重置对话？

在企业微信中发送：
```
/new
```
这会开始一个新的对话会话。

### 如何切换 AI 模型？

修改配置文件中的模型设置：
```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openrouter/anthropic/claude-3.5-sonnet"
      }
    }
  }
}
```
然后重启 Gateway。

### 消息有长度限制吗？

企业微信单条消息限制：
- 文本消息：2048 字节

如果 AI 回复过长，会自动分段发送。

---

## 还有问题？

- **GitHub Issues**：[提交问题](https://github.com/11haonb/wecom-openclaw-plugin/issues)
- **联系作者**：[liujinqi@bit.edu.cn](mailto:liujinqi@bit.edu.cn)
