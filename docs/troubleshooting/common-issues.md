# 常见问题解决

## 安装问题

### npm install 失败

**错误信息**：
```
npm ERR! code EACCES
```

**解决方案**：
```bash
# 方法 1：使用 sudo
sudo npm install -g openclaw

# 方法 2：修复 npm 权限
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g openclaw
```

### Node.js 版本过低

**错误信息**：
```
Error: Node.js version 16.x is not supported
```

**解决方案**：
```bash
# 使用 nvm 安装 Node.js 18+
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

---

## 企业微信配置问题

### 回调 URL 验证失败

**可能原因**：
1. Gateway 未启动
2. 端口未开放
3. Token/AESKey 不匹配

**排查步骤**：
```bash
# 1. 确认 Gateway 正在运行
ps aux | grep openclaw

# 2. 确认端口监听
ss -ltnp | grep 18789

# 3. 测试端口连通性（从外部）
curl http://your-server:18789/wecom/callback

# 4. 检查日志
tail -f /tmp/gateway.log
```

### 消息解密失败

**错误信息**：
```
[WeCom] Decrypt failed: Invalid AES key
```

**解决方案**：
1. 确认 EncodingAESKey 是 **43 位**
2. 重新从企业微信后台复制，确保没有多余空格
3. 检查配置文件中的值是否正确

### 发送消息失败

**错误信息**：
```
[WeCom] Send message failed: access_token expired
```

**解决方案**：
1. 检查 Corp ID 和 Secret 是否正确
2. 确认应用的可见范围包含目标用户
3. 重启 Gateway 刷新 access_token

### 收不到消息回调

**排查步骤**：
1. 确认回调 URL 已在企业微信后台保存成功
2. 确认应用已启用"接收消息"功能
3. 检查 Gateway 日志是否有请求记录
4. 确认防火墙允许企业微信服务器访问

---

## AI 模型问题

### AI 不回复

**可能原因**：
1. API Key 无效
2. 模型配置错误
3. 网络问题

**排查步骤**：
```bash
# 检查日志中的错误
grep -i "error\|failed" /tmp/gateway.log | tail -20
```

**解决方案**：
1. 验证 API Key 是否有效
2. 检查模型名称是否正确
3. 如果在国内，可能需要配置代理

### 回复很慢

**可能原因**：
1. 模型响应慢
2. 网络延迟
3. 上下文过长

**解决方案**：
1. 使用更快的模型（如 qwen-turbo）
2. 配置代理优化网络
3. 使用 `/new` 命令重置会话

---

## 远程控制问题

### 节点连接失败

**错误信息**：
```
Connection refused
```

**排查步骤**：
```bash
# 1. 确认 Gateway 正在运行
openclaw channels status

# 2. 测试网络连通性
ping <gateway-ip>
telnet <gateway-ip> 18789

# 3. 检查 Token 是否一致
echo $OPENCLAW_GATEWAY_TOKEN
```

### 命令执行被拒绝

**错误信息**：
```
Approval required for command execution
```

**解决方案**：
```bash
# 设置执行权限
openclaw config set tools.exec.security full
```

### 节点频繁断开

**可能原因**：
1. 网络不稳定
2. 防火墙超时断开
3. Gateway 重启

**解决方案**：
1. 使用更稳定的网络
2. 配置防火墙保持连接
3. 使用自动重连脚本

### AI 不使用 nodes 工具

**解决方案**：
1. 确认 `~/.openclaw/workspace/TOOLS.md` 已正确配置
2. 发送 `/new` 开始新会话
3. 在消息中明确提到"远程"或"我的电脑"

---

## 浏览器控制问题

### 扩展显示 Disconnected

**解决方案**：
1. 确认 OpenClaw Node 正在运行
2. 刷新扩展（右键图标 → 重新加载）
3. 检查 Node 日志是否有错误

### 无法控制某些页面

**原因**：Chrome 安全限制

**受限页面**：
- `chrome://` 页面
- Chrome 网上应用店
- 其他扩展页面
- PDF 文件

这是 Chrome 的安全限制，无法绕过。

---

## 群聊问题

### 群聊中机器人不响应

**排查步骤**：
1. 确认 `groupChat.enabled` 为 `true`
2. 确认机器人已添加到群聊
3. 如果 `requireMention` 为 `true`，确保 @了机器人
4. 检查 `allowedGroups` 配置

### 如何获取群聊 ID

在 Gateway 日志中查找：
```bash
tail -f /tmp/gateway.log | grep "ChatId"
```

---

## 日志和调试

### 查看日志

```bash
# Gateway 日志
tail -f /tmp/gateway.log

# 过滤错误
grep -i error /tmp/gateway.log

# 过滤特定模块
grep -i wecom /tmp/gateway.log
```

### 启用调试模式

```bash
LOG_LEVEL=debug openclaw gateway run
```

---

## 获取帮助

如果以上方案都无法解决问题：

1. **查看完整日志**：`cat /tmp/gateway.log`
2. **提交 Issue**：[GitHub Issues](https://github.com/11haonb/wecom-openclaw-plugin/issues)
3. **联系作者**：[liujinqi@bit.edu.cn](mailto:liujinqi@bit.edu.cn)

提交 Issue 时请包含：
- 操作系统和 Node.js 版本
- OpenClaw 版本
- 完整的错误日志
- 复现步骤
