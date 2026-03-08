/**
 * 游戏状态枚举
 */
export enum GameStatus {
  WAITING = 'WAITING',   // 等待玩家加入/准备
  PLAYING = 'PLAYING',   // 游戏中
  ENDED = 'ENDED'        // 游戏结束
}

/**
 * 棋子颜色/玩家类型
 */
export enum PlayerColor {
  NONE = 0,
  BLACK = 1,
  WHITE = 2
}

/**
 * 玩家信息
 */
export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isReady: boolean;
  isBot: boolean;
}

/**
 * 落子信息
 */
export interface Move {
  x: number;
  y: number;
  color: PlayerColor;
  timestamp: number;
}

/**
 * 核心游戏状态
 */
export interface GameState {
  board: PlayerColor[][];
  currentTurn: PlayerColor;
  status: GameStatus;
  winner?: PlayerColor;
  moves: Move[];
}

/**
 * 房间信息
 */
export interface RoomInfo {
  id: string;
  name: string;
  players: Player[];
  status: GameStatus;
  maxPlayers: number;
}

/**
 * WebSocket 事件常量
 */
export const WSEvents = {
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATE: 'room:update',
  PLAYER_READY: 'player:ready',
  GAME_START: 'game:start',
  MOVE_MAKE: 'move:make',
  MOVE_UPDATE: 'move:update',
  GAME_OVER: 'game:over',
  CHAT_MESSAGE: 'chat:message',
  ERROR: 'error'
} as const;

/**
 * API 响应结构
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
