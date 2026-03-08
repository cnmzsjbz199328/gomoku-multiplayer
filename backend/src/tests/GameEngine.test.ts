import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../services/GameEngine';
import { PlayerColor, GameStatus } from '../../../shared/types';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(15);
    engine.reset();
  });

  it('应该能正确初始化棋盘', () => {
    const state = engine.getGameState();
    expect(state.status).toBe(GameStatus.PLAYING);
    expect(state.currentTurn).toBe(PlayerColor.BLACK);
    expect(state.board.length).toBe(15);
    expect(state.board[0].length).toBe(15);
  });

  it('应该允许合法落子', () => {
    const success = engine.makeMove(7, 7, PlayerColor.BLACK);
    expect(success).toBe(true);
    expect(engine.getBoard()[7][7]).toBe(PlayerColor.BLACK);
    expect(engine.getGameState().currentTurn).toBe(PlayerColor.WHITE);
  });

  it('不应该允许在已有棋子的地方落子', () => {
    engine.makeMove(7, 7, PlayerColor.BLACK);
    const success = engine.makeMove(7, 7, PlayerColor.WHITE);
    expect(success).toBe(false);
  });

  it('应该能判定水平五子连珠获胜', () => {
    // 黑棋: (0,0), (1,0), (2,0), (3,0), (4,0)
    // 白棋: (0,1), (1,1), (2,1), (3,1)
    engine.makeMove(0, 0, PlayerColor.BLACK); // B
    engine.makeMove(0, 1, PlayerColor.WHITE); // W
    engine.makeMove(1, 0, PlayerColor.BLACK); // B
    engine.makeMove(1, 1, PlayerColor.WHITE); // W
    engine.makeMove(2, 0, PlayerColor.BLACK); // B
    engine.makeMove(2, 1, PlayerColor.WHITE); // W
    engine.makeMove(3, 0, PlayerColor.BLACK); // B
    engine.makeMove(3, 1, PlayerColor.WHITE); // W
    engine.makeMove(4, 0, PlayerColor.BLACK); // B Win!

    const state = engine.getGameState();
    expect(state.status).toBe(GameStatus.ENDED);
    expect(state.winner).toBe(PlayerColor.BLACK);
  });

  it('应该能判定垂直五子连珠获胜', () => {
    engine.makeMove(0, 0, PlayerColor.BLACK);
    engine.makeMove(1, 0, PlayerColor.WHITE);
    engine.makeMove(0, 1, PlayerColor.BLACK);
    engine.makeMove(1, 1, PlayerColor.WHITE);
    engine.makeMove(0, 2, PlayerColor.BLACK);
    engine.makeMove(1, 2, PlayerColor.WHITE);
    engine.makeMove(0, 3, PlayerColor.BLACK);
    engine.makeMove(1, 3, PlayerColor.WHITE);
    engine.makeMove(0, 4, PlayerColor.BLACK);

    const state = engine.getGameState();
    expect(state.status).toBe(GameStatus.ENDED);
    expect(state.winner).toBe(PlayerColor.BLACK);
  });

  it('应该能判定斜向五子连珠获胜', () => {
    engine.makeMove(0, 0, PlayerColor.BLACK);
    engine.makeMove(0, 1, PlayerColor.WHITE);
    engine.makeMove(1, 1, PlayerColor.BLACK);
    engine.makeMove(1, 2, PlayerColor.WHITE);
    engine.makeMove(2, 2, PlayerColor.BLACK);
    engine.makeMove(2, 3, PlayerColor.WHITE);
    engine.makeMove(3, 3, PlayerColor.BLACK);
    engine.makeMove(3, 4, PlayerColor.WHITE);
    engine.makeMove(4, 4, PlayerColor.BLACK);

    const state = engine.getGameState();
    expect(state.status).toBe(GameStatus.ENDED);
    expect(state.winner).toBe(PlayerColor.BLACK);
  });
});
