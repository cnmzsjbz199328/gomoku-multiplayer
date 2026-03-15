/**
 * 后端全流程自动化测试脚本（单人 vs Bot 模式）
 * 流程：登录 → 创建房间(REST) → Socket 加入 → Bot 自动入场
 *       → Alice 准备 → 游戏开始 → Alice 落子/等 Bot 回子 → 游戏结束
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __dir = path.dirname(fileURLToPath(import.meta.url));
const { io } = require(path.resolve(__dir, '../frontend/node_modules/socket.io-client'));

const BASE = 'http://localhost:3000';

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────
function log(tag, msg) {
  const time = new Date().toISOString().slice(11, 23);
  console.log(`[${time}] [${tag}] ${msg}`);
}

function pass(msg) { console.log(`  ✅  ${msg}`); }
function fail(msg) { console.error(`  ❌  ${msg}`); process.exit(1); }

async function httpPost(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST', headers,
    body: JSON.stringify(body)
  });
  return res.json();
}

function waitEvent(socket, event, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeout);
    socket.once(event, (data) => { clearTimeout(t); resolve(data); });
  });
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const s = io(BASE, { auth: { token }, transports: ['websocket'], forceNew: true });
    s.once('connect', () => resolve(s));
    s.once('connect_error', reject);
    setTimeout(() => reject(new Error('Socket connect timeout')), 5000);
  });
}

// ──────────────────────────────────────────────
// 测试主流程
// ──────────────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   Gomoku 后端全流程测试 (1P vs Bot)');
  console.log('═══════════════════════════════════════════\n');

  // ── 步骤 1：登录 Alice ─────────────────────
  log('AUTH', '登录玩家 Alice ...');
  const r1 = await httpPost('/api/auth/login', { name: 'Alice' });
  if (!r1.success) fail(`登录失败: ${r1.message}`);
  const token = r1.data.token;
  pass('Alice 登录成功，JWT 已获取');

  // ── 步骤 2：创建房间（REST API）───────────────
  log('ROOM', '调用 POST /api/rooms ...');
  const rc = await httpPost('/api/rooms', { name: '测试房间' }, token);
  if (!rc.success) fail(`创建房间失败: ${JSON.stringify(rc)}`);
  const roomId = rc.data.id;
  pass(`房间创建成功，ID: ${roomId}`);

  // ── 步骤 3：Socket 连接 ───────────────────────
  log('SOCK', 'Alice 连接 WebSocket ...');
  const socket = await connectSocket(token);
  pass(`Alice 已连接，socket.id: ${socket.id}`);

  // ── 步骤 4：加入房间，等待 Bot 自动入场 ─────────
  log('ROOM', '加入房间（等待 Bot 自动入场）...');
  // 第一次 room:update：Alice 加入后
  const firstUpdate = waitEvent(socket, 'room:update');
  socket.emit('room:join', { roomId, playerName: 'Alice' });
  const u1 = await firstUpdate;
  log('ROOM', `room:update #1 → 玩家数: ${u1.room.players.length}`);

  // 第二次 room:update：Bot 加入后
  const secondUpdate = waitEvent(socket, 'room:update', 3000);
  const u2 = await secondUpdate;
  const players = u2.room.players;
  if (players.length < 2) fail(`Bot 未自动加入，玩家数: ${players.length}`);
  const alice = players.find(p => !p.isBot);
  const bot   = players.find(p =>  p.isBot);
  if (!alice || !bot) fail('找不到 Alice 或 Bot');
  pass(`Bot "${bot.name}" 已加入。Alice=${alice.color===1?'黑':'白'}, Bot=${bot.color===1?'黑':'白'}`);

  // ── 步骤 5：Alice 准备（Bot 已是 ready）────────
  log('REDY', 'Alice 发送 player:ready ...');
  const gameStartP = waitEvent(socket, 'game:start', 5000);
  socket.emit('player:ready', { ready: true });
  const gs = await gameStartP;
  if (!gs.game || gs.game.status !== 'PLAYING') fail(`游戏未开始，status: ${gs.game?.status}`);
  pass(`game:start 收到！初始回合: ${gs.game.currentTurn===1?'黑棋':'白棋'}`);

  // ── 步骤 6：对弈 ─────────────────────────────
  // 动态选位：追踪棋盘状态，从中心向外挑第一个空格，跳过 Bot 已占位置
  // Bot 胜/Alice 胜均可；核心验证 move:update / game:over 全链路
  log('GAME', '开始对弈（动态跟踪棋盘，直到游戏结束）...');

  let board = gs.game.board;
  let gameOver = null;
  socket.on('game:over', (d) => { gameOver = d; });

  // 按中心→边缘生成全部格子的优先顺序
  const allCells = [];
  for (let d = 0; d < 15; d++) {
    for (let y = 7 - d; y <= 7 + d; y++) {
      for (let x = 7 - d; x <= 7 + d; x++) {
        if (x >= 0 && x < 15 && y >= 0 && y < 15) {
          if (!allCells.some(c => c.x === x && c.y === y)) allCells.push({ x, y });
        }
      }
    }
  }

  let totalMoves = 0;
  const MAX_GAME_MOVES = 40;

  while (!gameOver && totalMoves < MAX_GAME_MOVES) {
    const mv = allCells.find(c => board[c.y][c.x] === 0);
    if (!mv) { log('GAME', '棋盘已满'); break; }

    log('MOVE', `[${totalMoves + 1}] Alice(黑) → (${mv.x}, ${mv.y})`);
    const muP = waitEvent(socket, 'move:update', 5000);
    socket.emit('move:make', mv);
    const mu = await muP;
    board = mu.game.board;
    totalMoves++;
    log('MOVE', `    status=${mu.game.status} turn=${mu.game.currentTurn}`);

    if (mu.game.status === 'ENDED') {
      gameOver = { winner: mu.game.winner, game: mu.game };
      break;
    }

    log('MOVE', '    等待 Bot 落子...');
    const botMu = await waitEvent(socket, 'move:update', 8000);
    board = botMu.game.board;
    log('MOVE', `    Bot 落子，status=${botMu.game.status}`);
    if (botMu.game.status === 'ENDED') {
      gameOver = { winner: botMu.game.winner, game: botMu.game };
      break;
    }
  }

  if (!gameOver) fail(`${MAX_GAME_MOVES} 回合后游戏仍未结束`);
  const winner = gameOver.winner ?? gameOver.game?.winner;
  pass(`游戏正常结束，胜利方颜色值: ${winner}  (1=黑/Alice, 2=白/Bot)，共 ${totalMoves} 回合`);


  // ── 步骤 7：房间列表 ──────────────────────────
  log('ROOM', 'GET /api/rooms 查询房间列表 ...');
  const listRes = await fetch(`${BASE}/api/rooms`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = await listRes.json();
  if (!listData.success) fail('获取房间列表失败');
  pass(`当前共 ${listData.data.length} 个房间`);

  // ── 步骤 8：离开房间，验证清理 ────────────────
  log('CLEAN', '玩家离开房间 ...');
  socket.emit('room:leave');
  await new Promise(r => setTimeout(r, 600));

  const listRes2 = await fetch(`${BASE}/api/rooms`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData2 = await listRes2.json();
  const roomStillExists = listData2.data?.find(r => r.id === roomId);
  if (!roomStillExists) {
    pass('房间在玩家离开后已被自动销毁 ✓');
  } else {
    log('WARN', '房间仍然存在（游戏结束后的保留策略）');
  }

  socket.disconnect();

  console.log('\n═══════════════════════════════════════════');
  console.log('   全部测试通过 🎉');
  console.log('═══════════════════════════════════════════\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ 测试脚本异常:', err.message);
  console.error(err.stack);
  process.exit(1);
});
