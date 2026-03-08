import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { GameState, GameStatus, Player, PlayerColor, RoomInfo, WSEvents } from '../../../shared/types/game';
import socket from '../utils/socket';

export const useGameStore = defineStore('game', () => {
  const currentRoom = ref<RoomInfo | null>(null);
  const gameState = ref<GameState | null>(null);
  const currentUser = ref<Player | null>(null);
  const rooms = ref<RoomInfo[]>([]);

  const isMyTurn = computed(() => {
    return gameState.value?.status === GameStatus.PLAYING && 
           gameState.value?.currentTurn === currentUser.value?.color;
  });

  /**
   * 初始化 Socket 监听
   */
  function initSocket() {
    socket.connect();
    
    socket.on(WSEvents.ROOM_UPDATE, (room: RoomInfo) => {
      currentRoom.value = room;
      const me = room.players.find(p => p.id === currentUser.value?.id);
      if (me) currentUser.value = me;
    });

    socket.on(WSEvents.GAME_START, (state: GameState) => {
      gameState.value = state;
    });

    socket.on(WSEvents.MOVE_UPDATE, (state: GameState) => {
      gameState.value = state;
    });

    socket.on(WSEvents.GAME_OVER, (state: GameState) => {
      gameState.value = state;
    });
  }

  /**
   * 创建/加入房间
   */
  function joinRoom(playerName: string, roomName?: string, roomId?: string) {
    const player: Partial<Player> = {
      id: Math.random().toString(36).substr(2, 9),
      name: playerName,
      isReady: false
    };
    currentUser.value = player as Player;
    socket.emit(WSEvents.ROOM_JOIN, { roomName, roomId, player });
  }

  /**
   * 落子动作
   */
  function makeMove(x: number, y: number) {
    if (!isMyTurn.value || !currentRoom.value) return;
    socket.emit(WSEvents.MOVE_MAKE, {
      roomId: currentRoom.value.id,
      move: { x, y, color: currentUser.value?.color, timestamp: Date.now() }
    });
  }

  /**
   * 准备/取消准备
   */
  function toggleReady() {
    if (!currentRoom.value || !currentUser.value) return;
    socket.emit(WSEvents.PLAYER_READY, {
      roomId: currentRoom.value.id,
      playerId: currentUser.value.id
    });
  }

  return {
    currentRoom,
    gameState,
    currentUser,
    rooms,
    isMyTurn,
    initSocket,
    joinRoom,
    makeMove,
    toggleReady
  };
});
