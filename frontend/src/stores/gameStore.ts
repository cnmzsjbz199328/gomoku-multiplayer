/**
 * 游戏状态管理 Store
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Player, GameStatus, PlayerColor, GameState, RoomInfo } from '../../shared/types/game';
import { socketManager } from '../utils/socket';

export const useGameStore = defineStore('game', () => {
  // 状态
  const connected = ref(false);
  const playerId = ref<string>('');
  const currentRoom = ref<RoomInfo | null>(null);
  const gameState = ref<GameState | null>(null);
  const playerName = ref<string>('');
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
  function connect(name: string) {
    playerName.value = name;
    socketManager.connect();
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
