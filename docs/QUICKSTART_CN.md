# 快速入门指南

> 本文档帮助你完成 WeCom OpenClaw 集成的完整配置。

---

## 前置条件

在开始之前，请确保你具备以下条件：

| 条件 | 说明 |
|------|------|
| 🖥️ 服务器 | 一台有公网 IP 的服务器，或使用内网穿透工具 |
| 👔 企业微信 | 企业微信管理员权限 |
| 📦 Node.js | 18.0 或更高版本 |
| 🔑 AI API Key | OpenRouter / OpenAI / Anthropic 等任一 |

---

## 第一步：获取企业微信凭证

### 1.1 获取企业 ID (Corp ID)

<div class="step">
<div class="step-number">1</div>
<div class="step-content">
<h4>登录企业微信管理后台</h4>
<p>访问 <a href="https://work.weixin.qq.com/" target="_blank">https://work.weixin.qq.com/</a> 并使用管理员账号登录</p>
</div>
</div>

<div class="step">
<div class="step-number">2</div>
<div class="step-content">
<h4>找到企业 ID</h4>
<p>点击左侧菜单 <strong>我的企业</strong> → 在页面底部找到 <strong>企业ID</strong></p>
</div>
</div>

<div class="step">
<div class="step-number">3</div>
<div class="step-content">
<h4>复制保存</h4>
<p>企业 ID 格式为 <code>ww</code> 开头的 18 位字符串，例如：<code>ww1234567890abcdef</code></p>
</div>
</div>

### 1.2 创建自建应用

<div class="step">
<div class="step-number">1</div>
<div class="step-content">
<h4>进入应用管理</h4>
<p>点击左侧菜单 <strong>应用管理</strong> → <strong>自建</strong> → <strong>创建应用</strong></p>
</div>
</div>

<div class="step">
<div class="step-number">2</div>
<div class="step-content">
<h4>填写应用信息</h4>
<p>
  • <strong>应用名称</strong>：AI 助手（或你喜欢的名称）<br>
  • <strong>应用 logo</strong>：上传一个图标（可选）<br>
  • <strong>可见范围</strong>：选择可以使用该应用的部门或成员
</p>
</div>
</div>

<div class="step">
<div class="step-number">3</div>
<div class="step-content">
<h4>记录应用凭证</h4>
<p>
  创建成功后，在应用详情页记录以下信息：<br>
  • <strong>AgentId</strong>：应用 ID，如 <code>1000001</code><br>
  • <strong>Secret</strong>：点击「查看」获取应用密钥
</p>
</div>
</div>

### 1.3 配置消息接收

<div class="step">
<div class="step-number">1</div>
<div class="step-content">
<h4>进入接收消息设置</h4>
<p>在应用详情页，找到 <strong>接收消息</strong> 模块 → 点击 <strong>设置API接收</strong></p>
</div>
</div>

<div class="step">
<div class="step-number">2</div>
<div class="step-content">
<h4>生成 Token 和 AES Key</h4>
<p>
  点击 <strong>随机获取</strong> 按钮，系统会自动生成：<br>
  • <strong>Token</strong>：用于验证消息来源<br>
  • <strong>EncodingAESKey</strong>：43 位字符，用于消息加解密
</p>
</div>
</div>

> ⚠️ **重要**：此时**不要点击保存**！需要先启动服务器，否则验证会失败。

### 1.4 凭证汇总

完成以上步骤后，你应该获得以下凭证：

| 凭证名称 | 示例值 | 说明 |
|----------|--------|------|
| 企业 ID | `ww1234567890abcdef` | 18 位，`ww` 开头 |
| AgentId | `1000001` | 应用 ID |
| Secret | `xxxxxxxx...` | 应用密钥，64 位 |
| Token | `xxxxxxxxxxxxxx` | 回调验证 Token |
| EncodingAESKey | `xxxxxxxxx...xxx` | 43 位加密密钥 |

---

## 第二步：安装 OpenClaw

<!-- tabs:start -->

### **方式一：从源码安装（推荐）**

```bash
# 1. 克隆项目
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 2. 安装依赖（需要 pnpm）
npm install -g pnpm
pnpm install

# 3. 构建项目
pnpm build

# 4. 验证安装
node dist/entry.js --version
```

### **方式二：NPM 全局安装**

```bash
# 全局安装
npm install -g openclaw

# 验证安装
openclaw --version
```

### **方式三：Docker 部署**

```bash
# 拉取镜像
docker pull openclaw/openclaw:latest

# 创建配置目录
mkdir -p ~/.openclaw

# 运行容器
docker run -d \
  --name openclaw-gateway \
  -p 18789:18789 \
  -v ~/.openclaw:/root/.openclaw \
  openclaw/openclaw:latest \
  gateway run --bind all --port 18789
```

<!-- tabs:end -->

---

## 第三步：配置 OpenClaw

### 3.1 创建配置目录

```bash
mkdir -p ~/.openclaw
```

### 3.2 创建配置文件

创建文件 `~/.openclaw/openclaw.json`：

```json
{
  "env": {
    "OPENROUTER_API_KEY": "sk-or-v1-你的OpenRouter密钥",
    "WECOM_CORP_ID": "ww1234567890abcdef",
    "WECOM_CORP_SECRET": "你的应用Secret",
    "WECOM_AGENT_ID": "1000001",
    "WECOM_CALLBACK_TOKEN": "你的Token",
    "WECOM_CALLBACK_AES_KEY": "你的43位EncodingAESKey"
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
        "enabled": true
      }
    }
  }
}
```

### 3.3 配置项详解

#### 企业微信凭证

| 配置项 | 说明 | 必需 |
|--------|------|:----:|
| `WECOM_CORP_ID` | 企业 ID，`ww` 开头 | ✅ |
| `WECOM_CORP_SECRET` | 应用 Secret | ✅ |
| `WECOM_AGENT_ID` | 应用 AgentId | ✅ |
| `WECOM_CALLBACK_TOKEN` | 回调验证 Token | ✅ |
| `WECOM_CALLBACK_AES_KEY` | 消息加密密钥（43位） | ✅ |

#### AI 模型配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `OPENROUTER_API_KEY` | OpenRouter 密钥 | `sk-or-v1-xxx` |
| `OPENAI_API_KEY` | OpenAI 密钥 | `sk-xxx` |
| `ANTHROPIC_API_KEY` | Anthropic 密钥 | `sk-ant-xxx` |
| `DASHSCOPE_API_KEY` | 阿里云密钥 | `sk-xxx` |

> 💡 只需配置一个 AI 提供商的密钥即可。推荐使用 OpenRouter，支持多种模型。

#### Gateway 配置

| 配置项 | 说明 | 可选值 |
|--------|------|--------|
| `mode` | 运行模式 | `local`（本地）/ `cloud`（云端） |
| `bind` | 绑定地址 | `loopback`（仅本机）/ `lan`（内网）/ `all`（所有） |
| `port` | 监听端口 | 默认 `18789` |

---

## 第四步：启动服务

### 4.1 启动 Gateway

<!-- tabs:start -->

### **源码方式**

```bash
cd openclaw
node dist/entry.js gateway run --bind lan --port 18789
```

### **NPM 全局安装**

```bash
openclaw gateway run --bind lan --port 18789
```

### **Docker**

```bash
# 如果容器已停止，重新启动
docker start openclaw-gateway

# 查看日志
docker logs -f openclaw-gateway
```

<!-- tabs:end -->

### 4.2 验证启动成功

启动成功后，你会看到类似以下日志：

```
[Gateway] Starting on 0.0.0.0:18789
[Plugins] Loading plugin: wecom
[WeCom] Plugin registered
[WeCom] Corp ID: ww1234567890abcdef
[WeCom] Agent ID: 1000001
[WeCom] Callback path: /wecom/callback
[Gateway] Ready to accept connections
```

### 4.3 测试回调接口

```bash
# 测试服务是否正常运行
curl http://localhost:18789/health

# 应该返回
{"status":"ok"}
```

---

## 第五步：完成企业微信配置

### 5.1 设置回调 URL

<div class="step">
<div class="step-number">1</div>
<div class="step-content">
<h4>回到企业微信管理后台</h4>
<p>打开之前的「接收消息」设置页面（Token 和 EncodingAESKey 应该还在）</p>
</div>
</div>

<div class="step">
<div class="step-number">2</div>
<div class="step-content">
<h4>填写回调 URL</h4>
<p>
  URL 格式：<code>http://你的服务器IP:18789/wecom/callback</code><br>
  例如：<code>http://123.45.67.89:18789/wecom/callback</code>
</p>
</div>
</div>

<div class="step">
<div class="step-number">3</div>
<div class="step-content">
<h4>点击保存</h4>
<p>如果配置正确，会显示 <strong>「验证成功」</strong></p>
</div>
</div>

### 5.2 常见错误及解决

| 错误信息 | 可能原因 | 解决方案 |
|----------|----------|----------|
| 回调地址请求不通 | 防火墙阻止 | 开放 18789 端口 |
| 签名校验失败 | Token 不匹配 | 检查 Token 配置 |
| 解密失败 | AES Key 错误 | 确认是 43 位字符 |
| 响应超时 | 服务未启动 | 检查 Gateway 日志 |

---

## 第六步：测试

### 6.1 发送测试消息

1. 打开手机上的**企业微信 APP**
2. 找到你创建的应用（如「AI 助手」）
3. 发送一条消息，例如：`你好`
4. 等待 AI 回复

### 6.2 预期结果

如果一切配置正确，你会在几秒内收到 AI 的回复。

### 6.3 查看日志

如果没有收到回复，查看 Gateway 日志排查问题：

```bash
# 源码方式
tail -f /tmp/openclaw.log

# Docker 方式
docker logs -f openclaw-gateway
```

---

## 后台运行

### 使用 nohup

```bash
nohup openclaw gateway run --bind lan --port 18789 > /tmp/openclaw.log 2>&1 &
```

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start "openclaw gateway run --bind lan --port 18789" --name openclaw

# 设置开机自启
pm2 startup
pm2 save
```

### 使用 Systemd

创建服务文件 `/etc/systemd/system/openclaw.service`：

```ini
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
ExecStart=/usr/bin/openclaw gateway run --bind lan --port 18789
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable openclaw
sudo systemctl start openclaw
```

---

## 下一步

恭喜你完成了基础配置！接下来可以探索更多功能：

- 🖥️ [远程控制电脑](REMOTE_CONTROL_CN.md) - 通过企业微信远程执行命令
- 🌐 [浏览器控制](BROWSER_CONTROL.md) - 远程操控 Chrome 浏览器
- ⚙️ [环境变量配置](configuration/environment.md) - 完整配置参考
- 🔒 [安全配置](configuration/security.md) - 生产环境安全建议

---

## 获取帮助

遇到问题？

- 📖 查看 [常见问题](troubleshooting/common-issues.md)
- 🐛 提交 [GitHub Issue](https://github.com/openclaw/openclaw/issues)
- 📧 联系作者 [liujinqi@bit.edu.cn](mailto:liujinqi@bit.edu.cn)
