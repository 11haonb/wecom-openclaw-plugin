# Gateway 配置

Gateway 是 OpenClaw 的核心服务，负责处理企业微信回调、AI 对话和节点管理。

## 启动方式

### 基本启动

```bash
openclaw gateway run
```

### 带参数启动

```bash
openclaw gateway run --bind lan --port 18789 --force
```

### 后台运行

```bash
nohup openclaw gateway run --bind lan --port 18789 > /tmp/gateway.log 2>&1 &
```

### 使用 systemd

创建服务文件 `/etc/systemd/system/openclaw-gateway.service`：

```ini
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/home/your_user
Environment=NODE_ENV=production
ExecStart=/usr/bin/openclaw gateway run --bind lan --port 18789
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable openclaw-gateway
sudo systemctl start openclaw-gateway
```

---

## 命令行参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--bind` | 绑定地址模式 | `loopback` |
| `--port` | 监听端口 | `18789` |
| `--force` | 强制启动 | `false` |
| `--config` | 配置文件路径 | `~/.openclaw/openclaw.json` |

---

## 节点管理

### 配置节点路由

```json
{
  "gateway": {
    "nodes": {
      "browser": {
        "mode": "auto",
        "node": "my-windows-pc"
      }
    }
  }
}
```

### Gateway Token

用于节点认证的 Token：

```bash
export OPENCLAW_GATEWAY_TOKEN=your_secret_token
```

> ⚠️ 请使用强密码作为 Token，至少 32 位随机字符。

### 查看节点状态

```bash
openclaw nodes status
```

---

## 健康检查

### 检查 Gateway 状态

```bash
openclaw channels status --probe
```

### 检查端口监听

```bash
ss -ltnp | grep 18789
```

### 检查日志

```bash
tail -f /tmp/gateway.log
```

---

## 常见问题

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :18789

# 终止进程
kill -9 <PID>

# 或使用 --force 参数
openclaw gateway run --force
```

### Gateway 启动后立即退出

检查日志获取错误信息：

```bash
openclaw gateway run 2>&1 | head -50
```

常见原因：
- 配置文件格式错误
- 缺少必要的环境变量
- 端口被占用
