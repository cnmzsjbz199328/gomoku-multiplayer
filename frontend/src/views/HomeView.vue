<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <div class="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
      <h1 class="text-4xl font-bold text-center text-indigo-600 mb-2">
        ♟️ 五子棋对战
      </h1>
      <p class="text-center text-gray-500 mb-8">Gomoku Multiplayer</p>

      <!-- 输入名字 -->
      <div v-if="!store.playerName" class="space-y-4">
        <label class="block">
          <span class="text-gray-700 font-medium">你的名字</span>
          <input
            v-model="inputName"
            type="text"
            placeholder="输入名字开始游戏"
            class="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            @keyup.enter="startGame"
          />
        </label>
        <button
          @click="startGame"
          class="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          开始游戏
        </button>
      </div>

      <!-- 游戏大厅 -->
      <div v-else class="space-y-6">
        <div class="flex items-center justify-between">
          <span class="text-gray-700">欢迎，<strong class="text-indigo-600">{{ store.playerName }}</strong></span>
          <button
            @click="logout"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            退出
          </button>
        </div>

        <!-- 创建房间 -->
        <div class="border-t pt-6">
          <h2 class="text-xl font-semibold mb-4">创建新房间</h2>
          <div class="flex gap-2">
            <input
              v-model="roomName"
              type="text"
              placeholder="房间名称（可选）"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              @click="createRoom"
              class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              创建
            </button>
          </div>
        </div>

        <!-- 加入房间 -->
        <div class="border-t pt-6">
          <h2 class="text-xl font-semibold mb-4">加入房间</h2>
          <div class="flex gap-2">
            <input
              v-model="joinRoomId"
              type="text"
              placeholder="输入房间 ID"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              @click="joinExistingRoom"
              class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              加入
            </button>
          </div>
        </div>

        <!-- 连接状态 -->
        <div v-if="store.connected" class="text-center text-green-600 text-sm">
          ✓ 已连接到服务器
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { socketManager } from '../utils/socket';

const router = useRouter();
const store = useGameStore();

const inputName = ref('');
const roomName = ref('');
const joinRoomId = ref('');

function startGame() {
  if (!inputName.value.trim()) return;
  store.connect(inputName.value.trim());
}

function createRoom() {
  const roomId = `room-${Date.now()}`;
  store.joinRoom(roomId);
  router.push(`/room/${roomId}`);
}

function joinExistingRoom() {
  if (!joinRoomId.value.trim()) return;
  store.joinRoom(joinRoomId.value.trim());
  router.push(`/room/${joinRoomId.value}`);
}

function logout() {
  store.playerName = '';
  socketManager.disconnect();
  location.reload();
}

// 监听 Socket 事件
socketManager.on('connect', () => {
  store.connected = true;
});

socketManager.on('disconnect', () => {
  store.connected = false;
});
</script>
