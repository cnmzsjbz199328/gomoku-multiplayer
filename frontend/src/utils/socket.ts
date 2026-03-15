/**
 * Socket.IO 客户端工具
 */
import { io, Socket } from 'socket.io-client';
import { WSEvents, Player, GameStatus, PlayerColor, GameState, RoomInfo } from '../../../shared/types/game';

// Connect to same origin so Vite's proxy (/socket.io → localhost:3000) is used;
// or override with VITE_SOCKET_URL env var for production.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';


class SocketManager {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  connect(token?: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('[Socket] 已连接到服务器');
      this.emitHandlers('connect');
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] 与服务器断开连接');
      this.emitHandlers('disconnect');
    });

    this.socket.on(WSEvents.ROOM_UPDATE, (data: { room: RoomInfo; game: GameState }) => {
      console.log('[Socket] 房间更新:', data);
      this.emitHandlers('roomUpdate', data);
    });

    this.socket.on(WSEvents.GAME_START, (data: { game: GameState }) => {
      console.log('[Socket] 游戏开始');
      this.emitHandlers('gameStart', data);
    });

    this.socket.on(WSEvents.MOVE_UPDATE, (data: { move: any; game: GameState }) => {
      console.log('[Socket] 移动更新:', data);
      this.emitHandlers('moveUpdate', data);
    });

    this.socket.on(WSEvents.GAME_OVER, (data: { winner: PlayerColor; game: GameState }) => {
      console.log('[Socket] 游戏结束:', data);
      this.emitHandlers('gameOver', data);
    });

    this.socket.on(WSEvents.CHAT_MESSAGE, (data: any) => {
      this.emitHandlers('chatMessage', data);
    });

    this.socket.on(WSEvents.ERROR, (data: { message: string }) => {
      console.error('[Socket] 错误:', data.message);
      this.emitHandlers('error', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isInitialized() {
    return this.socket !== null;
  }

  getPlayerId() {
    return this.socket?.id;
  }

  joinRoom(roomId: string, playerName: string) {
    this.socket?.emit(WSEvents.ROOM_JOIN, { roomId, playerName });
  }

  leaveRoom() {
    this.socket?.emit(WSEvents.ROOM_LEAVE);
  }

  setReady(ready: boolean) {
    this.socket?.emit(WSEvents.PLAYER_READY, { ready });
  }

  makeMove(x: number, y: number) {
    this.socket?.emit(WSEvents.MOVE_MAKE, { x, y });
  }

  sendMessage(message: string) {
    this.socket?.emit(WSEvents.CHAT_MESSAGE, { message });
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }

  private emitHandlers(event: string, data?: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

export const socketManager = new SocketManager();
