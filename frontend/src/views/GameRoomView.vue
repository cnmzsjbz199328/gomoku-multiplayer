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
                </div>
                <span v-if="player.isReady" class="text-green-500 text-sm">✓ 准备</span>
              </div>
              <div
                v-if="store.currentRoom && store.currentRoom.players.length < 2"
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

          <div v-else class="flex items-center justify-center h-96 text-gray-400">
            等待游戏开始...
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { socketManager } from '../utils/socket';
import GameBoard from '../components/GameBoard.vue';
import ChatBox from '../components/ChatBox.vue';
import { GameStatus } from '../../../shared/types/game';

const router = useRouter();
const route = useRoute();
const store = useGameStore();
const isReady = ref(false);

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

// 监听 Socket 事件
onMounted(() => {
  const roomId = route.params.roomId as string;
  store.joinRoom(roomId);
});

onUnmounted(() => {
  // Store handles the state, so we don't need to do much here
});
</script>
