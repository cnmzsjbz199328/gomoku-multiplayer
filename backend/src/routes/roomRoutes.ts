import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Room } from '../models/Room';
import { AuthRequest } from '../middleware/sessionAuth';
import { ApiResponse, RoomInfo } from '../../../../shared/types/game';

const router = Router();

// 内存中维护房间列表（实际项目建议使用 Redis）
export const rooms = new Map<string, Room>();

/**
 * GET /api/rooms
 * 获取所有待加入的房间列表
 */
router.get('/', (req: AuthRequest, res: Response) => {
  const roomList: RoomInfo[] = Array.from(rooms.values()).map(room => room.getRoomInfo());
  res.json({ success: true, data: roomList });
});

/**
 * POST /api/rooms
 * 创建新房间
 */
router.post('/', (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  const roomId = uuidv4();
  const newRoom = new Room(roomId, name || `房间_${roomId.slice(0, 4)}`);
  
  rooms.set(roomId, newRoom);
  
  res.status(201).json({ 
    success: true, 
    data: newRoom.getRoomInfo() 
  });
});

/**
 * POST /api/rooms/:id/join
 * 加入房间
 */
router.post('/:id/join', (req: AuthRequest, res: Response) => {
  const roomId = req.params.id;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ success: false, message: '房间不存在' });
  }

  if (room.players.length >= room.maxPlayers) {
    return res.status(400).json({ success: false, message: '房间已满' });
  }

  res.json({ success: true, data: room.getRoomInfo() });
});

export default router;
