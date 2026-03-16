<template>
  <div class="flex flex-col items-center">
    <!-- 棋盘容器 -->
    <div 
      class="relative bg-[#D2B48C] p-6 shadow-2xl rounded-sm border-4 border-[#8B4513]"
      :style="{ width: boardPx + 'px', height: boardPx + 'px' }"
    >
      <!-- 网格线 -->
      <div class="absolute inset-6 border border-black pointer-events-none">
        <div v-for="i in 14" :key="'h'+i" class="w-full h-px bg-black/60 absolute" :style="{ top: (i * cellSize) + 'px' }"></div>
        <div v-for="i in 14" :key="'v'+i" class="h-full w-px bg-black/60 absolute" :style="{ left: (i * cellSize) + 'px' }"></div>
      </div>

      <!-- 星位 (天元及四角) -->
      <div v-for="point in starPoints" :key="point.x+'-'+point.y"
           class="absolute w-2 h-2 bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2"
           :style="{ left: (point.x * cellSize + 24) + 'px', top: (point.y * cellSize + 24) + 'px' }">
      </div>

      <!-- 落子响应区域与棋子 -->
      <div class="absolute inset-6 grid grid-cols-15 grid-rows-15">
        <div v-for="y in 15" :key="'r'+y" class="contents">
          <div v-for="x in 15" :key="'c'+x"
               class="relative flex items-center justify-center cursor-pointer group"
               @click="handleCellClick(x-1, y-1)">
            
            <!-- 棋子渲染 -->
            <div v-if="getPiece(x-1, y-1) !== PlayerColor.NONE"
                 class="w-[88%] h-[88%] rounded-full shadow-lg flex items-center justify-center text-xs font-bold transition-all"
                 :class="[
                   getPiece(x-1, y-1) === PlayerColor.BLACK ? 'bg-black text-white' : 'bg-white text-black border border-gray-300',
                   isLastMove(x-1, y-1) ? 'ring-2 ring-red-500 ring-offset-1' : ''
                 ]">
              {{ getInitial(x-1, y-1) }}
            </div>

            <!-- 最后落子标识 -->
            <div v-if="isLastMove(x-1, y-1)" class="absolute w-1.5 h-1.5 bg-red-500 rounded-full z-10"></div>
            
            <!-- 悬停辅助 -->
            <div v-if="getPiece(x-1, y-1) === PlayerColor.NONE" 
                 class="hidden group-hover:block w-3 h-3 bg-black/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlayerColor, GameState, RoomInfo } from '@gomoku/shared';

const props = defineProps<{
  gameState: GameState | null;
  roomInfo: RoomInfo | null;
}>();

const emit = defineEmits(['move']);

const boardPx = 600;
const cellSize = (boardPx - 48) / 14;
const starPoints = [{x:3,y:3}, {x:11,y:3}, {x:7,y:7}, {x:3,y:11}, {x:11,y:11}];

const getPiece = (x: number, y: number) => props.gameState?.board[y]?.[x] || PlayerColor.NONE;

const getInitial = (x: number, y: number) => {
  const color = getPiece(x, y);
  const player = props.roomInfo?.players.find(p => p.color === color);
  return player?.name?.charAt(0).toUpperCase() || '';
};

const isLastMove = (x: number, y: number) => {
  const moves = props.gameState?.moves || [];
  if (moves.length === 0) return false;
  const last = moves[moves.length - 1];
  return last.x === x && last.y === y;
};

const handleCellClick = (x: number, y: number) => {
  if (getPiece(x, y) === PlayerColor.NONE) emit('move', x, y);
};
</script>
