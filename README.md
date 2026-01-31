# OpenClaw WeCom Plugin / 企业微信插件

[English](#english) | [中文](#中文)

---

## English

### Overview

OpenClaw WeCom plugin enables AI agent integration with WeCom (企业微信/WeChat Work). Send messages to your WeCom app and get AI-powered responses with tool capabilities.

### Features

- **Message Reception**: Receive text messages from WeCom users
- **Message Encryption**: AES-256-CBC encryption/decryption with signature verification
- **AI Agent Integration**: Full OpenClaw agent system with tool calling support
- **Text Replies**: Send text and markdown messages
- **Image Replies**: Send images from local files or URLs
- **Multi-model Support**: Works with Qwen, Claude, GPT, and other models via OpenRouter

### Installation

1. **Enable the plugin** in your OpenClaw config (`~/.openclaw/openclaw.json`):

```json
{
  "plugins": {
    "entries": {
      "wecom": {
        "enabled": true
      }
    }
  }
}
```

2. **Set environment variables**:

```json
{
  "env": {
    "WECOM_CORP_ID": "your-corp-id",
    "WECOM_CORP_SECRET": "your-corp-secret",
    "WECOM_AGENT_ID": "your-agent-id",
    "WECOM_CALLBACK_TOKEN": "your-callback-token",
    "WECOM_CALLBACK_AES_KEY": "your-aes-key"
  }
}
```

3. **Configure WeCom Admin Console**:
   - Go to: WeCom Admin Console → App Management → Your App → Receive Messages
   - Set callback URL: `http://YOUR_SERVER_IP:18789/wecom/callback`
   - Set Token and EncodingAESKey (same as your config)

### Configuration

Full example config (`~/.openclaw/openclaw.json`):

```json
{
  "env": {
    "OPENROUTER_API_KEY": "your-openrouter-key",
    "WECOM_CORP_ID": "your-corp-id",
    "WECOM_CORP_SECRET": "your-corp-secret",
    "WECOM_AGENT_ID": "your-agent-id",
    "WECOM_CALLBACK_TOKEN": "your-callback-token",
    "WECOM_CALLBACK_AES_KEY": "your-aes-key"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openrouter/qwen/qwen3-max"
      }
    }
  },
  "tools": {
    "exec": {
      "security": "full"
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

### Usage

1. **Build and start the gateway**:

```bash
cd /path/to/openclaw
pnpm build
node dist/entry.js gateway
```

2. **Send messages** via WeCom app to your agent

3. **View logs**:

```bash
tail -f /tmp/gateway.log
```

### Model Recommendations

For users in China, these models work without proxy:
- `openrouter/qwen/qwen3-max` (recommended)
- `openrouter/qwen/qwen-2.5-72b-instruct`

For users outside China or with proxy:
- `openrouter/anthropic/claude-sonnet-4.5`
- `openrouter/openai/gpt-4o`

### Proxy Configuration

If you need to use models that require proxy (Claude, GPT, etc.):

```bash
HTTPS_PROXY=http://127.0.0.1:7890 node dist/entry.js gateway
```

---

## 中文

### 概述

OpenClaw 企业微信插件让你可以通过企业微信与 AI 智能体交互。发送消息到企业微信应用，获得具有工具调用能力的 AI 回复。

### 功能特性

- **消息接收**：接收企业微信用户发送的文本消息
- **消息加解密**：AES-256-CBC 加解密，支持签名验证
- **AI 智能体集成**：完整的 OpenClaw 智能体系统，支持工具调用
- **文本回复**：发送文本和 Markdown 消息
- **图片回复**：发送本地图片或从 URL 下载图片发送
- **多模型支持**：通过 OpenRouter 支持 Qwen、Claude、GPT 等模型

### 安装步骤

1. **启用插件**，在 OpenClaw 配置文件 (`~/.openclaw/openclaw.json`) 中添加：

```json
{
  "plugins": {
    "entries": {
      "wecom": {
        "enabled": true
      }
    }
  }
}
```

2. **设置环境变量**：

```json
{
  "env": {
    "WECOM_CORP_ID": "你的企业ID",
    "WECOM_CORP_SECRET": "你的应用Secret",
    "WECOM_AGENT_ID": "你的应用AgentId",
    "WECOM_CALLBACK_TOKEN": "你的回调Token",
    "WECOM_CALLBACK_AES_KEY": "你的EncodingAESKey"
  }
}
```

3. **配置企业微信管理后台**：
   - 进入：企业微信管理后台 → 应用管理 → 你的应用 → 接收消息
   - 设置回调 URL：`http://你的服务器IP:18789/wecom/callback`
   - 设置 Token 和 EncodingAESKey（与配置文件一致）

### 完整配置示例

`~/.openclaw/openclaw.json`：

```json
{
  "env": {
    "OPENROUTER_API_KEY": "你的OpenRouter密钥",
    "WECOM_CORP_ID": "你的企业ID",
    "WECOM_CORP_SECRET": "你的应用Secret",
    "WECOM_AGENT_ID": "你的应用AgentId",
    "WECOM_CALLBACK_TOKEN": "你的回调Token",
    "WECOM_CALLBACK_AES_KEY": "你的EncodingAESKey"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openrouter/qwen/qwen3-max"
      }
    }
  },
  "tools": {
    "exec": {
      "security": "full"
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

### 使用方法

1. **构建并启动 Gateway**：

```bash
cd /path/to/openclaw
pnpm build
node dist/entry.js gateway
```

2. **通过企业微信应用发送消息**给你的智能体

3. **查看日志**：

```bash
tail -f /tmp/gateway.log
```

### 模型推荐

国内用户（无需代理）：
- `openrouter/qwen/qwen3-max`（推荐）
- `openrouter/qwen/qwen-2.5-72b-instruct`

海外用户或有代理：
- `openrouter/anthropic/claude-sonnet-4.5`
- `openrouter/openai/gpt-4o`

### 代理配置

如需使用需要代理的模型（Claude、GPT 等）：

```bash
HTTPS_PROXY=http://127.0.0.1:7890 node dist/entry.js gateway
```

---

## TODO / 待办事项

### High Priority / 高优先级

- [ ] **Remote browser control** - Support controlling browser on local Windows/Mac machine via Node Host

  远程浏览器控制 - 支持通过 Node Host 控制本地 Windows/Mac 机器上的浏览器

- [ ] **Receive media messages** - Handle images, voice, video, and files sent by users

  接收媒体消息 - 处理用户发送的图片、语音、视频和文件

- [ ] **Voice message sending** - Send voice messages via WeCom API

  语音消息发送 - 通过企业微信 API 发送语音消息

### Medium Priority / 中优先级

- [ ] **Group chat support** - Handle messages in group chats with @mention detection

  群聊支持 - 处理群聊消息，支持 @提及检测

- [ ] **File message sending** - Send files via WeCom API

  文件消息发送 - 通过企业微信 API 发送文件

- [ ] **Message cards** - Support rich text card messages

  消息卡片 - 支持富文本卡片消息

### Low Priority / 低优先级

- [ ] **Multiple accounts** - Support multiple WeCom apps/accounts

  多账号支持 - 支持多个企业微信应用/账号

- [ ] **Event handling** - Handle WeCom events (user follow, menu click, etc.)

  事件处理 - 处理企业微信事件（用户关注、菜单点击等）

- [ ] **Mini program integration** - Support mini program message types

  小程序集成 - 支持小程序消息类型

---

## File Structure / 文件结构

```
extensions/wecom/
├── src/
│   ├── api.ts        # WeCom API client / API 客户端
│   ├── crypto.ts     # Message encryption / 消息加解密
│   ├── monitor.ts    # Message handler / 消息处理
│   ├── channel.ts    # Channel definition / 渠道定义
│   ├── parser.ts     # XML parser / XML 解析
│   ├── types.ts      # Type definitions / 类型定义
│   └── runtime.ts    # Runtime config / 运行时配置
├── index.ts          # Plugin entry / 插件入口
├── package.json
├── tsconfig.json
└── README.md
```

---

## License / 许可证

MIT
