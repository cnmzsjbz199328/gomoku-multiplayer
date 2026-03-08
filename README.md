# Gomoku Multiplayer - 多人在线五子棋 🎮

一个基于现代 Web 技术的实时竞技五子棋平台，支持多人在线对战、房间创建与聊天。

## ✨ 功能列表

- 🔄 **实时对战**：基于 WebSocket 的极低延迟落子同步
- 🏠 **房间系统**：创建房间、密码保护、加入指定房间、大厅随机匹配
- 🤖 **智能机器人**：单人也能玩，内置 AI 对手
- 👀 **观战模式**：允许其他玩家实时观看正在进行的比赛
- 🎯 **智能判据**：精准的五子连珠算法，支持多种棋盘尺寸（15x15, 19x19）
- 📱 **响应式设计**：完美适配 PC 端与移动端浏览器
- 🔐 **免登录体验**：基于浏览器 Session 的快速加入

## 🛠️ 开发环境要求

- **Node.js**: v18.0.0 或更高版本
- **Package Manager**: npm, yarn 或 pnpm
- **Database**: Redis (用于房间状态缓存)

## 🚀 快速开始指南

### 后端启动 (Backend)
```bash
cd gomoku-multiplayer/backend
npm install
# 配置 .env 文件 (参考 .env.example)
npm run dev
```

### 前端启动 (Frontend)
```bash
cd gomoku-multiplayer/frontend
npm install
npm run dev
```

## 📁 目录结构说明

```
gomoku-multiplayer/
├── frontend/           # Vue 3 前端应用
│   ├── src/
│   │   ├── components/ # 可复用组件
│   │   ├── views/      # 页面视图
│   │   ├── stores/     # Pinia 状态管理
│   │   ├── utils/      # 工具函数
│   │   └── assets/     # 静态资源
│   └── public/
├── backend/            # Node.js 后端服务
│   ├── src/
│   │   ├── routes/     # HTTP 路由
│   │   ├── middleware/ # 中间件
│   │   ├── models/     # 数据模型
│   │   ├── services/   # 业务逻辑
│   │   └── sockets/    # WebSocket 处理
│   └── config/
└── docs/               # 项目文档
```

## 📋 项目文档

- [编码规范](./Gemini.md) - 代码组织、命名、注释规范
- [项目设计](./docs/PROJECT_DESIGN.md) - 技术选型、架构设计

## 📄 开源协议

MIT License
