<p align="center">
  <img src="https://api.iconify.design/tdesign/logo-wecom.svg?color=%2307C160" alt="WeCom Logo" width="80" height="80">
  &nbsp;&nbsp;
  <img src="https://api.iconify.design/simple-icons/wechat.svg?color=%2307C160" alt="WeChat Logo" width="80" height="80">
</p>

<h1 align="center">WeCom OpenClaw Integration</h1>

<p align="center">
  <strong>🤖 Connect your AI agent to WeCom (企业微信)</strong>
  <br>
  <sub>Send messages via WeCom → AI processes → Control your computer remotely</sub>
</p>

<p align="center">
  <em>For <a href="https://github.com/openclaw/openclaw">OpenClaw</a> (formerly known as Moltbot or originally Clawdbot)</em>
</p>

<p align="center">
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  </a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white" alt="Node Version">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/WeCom-企业微信-07C160?logo=wechat&logoColor=white" alt="WeCom">
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-remote-browser-control">Browser Control</a> •
  <a href="#-documentation">Docs</a> •
  <a href="./docs/QUICKSTART_CN.md">中文文档</a>
</p>

---

## 📖 What is this?

This plugin connects [OpenClaw](https://github.com/openclaw/openclaw) AI agent to **WeCom (企业微信/WeChat Work)**.

<table>
  <tr>
    <td align="center">💬</td>
    <td><strong>Chat with AI</strong><br/>Send messages via WeCom, get AI-powered responses</td>
  </tr>
  <tr>
    <td align="center">🖥️</td>
    <td><strong>Remote Browser Control</strong><br/>Control your PC's browser from your phone</td>
  </tr>
  <tr>
    <td align="center">📁</td>
    <td><strong>Rich Media</strong><br/>Send/receive images, voice, video, files</td>
  </tr>
  <tr>
    <td align="center">🔧</td>
    <td><strong>Tool Calling</strong><br/>AI can execute tasks with 100+ built-in tools</td>
  </tr>
</table>

---

## ⚡ Quick Start

### 1️⃣ Get WeCom Credentials

| Field | Where to Find |
|:------|:--------------|
| **Corp ID** | WeCom Admin → My Enterprise → Enterprise ID |
| **Agent ID** | App Management → Your App → Agent ID |
| **Secret** | App Management → Your App → Secret |
| **Token** | Your App → Receive Messages → Generate |
| **AES Key** | Your App → Receive Messages → Generate |

### 2️⃣ Configure OpenClaw

Create `~/.openclaw/openclaw.json`:

```json
{
  "env": {
    "WECOM_CORP_ID": "ww1234567890abcdef",
    "WECOM_CORP_SECRET": "your-app-secret",
    "WECOM_AGENT_ID": "1000001",
    "WECOM_CALLBACK_TOKEN": "your-token",
    "WECOM_CALLBACK_AES_KEY": "your-43-character-aes-key"
  },
  "plugins": {
    "entries": {
      "wecom": { "enabled": true }
    }
  }
}
```

### 3️⃣ Start Gateway

```bash
cd /path/to/openclaw
pnpm build && node dist/entry.js gateway
```

### 4️⃣ Set Callback URL

In WeCom Admin → Your App → Receive Messages:

```
URL: http://YOUR_SERVER:18789/wecom/callback
```

### 5️⃣ Test It! 🎉

Open WeCom app → Find your app → Send "Hello"!

---

## ✨ Features

<table>
  <thead>
    <tr>
      <th>Category</th>
      <th>Feature</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="6"><strong>📨 Messaging</strong></td>
      <td>Text messages</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Image messages</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Voice messages</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Video messages</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>File messages</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Message cards</td>
      <td>✅</td>
    </tr>
    <tr>
      <td rowspan="3"><strong>👥 Group Chat</strong></td>
      <td>Group messages</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>@mention detection</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Access control</td>
      <td>✅</td>
    </tr>
    <tr>
      <td rowspan="2"><strong>🖥️ Browser</strong></td>
      <td>Remote control</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Screenshot capture</td>
      <td>✅</td>
    </tr>
    <tr>
      <td rowspan="3"><strong>⚙️ Advanced</strong></td>
      <td>Multi-account</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Event handling</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Mini programs</td>
      <td>✅</td>
    </tr>
  </tbody>
</table>

---

## 🖥️ Remote Browser Control

**Control your computer's browser from your phone!**

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  📱 Phone    │      │  🖥️ Server   │      │  💻 Your PC  │
│    WeCom     │ ───▶ │   OpenClaw   │ ───▶ │   Browser    │
└──────────────┘      └──────────────┘      └──────────────┘
```

### Setup

<details>
<summary><strong>1. Configure Server</strong></summary>

Add to `~/.openclaw/openclaw.json`:

```json
{
  "browser": { "enabled": true },
  "gateway": {
    "nodes": {
      "browser": { "mode": "auto" }
    }
  }
}
```

</details>

<details>
<summary><strong>2. Install and Run Node Host on Your PC</strong></summary>

```bash
# Install OpenClaw
npm install -g openclaw

# Connect to your server
openclaw node run --host YOUR_SERVER_IP --port 18789
```

</details>

<details>
<summary><strong>3. Send Commands via WeCom</strong></summary>

| Command | Action |
|:--------|:-------|
| `打开浏览器访问淘宝` | Open browser, go to taobao.com |
| `搜索 iPhone 16` | Search on current page |
| `截图` | Take screenshot |
| `点击第一个商品` | Click first product |

</details>

📖 **[Full Browser Control Guide →](./docs/BROWSER_CONTROL.md)**

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|:---------|:--------:|:------------|
| `WECOM_CORP_ID` | ✅ | Enterprise ID |
| `WECOM_CORP_SECRET` | ✅ | App secret |
| `WECOM_AGENT_ID` | ✅ | App agent ID |
| `WECOM_CALLBACK_TOKEN` | ✅ | Callback token |
| `WECOM_CALLBACK_AES_KEY` | ✅ | 43-char AES key |
| `WECOM_BOT_NAME` | | Bot name for @mention |
| `WECOM_WELCOME_MESSAGE` | | Auto-reply for new users |

### Full Example

<details>
<summary><strong>Click to expand</strong></summary>

```json
{
  "env": {
    "OPENROUTER_API_KEY": "sk-or-xxx",
    "WECOM_CORP_ID": "ww1234567890",
    "WECOM_CORP_SECRET": "your-secret",
    "WECOM_AGENT_ID": "1000001",
    "WECOM_CALLBACK_TOKEN": "your-token",
    "WECOM_CALLBACK_AES_KEY": "your-43-char-key",
    "WECOM_BOT_NAME": "AI助手",
    "WECOM_WELCOME_MESSAGE": "你好！我是AI助手，有什么可以帮你的？"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openrouter/qwen/qwen3-max"
      }
    }
  },
  "browser": {
    "enabled": true
  },
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "nodes": {
      "browser": { "mode": "auto" }
    }
  },
  "plugins": {
    "entries": {
      "wecom": { "enabled": true }
    }
  }
}
```

</details>

---

## 👥 Group Chat

| Mode | Behavior |
|:-----|:---------|
| **Private Chat** | Bot responds to all messages |
| **Group Chat** | Bot only responds when @mentioned |

Configure @mention names:

```bash
WECOM_BOT_NAME=小助手
WECOM_BOT_ALIASES=AI,机器人,助手
```

---

## 🔌 API Reference

<details>
<summary><strong>WeComApiClient</strong></summary>

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
  description: "Description",
  url: "https://example.com",
});
```

</details>

<details>
<summary><strong>Event Handling</strong></summary>

```typescript
import { onEvent, setWelcomeMessage } from "wecom-openclaw-integration";

// Welcome new users
setWelcomeMessage("Welcome! How can I help?");

// Handle events
onEvent("subscribe", async (event, config) => {
  console.log(`New user: ${event.fromUserName}`);
});

onEvent("click", async (event, config) => {
  // Handle menu clicks
});
```

</details>

<details>
<summary><strong>Mini Programs</strong></summary>

```typescript
import { createMiniProgramClient } from "wecom-openclaw-integration";

const mpClient = createMiniProgramClient(client);

await mpClient.sendSimpleMiniProgramCard("userid", {
  appid: "wx123456",
  pagepath: "/pages/index",
  title: "Open Mini Program",
});
```

</details>

---

## 🤖 Recommended Models

| Region | Model | Notes |
|:-------|:------|:------|
| 🇨🇳 China | `openrouter/qwen/qwen3-max` | ⭐ Recommended, no proxy |
| 🇨🇳 China | `openrouter/deepseek/deepseek-chat` | Fast, cheap |
| 🌍 Global | `openrouter/anthropic/claude-sonnet-4` | Best quality |
| 🌍 Global | `openrouter/openai/gpt-4o` | Good balance |

**Using proxy:**
```bash
HTTPS_PROXY=http://127.0.0.1:7890 node dist/entry.js gateway
```

---

## 📁 Project Structure

```
wecom-openclaw-integration/
├── 📄 index.ts             # Plugin entry point
├── 📁 src/
│   ├── api.ts              # WeCom API client
│   ├── crypto.ts           # AES encryption
│   ├── parser.ts           # XML parser
│   ├── monitor.ts          # Webhook handler
│   ├── channel.ts          # Channel definition
│   ├── types.ts            # TypeScript types
│   ├── group-policy.ts     # Group chat rules
│   ├── mention.ts          # @mention detection
│   ├── multi-account.ts    # Multi-account support
│   ├── events.ts           # Event handlers
│   └── miniprogram.ts      # Mini program support
├── 📁 docs/
│   ├── QUICKSTART_CN.md    # 中文快速入门
│   └── BROWSER_CONTROL.md  # Browser control guide
├── 📁 test/                # Test files
├── 📄 CHANGELOG.md         # Version history
└── 📄 README.md            # This file
```

---

## 📖 Documentation

| Document | Description |
|:---------|:------------|
| [Quick Start (English)](./docs/QUICKSTART_EN.md) | 5-minute setup guide |
| [Quick Start (中文)](./docs/QUICKSTART_CN.md) | 5 分钟快速入门 |
| [Remote Control (English)](./docs/REMOTE_CONTROL_EN.md) | Control Windows PC remotely |
| [Remote Control (中文)](./docs/REMOTE_CONTROL_CN.md) | 远程控制 Windows 电脑 |
| [Changelog](./CHANGELOG.md) | Version history |

---

## 🐛 Troubleshooting

<details>
<summary><strong>Callback URL verification failed</strong></summary>

- ✅ Check Token and AES Key match exactly
- ✅ Ensure server is accessible from internet
- ✅ Check firewall allows port 18789

</details>

<details>
<summary><strong>Messages not received</strong></summary>

- ✅ Verify callback URL in WeCom admin
- ✅ Check logs: `tail -f /tmp/gateway.log`
- ✅ Ensure plugin is enabled

</details>

<details>
<summary><strong>Browser control not working</strong></summary>

- ✅ Verify Node Host is connected
- ✅ Check `browser.enabled: true`
- ✅ Check `gateway.nodes.browser.mode: "auto"`

</details>

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ✨ Contributors

<p align="center">
  <a href="https://github.com/zhzy0077"><img src="https://github.com/zhzy0077.png" width="50" height="50" style="border-radius: 50%;" alt="zhzy0077"></a>
</p>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

<p align="center">
  <a href="https://github.com/openclaw/openclaw">OpenClaw</a> •
  <a href="https://developer.work.weixin.qq.com/document/">WeCom Developer Docs</a>
</p>

---

<p align="center">
  Made with ❤️ by <a href="mailto:liujinqi@bit.edu.cn">liujinqi</a> @ Beijing Institute of Technology
</p>
