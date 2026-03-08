import { PlayerColor, Move } from '../../../shared/types';
import { GameEngine } from './GameEngine';

/**
 * BotAI 类提供简单的五子棋 AI 决策逻辑。
 * 采用基于位置评分的评估系统。
 */
export class BotAI {
  private engine: GameEngine;
  private color: PlayerColor;
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(engine: GameEngine, color: PlayerColor, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.engine = engine;
    this.color = color;
    this.difficulty = difficulty;
  }

  /**
   * 计算最佳落子位置
   */
  public findBestMove(): { x: number, y: number } | null {
    const board = this.engine.getBoard();
    const size = board.length;
    let bestScore = -Infinity;
    let bestMove: { x: number, y: number } | null = null;

    // 基础启发式：优先选择中心区域
    const scores: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] !== PlayerColor.NONE) continue;

        // 评分逻辑：综合进攻（自己连线）和防守（阻断对方）
        const score = this.evaluatePosition(x, y, board);
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = { x, y };
        } else if (score === bestScore && Math.random() > 0.5) {
          bestMove = { x, y };
        }
      }
    }

    return bestMove;
  }

  /**
   * 评估特定位置的分数
   */
  private evaluatePosition(x: number, y: number, board: PlayerColor[][]): number {
    const opponentColor = this.color === PlayerColor.BLACK ? PlayerColor.WHITE : PlayerColor.BLACK;
    
    // 进攻分数
    const attackScore = this.getDirectionalScore(x, y, this.color, board);
    // 防守分数
    const defenseScore = this.getDirectionalScore(x, y, opponentColor, board);

    // 根据难度调整权重
    if (this.difficulty === 'easy') {
      return attackScore + defenseScore * 0.5 + Math.random() * 10;
    } else if (this.difficulty === 'medium') {
      return attackScore + defenseScore * 0.8;
    } else {
      // 困难模式：防守权重更高，且增加连子判断
      return Math.max(attackScore, defenseScore * 1.1);
    }
  }

  /**
   * 获取方向性评分
   */
  private getDirectionalScore(x: number, y: number, color: PlayerColor, board: PlayerColor[][]): number {
    let totalScore = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    const size = board.length;

    for (const [dx, dy] of directions) {
      let count = 1;
      let block = 0;

      // 正向
      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          if (board[ny][nx] === color) count++;
          else if (board[ny][nx] !== PlayerColor.NONE) { block++; break; }
          else break;
        } else { block++; break; }
      }

      // 反向
      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          if (board[ny][nx] === color) count++;
          else if (board[ny][nx] !== PlayerColor.NONE) { block++; break; }
          else break;
        } else { block++; break; }
      }

      totalScore += this.calculatePatternScore(count, block);
    }

    return totalScore;
  }

  /**
   * 计算棋型分数
   */
  private calculatePatternScore(count: number, block: number): number {
    if (count >= 5) return 100000;
    if (block === 0) { // 活棋
      if (count === 4) return 10000;
      if (count === 3) return 1000;
      return count * 10;
    }
    if (block === 1) { // 冲棋
      if (count === 4) return 1000;
      if (count === 3) return 100;
      return count;
    }
    return 0;
  }
}
