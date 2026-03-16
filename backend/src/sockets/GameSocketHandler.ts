import { Server, Socket } from 'socket.io';
import { Room } from '../models/Room';
import { rooms } from '../routes/roomRoutes';
import { WSEvents, Player, PlayerColor, GameStatus } from '@gomoku/shared';
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
    const addr = socket.handshake.address;
    console.log(`\n[SOCK ] ── 新连接 ──────────────────────────────`);
    console.log(`[SOCK ] 客户端连接: id=${socket.id}  addr=${addr}  总连接数=${this.io.sockets.sockets.size}`);

    /**
     * 加入房间
     */
    socket.on(WSEvents.ROOM_JOIN, (payload: { roomId: string; playerName: string }) => {
      const { roomId, playerName } = payload;
      console.log(`[ROOM ] room:join  socket=${socket.id}  roomId=${roomId}  name="${playerName}"`);
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
          
          console.log(`[ROOM ] ✓ 玩家 "${playerName}" 加入房间 ${roomId}  当前人数=${room.players.length}  颜色=${player.color}`);

          // 如果房间只有一个人，自动加入机器人
          if (room.players.length === 1 && room.status === GameStatus.WAITING) {
            this.addBotToRoom(roomId);
          }
        } else {
          console.log(`[ROOM ] ✗ 玩家 "${playerName}" 加入失败 - 房间已满 (${room.players.length}/${room.maxPlayers})`);
          socket.emit(WSEvents.ERROR, { message: '房间已满' });
        }
      } else {
        console.log(`[ROOM ] ✗ 房间 ${roomId} 不存在  (已有房间: [${Array.from(rooms.keys()).join(', ')}])`);
        socket.emit(WSEvents.ERROR, { message: '无法找到该房间' });
      }
    });

    /**
     * 离开房间
     */
    socket.on(WSEvents.ROOM_LEAVE, () => {
      const roomId = this.getSocketRoom(socket);
      console.log(`[ROOM ] room:leave  socket=${socket.id}  roomId=${roomId ?? '(未在房间)'}`);
      this.handlePlayerLeave(socket);
    });

    /**
     * 玩家准备
     */
    socket.on(WSEvents.PLAYER_READY, (payload: { ready: boolean }) => {
      const roomId = this.getSocketRoom(socket);
      console.log(`[GAME ] player:ready  socket=${socket.id}  roomId=${roomId}  ready=${payload.ready}`);
      if (!roomId) {
        console.log(`[GAME ] ✗ player:ready 失败 - socket 不在任何房间`);
        return;
      }
      
      const room = rooms.get(roomId);
      if (room) {
        room.setReady(socket.id, payload.ready);
        const player = room.players.find(p => p.id === socket.id);
        console.log(`[GAME ] 玩家 "${player?.name}" 设置准备=${payload.ready}  全员准备=${room.players.every(p=>p.isReady)}`);
        this.io.to(roomId).emit(WSEvents.ROOM_UPDATE, {
          room: room.getRoomInfo(),
          game: room.getGameState()
        });
        
        if (room.status === GameStatus.PLAYING) {
          console.log(`[GAME ] ✓ 游戏开始！房间=${roomId}  玩家=${room.players.map(p=>`${p.name}(${p.color===1?'黑':'白'})`).join(' vs ')}`);
          this.io.to(roomId).emit(WSEvents.GAME_START, {
            game: room.getGameState()
          });
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
      if (!room || room.status !== GameStatus.PLAYING) {
        console.log(`[GAME ] move:make 忽略 - roomId=${roomId}  status=${room?.status}`);
        return;
      }

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.color !== room.getGameState().currentTurn) {
        console.log(`[GAME ] move:make 拒绝 - 不是 "${player?.name}" 的回合 (当前回合=${room.getGameState().currentTurn})`);
        socket.emit(WSEvents.ERROR, { message: '不是你的回合' });
        return;
      }

      const success = room.engine.makeMove(payload.x, payload.y, player.color);
      console.log(`[GAME ] move:make  player="${player.name}"(${player.color===1?'黑':'白'})  pos=(${payload.x},${payload.y})  success=${success}`);
      if (success) {
        const gameState = room.getGameState();
        this.io.to(roomId).emit(WSEvents.MOVE_UPDATE, {
          move: { x: payload.x, y: payload.y, color: player.color, timestamp: Date.now() },
          game: gameState
        });

        if (gameState.status === GameStatus.ENDED) {
          console.log(`[GAME ] ✓ 游戏结束！房间=${roomId}  胜利者颜色=${gameState.winner}(${gameState.winner===1?'黑':'白'})`);
          this.io.to(roomId).emit(WSEvents.GAME_OVER, {
            winner: gameState.winner,
            game: gameState
          });
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
          console.log(`[CHAT ] "${player.name}": ${payload.message}`);
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

    socket.on('disconnect', (reason) => {
      console.log(`[SOCK ] 客户端断开: id=${socket.id}  reason=${reason}  剩余连接=${this.io.sockets.sockets.size - 1}`);
      this.handlePlayerLeave(socket);
    });
  }

  private handlePlayerLeave(socket: Socket) {
    const roomId = this.getSocketRoom(socket);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        const leavingPlayer = room.players.find(p => p.id === socket.id);
        console.log(`[ROOM ] 玩家 "${leavingPlayer?.name ?? socket.id}" 离开房间 ${roomId}`);
        room.removePlayer(socket.id);
        socket.leave(roomId);
        
        if (room.players.length === 0 || room.players.every(p => p.isBot)) {
          rooms.delete(roomId);
          console.log(`[ROOM ] 房间 ${roomId} 已销毁 (无真实玩家)`);
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
    console.log(`[BOT  ] Bot "小五" 自动加入房间 ${roomId}  颜色=${botPlayer.color}`);
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
        console.log(`[BOT  ] Bot "小五" 思考中... 将落子 (${move.x},${move.y})`);
        // 模拟思考延迟
        setTimeout(() => {
          const success = room.engine.makeMove(move.x, move.y, botPlayer.color);
          if (!success) {
            console.log(`[BOT  ] ✗ Bot 落子失败 (${move.x},${move.y})`);
            return;
          }
          console.log(`[BOT  ] ✓ Bot 落子 (${move.x},${move.y})`);
          const nextState = room.getGameState();
          this.io.to(roomId).emit(WSEvents.MOVE_UPDATE, {
            move: { x: move.x, y: move.y, color: botPlayer.color, timestamp: Date.now() },
            game: nextState
          });

          if (nextState.status === GameStatus.ENDED) {
            console.log(`[GAME ] ✓ Bot 赢得游戏！房间=${roomId}`);
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
