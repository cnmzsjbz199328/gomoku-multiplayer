<template>
  <div class="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
      <h1 class="text-4xl font-black text-center text-slate-800 mb-8 tracking-tight">多人五子棋</h1>
      
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">你的昵称</label>
          <input v-model="playerName" type="text" placeholder="输入玩家名..." 
                 class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>

        <div class="pt-6 border-t border-slate-100">
          <div class="flex gap-2">
            <input v-model="roomName" type="text" placeholder="新房间名" 
                   class="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
            <button @click="createRoom" :disabled="!isReady"
                    class="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all">
              创建房间
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">活跃房间</p>
          <div v-if="gameStore.rooms.length === 0" class="text-center py-8 text-slate-400 border border-dashed rounded-xl">
            暂无活跃房间
          </div>
          <div v-for="room in gameStore.rooms" :key="room.id"
               class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 transition-all cursor-pointer group">
            <div>
              <span class="font-bold text-slate-700">{{ room.name }}</span>
              <span class="ml-2 text-xs text-slate-400">{{ room.players.length }}/2</span>
            </div>
            <button @click="joinExisting(room.id)" :disabled="!playerName"
                    class="px-4 py-1 text-sm bg-green-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all">
              加入
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const router = useRouter();
const gameStore = useGameStore();

const playerName = ref('');
const roomName = ref('');
const isReady = computed(() => playerName.value.trim() && roomName.value.trim());

onMounted(() => gameStore.initSocket());

const createRoom = () => {
  gameStore.joinRoom(playerName.value, roomName.value);
  router.push('/game');
};

const joinExisting = (roomId: string) => {
  gameStore.joinRoom(playerName.value, undefined, roomId);
  router.push('/game');
};
</script>
