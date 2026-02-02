# Quick Start Guide

This guide helps you set up WeCom OpenClaw integration in 5 minutes.

---

## Prerequisites

- A server with public IP (or use tunneling)
- WeCom admin access
- Node.js 18+ installed

---

## Step 1: Get WeCom Credentials

### 1.1 Get Corp ID

1. Login to [WeCom Admin Console](https://work.weixin.qq.com/)
2. Click **My Enterprise** → Find **Corp ID**
3. Copy and save (format: `ww1234567890abcdef`)

### 1.2 Create Application

1. Go to **App Management** → **Self-built** → **Create App**
2. Fill in app name (e.g., AI Assistant)
3. Select visibility scope
4. After creation, note down:
   - **AgentId** (Application ID)
   - **Secret** (Click to view)

### 1.3 Configure Message Receiving

1. In app details, find **Receive Messages** → **Set API Receive**
2. Click **Random Generate** to get Token and EncodingAESKey
3. **Don't click OK yet!** Start server first

Record the following:
| Field | Example |
|-------|---------|
| Corp ID | `ww1234567890abcdef` |
| AgentId | `1000001` |
| Secret | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| Token | `xxxxxxxxxxxxxx` |
| EncodingAESKey | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

---

## Step 2: Configure Server

### 2.1 Install OpenClaw

```bash
# Clone project
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# Install dependencies
pnpm install

# Build
pnpm build
```

### 2.2 Create Configuration File

Create `~/.openclaw/openclaw.json`:

```json
{
  "env": {
    "OPENROUTER_API_KEY": "your_openrouter_key",
    "WECOM_CORP_ID": "your_corp_id",
    "WECOM_CORP_SECRET": "your_app_secret",
    "WECOM_AGENT_ID": "your_agent_id",
    "WECOM_CALLBACK_TOKEN": "your_token",
    "WECOM_CALLBACK_AES_KEY": "your_encoding_aes_key"
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

### 2.3 Start Service

```bash
node dist/entry.js gateway
```

Success indicators:
```
[WeCom] Plugin registered
[WeCom] Corp ID: ww1234567890abcdef
[WeCom] Agent ID: 1000001
[WeCom] Callback path: /wecom/callback
```

---

## Step 3: Complete WeCom Configuration

### 3.1 Set Callback URL

Go back to WeCom Admin Console **Receive Messages** page:

1. Enter URL: `http://your_server_ip:18789/wecom/callback`
2. Click **Save**

If you see **Verification Successful**, congratulations!

### 3.2 Common Errors

| Error | Solution |
|-------|----------|
| Callback URL unreachable | Check firewall allows port 18789 |
| Signature verification failed | Check Token and EncodingAESKey |
| Decryption failed | EncodingAESKey must be 43 characters |

---

## Step 4: Test

1. Open WeCom mobile app
2. Find your created application
3. Send a message, e.g., "Hello"
4. Wait for AI response

---

## Next Steps

- [Configure Remote Browser Control](./REMOTE_CONTROL_EN.md)
- [Configure Group Chat](./README.md#group-chat)
- [Configure Multi-Account](./README.md#multi-account-support)

---

## Get Help

- View logs: `tail -f /tmp/gateway.log`
- Contact: [liujinqi@bit.edu.cn](mailto:liujinqi@bit.edu.cn)
