# 远程控制 Windows 电脑教程

本文档介绍如何通过企业微信远程控制 Windows 电脑。

---

## 架构说明

```
企业微信 APP → 企业微信服务器 → Linux Gateway → Windows Node → 执行命令
     ↑                                                              ↓
     └──────────────────── 返回结果 ←────────────────────────────────┘
```

- **Linux Gateway**：运行 OpenClaw Gateway 和 WeCom 插件
- **Windows Node**：运行 `openclaw node run`，连接到 Gateway

---

## 前置条件

- Linux 服务器已配置好 WeCom 插件（参考 [快速入门](./QUICKSTART_CN.md)）
- Windows 电脑可以访问 Linux 服务器的 18789 端口
- Windows 已安装 Node.js 18+

---

## 第一步：在 Windows 上安装 OpenClaw

```powershell
npm install -g openclaw
```

验证安装：
```powershell
openclaw --version
```

---

## 第二步：配置 Linux Gateway

### 2.1 设置 Gateway Token

在 Linux 服务器上，启动 Gateway 时设置 token：

```bash
export OPENCLAW_GATEWAY_TOKEN=your_secret_token
node dist/entry.js gateway run --bind lan --port 18789
```

### 2.2 配置 nodes.browser

编辑 `~/.openclaw/openclaw.json`，添加：

```json
{
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "nodes": {
      "browser": {
        "mode": "auto",
        "node": "你的Windows节点名"
      }
    }
  }
}
```

---

## 第三步：连接 Windows 节点

### 3.1 配置执行权限

在 Windows 上运行：

```powershell
openclaw config set tools.exec.security full
```

### 3.2 连接到 Gateway

```powershell
$env:OPENCLAW_GATEWAY_TOKEN="your_secret_token"
openclaw node run --host <Linux服务器IP> --port 18789
```

看到以下输出说明连接成功：
```
🦞 OpenClaw 2026.x.x
node host PATH: ...
```

### 3.3 验证连接

在 Linux 上运行：

```bash
openclaw nodes status
```

应该看到你的 Windows 节点显示为 `paired · connected`。

---

## 第四步：配置 Agent 使用 nodes 工具

编辑 `~/.openclaw/workspace/TOOLS.md`，添加：

```markdown
## 远程 Windows 电脑控制

你有一个已连接的远程 Windows 电脑节点：**你的节点名**

### 必须使用 nodes 工具

当用户要求以下操作时，必须使用 nodes 工具：
- 打开网页/浏览器
- 打开程序/应用
- 查看文件/文件夹
- 执行任何 Windows 命令

### nodes 工具用法

action: "run"
node: "你的节点名"
command: ["cmd", "/c", "你的命令"]

### 示例

| 用户请求 | command 参数 |
|---------|-------------|
| 打开百度 | ["cmd", "/c", "start", "https://www.baidu.com"] |
| 打开 VSCode | ["cmd", "/c", "code"] |
| 查看桌面文件 | ["cmd", "/c", "dir", "C:\\Users\\用户名\\Desktop"] |
```

---

## 第五步：测试

在企业微信中发送：

```
打开百度
```

或：

```
查看桌面有哪些文件
```

---

## 配置浏览器控制（可选）

如果你想通过企业微信控制 Windows 上的 Chrome 浏览器：

### 5.1 安装 Chrome 扩展

在 Windows Chrome 中安装 **OpenClaw Browser Relay** 扩展。

### 5.2 启动扩展

1. 打开 Chrome 任意标签页
2. 点击 OpenClaw 扩展图标
3. 确保显示 "Relay reachable"

### 5.3 测试浏览器控制

在 Linux 上测试：

```bash
openclaw nodes invoke --node 你的节点名 --command browser.proxy --params '{"method":"GET","path":"/profiles"}'
```

---

## 常见问题

### Q: Windows 节点连接后立即断开

检查：
1. Token 是否一致
2. 防火墙是否允许 18789 端口
3. 网络是否稳定

### Q: 命令执行提示 "approval required"

运行：
```powershell
openclaw config set tools.exec.security full
```

### Q: Agent 不使用 nodes 工具

1. 确保 `~/.openclaw/workspace/TOOLS.md` 已正确配置
2. 在企业微信发送 `/new` 开始新会话
3. 或重启 Gateway

---

## 安全建议

1. 使用强密码作为 Gateway Token
2. 限制 Gateway 只监听内网 IP
3. 定期更换 Token
4. 不要在公共网络上暴露 Gateway

---

## 获取帮助

- 查看 Gateway 日志：`tail -f /tmp/gateway.log`
- 查看 Agent 日志：`ls ~/.openclaw/agents/main/sessions/`
- 联系作者：[liujinqi@bit.edu.cn](mailto:liujinqi@bit.edu.cn)
