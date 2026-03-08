/**
 * RoomManager 类管理所有活跃的游戏房间
 * 提供房间的创建、查找、删除等功能
 */

import { Room } from '../models/Room';
import { GameStatus, PlayerColor } from '../../shared/types/game';
import { BotAI } from '../services/BotAI';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRoomMap: Map<string, string> = new Map(); // playerId -> roomId

  /**
   * 创建新房间
   */
  public createRoom(id: string, name: string, boardSize: number = 15): Room {
    const room = new Room(id, name, boardSize);
    this.rooms.set(id, room);
    console.log(`[RoomManager] 创建房间：${id} (${name})`);
    return room;
  }

  /**
   * 获取房间
   */
  public getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  /**
   * 删除房间
   */
  public deleteRoom(id: string): boolean {
    const room = this.rooms.get(id);
    if (room) {
      // 移除所有玩家的映射
      room.players.forEach(player => {
        this.playerRoomMap.delete(player.id);
      });
      this.rooms.delete(id);
      console.log(`[RoomManager] 删除房间：${id}`);
      return true;
    }
    return false;
  }

  /**
   * 获取玩家所在的房间
   */
  public getPlayerRoom(playerId: string): Room | undefined {
    const roomId = this.playerRoomMap.get(playerId);
    if (roomId) {
      return this.rooms.get(roomId);
    }
    return undefined;
  }

  /**
   * 获取所有房间列表
   */
  public getAllRooms() {
    return Array.from(this.rooms.values()).map(room => room.getRoomInfo());
  }

  /**
   * 为房间添加机器人玩家
   */
  public addBotToRoom(roomId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) {
      return false;
    }

    const botPlayer = {
      id: `bot-${roomId}-${Date.now()}`,
      name: `AI (${difficulty})`,
      color: PlayerColor.NONE,
      isReady: true,
      isBot: true
    };

    room.addPlayer(botPlayer);
    this.playerRoomMap.set(botPlayer.id, roomId);

    // 设置机器人 AI
    const botAI = new BotAI(room.engine, botPlayer.color, difficulty);
    
    // 监听游戏状态变化，让机器人自动落子
    const checkBotTurn = () => {
      const gameState = room.getGameState();
      if (gameState.status === GameStatus.PLAYING) {
        const currentPlayer = room.players.find(p => p.color === gameState.currentTurn);
        if (currentPlayer?.isBot) {
          setTimeout(() => {
            const move = botAI.findBestMove();
            if (move) {
              room.engine.makeMove(move.x, move.y, currentPlayer.color);
              // 触发移动事件通知客户端
            }
          }, 1000); // 1 秒延迟，模拟思考
        }
      }
    };

    console.log(`[RoomManager] 添加机器人到房间 ${roomId}: ${botPlayer.name}`);
    return true;
  }

  /**
   * 清理空房间
   */
  public cleanupEmptyRooms(): number {
    let cleaned = 0;
    for (const [id, room] of this.rooms.entries()) {
      if (room.players.length === 0) {
        this.deleteRoom(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  /**
   * 获取活跃房间数量
   */
  public getActiveRoomCount(): number {
    return Array.from(this.rooms.values()).filter(
      room => room.status === GameStatus.PLAYING
    ).length;
  }
}
