# 🚀 Railway 部署指南

## 📋 部署步骤

### 1️⃣ 准备工作

确保你的项目已经推送到 GitHub：
```bash
cd /Users/tangjiang/.openclaw/workspace/gomoku-multiplayer
git add .
git commit -m "chore: add Railway deployment config"
git push origin main
```

### 2️⃣ 部署后端

1. 访问 [Railway](https://railway.app/)
2. 登录（推荐用 GitHub 账号）
3. 点击 **"New Project"**
4. 选择 **"Deploy from GitHub repo"**
5. 选择 `gomoku-multiplayer` 仓库

#### 配置后端服务：

**服务名称**: `gomoku-backend`

**Root Directory**: `backend`

**环境变量**（在 Railway 控制台 Variables 标签页设置）：
```
PORT=3000
NODE_ENV=production
JWT_SECRET=<生成一个强随机密钥>
CORS_ORIGIN=<前端部署后的域名，或暂时设为 *>
```

**生成 JWT 密钥**：
```bash
openssl rand -hex 32
```

#### 部署命令：
Railway 会自动识别 `railway.json` 和 `nixpacks.toml`，无需手动配置。

---

### 3️⃣ 部署前端

1. 在同一个 Railway Project 中，点击 **"New"**
2. 选择 **"Empty Service"**
3. 配置如下：

**服务名称**: `gomoku-frontend`

**Root Directory**: `frontend`

**环境变量**：
```
VITE_API_URL=<后端部署后的 URL>
```

**构建命令**：`npm run build`

**启动命令**：`npx serve dist`

---

### 4️⃣ 配置服务间通信

#### 后端 CORS 配置：
1. 在 Railway 后端服务页面，复制生成的域名（如 `gomoku-backend-production.up.railway.app`）
2. 在前端服务的 `VITE_API_URL` 环境变量中填入后端域名
3. 在后端服务的 `CORS_ORIGIN` 环境变量中填入前端域名

#### 示例配置：
```
# 前端环境变量
VITE_API_URL=https://gomoku-backend-production.up.railway.app

# 后端环境变量
CORS_ORIGIN=https://gomoku-frontend-production.up.railway.app
```

---

### 5️⃣ 自定义域名（可选）

1. 在 Railway 项目设置中选择 **"Domains"**
2. 添加你的域名
3. 按照提示配置 DNS（添加 CNAME 记录）

---

## 🔍 验证部署

### 健康检查：
```bash
curl https://<your-backend-url>.up.railway.app/health
```

### 测试连接：
1. 访问前端 URL
2. 创建游戏房间
3. 用另一个浏览器/设备加入房间
4. 测试对战功能

---

## 💰 Railway 费用估算

**免费套餐**：
- $5 免费额度/月
- 后端服务：约 $2-3/月（512MB RAM，持续运行）
- 前端服务：约 $1-2/月（静态资源，流量少）
- **总计**：约 $3-5/月（在免费额度内）

**监控用量**：
- 在 Railway Dashboard 查看 **"Usage"** 标签页
- 设置用量提醒避免超额

---

## 🛠️ 故障排查

### 后端启动失败：
```bash
# 查看 Railway 日志
# Railway Dashboard → Deployments → View Logs
```

### WebSocket 连接问题：
1. 检查 CORS 配置
2. 确认前后端域名正确
3. 检查浏览器控制台错误

### 环境变量未生效：
1. 在 Railway 控制台重新保存变量
2. 手动触发重新部署（Redeploy）

---

## 📝 重要提示

1. **JWT_SECRET**：生产环境必须使用强随机密钥
2. **CORS_ORIGIN**：不要在生产环境使用 `*`，指定具体域名
3. **日志监控**：定期查看 Railway 日志
4. **备份配置**：保存好环境变量配置

---

## 🎯 下一步

- [ ] 部署后端服务
- [ ] 部署前端服务
- [ ] 配置 CORS 和 API URL
- [ ] 测试完整对战流程
- [ ] 配置自定义域名（可选）
- [ ] 设置用量监控

---

**创建时间**: 2026-03-15  
**状态**: 配置完成，等待部署
