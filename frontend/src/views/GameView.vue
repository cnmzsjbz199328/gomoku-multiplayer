<template>
  <div class="min-h-screen bg-slate-900 flex flex-col md:flex-row p-6 gap-6 text-white">
    <!-- 侧边栏：玩家与信息 -->
    <div class="w-full md:w-80 flex flex-col gap-6">
      <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 class="text-xl font-bold mb-4 flex items-center justify-between">
          {{ gameStore.currentRoom?.name || '对局' }}
          <span class="text-xs bg-slate-700 px-2 py-1 rounded text-slate-400 font-mono">ID: {{ gameStore.currentRoom?.id.slice(0, 6) }}</span>
        </h2>
        
        <div class="space-y-4">
          <div v-for="color in [PlayerColor.BLACK, PlayerColor.WHITE]" :key="color"
               class="flex items-center gap-4 p-4 rounded-xl border-2 transition-all"
               :class="[
                 gameStore.gameState?.currentTurn === color && gameStore.gameState?.status === GameStatus.PLAYING 
                 ? 'border-blue-500 bg-blue-500/10' : 'border-transparent bg-slate-700/50'
               ]">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                 :class="color === PlayerColor.BLACK ? 'bg-black text-white shadow-[0_0_10px_rgba(0,0,0,0.5)]' : 'bg-white text-black'">
              {{ getPlayer(color)?.name?.charAt(0) || '?' }}
            </div>
            <div class="flex-1 overflow-hidden">
              <div class="font-bold truncate">{{ getPlayer(color)?.name || '等待中...' }}</div>
              <div class="text-xs" :class="getPlayer(color)?.isReady ? 'text-green-400' : 'text-slate-500'">
                {{ getPlayer(color) ? (getPlayer(color)?.isReady ? '● 已就绪' : '○ 未准备') : '' }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 flex gap-3">
          <button @click="gameStore.toggleReady" 
                  v-if="gameStore.gameState?.status !== GameStatus.PLAYING"
                  class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all active:scale-95">
            {{ gameStore.currentUser?.isReady ? '取消准备' : '准备游戏' }}
          </button>
          <button @click="router.push('/')" class="px-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all">
            退出
          </button>
        </div>
      </div>

      <!-- 聊天区 -->
      <div class="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex-1 flex flex-col min-h-[300px]">
        <div class="flex-1 overflow-y-auto space-y-2 mb-4 p-2 text-sm text-slate-400">
          <div class="text-center italic opacity-50">系统：欢迎加入游戏，祝你好运！</div>
        </div>
        <div class="flex gap-2">
          <input type="text" placeholder="聊点什么..." class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
          <button class="bg-blue-600 p-2 rounded-lg hover:bg-blue-700 transition-all">发送</button>
        </div>
      </div>
    </div>

    <!-- 主棋盘区 -->
    <div class="flex-1 flex flex-col items-center justify-center bg-slate-800 rounded-3xl border border-slate-700 relative overflow-hidden">
      <!-- 游戏状态指示器 -->
      <div class="absolute top-8 left-1/2 -translate-x-1/2 text-center">
        <div v-if="gameStore.gameState?.status === GameStatus.PLAYING" class="px-6 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-full font-bold animate-pulse">
          {{ gameStore.isMyTurn ? '你的回合' : '对手思考中...' }}
        </div>
        <div v-else-if="gameStore.gameState?.status === GameStatus.ENDED" class="text-2xl font-black text-yellow-400 drop-shadow-lg">
          {{ gameStore.gameState.winner === PlayerColor.NONE ? '平局' : (gameStore.gameState.winner === gameStore.currentUser?.color ? '获得胜利！' : '很遗憾失败了') }}
        </div>
      </div>

      <GameBoard 
        :gameState="gameStore.gameState" 
        :roomInfo="gameStore.currentRoom"
        @move="gameStore.makeMove" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { PlayerColor, GameStatus } from '../../../shared/types/game';
import GameBoard from '../components/GameBoard.vue';

const router = useRouter();
const gameStore = useGameStore();

const getPlayer = (color: PlayerColor) => gameStore.currentRoom?.players.find(p => p.color === color);
</script>
