import { Server, Socket } from 'socket.io';
import { rooms } from '../routes/roomRoutes';
import { WSEvents, Player, PlayerColor, GameStatus } from '../../../../shared/types/game';
import { BotAI } from '../services/BotAI';

/**
 * 处理所有游戏相关的 WebSocket 事件
 */
export class GameSocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public handleConnection(socket: Socket) {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * 加入房间
     */
    socket.on(WSEvents.ROOM_JOIN, (payload: { roomId: string; player: Player }) => {
      const { roomId, player } = payload;
      const room = rooms.get(roomId);

      if (room && room.addPlayer(player)) {
        socket.join(roomId);
        this.io.to(roomId).emit(WSEvents.ROOM_UPDATE, room.getRoomInfo());
        
        // 如果房间只有一个人，自动加入机器人
        if (room.players.length === 1 && room.status === GameStatus.WAITING) {
          this.addBotToRoom(roomId);
        }
      } else {
        socket.emit(WSEvents.ERROR, { message: '无法加入房间' });
      }
    });

    /**
     * 玩家准备
     */
    socket.on(WSEvents.PLAYER_READY, (payload: { roomId: string; playerId: string }) => {
      const room = rooms.get(payload.roomId);
      if (room) {
        room.setReady(payload.playerId, true);
        this.io.to(payload.roomId).emit(WSEvents.ROOM_UPDATE, room.getRoomInfo());
        
        if (room.status === GameStatus.PLAYING) {
          this.io.to(payload.roomId).emit(WSEvents.GAME_START, room.getGameState());
        }
      }
    });

    /**
     * 处理落子请求
     */
    socket.on(WSEvents.MOVE_MAKE, (payload: { roomId: string; x: number; y: number; color: PlayerColor }) => {
      const room = rooms.get(payload.roomId);
      if (!room || room.status !== GameStatus.PLAYING) return;

      const success = room.engine.makeMove(payload.x, payload.y, payload.color);
      if (success) {
        const gameState = room.getGameState();
        this.io.to(payload.roomId).emit(WSEvents.MOVE_UPDATE, gameState);

        if (gameState.status === GameStatus.ENDED) {
          this.io.to(payload.roomId).emit(WSEvents.GAME_OVER, { winner: gameState.winner });
        } else if (gameState.currentTurn !== payload.color) {
          // 检查下一手是否为机器人
          this.handleBotTurn(payload.roomId);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // TODO: 处理玩家断开逻辑
    });
  }

  /**
   * 添加机器人到房间
   */
  private addBotToRoom(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const botPlayer: Player = {
      id: `bot-${roomId}`,
      name: '机器人',
      color: PlayerColor.WHITE,
      isReady: true,
      isBot: true
    };

    room.addPlayer(botPlayer);
    this.io.to(roomId).emit(WSEvents.ROOM_UPDATE, room.getRoomInfo());
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
          room.engine.makeMove(move.x, move.y, botPlayer.color);
          const nextState = room.getGameState();
          this.io.to(roomId).emit(WSEvents.MOVE_UPDATE, nextState);

          if (nextState.status === GameStatus.ENDED) {
            this.io.to(roomId).emit(WSEvents.GAME_OVER, { winner: nextState.winner });
          }
        }, 800);
      }
    }
  }
}
