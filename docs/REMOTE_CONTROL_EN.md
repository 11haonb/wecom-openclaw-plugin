# Remote Control Windows PC Tutorial

This document explains how to remotely control a Windows PC via WeCom (Enterprise WeChat).

---

## Architecture

```
WeCom APP → WeCom Server → Linux Gateway → Windows Node → Execute Command
    ↑                                                           ↓
    └──────────────────── Return Result ←───────────────────────┘
```

- **Linux Gateway**: Runs OpenClaw Gateway and WeCom plugin
- **Windows Node**: Runs `openclaw node run`, connects to Gateway

---

## Prerequisites

- Linux server with WeCom plugin configured (see [Quick Start](./QUICKSTART_EN.md))
- Windows PC can access Linux server port 18789
- Windows has Node.js 18+ installed

---

## Step 1: Install OpenClaw on Windows

```powershell
npm install -g openclaw
```

Verify installation:
```powershell
openclaw --version
```

---

## Step 2: Configure Linux Gateway

### 2.1 Set Gateway Token

On Linux server, start Gateway with token:

```bash
export OPENCLAW_GATEWAY_TOKEN=your_secret_token
node dist/entry.js gateway run --bind lan --port 18789
```

### 2.2 Configure nodes.browser

Edit `~/.openclaw/openclaw.json`, add:

```json
{
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "nodes": {
      "browser": {
        "mode": "auto",
        "node": "your_windows_node_name"
      }
    }
  }
}
```

---

## Step 3: Connect Windows Node

### 3.1 Configure Execution Permission

On Windows, run:

```powershell
openclaw config set tools.exec.security full
```

### 3.2 Connect to Gateway

```powershell
$env:OPENCLAW_GATEWAY_TOKEN="your_secret_token"
openclaw node run --host <Linux_Server_IP> --port 18789
```

You should see:
```
🦞 OpenClaw 2026.x.x
node host PATH: ...
```

### 3.3 Verify Connection

On Linux, run:

```bash
openclaw nodes status
```

Your Windows node should show as `paired · connected`.

---

## Step 4: Configure Agent to Use nodes Tool

Edit `~/.openclaw/workspace/TOOLS.md`, add:

```markdown
## Remote Windows PC Control

You have a connected remote Windows PC node: **your_node_name**

### Must Use nodes Tool

When user requests the following, you MUST use the nodes tool:
- Open webpage/browser
- Open program/application
- View files/folders
- Execute any Windows command

### nodes Tool Usage

action: "run"
node: "your_node_name"
command: ["cmd", "/c", "your_command"]

### Examples

| User Request | command Parameter |
|--------------|-------------------|
| Open Baidu | ["cmd", "/c", "start", "https://www.baidu.com"] |
| Open VSCode | ["cmd", "/c", "code"] |
| List Desktop | ["cmd", "/c", "dir", "C:\\Users\\username\\Desktop"] |
```

---

## Step 5: Test

In WeCom, send:

```
Open Baidu
```

Or:

```
List files on desktop
```

---

## Browser Control (Optional)

To control Chrome browser on Windows via WeCom:

### 5.1 Install Chrome Extension

Install **OpenClaw Browser Relay** extension in Windows Chrome.

### 5.2 Activate Extension

1. Open any Chrome tab
2. Click OpenClaw extension icon
3. Ensure it shows "Relay reachable"

### 5.3 Test Browser Control

On Linux:

```bash
openclaw nodes invoke --node your_node_name --command browser.proxy --params '{"method":"GET","path":"/profiles"}'
```

---

## Troubleshooting

### Q: Windows node disconnects immediately

Check:
1. Token matches on both sides
2. Firewall allows port 18789
3. Network is stable

### Q: Command execution shows "approval required"

Run:
```powershell
openclaw config set tools.exec.security full
```

### Q: Agent doesn't use nodes tool

1. Ensure `~/.openclaw/workspace/TOOLS.md` is configured
2. Send `/new` in WeCom to start new session
3. Or restart Gateway

---

## Security Recommendations

1. Use strong password as Gateway Token
2. Bind Gateway to internal IP only
3. Rotate Token regularly
4. Don't expose Gateway on public network

---

## Get Help

- View Gateway logs: `tail -f /tmp/gateway.log`
- View Agent logs: `ls ~/.openclaw/agents/main/sessions/`
- Contact: [liujinqi@bit.edu.cn](mailto:liujinqi@bit.edu.cn)
