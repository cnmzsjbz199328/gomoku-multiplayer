import { PlayerColor, GameStatus, Move, GameState } from '../../../shared/types/game';

/**
 * GameEngine 类负责五子棋的核心逻辑，包括棋盘管理、落子验证和胜负判定。
 */
export class GameEngine {
  private boardSize: number;
  private board: PlayerColor[][];
  private currentTurn: PlayerColor;
  private status: GameStatus;
  private moves: Move[];
  private winner: PlayerColor | undefined;

  constructor(size: number = 15) {
    this.boardSize = size;
    this.board = Array(size).fill(0).map(() => Array(size).fill(PlayerColor.NONE));
    this.currentTurn = PlayerColor.BLACK;
    this.status = GameStatus.WAITING;
    this.moves = [];
  }

  /**
   * 初始化/重置游戏
   */
  public reset(): void {
    this.board = Array(this.boardSize).fill(0).map(() => Array(this.boardSize).fill(PlayerColor.NONE));
    this.currentTurn = PlayerColor.BLACK;
    this.status = GameStatus.PLAYING;
    this.moves = [];
    this.winner = undefined;
  }

  /**
   * 验证落子位置是否合法
   */
  public isValidMove(x: number, y: number): boolean {
    if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize) return false;
    if (this.board[y][x] !== PlayerColor.NONE) return false;
    if (this.status !== GameStatus.PLAYING) return false;
    return true;
  }

  /**
   * 执行落子逻辑
   */
  public makeMove(x: number, y: number, color: PlayerColor): boolean {
    if (!this.isValidMove(x, y) || color !== this.currentTurn) {
      return false;
    }

    this.board[y][x] = color;
    this.moves.push({ x, y, color, timestamp: Date.now() });

    if (this.checkWin(x, y, color)) {
      this.status = GameStatus.ENDED;
      this.winner = color;
    } else if (this.moves.length === this.boardSize * this.boardSize) {
      this.status = GameStatus.ENDED;
      this.winner = PlayerColor.NONE; // 平局
    } else {
      // 切换回合
      this.currentTurn = this.currentTurn === PlayerColor.BLACK ? PlayerColor.WHITE : PlayerColor.BLACK;
    }

    return true;
  }

  /**
   * 五子连珠检查算法
   * 从当前落子点向四个方向（横、竖、左斜、右斜）搜索是否有连续五个相同颜色的棋子。
   */
  private checkWin(x: number, y: number, color: PlayerColor): boolean {
    const directions = [
      [1, 0],  // 横向
      [0, 1],  // 纵向
      [1, 1],  // 右斜
      [1, -1]  // 左斜
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      // 正向搜索
      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (this.isColorAt(nx, ny, color)) count++;
        else break;
      }

      // 反向搜索
      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (this.isColorAt(nx, ny, color)) count++;
        else break;
      }

      if (count >= 5) return true;
    }

    return false;
  }

  private isColorAt(x: number, y: number, color: PlayerColor): boolean {
    return x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize && this.board[y][x] === color;
  }

  public getGameState(): GameState {
    return {
      board: this.board,
      currentTurn: this.currentTurn,
      status: this.status,
      winner: this.winner,
      moves: this.moves
    };
  }

  public getBoard(): PlayerColor[][] {
    return this.board;
  }
}
