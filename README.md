# WeCom OpenClaw Integration

<p align="center">
  <strong>🤖 Connect your AI agent to WeCom (企业微信)</strong>
</p>

<p align="center">
  Send messages via WeCom → AI processes and responds → Control your computer remotely
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#remote-browser-control">Browser Control</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## What is this?

This plugin connects [OpenClaw](https://github.com/openclaw/openclaw) AI agent to WeCom (企业微信/WeChat Work).

**Use cases:**
- 💬 Chat with AI assistant via WeCom
- 🖥️ Control your computer's browser remotely from your phone
- 📁 Send/receive files, images, voice messages
- 🤖 Automate tasks with AI tool calling

---

## Quick Start

### Step 1: Get WeCom Credentials

1. Log in to [WeCom Admin Console](https://work.weixin.qq.com/)
2. Go to **App Management** → **Create App** (or use existing)
3. Note down these values:
   - **Corp ID** (企业ID) - Found in "My Enterprise"
   - **Agent ID** (应用ID) - Found in app details
   - **Secret** (应用Secret) - Found in app details
4. In app settings → **Receive Messages**:
   - Generate **Token** and **EncodingAESKey**
   - Set callback URL: `http://YOUR_SERVER:18789/wecom/callback`

### Step 2: Configure OpenClaw

Create or edit `~/.openclaw/openclaw.json`:

```json
{
  "env": {
    "WECOM_CORP_ID": "your-corp-id",
    "WECOM_CORP_SECRET": "your-app-secret",
    "WECOM_AGENT_ID": "1000001",
    "WECOM_CALLBACK_TOKEN": "your-token",
    "WECOM_CALLBACK_AES_KEY": "your-43-char-aes-key"
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

### Step 3: Start the Gateway

```bash
cd /path/to/openclaw
pnpm build
node dist/entry.js gateway
```

### Step 4: Test It

Open WeCom app on your phone → Find your app → Send a message!

---

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Text Messages | ✅ | Send and receive text |
| Image Messages | ✅ | Send and receive images |
| Voice Messages | ✅ | Send and receive voice (AMR format) |
| Video Messages | ✅ | Send and receive videos |
| File Messages | ✅ | Send and receive files |
| Group Chat | ✅ | Support group messages with @mention |
| Message Cards | ✅ | Rich text cards, news articles |
| Remote Browser | ✅ | Control browser on your PC via phone |
| Multi-Account | ✅ | Run multiple WeCom apps |
| Event Handling | ✅ | Handle subscribe, menu clicks, etc. |
| Mini Programs | ✅ | Send mini program cards |

---

## Configuration

### Basic Configuration

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `WECOM_CORP_ID` | ✅ | Your enterprise ID |
| `WECOM_CORP_SECRET` | ✅ | App secret |
| `WECOM_AGENT_ID` | ✅ | App agent ID |
| `WECOM_CALLBACK_TOKEN` | ✅ | Callback verification token |
| `WECOM_CALLBACK_AES_KEY` | ✅ | 43-character AES key |

### Optional Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `WECOM_CALLBACK_PORT` | `8080` | Callback server port |
| `WECOM_CALLBACK_PATH` | `/wecom/callback` | Callback URL path |
| `WECOM_BOT_NAME` | `助手` | Bot name for @mention detection |
| `WECOM_BOT_ALIASES` | `机器人,AI,Bot` | Alternative names (comma-separated) |
| `WECOM_GROUP_REQUIRE_MENTION` | `true` | Require @mention in groups |
| `WECOM_WELCOME_MESSAGE` | - | Auto-reply when user subscribes |

### Full Example

```json
{
  "env": {
    "OPENROUTER_API_KEY": "sk-or-xxx",
    "WECOM_CORP_ID": "ww1234567890",
    "WECOM_CORP_SECRET": "your-secret",
    "WECOM_AGENT_ID": "1000001",
    "WECOM_CALLBACK_TOKEN": "your-token",
    "WECOM_CALLBACK_AES_KEY": "your-43-char-key",
    "WECOM_BOT_NAME": "小助手",
    "WECOM_WELCOME_MESSAGE": "你好！我是AI助手，有什么可以帮你的？"
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
      "wecom": { "enabled": true }
    }
  }
}
```

---

## Remote Browser Control

**Control your computer's browser from your phone via WeCom!**

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  📱 WeCom    │ ───▶ │  🖥️ Server   │ ───▶ │  💻 Your PC  │
│  (Phone)     │ ◀─── │  (OpenClaw)  │ ◀─── │  (Browser)   │
└──────────────┘      └──────────────┘      └──────────────┘
```

### Setup

**1. On your PC (Windows/Mac):**

```bash
# Install OpenClaw
npm install -g openclaw

# Connect to your server
openclaw node-host --gateway-host YOUR_SERVER_IP --gateway-port 18789
```

**2. On your server, add to config:**

```json
{
  "browser": {
    "enabled": true
  },
  "gateway": {
    "nodes": {
      "browser": {
        "mode": "auto"
      }
    }
  }
}
```

**3. Send commands via WeCom:**

| Command Example | What it does |
|-----------------|--------------|
| "打开浏览器访问淘宝" | Opens browser, navigates to taobao.com |
| "搜索 iPhone 16" | Types and searches on current page |
| "截图" | Takes screenshot and sends to you |
| "点击第一个商品" | Clicks the first product |
| "帮我登录京东" | AI helps you log in |

### Supported Actions

| Action | Description |
|--------|-------------|
| `start` | Launch browser |
| `stop` | Close browser |
| `navigate` | Go to URL |
| `screenshot` | Capture screen |
| `click` | Click element |
| `type` | Type text |
| `fill` | Fill form field |
| `scroll` | Scroll page |
| `tabs` | List open tabs |

---

## Group Chat

### How it works

- **Private chat**: Bot responds to all messages
- **Group chat**: Bot only responds when @mentioned (configurable)

### Configuration

```bash
# Require @mention in groups (default: true)
WECOM_GROUP_REQUIRE_MENTION=true

# Bot names for @mention detection
WECOM_BOT_NAME=小助手
WECOM_BOT_ALIASES=AI,机器人,助手
```

### Usage

In group chat, mention the bot:
```
@小助手 今天天气怎么样？
```

---

## Multi-Account Support

Run multiple WeCom apps simultaneously:

```bash
export WECOM_ACCOUNTS='[
  {
    "id": "customer-service",
    "name": "Customer Service Bot",
    "corpId": "ww123",
    "corpSecret": "secret1",
    "agentId": 1000001,
    "callbackToken": "token1",
    "callbackAesKey": "key1"
  },
  {
    "id": "internal-bot",
    "name": "Internal Assistant",
    "corpId": "ww123",
    "corpSecret": "secret2",
    "agentId": 1000002,
    "callbackToken": "token2",
    "callbackAesKey": "key2"
  }
]'
```

---

## Event Handling

Handle WeCom events programmatically:

```typescript
import { onEvent, setWelcomeMessage } from "wecom-openclaw-integration";

// Welcome new users
setWelcomeMessage("Welcome! How can I help you?");

// Custom event handlers
onEvent("subscribe", async (event, config) => {
  console.log(`New user: ${event.fromUserName}`);
});

onEvent("click", async (event, config) => {
  // Handle menu button clicks
  if (event.eventKey === "help") {
    // Send help message
  }
});
```

### Supported Events

| Event | Trigger |
|-------|---------|
| `subscribe` | User follows the app |
| `unsubscribe` | User unfollows |
| `enter_agent` | User opens the app |
| `click` | Menu button clicked |
| `view` | Menu link clicked |
| `scancode_push` | QR code scanned |
| `location_select` | Location selected |

---

## API Reference

### WeComApiClient

```typescript
import { WeComApiClient } from "wecom-openclaw-integration";

const client = new WeComApiClient({
  corpId: "your-corp-id",
  corpSecret: "your-secret",
  agentId: 1000001,
});

// Send text
await client.sendText("userid", "Hello!");

// Send image
await client.sendImageFromUrl("userid", "https://example.com/image.jpg");

// Send file
await client.sendFileFile("userid", "/path/to/file.pdf");

// Send card
await client.sendTextCard("userid", {
  title: "Card Title",
  description: "Card description",
  url: "https://example.com",
});
```

### Mini Program

```typescript
import { createMiniProgramClient } from "wecom-openclaw-integration";

const mpClient = createMiniProgramClient(client);

await mpClient.sendSimpleMiniProgramCard("userid", {
  appid: "wx123456",
  pagepath: "/pages/index",
  title: "Open Mini Program",
});
```

---

## Model Recommendations

### For users in China (no proxy needed):
- `openrouter/qwen/qwen3-max` ⭐ Recommended
- `openrouter/qwen/qwen-2.5-72b-instruct`
- `openrouter/deepseek/deepseek-chat`

### For users with proxy:
- `openrouter/anthropic/claude-sonnet-4`
- `openrouter/openai/gpt-4o`

### Using proxy:
```bash
HTTPS_PROXY=http://127.0.0.1:7890 node dist/entry.js gateway
```

---

## File Structure

```
wecom-openclaw-integration/
├── src/
│   ├── api.ts           # WeCom API client
│   ├── crypto.ts        # Message encryption (AES-256-CBC)
│   ├── parser.ts        # XML message parser
│   ├── monitor.ts       # Webhook handler
│   ├── channel.ts       # OpenClaw channel definition
│   ├── types.ts         # TypeScript types
│   ├── group-policy.ts  # Group chat policies
│   ├── mention.ts       # @mention detection
│   ├── quote.ts         # Reply formatting
│   ├── multi-account.ts # Multi-account support
│   ├── events.ts        # Event handling
│   └── miniprogram.ts   # Mini program integration
├── test/                # Test files
├── index.ts             # Plugin entry point
├── package.json
└── README.md
```

---

## Troubleshooting

### Callback URL verification failed

- Check Token and EncodingAESKey match exactly
- Ensure server is accessible from internet
- Check firewall allows port 18789

### Messages not received

- Verify callback URL is correctly set in WeCom admin
- Check server logs: `tail -f /tmp/gateway.log`
- Ensure plugin is enabled in config

### Browser control not working

- Verify Node Host is connected: check server logs
- Ensure `browser.enabled: true` in config
- Check `gateway.nodes.browser.mode: "auto"`

---

## License

MIT

---

## Links

- [OpenClaw](https://github.com/openclaw/openclaw)
- [WeCom Developer Docs](https://developer.work.weixin.qq.com/document/)
- [Report Issues](https://github.com/liujinqi/wecom-openclaw-integration/issues)
