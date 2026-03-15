import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

const router = Router();

/**
 * POST /api/auth/login
 * 简单登录接口，返回 JWT
 */
router.post('/login', (req: Request, res: Response) => {
  const { name } = req.body;
  console.log(`[AUTH] POST /api/auth/login  name="${name}"`);
  
  if (!name) {
    console.log(`[AUTH] 登录失败 - 未提供名字`);
    return res.status(400).json({ success: false, message: '请输入名字' });
  }

  const userId = uuidv4();
  const token = jwt.sign(
    { id: userId, name },
    config.jwtSecret,
    { expiresIn: '24h' }
  );

  console.log(`[AUTH] 登录成功 → userId=${userId} name="${name}"`);
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: userId,
        name
      }
    }
  });
});

export default router;
