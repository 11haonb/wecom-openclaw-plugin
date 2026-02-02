# 安全配置

WeCom OpenClaw Plugin 涉及企业微信通信和远程电脑控制，安全配置至关重要。

## 凭证安全

### 保护企业微信凭证

- **不要硬编码**：不要在代码中硬编码凭证，使用环境变量或配置文件
- **限制访问**：配置文件权限设置为 600，只有所有者可读写
- **定期轮换**：定期更换 Secret 和 Token
- **不要提交**：将配置文件加入 .gitignore，不要提交到版本控制

### 设置文件权限

```bash
chmod 600 ~/.openclaw/openclaw.json
```

### 使用 .gitignore

```gitignore
# OpenClaw 配置
.openclaw/
openclaw.json
.env
.env.*
!.env.example
```

---

## 网络安全

### Gateway 绑定地址

**推荐：内网绑定**

```json
{
  "gateway": {
    "bind": "lan"
  }
}
```

只允许内网访问，配合反向代理使用。

**不推荐：公网绑定**

```json
{
  "gateway": {
    "bind": "all"
  }
}
```

⚠️ 暴露在公网有安全风险。

### 使用反向代理

推荐使用 Nginx 作为反向代理，添加 SSL 和访问控制：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /wecom/callback {
        proxy_pass http://127.0.0.1:18789;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 防火墙配置

只开放必要的端口：

```bash
# 只允许企业微信服务器访问 18789 端口
sudo ufw allow from 101.226.0.0/16 to any port 18789
```

---

## 节点安全

### Gateway Token

使用强密码作为 Gateway Token：

```bash
# 生成随机 Token
openssl rand -hex 32

# 设置 Token
export OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)
```

### 执行权限控制

根据需求设置执行权限：

| 级别 | 说明 | 适用场景 |
|------|------|---------|
| `none` | 禁止执行命令 | 只需要对话功能 |
| `safe` | 只允许安全命令 | 一般使用 |
| `full` | 允许所有命令 | 完全信任的环境 |

```bash
# 设置为安全模式
openclaw config set tools.exec.security safe
```

---

## 访问控制

### 用户白名单

限制可以使用机器人的用户：

```json
{
  "plugins": {
    "entries": {
      "wecom": {
        "allowedUsers": ["user1", "user2"]
      }
    }
  }
}
```

### 群聊白名单

限制可以使用的群聊：

```json
{
  "plugins": {
    "entries": {
      "wecom": {
        "groupChat": {
          "enabled": true,
          "allowedGroups": ["group_id_1", "group_id_2"]
        }
      }
    }
  }
}
```

---

## 安全检查清单

### 部署前检查

- [ ] 企业微信凭证已安全存储
- [ ] 配置文件权限设置为 600
- [ ] Gateway 绑定到内网地址
- [ ] 使用强密码作为 Gateway Token
- [ ] 防火墙已正确配置

### 运行时检查

- [ ] 定期检查日志是否有异常
- [ ] 定期更新 OpenClaw 到最新版本
- [ ] 定期轮换凭证和 Token
- [ ] 监控服务器资源使用

---

## 安全事件响应

### 如果凭证泄露

1. **立即**在企业微信后台重置 Secret
2. 更新配置文件中的凭证
3. 重启 Gateway 服务
4. 检查日志是否有异常访问

### 联系方式

如果发现安全漏洞，请联系：

- Email: [liujinqi@bit.edu.cn](mailto:liujinqi@bit.edu.cn)
- GitHub: [提交 Issue](https://github.com/11haonb/wecom-openclaw-plugin/issues)
