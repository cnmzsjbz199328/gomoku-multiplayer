/**
 * WebSocket Socket.IO 服务器
 * 处理实时游戏通信、房间管理和消息分发
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { RoomManager } from './RoomManager';
import { WSEvents, Player, Move, GameState } from '../../shared/types/game';

export class SocketServer {
  private io: SocketIOServer;
  private roomManager: RoomManager;

  constructor(io: SocketIOServer, roomManager: RoomManager) {
    this.io = io;
    this.roomManager = roomManager;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] 客户端连接：${socket.id}`);

      // 加入房间
      socket.on(WSEvents.ROOM_JOIN, (data: { roomId: string; playerName: string }) => {
        this.handleJoinRoom(socket, data);
      });

      // 离开房间
      socket.on(WSEvents.ROOM_LEAVE, () => {
        this.handleLeaveRoom(socket);
      });

      // 玩家准备
      socket.on(WSEvents.PLAYER_READY, (data: { ready: boolean }) => {
        this.handlePlayerReady(socket, data.ready);
      });

      // 落子
      socket.on(WSEvents.MOVE_MAKE, (data: { x: number; y: number }) => {
        this.handleMoveMake(socket, data);
      });

      // 聊天消息
      socket.on(WSEvents.CHAT_MESSAGE, (data: { message: string }) => {
        this.handleChatMessage(socket, data);
      });

      // 断开连接
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinRoom(
    socket: Socket,
    data: { roomId: string; playerName: string }
  ): void {
    try {
      const { roomId, playerName } = data;
      
      // 创建或获取房间
      let room = this.roomManager.getRoom(roomId);
      if (!room) {
        room = this.roomManager.createRoom(roomId, `${playerName}的房间`);
      }

      // 添加玩家
      const player: Player = {
        id: socket.id,
        name: playerName,
        color: 0, // 会在 addPlayer 中自动分配
        isReady: false,
        isBot: false
      };

      const success = room.addPlayer(player);
      if (!success) {
        socket.emit(WSEvents.ERROR, { message: '房间已满' });
        return;
      }

      // 加入 Socket.IO 房间
      socket.join(roomId);

      // 发送房间更新
      this.broadcastToRoom(roomId, WSEvents.ROOM_UPDATE, {
        room: room.getRoomInfo(),
        game: room.getGameState()
      });

      console.log(`[Socket] 玩家 ${playerName} 加入房间 ${roomId}`);
    } catch (error) {
      socket.emit(WSEvents.ERROR, { message: '加入房间失败' });
      console.error('[Socket] 加入房间错误:', error);
    }
  }

  private handleLeaveRoom(socket: Socket): void {
    try {
      const room = this.roomManager.getPlayerRoom(socket.id);
      if (room) {
        const roomId = room.id;
        room.removePlayer(socket.id);
        socket.leave(roomId);
        
        this.broadcastToRoom(roomId, WSEvents.ROOM_UPDATE, {
          room: room.getRoomInfo(),
          game: room.getGameState()
        });

        console.log(`[Socket] 玩家离开房间 ${roomId}`);
      }
    } catch (error) {
      console.error('[Socket] 离开房间错误:', error);
    }
  }

  private handlePlayerReady(socket: Socket, ready: boolean): void {
    try {
      const room = this.roomManager.getPlayerRoom(socket.id);
      if (room) {
        room.setReady(socket.id, ready);
        
        this.broadcastToRoom(room.id, WSEvents.ROOM_UPDATE, {
          room: room.getRoomInfo(),
          game: room.getGameState()
        });

        // 如果游戏开始，通知所有玩家
        if (room.status === 1) { // PLAYING
          this.broadcastToRoom(room.id, WSEvents.GAME_START, {
            game: room.getGameState()
          });
        }

        console.log(`[Socket] 玩家 ${socket.id} 准备状态：${ready}`);
      }
    } catch (error) {
      socket.emit(WSEvents.ERROR, { message: '设置准备状态失败' });
      console.error('[Socket] 准备状态错误:', error);
    }
  }

  private handleMoveMake(socket: Socket, data: { x: number; y: number }): void {
    try {
      const room = this.roomManager.getPlayerRoom(socket.id);
      if (!room || room.status !== 1) { // Not PLAYING
        return;
      }

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.color !== room.getGameState().currentTurn) {
        socket.emit(WSEvents.ERROR, { message: '不是你的回合' });
        return;
      }

      const { x, y } = data;
      const success = room.engine.makeMove(x, y, player.color);
      
      if (!success) {
        socket.emit(WSEvents.ERROR, { message: '非法移动' });
        return;
      }

      const gameState = room.getGameState();
      
      // 广播移动更新
      this.broadcastToRoom(room.id, WSEvents.MOVE_UPDATE, {
        move: { x, y, color: player.color, timestamp: Date.now() },
        game: gameState
      });

      // 检查游戏结束
      if (gameState.status === 2) { // ENDED
        this.broadcastToRoom(room.id, WSEvents.GAME_OVER, {
          winner: gameState.winner,
          game: gameState
        });
      }

      console.log(`[Socket] 玩家 ${socket.id} 落子 (${x}, ${y})`);
    } catch (error) {
      socket.emit(WSEvents.ERROR, { message: '落子失败' });
      console.error('[Socket] 落子错误:', error);
    }
  }

  private handleChatMessage(socket: Socket, data: { message: string }): void {
    try {
      const room = this.roomManager.getPlayerRoom(socket.id);
      if (room) {
        const player = room.players.find(p => p.id === socket.id);
        this.broadcastToRoom(room.id, WSEvents.CHAT_MESSAGE, {
          playerId: socket.id,
          playerName: player?.name || 'Unknown',
          message: data.message,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('[Socket] 聊天消息错误:', error);
    }
  }

  private handleDisconnect(socket: Socket): void {
    this.handleLeaveRoom(socket);
    console.log(`[Socket] 客户端断开：${socket.id}`);
  }

  private broadcastToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }
}
