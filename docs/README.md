# WeCom OpenClaw Plugin

> 通过企业微信与 AI 助手对话，远程控制你的电脑

## 什么是 WeCom OpenClaw Plugin？

WeCom OpenClaw Plugin 是一个企业微信集成插件，让你可以：

- 🤖 **AI 对话** - 在企业微信中与 AI 助手自然对话，支持多种大语言模型
- 🖥️ **远程控制** - 通过企业微信远程控制 Windows/Mac/Linux 电脑
- 🌐 **浏览器控制** - 远程操控 Chrome 浏览器，自动化网页操作
- 👥 **群聊支持** - 在企业微信群中 @AI 助手，团队协作更高效

## 架构概览

```
企业微信 APP → 企业微信服务器 → OpenClaw Gateway → AI 模型
                                      ↓
                               Windows/Mac Node → Chrome 浏览器
```

## 快速开始

### 系统要求

| 组件 | 要求 |
|------|------|
| Node.js | 18.0 或更高版本 |
| 操作系统 | Linux / macOS / Windows |
| 网络 | 公网 IP 或内网穿透 |
| 企业微信 | 管理员权限 |

### 安装

```bash
# 克隆项目
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 安装依赖
pnpm install

# 构建
pnpm build
```

### 配置

创建配置文件 `~/.openclaw/openclaw.json`：

```json
{
  "env": {
    "OPENROUTER_API_KEY": "你的OpenRouter密钥",
    "WECOM_CORP_ID": "你的企业ID",
    "WECOM_CORP_SECRET": "你的应用Secret",
    "WECOM_AGENT_ID": "你的AgentId",
    "WECOM_CALLBACK_TOKEN": "你的Token",
    "WECOM_CALLBACK_AES_KEY": "你的EncodingAESKey"
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

### 启动

```bash
openclaw gateway run --bind lan --port 18789
```

详细步骤请查看 [快速入门指南](QUICKSTART_CN.md)。

## 核心特性

### 多模型支持

支持 OpenRouter、OpenAI、Anthropic、阿里云等多种 AI 模型提供商，可以根据需求选择最适合的模型。

### 安全可靠

- 企业微信官方 API 加密通信
- Gateway Token 认证
- 可配置的命令执行权限
- 支持内网部署

### 易于部署

- 支持 Docker 一键部署
- 详细的配置文档
- 完善的错误提示

### 扩展性强

- 基于 OpenClaw 插件架构
- 支持自定义工具
- 支持多节点分布式部署

## 获取帮助

- 📖 [完整文档](QUICKSTART_CN.md)
- 🐛 [GitHub Issues](https://github.com/11haonb/wecom-openclaw-plugin/issues)
- 📧 [联系作者](mailto:liujinqi@bit.edu.cn)

## 许可证

MIT License

---

Made with ❤️ by [liujinqi](mailto:liujinqi@bit.edu.cn) @ Beijing Institute of Technology
