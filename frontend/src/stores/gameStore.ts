/**
 * 游戏状态管理 Store
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PlayerColor, GameStatus } from '../../../shared/types/game';
import type { Player, GameState, RoomInfo, ChatMessage } from '../../../shared/types/game';
import { socketManager } from '../utils/socket';

export const useGameStore = defineStore('game', () => {
  // 状态
  const connected = ref(false);
  const playerId = ref<string>('');
  const currentRoom = ref<RoomInfo | null>(null);
  const gameState = ref<GameState | null>(null);
  const playerName = ref<string>(localStorage.getItem('playerName') || '');
  const token = ref<string>(localStorage.getItem('token') || '');
  const rooms = ref<RoomInfo[]>([]);
  const messages = ref<ChatMessage[]>([]);

  // 计算属性
  const isMyTurn = computed(() => {
    if (!gameState.value || !playerId.value) return false;
    const player = currentRoom.value?.players.find(p => p.id === playerId.value);
    return player && player.color === gameState.value.currentTurn;
  });

  const myColor = computed(() => {
    const player = currentRoom.value?.players.find(p => p.id === playerId.value);
    return player?.color || PlayerColor.NONE;
  });

  const isPlaying = computed(() => {
    return gameState.value?.status === GameStatus.PLAYING;
  });

  const winner = computed(() => {
    if (gameState.value?.status !== GameStatus.ENDED) return null;
    return gameState.value.winner;
  });

  // 动作
  async function login(name: string) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (data.success) {
        token.value = data.data.token;
        playerName.value = data.data.user.name;
        localStorage.setItem('token', token.value);
        localStorage.setItem('playerName', playerName.value);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async function connect(name: string) {
    const success = await login(name);
    if (success) {
      socketManager.connect(token.value);
    }
  }

  function joinRoom(roomId: string) {
    socketManager.joinRoom(roomId, playerName.value);
  }

  function leaveRoom() {
    socketManager.leaveRoom();
    currentRoom.value = null;
    gameState.value = null;
  }

  function setReady(ready: boolean) {
    socketManager.setReady(ready);
  }

  function makeMove(x: number, y: number) {
    socketManager.makeMove(x, y);
  }

  function updateRoom(room: RoomInfo) {
    currentRoom.value = room;
  }

  function updateGame(game: GameState) {
    gameState.value = game;
  }

  function setPlayerId(id: string) {
    playerId.value = id;
  }

  function updateRooms(roomList: RoomInfo[]) {
    rooms.value = roomList;
  }

  function addMessage(message: ChatMessage) {
    messages.value.push(message);
    if (messages.value.length > 50) {
      messages.value.shift();
    }
  }

  function sendMessage(content: string) {
    socketManager.sendMessage(content);
  }

  // 初始化 Socket 监听器
  socketManager.on('connect', () => {
    connected.value = true;
    playerId.value = socketManager.getPlayerId() || '';
  });

  socketManager.on('disconnect', () => {
    connected.value = false;
  });

  socketManager.on('roomUpdate', (data: { room: RoomInfo; game: GameState }) => {
    currentRoom.value = data.room;
    if (data.game) gameState.value = data.game;
  });

  socketManager.on('gameStart', (data: { game: GameState }) => {
    gameState.value = data.game;
  });

  socketManager.on('moveUpdate', (data: { move: any; game: GameState }) => {
    gameState.value = data.game;
  });

  socketManager.on('gameOver', (data: { winner: PlayerColor; game: GameState }) => {
    gameState.value = data.game;
  });

  socketManager.on('chatMessage', (data: ChatMessage) => {
    addMessage(data);
  });

  return {
    connected,
    playerId,
    currentRoom,
    gameState,
    playerName,
    rooms,
    isMyTurn,
    myColor,
    isPlaying,
    winner,
    connect,
    joinRoom,
    leaveRoom,
    setReady,
    makeMove,
    updateRoom,
    updateGame,
    setPlayerId,
    updateRooms,
    messages,
    addMessage,
    sendMessage
  };
});
