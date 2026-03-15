<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <div class="max-w-6xl mx-auto">
      <!-- 顶部导航 -->
      <div class="flex items-center justify-between mb-4">
        <button
          @click="backToHome"
          class="text-gray-600 hover:text-gray-800"
        >
          ← 返回大厅
        </button>
        <h1 class="text-xl font-semibold text-gray-800">
          房间：{{ store.currentRoom?.name || '加载中...' }}
        </h1>
        <div class="text-sm text-gray-500">
          ID: {{ route.params.roomId }}
        </div>
      </div>

      <!-- 连接中 / 错误状态覆盖层 -->
      <div
        v-if="socketError || connectStatus !== 'connected'"
        class="mb-4 rounded-xl p-4 text-center text-sm font-medium"
        :class="socketError ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'"
      >
        <span v-if="socketError">❌ {{ socketError }}</span>
        <span v-else-if="connectStatus === 'connecting'">⏳ 正在连接服务器...</span>
        <span v-else-if="connectStatus === 'joining'">⏳ 加入房间中...</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧：玩家信息 -->
        <div class="flex flex-col gap-6">
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-lg font-semibold mb-4">玩家列表</h2>
            <div class="space-y-3">
              <div
                v-for="player in store.currentRoom?.players"
                :key="player.id"
                class="flex items-center justify-between p-3 rounded-lg"
                :class="player.color === 1 ? 'bg-gray-900 text-white' : 'bg-gray-100'"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="w-3 h-3 rounded-full"
                    :class="player.color === 1 ? 'bg-black' : 'bg-white border border-gray-400'"
                  ></span>
                  <span>{{ player.name }}</span>
                  <span v-if="player.isBot" class="text-xs bg-purple-100 text-purple-600 px-1 rounded">Bot</span>
                </div>
                <span v-if="player.isReady" class="text-green-500 text-sm">✓ 准备</span>
              </div>
              <div
                v-if="!store.currentRoom"
                class="text-center text-gray-400 py-4 text-sm"
              >
                <span v-if="connectStatus !== 'connected'">连接中...</span>
                <span v-else>加入房间中...</span>
              </div>
              <div
                v-else-if="store.currentRoom.players.length < 2"
                class="text-center text-gray-400 py-4"
              >
                等待其他玩家加入...
              </div>
            </div>

            <!-- 准备按钮 -->
            <button
              v-if="store.currentRoom?.players.length === 2"
              @click="toggleReady"
              class="w-full mt-4 py-3 rounded-lg font-semibold transition"
              :class="isReady ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700 text-white'"
            >
              {{ isReady ? '取消准备' : '准备开始' }}
            </button>
          </div>

          <!-- 聊天框 -->
          <ChatBox class="flex-1" />
        </div>

        <!-- 中间：棋盘 -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <GameBoard
            v-if="store.gameState"
            :game-state="store.gameState"
            :room-info="store.currentRoom"
            @move="handleMove"
          />

          <div v-else class="flex flex-col items-center justify-center h-96 text-gray-400 gap-4">
            <span v-if="socketError" class="text-red-400 text-center">
              房间不存在或已关闭，请返回大厅重新创建
            </span>
            <span v-else-if="connectStatus !== 'connected'">连接中...</span>
            <span v-else-if="!store.currentRoom">加入房间中...</span>
            <span v-else>等待游戏开始...</span>
            <button
              v-if="socketError"
              @click="backToHome"
              class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 text-sm"
            >
              返回大厅
            </button>
          </div>
        </div>
      </div>

      <!-- 游戏状态提示 -->
      <div
        v-if="store.winner !== null"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div class="bg-white rounded-2xl p-8 max-w-md text-center">
          <h2 class="text-3xl font-bold mb-4">
            {{ store.winner === store.myColor ? '🎉 你赢了！' : '😔 游戏结束' }}
          </h2>
          <p class="text-gray-600 mb-6">
            {{ store.winner === 1 ? '黑棋' : store.winner === 2 ? '白棋' : '平局' }} 获胜
          </p>
          <button
            @click="backToHome"
            class="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700"
          >
            返回大厅
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { socketManager } from '../utils/socket';
import GameBoard from '../components/GameBoard.vue';
import ChatBox from '../components/ChatBox.vue';

const router = useRouter();
const route = useRoute();
const store = useGameStore();
const isReady = ref(false);

// 连接状态跟踪
type ConnectStatus = 'connecting' | 'joining' | 'connected';
const connectStatus = ref<ConnectStatus>('connecting');
const socketError = ref<string | null>(null);

function backToHome() {
  socketManager.leaveRoom();
  store.leaveRoom();
  router.push('/');
}

function toggleReady() {
  isReady.value = !isReady.value;
  store.setReady(isReady.value);
}

function handleMove(x: number, y: number) {
  if (store.isMyTurn) {
    store.makeMove(x, y);
  }
}

// socket 连接和加入房间
let _errorHandler: ((data: { message: string }) => void) | null = null;

function initSocket(roomId: string) {
  const savedToken = localStorage.getItem('token');
  const savedName = localStorage.getItem('playerName');

  // 未登录 → 跳回首页
  if (!savedToken) {
    console.warn('[Room] 无 token，跳转回首页');
    router.replace('/');
    return;
  }

  // 没有名字则也跳回首页重新登录
  if (!savedName && !store.playerName) {
    console.warn('[Room] 无 playerName，跳转回首页');
    router.replace('/');
    return;
  }

  const name = store.playerName || savedName!;
  if (!store.playerName) store.playerName = name;

  const onConnect = () => {
    console.log('[Room] Socket 已连接，加入房间 ' + roomId);
    connectStatus.value = 'joining';
    socketManager.joinRoom(roomId, name);
  };

  const onRoomUpdate = () => {
    connectStatus.value = 'connected';
    socketError.value = null;
    socketManager.off('connect', onConnect);
  };

  _errorHandler = (data: { message: string }) => {
    console.error('[Room] Socket 错误:', data.message);
    socketError.value = data.message;
    connectStatus.value = 'connected';
  };

  socketManager.on('roomUpdate', onRoomUpdate);
  socketManager.on('error', _errorHandler);

  if (!socketManager.isInitialized()) {
    socketManager.on('connect', onConnect);
    socketManager.connect(savedToken);
  } else if (!store.connected) {
    socketManager.on('connect', onConnect);
  } else {
    connectStatus.value = 'joining';
    socketManager.joinRoom(roomId, name);
  }
}

onMounted(() => {
  const roomId = route.params.roomId as string;
  initSocket(roomId);
});

onUnmounted(() => {
  if (_errorHandler) socketManager.off('error', _errorHandler);
});
</script>
