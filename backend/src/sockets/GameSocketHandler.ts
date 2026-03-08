import { Server, Socket } from 'socket.io';
import { rooms } from '../routes/roomRoutes';
import { WSEvents, Player, PlayerColor, GameStatus } from '../../../shared/types/game';
import { BotAI } from '../services/BotAI';
import { v4 as uuidv4 } from 'uuid';

/**
 * 处理所有游戏相关的 WebSocket 事件
 */
export class GameSocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public handleConnection(socket: Socket) {
    console.log(`[Socket] 客户端连接: ${socket.id}`);

    /**
     * 加入房间
     */
    socket.on(WSEvents.ROOM_JOIN, (payload: { roomId: string; playerName: string }) => {
      const { roomId, playerName } = payload;
      const room = rooms.get(roomId);

      if (room) {
        const player: Player = {
          id: socket.id,
          name: playerName,
          color: PlayerColor.NONE,
          isReady: false,
          isBot: false
        };

        if (room.addPlayer(player)) {
          socket.join(roomId);
          this.io.to(roomId).emit(WSEvents.ROOM_UPDATE, {
            room: room.getRoomInfo(),
            game: room.getGameState()
          });
          
          console.log(`[Socket] 玩家 ${playerName} 加入房间 ${roomId}`);

          // 如果房间只有一个人，自动加入机器人
          if (room.players.length === 1 && room.status === GameStatus.WAITING) {
            this.addBotToRoom(roomId);
          }
        } else {
          socket.emit(WSEvents.ERROR, { message: '房间已满' });
        }
      } else {
        socket.emit(WSEvents.ERROR, { message: '无法找到该房间' });
      }
    });

    /**
     * 离开房间
     */
    socket.on(WSEvents.ROOM_LEAVE, () => {
      this.handlePlayerLeave(socket);
    });

    /**
     * 玩家准备
     */
    socket.on(WSEvents.PLAYER_READY, (payload: { ready: boolean }) => {
      const roomId = this.getSocketRoom(socket);
      if (!roomId) return;
      
      const room = rooms.get(roomId);
      if (room) {
        room.setReady(socket.id, payload.ready);
        this.io.to(roomId).emit(WSEvents.ROOM_UPDATE, {
          room: room.getRoomInfo(),
          game: room.getGameState()
        });
        
        if (room.status === GameStatus.PLAYING) {
          this.io.to(roomId).emit(WSEvents.GAME_START, {
            game: room.getGameState()
          });
          console.log(`[Socket] 房间 ${roomId} 游戏开始`);
        }
      }
    });

    /**
     * 处理落子请求
     */
    socket.on(WSEvents.MOVE_MAKE, (payload: { x: number; y: number }) => {
      const roomId = this.getSocketRoom(socket);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room || room.status !== GameStatus.PLAYING) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.color !== room.getGameState().currentTurn) {
        socket.emit(WSEvents.ERROR, { message: '不是你的回合' });
        return;
      }

      const success = room.engine.makeMove(payload.x, payload.y, player.color);
      if (success) {
        const gameState = room.getGameState();
        this.io.to(roomId).emit(WSEvents.MOVE_UPDATE, {
          move: { x: payload.x, y: payload.y, color: player.color, timestamp: Date.now() },
          game: gameState
        });

        if (gameState.status === GameStatus.ENDED) {
          this.io.to(roomId).emit(WSEvents.GAME_OVER, {
            winner: gameState.winner,
            game: gameState
          });
          console.log(`[Socket] 房间 ${roomId} 游戏结束，胜利者: ${gameState.winner}`);
        } else if (gameState.currentTurn !== player.color) {
          // 检查下一手是否为机器人
          this.handleBotTurn(roomId);
        }
      }
    });

    /**
     * 聊天消息
     */
    socket.on(WSEvents.CHAT_MESSAGE, (payload: { message: string }) => {
      const roomId = this.getSocketRoom(socket);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (room) {
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          this.io.to(roomId).emit(WSEvents.CHAT_MESSAGE, {
            id: uuidv4(),
            senderId: socket.id,
            senderName: player.name,
            content: payload.message,
            timestamp: Date.now()
          });
        }
      }
    });

    socket.on('disconnect', () => {
      this.handlePlayerLeave(socket);
      console.log(`[Socket] 客户端断开: ${socket.id}`);
    });
  }

  private handlePlayerLeave(socket: Socket) {
    const roomId = this.getSocketRoom(socket);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.removePlayer(socket.id);
        socket.leave(roomId);
        
        if (room.players.length === 0 || room.players.every(p => p.isBot)) {
          rooms.delete(roomId);
          console.log(`[Socket] 房间 ${roomId} 已销毁`);
        } else {
          this.io.to(roomId).emit(WSEvents.ROOM_UPDATE, {
            room: room.getRoomInfo(),
            game: room.getGameState()
          });
        }
      }
    }
  }

  private getSocketRoom(socket: Socket): string | undefined {
    return Array.from(socket.rooms).find(r => r !== socket.id);
  }

  /**
   * 添加机器人到房间
   */
  private addBotToRoom(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const botPlayer: Player = {
      id: `bot-${roomId}`,
      name: '小五',
      color: PlayerColor.NONE,
      isReady: true,
      isBot: true
    };

    room.addPlayer(botPlayer);
    this.io.to(roomId).emit(WSEvents.ROOM_UPDATE, {
      room: room.getRoomInfo(),
      game: room.getGameState()
    });
  }

  /**
   * 处理机器人回合
   */
  private handleBotTurn(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.status !== GameStatus.PLAYING) return;

    const gameState = room.getGameState();
    const botPlayer = room.players.find(p => p.isBot && p.color === gameState.currentTurn);

    if (botPlayer) {
      const botAI = new BotAI(room.engine, botPlayer.color);
      const move = botAI.findBestMove();

      if (move) {
        // 模拟思考延迟
        setTimeout(() => {
          const success = room.engine.makeMove(move.x, move.y, botPlayer.color);
          if (!success) return;

          const nextState = room.getGameState();
          this.io.to(roomId).emit(WSEvents.MOVE_UPDATE, {
            move: { x: move.x, y: move.y, color: botPlayer.color, timestamp: Date.now() },
            game: nextState
          });

          if (nextState.status === GameStatus.ENDED) {
            this.io.to(roomId).emit(WSEvents.GAME_OVER, {
              winner: nextState.winner,
              game: nextState
            });
          }
        }, 1000);
      }
    }
  }
}
