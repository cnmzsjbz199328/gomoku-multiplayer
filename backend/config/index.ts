import dotenv from 'dotenv';

dotenv.config();

/**
 * 后端全局配置
 */
export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'gomoku-secret-key-2026',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  env: process.env.NODE_ENV || 'development',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  game: {
    boardSize: 15,
    maxPlayers: 2,
  }
};
