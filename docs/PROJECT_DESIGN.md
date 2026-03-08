# Gomoku Multiplayer 项目设计文档 (PROJECT_DESIGN.md)

## 1. 技术选型说明
- **前端**：Vue 3 + Vite + TypeScript + Tailwind CSS + Pinia (状态管理)
- **后端**：Node.js + Express
- **实时通信**：Socket.IO
- **数据存储**：Redis (用于实时游戏房间状态) + MongoDB/PostgreSQL (用于用户数据和战绩)
- **构建工具**：Vite

## 2. 系统架构图 (文字描述)
- **客户端 (Frontend)**：处理用户 UI 交互，通过 WebSocket 发送落子请求，监听服务器广播的全局状态更新
- **服务端 (Backend)**：
  - **HTTP 层**：处理用户注册、登录、大厅列表获取
  - **Socket 层**：维护长连接，管理游戏房间（Room），分发实时指令
  - **逻辑层 (Game Logic)**：执行落子校验（是否合法、是否重复落子）及胜负判定
- **状态层**：集中管理所有活跃房间的棋盘矩阵和玩家信息

## 3. 数据流设计
1. **落子流程**：客户端点击棋盘 → 发送 `move:make(x, y)` 事件 → 服务器校验 → 更新服务器棋盘矩阵 → 判断胜负 → 广播 `game:update(board, turn, winner)`
2. **同步机制**：采用"增量更新 + 定期全量校准"模式。当网络波动时，客户端请求当前房间的完整 Snapshot

## 4. API 设计原则
- **RESTful 设计**：HTTP 接口遵循标准的资源操作规范
- **状态码**：统一返回 `{ code: number, data: any, message: string }` 格式
- **幂等性**：落子操作在服务端必须根据回合数 (Turn) 校验幂等性，防止双击或网络重发导致重复落子

## 5. Session 认证方案
- **JWT (JSON Web Token)**：
  - 用户进入大厅时颁发临时 Token（基于浏览器 Session）
  - WebSocket 连接握手阶段通过 `auth` 字段校验 JWT 合法性
  - 房间操作权限：每个 Socket 连接绑定用户 ID，服务端严格校验当前操作者是否为该房间的有效玩家及是否轮到其回合

## 6. 多人游戏设计
- **棋子标识**：使用用户名首字母（大写），颜色随机分配
- **回合制**：顺时针或随机顺序决定落子顺序
- **机器人 AI**：当房间玩家不足时，机器人自动加入填补空位
- **观战模式**：允许额外玩家以只读方式加入房间观看
