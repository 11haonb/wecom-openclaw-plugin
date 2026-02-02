# 环境变量配置

本文档介绍所有可用的环境变量和配置选项。

## 企业微信凭证

这些是必需的配置项，用于连接企业微信 API。

| 环境变量 | 说明 | 必需 |
|---------|------|------|
| `WECOM_CORP_ID` | 企业 ID | ✅ |
| `WECOM_CORP_SECRET` | 应用 Secret | ✅ |
| `WECOM_AGENT_ID` | 应用 Agent ID | ✅ |
| `WECOM_CALLBACK_TOKEN` | 回调验证 Token | ✅ |
| `WECOM_CALLBACK_AES_KEY` | 消息加密密钥 | ✅ |

### 配置示例

**配置文件方式** (`~/.openclaw/openclaw.json`)：

```json
{
  "env": {
    "WECOM_CORP_ID": "ww1234567890abcdef",
    "WECOM_CORP_SECRET": "your_secret_here",
    "WECOM_AGENT_ID": "1000001",
    "WECOM_CALLBACK_TOKEN": "your_token_here",
    "WECOM_CALLBACK_AES_KEY": "your_aes_key_here_43_characters_long"
  }
}
```

**环境变量方式**：

```bash
export WECOM_CORP_ID=ww1234567890abcdef
export WECOM_CORP_SECRET=your_secret_here
export WECOM_AGENT_ID=1000001
export WECOM_CALLBACK_TOKEN=your_token_here
export WECOM_CALLBACK_AES_KEY=your_aes_key_here_43_characters_long
```

---

## AI 模型配置

配置 AI 模型提供商和模型选择。

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `OPENROUTER_API_KEY` | OpenRouter API 密钥 | `sk-or-v1-xxx` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | `sk-xxx` |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 | `sk-ant-xxx` |
| `DASHSCOPE_API_KEY` | 阿里云 DashScope 密钥 | `sk-xxx` |

### 模型选择

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openrouter/qwen/qwen3-max"
      }
    }
  }
}
```

### 支持的模型

**OpenRouter**：
- `openrouter/qwen/qwen3-max` - 通义千问 (推荐)
- `openrouter/anthropic/claude-3.5-sonnet` - Claude 3.5
- `openrouter/openai/gpt-4o` - GPT-4o

**OpenAI**：
- `openai/gpt-4o` - GPT-4o
- `openai/gpt-4o-mini` - GPT-4o Mini

**Anthropic**：
- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet

**阿里云**：
- `dashscope/qwen-max` - 通义千问 Max
- `dashscope/qwen-turbo` - 通义千问 Turbo

---

## Gateway 配置

```json
{
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "port": 18789
  }
}
```

| 配置项 | 说明 | 默认值 | 可选值 |
|-------|------|--------|--------|
| `mode` | 运行模式 | `local` | `local`, `cloud` |
| `bind` | 绑定地址 | `loopback` | `loopback`, `lan`, `all` |
| `port` | 监听端口 | `18789` | 任意可用端口 |

### bind 选项说明

| 值 | 绑定地址 | 说明 |
|---|---------|------|
| `loopback` | `127.0.0.1` | 只允许本机访问 |
| `lan` | `0.0.0.0` (内网) | 允许内网访问 |
| `all` | `0.0.0.0` | 允许所有访问 |

> ⚠️ 生产环境建议使用 `lan`，不要使用 `all`。

---

## 插件配置

```json
{
  "plugins": {
    "entries": {
      "wecom": {
        "enabled": true,
        "callbackPath": "/wecom/callback",
        "groupChat": {
          "enabled": true,
          "requireMention": true
        }
      }
    }
  }
}
```

| 配置项 | 说明 | 默认值 |
|-------|------|--------|
| `enabled` | 是否启用插件 | `true` |
| `callbackPath` | 回调 URL 路径 | `/wecom/callback` |
| `groupChat.enabled` | 是否启用群聊 | `false` |
| `groupChat.requireMention` | 是否需要 @提及 | `true` |

---

## 代理配置

如果服务器需要通过代理访问外网：

```bash
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
```

---

## 完整配置示例

```json
{
  "env": {
    "OPENROUTER_API_KEY": "sk-or-v1-xxx",
    "WECOM_CORP_ID": "ww1234567890abcdef",
    "WECOM_CORP_SECRET": "your_secret_here",
    "WECOM_AGENT_ID": "1000001",
    "WECOM_CALLBACK_TOKEN": "your_token_here",
    "WECOM_CALLBACK_AES_KEY": "your_aes_key_here_43_characters"
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
    "bind": "lan",
    "port": 18789
  },
  "plugins": {
    "entries": {
      "wecom": {
        "enabled": true,
        "groupChat": {
          "enabled": true,
          "requireMention": true
        }
      }
    }
  }
}
```
