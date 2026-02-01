# Remote Browser Control / 远程浏览器控制

Control your computer's browser from your phone via WeCom.

通过企业微信远程控制你电脑上的浏览器。

---

## How It Works / 工作原理

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   📱 Phone      │     │   🖥️ Server     │     │   💻 Your PC    │
│   WeCom App     │────▶│   OpenClaw      │────▶│   Node Host     │
│                 │◀────│   Gateway       │◀────│   + Browser     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │  "打开淘宝"           │   Route to Node      │  Launch browser
        │  ──────────▶         │   ──────────▶        │  Navigate to URL
        │                       │                       │
        │  Screenshot          │   Return result      │  Take screenshot
        │  ◀──────────         │   ◀──────────        │
```

**Flow:**
1. You send a message via WeCom (e.g., "打开淘宝搜索手机")
2. OpenClaw AI understands your intent
3. AI calls Browser Tool to control your PC's browser
4. Results (screenshots, text) are sent back to you

---

## Setup Guide / 配置指南

### Step 1: Configure Server / 配置服务器

Add to your `~/.openclaw/openclaw.json`:

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

**Options for `gateway.nodes.browser.mode`:**

| Mode | Description |
|------|-------------|
| `auto` | Automatically use connected Node Host (recommended) |
| `manual` | Only use when explicitly requested |
| `off` | Disable remote browser control |

### Step 2: Install Node Host on Your PC / 在电脑上安装 Node Host

**Windows / Mac / Linux:**

```bash
# Install OpenClaw globally
npm install -g openclaw

# Or use pnpm
pnpm add -g openclaw
```

### Step 3: Connect Node Host to Server / 连接到服务器

```bash
openclaw node run --host YOUR_SERVER_IP --port 18789
```

**Example:**
```bash
openclaw node run --host 192.168.1.100 --port 18789
```

You should see:
```
[Node Host] Connected to gateway
[Node Host] Browser proxy enabled
```

### Step 4: Verify Connection / 验证连接

On the server, check logs:
```bash
tail -f /tmp/gateway.log | grep -i node
```

You should see:
```
[Gateway] Node connected: your-pc-name
[Gateway] Node capabilities: browser
```

---

## Usage Examples / 使用示例

### Basic Navigation / 基本导航

| Message | Action |
|---------|--------|
| "打开浏览器" | Start browser |
| "访问淘宝" | Navigate to taobao.com |
| "打开 https://github.com" | Navigate to specific URL |
| "关闭浏览器" | Stop browser |

### Search / 搜索

| Message | Action |
|---------|--------|
| "在百度搜索天气" | Search on Baidu |
| "在当前页面搜索 iPhone" | Search on current page |
| "在京东搜索笔记本电脑" | Search on JD.com |

### Interaction / 交互

| Message | Action |
|---------|--------|
| "点击第一个搜索结果" | Click first result |
| "点击登录按钮" | Click login button |
| "输入用户名 test123" | Type in input field |
| "向下滚动" | Scroll down |
| "截图" | Take screenshot |

### Advanced / 高级操作

| Message | Action |
|---------|--------|
| "帮我登录淘宝" | AI guides through login |
| "把这个页面保存为 PDF" | Save page as PDF |
| "查看所有打开的标签页" | List all tabs |
| "关闭当前标签页" | Close current tab |

---

## Supported Actions / 支持的操作

| Action | Description | Example |
|--------|-------------|---------|
| `start` | Launch browser | "启动浏览器" |
| `stop` | Close browser | "关闭浏览器" |
| `navigate` | Go to URL | "访问 google.com" |
| `screenshot` | Capture screen | "截图" |
| `snapshot` | Get DOM structure | "获取页面结构" |
| `click` | Click element | "点击登录按钮" |
| `type` | Type text | "输入 hello" |
| `fill` | Fill form field | "填写用户名" |
| `press` | Press key | "按回车键" |
| `scroll` | Scroll page | "向下滚动" |
| `hover` | Hover element | "悬停在菜单上" |
| `select` | Select dropdown | "选择北京" |
| `tabs` | List tabs | "显示所有标签页" |
| `open` | Open new tab | "打开新标签页" |
| `close` | Close tab | "关闭当前标签" |
| `pdf` | Save as PDF | "保存为 PDF" |

---

## Security Considerations / 安全注意事项

### Network Security / 网络安全

- Node Host connects to Gateway via WebSocket
- Use TLS for production deployments
- Consider using VPN or private network

### Access Control / 访问控制

Only authorized WeCom users can control the browser. Configure allowed users:

```json
{
  "gateway": {
    "nodes": {
      "browser": {
        "mode": "auto",
        "allowUsers": ["user1", "user2"]
      }
    }
  }
}
```

### Sensitive Operations / 敏感操作

The AI will ask for confirmation before:
- Entering passwords
- Making purchases
- Submitting forms with personal data

---

## Troubleshooting / 故障排除

### Node Host won't connect / Node Host 无法连接

**Check:**
1. Server IP is correct and reachable
2. Port 18789 is open on server firewall
3. Gateway is running

**Test connectivity:**
```bash
curl http://YOUR_SERVER_IP:18789/health
```

### Browser doesn't start / 浏览器无法启动

**Check:**
1. Chrome/Chromium is installed on your PC
2. No other browser instance is blocking

**Try:**
```bash
# Specify browser path
openclaw node-host --gateway-host SERVER_IP --gateway-port 18789 \
  --browser-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### Commands not working / 命令不生效

**Check server logs:**
```bash
tail -f /tmp/gateway.log | grep -i browser
```

**Common issues:**
- `No connected browser-capable nodes` → Node Host not connected
- `Browser not started` → Send "启动浏览器" first
- `Element not found` → Page structure changed, try different description

### Screenshots not received / 截图收不到

**Check:**
- WeCom app has permission to receive images
- Server has enough disk space for temp files
- Network allows large file transfers

---

## Advanced Configuration / 高级配置

### Multiple PCs / 多台电脑

Connect multiple Node Hosts with different names:

```bash
# On PC 1
openclaw node-host --gateway-host SERVER --gateway-port 18789 --name "home-pc"

# On PC 2
openclaw node-host --gateway-host SERVER --gateway-port 18789 --name "office-pc"
```

Then specify which PC to use:
```
在 home-pc 上打开浏览器
```

### Headless Mode / 无头模式

Run browser without GUI (for servers):

```json
{
  "browser": {
    "enabled": true,
    "headless": true
  }
}
```

### Custom Browser Profile / 自定义浏览器配置

```json
{
  "browser": {
    "enabled": true,
    "profiles": {
      "work": {
        "cdpPort": 9222
      },
      "personal": {
        "cdpPort": 9223
      }
    }
  }
}
```

---

## FAQ / 常见问题

**Q: Can I control multiple browsers simultaneously?**
A: Yes, connect multiple Node Hosts with different names.

**Q: Is my browsing data safe?**
A: Browser data stays on your PC. Only screenshots and text are transmitted.

**Q: Can I use this for automated testing?**
A: Yes, the Browser Tool supports all Playwright actions.

**Q: What browsers are supported?**
A: Chrome and Chromium-based browsers (Edge, Brave, etc.)

---

## Next Steps / 下一步

- [Configure Group Chat](./GROUP_CHAT.md)
- [Set Up Multi-Account](./MULTI_ACCOUNT.md)
- [API Reference](./API.md)
