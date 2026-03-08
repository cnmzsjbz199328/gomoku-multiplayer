# Gomoku Multiplayer 编码规范 (Gemini.md)

本规范旨在确保代码库的一致性、可维护性和高性能。所有开发者必须严格遵守。

## 1. 代码组织原则
- **职责分离 (SoC)**：前端视图 (Views) 与逻辑 (Stores/Utils) 分离；后端路由 (Routes)、业务逻辑 (Services) 与数据模型 (Models) 严格解耦。
- **目录一致性**：遵循既定的目录结构。组件必须放在 `components`，业务逻辑放在 `services` 或 `stores`。
- **单源真理 (SSOT)**：游戏状态应由后端权威服务器维护，前端仅作为状态的反映和用户输入的采集器。

## 2. 命名规范
- **文件命名**：
  - 组件文件：大驼峰 (PascalCase)，如 `GameBoard.tsx`。
  - 逻辑/工具类文件：小驼峰 (camelCase) 或连字符 (kebab-case)，如 `useGameLogic.ts`。
- **变量与函数**：使用小驼峰 (camelCase)。布尔值需加前缀，如 `isGameOver`, `hasPlayerJoined`。
- **常量与枚举**：全大写加下划线，如 `MAX_BOARD_SIZE`, `GAME_STATUS_WAITING`。
- **WebSocket 事件**：使用冒号或斜杠分隔的动宾短语，如 `room:join`, `move:make`, `game:start`。

## 3. 注释要求
- **JSDoc**：所有公共函数、Service 方法必须包含 JSDoc 注释，描述参数、返回值及异常情况。
- **逻辑说明**：复杂的算法（如五子棋连珠检查算法）必须在代码块上方详细说明其逻辑原理。
- **TODO 规范**：使用 `// TODO(name): description` 标记未完成项。

## 4. 模块化标准
- **高内聚**：一个模块只负责一个功能点（如 `WinChecker` 仅负责判断输赢）。
- **低耦合**：
  - 模块间通过接口通信，避免直接访问内部状态。
  - 前端组件尽量设计为受控组件，减少内部 State。
  - 后端 Service 层不应直接依赖 `req/res` 对象，只处理纯业务数据。

## 5. 类型安全 (TypeScript)
- 严禁滥用 `any`。所有 API 响应、WebSocket 消息荷载 (Payload) 必须定义 Interface。
- 共享类型定义在 `shared/types`（如果适用）或各端的 `types` 目录中。
