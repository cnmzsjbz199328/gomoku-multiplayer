import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../services/GameEngine';
import { BotAI } from '../services/BotAI';
import { PlayerColor } from '@shared/types';

describe('BotAI', () => {
  let engine: GameEngine;
  let bot: BotAI;

  beforeEach(() => {
    engine = new GameEngine(15);
    engine.reset();
    bot = new BotAI(engine, PlayerColor.WHITE);
  });

  it('在空棋盘上应该能找到一个落子点', () => {
    const move = bot.findBestMove();
    expect(move).not.toBeNull();
    expect(move?.x).toBeGreaterThanOrEqual(0);
    expect(move?.x).toBeLessThan(15);
    expect(move?.y).toBeGreaterThanOrEqual(0);
    expect(move?.y).toBeLessThan(15);
  });

  it('应该优先阻断玩家的四连', () => {
    // 玩家(黑棋)即将达成五连: (7,7), (8,7), (9,7), (10,7)
    engine.makeMove(7, 7, PlayerColor.BLACK);
    engine.makeMove(0, 0, PlayerColor.WHITE);
    engine.makeMove(8, 7, PlayerColor.BLACK);
    engine.makeMove(0, 1, PlayerColor.WHITE);
    engine.makeMove(9, 7, PlayerColor.BLACK);
    engine.makeMove(0, 2, PlayerColor.WHITE);
    engine.makeMove(10, 7, PlayerColor.BLACK);

    const move = bot.findBestMove();
    // 机器人应该下在 (6,7) 或 (11,7) 来阻断
    const isBlocking = (move?.x === 6 && move?.y === 7) || (move?.x === 11 && move?.y === 7);
    expect(isBlocking).toBe(true);
  });

  it('应该优先达成自己的五连', () => {
    // 机器人(白棋)即将达成五连: (7,7), (8,7), (9,7), (10,7)
    engine.makeMove(0, 0, PlayerColor.BLACK);
    engine.makeMove(7, 7, PlayerColor.WHITE);
    engine.makeMove(0, 1, PlayerColor.BLACK);
    engine.makeMove(8, 7, PlayerColor.WHITE);
    engine.makeMove(0, 2, PlayerColor.BLACK);
    engine.makeMove(9, 7, PlayerColor.WHITE);
    engine.makeMove(0, 3, PlayerColor.BLACK);
    engine.makeMove(10, 7, PlayerColor.WHITE);
    engine.makeMove(0, 4, PlayerColor.BLACK);

    const move = bot.findBestMove();
    // 机器人应该下在 (6,7) 或 (11,7) 来获胜
    const isWinning = (move?.x === 6 && move?.y === 7) || (move?.x === 11 && move?.y === 7);
    expect(isWinning).toBe(true);
  });
});
