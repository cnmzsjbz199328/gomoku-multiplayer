import { Player, GameStatus, PlayerColor, RoomInfo } from '@gomoku/shared';
import { GameEngine } from '../services/GameEngine';

/**
 * Room 类维护房间状态及玩家逻辑。
 */
export class Room {
  public id: string;
  public name: string;
  public players: Player[] = [];
  public engine: GameEngine;
  public status: GameStatus = GameStatus.WAITING;
  public maxPlayers: number = 2;

  constructor(id: string, name: string, boardSize: number = 15) {
    this.id = id;
    this.name = name;
    this.engine = new GameEngine(boardSize);
  }

  /**
   * 添加玩家到房间
   */
  public addPlayer(player: Player): boolean {
    if (this.players.length >= this.maxPlayers) return false;
    
    // 自动分配颜色（黑棋先手）
    player.color = this.players.length === 0 ? PlayerColor.BLACK : 
      (this.players[0].color === PlayerColor.BLACK ? PlayerColor.WHITE : PlayerColor.BLACK);
    
    this.players.push(player);
    return true;
  }

  /**
   * 从房间移除玩家
   */
  public removePlayer(playerId: string): void {
    this.players = this.players.filter(p => p.id !== playerId);
    if (this.status === GameStatus.PLAYING) {
      this.status = GameStatus.ENDED;
      // TODO: 处理玩家离开导致的胜负逻辑
    }
  }

  /**
   * 设置玩家准备状态
   */
  public setReady(playerId: string, ready: boolean): void {
    const player = this.players.find(p => p.id === playerId);
    if (player) player.isReady = ready;

    // 全员准备即开始游戏
    if (this.players.length === this.maxPlayers && this.players.every(p => p.isReady)) {
      this.status = GameStatus.PLAYING;
      this.engine.reset();
    }
  }

  /**
   * 获取房间公开信息
   */
  public getRoomInfo(): RoomInfo {
    return {
      id: this.id,
      name: this.name,
      players: this.players,
      status: this.status,
      maxPlayers: this.maxPlayers
    };
  }

  /**
   * 获取当前游戏状态
   */
  public getGameState() {
    return this.engine.getGameState();
  }
}
