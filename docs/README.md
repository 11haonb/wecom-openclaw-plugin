<div class="hero-section">

# WeCom OpenClaw Plugin

<p class="tagline">通过企业微信连接 <a href="https://github.com/openclaw/openclaw" target="_blank">OpenClaw</a></p>

<div class="badges">
  <span class="badge">📦 v1.0.0</span>
  <span class="badge">🟢 稳定版</span>
  <span class="badge">📄 MIT License</span>
  <span class="badge">🇨🇳 中文支持</span>
</div>

<div class="hero-buttons">
  <a href="#/QUICKSTART_CN" class="hero-btn hero-btn-primary">
    🚀 快速开始
  </a>
  <a href="https://github.com/openclaw/openclaw" class="hero-btn hero-btn-secondary" target="_blank">
    ⭐ GitHub
  </a>
</div>

</div>

---

## 核心功能

<div class="feature-grid">
<div class="feature-card">
<div class="feature-icon">🤖</div>
<div class="feature-title">AI 智能对话</div>
<div class="feature-desc">支持 <a href="https://docs.openclaw.ai/configuration#models" target="_blank">多种大语言模型</a></div>
</div>
<div class="feature-card">
<div class="feature-icon">🖥️</div>
<div class="feature-title">远程控制电脑</div>
<div class="feature-desc">通过 <a href="https://docs.openclaw.ai/features/remote-control" target="_blank">OpenClaw 远程控制</a> 功能</div>
</div>
<div class="feature-card">
<div class="feature-icon">🌐</div>
<div class="feature-title">浏览器自动化</div>
<div class="feature-desc">基于 <a href="https://docs.openclaw.ai/features/browser" target="_blank">OpenClaw 浏览器控制</a></div>
</div>
<div class="feature-card">
<div class="feature-icon">👥</div>
<div class="feature-title">群聊协作</div>
<div class="feature-desc">在企业微信群中 @AI 助手协作</div>
</div>
</div>

---

## 系统架构

<div class="arch-container">
<div class="arch-row">
<div class="arch-node arch-primary">
<div class="arch-icon">📱</div>
<div class="arch-label">企业微信 APP</div>
</div>
<div class="arch-arrow">→</div>
<div class="arch-node arch-primary">
<div class="arch-icon">☁️</div>
<div class="arch-label">企业微信服务器</div>
</div>
<div class="arch-arrow">→</div>
<div class="arch-node arch-highlight">
<div class="arch-icon">⚡</div>
<div class="arch-label">OpenClaw Gateway</div>
</div>
</div>
<div class="arch-divider">
<div class="arch-line"></div>
<div class="arch-down">↓</div>
<div class="arch-line"></div>
</div>
<div class="arch-row arch-row-bottom">
<div class="arch-node arch-secondary">
<div class="arch-icon">🧠</div>
<div class="arch-label">AI 模型</div>
<div class="arch-sub">OpenRouter / OpenAI</div>
</div>
<div class="arch-node arch-secondary">
<div class="arch-icon">💻</div>
<div class="arch-label">远程电脑</div>
<div class="arch-sub">Windows / Mac / Linux</div>
</div>
<div class="arch-node arch-secondary">
<div class="arch-icon">🌐</div>
<div class="arch-label">Chrome 浏览器</div>
<div class="arch-sub">自动化控制</div>
</div>
</div>
</div>

---

## 快速安装

<details open>
<summary><strong>系统要求</strong></summary>

| 组件 | 要求 |
|------|------|
| Node.js | 18.0 或更高版本 |
| 操作系统 | Linux / macOS / Windows |
| 网络 | 公网 IP 或内网穿透工具 |
| 企业微信 | 管理员权限 |

</details>

<details open>
<summary><strong>安装步骤</strong></summary>

<!-- tabs:start -->

#### **源码安装**

```bash
# 1. 克隆项目
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 2. 安装依赖
pnpm install

# 3. 构建项目
pnpm build
```

#### **NPM 安装**

```bash
# 全局安装
npm install -g openclaw

# 验证安装
openclaw --version
```

#### **Docker 部署**

```bash
# 拉取镜像并运行
docker run -d \
  --name openclaw-gateway \
  -p 18789:18789 \
  -v ~/.openclaw:/root/.openclaw \
  openclaw/openclaw:latest \
  gateway run --bind all --port 18789
```

<!-- tabs:end -->

</details>

---

## 配置指南

<details>
<summary><strong>第一步：获取企业微信凭证</strong></summary>

1. **获取企业 ID**
   - 登录 [企业微信管理后台](https://work.weixin.qq.com/)
   - 点击「我的企业」→ 复制企业 ID（格式：`ww` 开头的 18 位字符串）

2. **创建自建应用**
   - 进入「应用管理」→「自建」→「创建应用」
   - 填写应用名称和可见范围
   - 记录 `AgentId` 和 `Secret`

3. **配置消息接收**
   - 在应用详情页 →「接收消息」→「设置 API 接收」
   - 点击「随机获取」生成 `Token` 和 `EncodingAESKey`
   - **先不要点确定！** 需要先启动服务器

</details>

<details>
<summary><strong>第二步：创建配置文件</strong></summary>

创建 `~/.openclaw/openclaw.json`：

```json
{
  "env": {
    "OPENROUTER_API_KEY": "sk-or-v1-xxx",
    "WECOM_CORP_ID": "ww1234567890abcdef",
    "WECOM_CORP_SECRET": "your_secret_here",
    "WECOM_AGENT_ID": "1000001",
    "WECOM_CALLBACK_TOKEN": "your_token_here",
    "WECOM_CALLBACK_AES_KEY": "your_43_char_aes_key_here"
  },
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "port": 18789
  },
  "plugins": {
    "entries": {
      "wecom": { "enabled": true }
    }
  }
}
```

**配置项说明：**

| 配置项 | 说明 |
|--------|------|
| `WECOM_CORP_ID` | 企业 ID（企业微信后台 → 我的企业） |
| `WECOM_CORP_SECRET` | 应用密钥（应用详情页 → Secret） |
| `WECOM_AGENT_ID` | 应用 ID（应用详情页 → AgentId） |
| `WECOM_CALLBACK_TOKEN` | 回调 Token（接收消息设置） |
| `WECOM_CALLBACK_AES_KEY` | 加密密钥 43 位（接收消息设置） |

</details>

<details>
<summary><strong>第三步：启动服务</strong></summary>

```bash
openclaw gateway run --bind lan --port 18789
```

启动成功后会看到：

```
[Gateway] Starting on 0.0.0.0:18789
[WeCom] Plugin registered
[WeCom] Callback path: /wecom/callback
[Gateway] Ready to accept connections
```

</details>

<details>
<summary><strong>第四步：完成企业微信配置</strong></summary>

1. 回到企业微信管理后台的「接收消息」设置页面
2. 填写 URL：`http://你的服务器IP:18789/wecom/callback`
3. 点击「保存」

> ✅ 如果显示「验证成功」，恭喜你配置完成！

</details>

---

## 支持的 AI 模型

| 提供商 | 模型 | 配置值 |
|--------|------|--------|
| **OpenRouter** | Claude Opus 4.5 | `openrouter/anthropic/claude-opus-4-5-20251101` |
| | Claude Sonnet 4.5 | `openrouter/anthropic/claude-sonnet-4-5-20251101` |
| | GPT-4o | `openrouter/openai/gpt-4o` |
| | 通义千问 Max | `openrouter/qwen/qwen3-max` |
| **Anthropic** | Claude Opus 4.5 | `anthropic/claude-opus-4-5-20251101` |
| | Claude Sonnet 4.5 | `anthropic/claude-sonnet-4-5-20251101` |
| **OpenAI** | GPT-4o | `openai/gpt-4o` |
| **阿里云** | 通义千问 Max | `dashscope/qwen-max` |

---

## 高级配置

<details>
<summary><strong>内网穿透配置</strong></summary>

如果服务器没有公网 IP，可以使用内网穿透工具：

<!-- tabs:start -->

#### **frp**

```ini
# frpc.ini
[common]
server_addr = your-frp-server.com
server_port = 7000

[wecom]
type = http
local_port = 18789
custom_domains = wecom.your-domain.com
```

#### **ngrok**

```bash
ngrok http 18789
```

#### **Cloudflare Tunnel**

```bash
cloudflared tunnel --url http://localhost:18789
```

<!-- tabs:end -->

</details>

<details>
<summary><strong>代理配置</strong></summary>

如果服务器需要通过代理访问外网：

```bash
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
```

</details>

<details>
<summary><strong>后台运行</strong></summary>

```bash
# 使用 nohup
nohup openclaw gateway run --bind lan --port 18789 > /tmp/openclaw.log 2>&1 &

# 使用 pm2
pm2 start "openclaw gateway run --bind lan --port 18789" --name openclaw

# 使用 systemd
sudo systemctl enable openclaw
sudo systemctl start openclaw
```

</details>

---

## 常见问题

<details>
<summary><strong>Q: 回调地址验证失败怎么办？</strong></summary>

1. 检查服务器防火墙是否开放 18789 端口
2. 确认 Token 和 EncodingAESKey 配置正确
3. 查看 Gateway 日志确认请求是否到达

</details>

<details>
<summary><strong>Q: AI 不回复消息怎么办？</strong></summary>

1. 检查 AI 模型 API Key 是否正确
2. 确认模型配置格式正确
3. 查看日志中的错误信息

</details>

<details>
<summary><strong>Q: 如何启用群聊功能？</strong></summary>

在配置文件中设置：

```json
{
  "plugins": {
    "entries": {
      "wecom": {
        "groupChat": {
          "enabled": true,
          "requireMention": true
        }
      }
    }
  }
}
```

</details>

---

## 更多文档

- 📖 [快速入门指南](QUICKSTART_CN.md) - 详细的安装配置步骤
- 🖥️ [远程控制电脑](REMOTE_CONTROL_CN.md) - 远程执行命令和脚本
- 🌐 [浏览器控制](BROWSER_CONTROL.md) - Chrome 浏览器自动化
- ⚙️ [环境变量配置](configuration/environment.md) - 完整配置参考
- 🔧 [故障排除](troubleshooting/common-issues.md) - 常见问题解决

---

## 获取帮助

- 🐛 [GitHub Issues](https://github.com/openclaw/openclaw/issues) - 报告问题
- 📧 [联系作者](mailto:liujinqi@bit.edu.cn) - 技术支持

---

<div style="text-align: center; color: #64748b; margin-top: 3rem;">

Made with ❤️ by [liujinqi](mailto:liujinqi@bit.edu.cn) @ Beijing Institute of Technology

</div>
