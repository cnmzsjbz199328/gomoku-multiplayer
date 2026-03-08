import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

/**
 * 扩展 Request 类型以包含用户信息
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
}

/**
 * JWT 身份验证中间件
 */
export const sessionAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未授权，请先登录' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; name: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: '无效或过期的 Token' });
  }
};
