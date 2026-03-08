import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from '../config';
import roomRoutes from './routes/roomRoutes';
import authRoutes from './routes/authRoutes';
import { GameSocketHandler } from './sockets/GameSocketHandler';
import { sessionAuth } from './middleware/sessionAuth';

const app = express();
const httpServer = createServer(app);

// 初始化 Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST']
  }
});

// 中间件配置
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/auth', authRoutes);
// 房间列表和操作受 JWT 保护
app.use('/api/rooms', sessionAuth, roomRoutes);

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 初始化 WebSocket 处理器
const socketHandler = new GameSocketHandler(io);
io.on('connection', (socket) => {
  socketHandler.handleConnection(socket);
});

// 启动服务器
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`[Server] Gomoku backend running at http://localhost:${PORT}`);
  console.log(`[Env] Current environment: ${config.env}`);
});
