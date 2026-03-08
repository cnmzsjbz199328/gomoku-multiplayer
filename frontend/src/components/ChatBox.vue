<template>
  <div class="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100">
    <!-- 聊天头部 -->
    <div class="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
      <h3 class="font-semibold text-gray-700 flex items-center gap-2">
        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
        实时聊天
      </h3>
      <span class="text-xs text-gray-400">{{ store.messages.length }} 条消息</span>
    </div>

    <!-- 消息列表 -->
    <div 
      ref="messageListRef"
      class="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px]"
    >
      <div v-if="store.messages.length === 0" class="text-center text-gray-400 mt-10 text-sm italic">
        暂无消息，打个招呼吧 ~
      </div>
      
      <div 
        v-for="msg in store.messages" 
        :key="msg.id"
        class="flex flex-col"
        :class="msg.senderId === store.playerId ? 'items-end' : 'items-start'"
      >
        <div class="flex items-center gap-2 mb-1">
          <span v-if="msg.senderId !== store.playerId" class="text-xs font-medium text-gray-500">
            {{ msg.senderName }}
          </span>
          <span class="text-[10px] text-gray-300">
            {{ formatTime(msg.timestamp) }}
          </span>
        </div>
        
        <div 
          class="px-3 py-2 rounded-2xl text-sm max-w-[85%] break-words shadow-sm"
          :class="msg.senderId === store.playerId 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'"
        >
          {{ msg.content }}
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
      <form @submit.prevent="handleSendMessage" class="flex gap-2">
        <input 
          v-model="newMessage" 
          type="text" 
          placeholder="输入消息..." 
          class="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          :disabled="!store.connected"
        />
        <button 
          type="submit" 
          class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
          :disabled="!newMessage.trim() || !store.connected"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUpdated, nextTick } from 'vue';
import { useGameStore } from '../stores/gameStore';

const store = useGameStore();
const newMessage = ref('');
const messageListRef = ref<HTMLElement | null>(null);

function handleSendMessage() {
  if (!newMessage.value.trim()) return;
  store.sendMessage(newMessage.value);
  newMessage.value = '';
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// 自动滚动到底部
onUpdated(() => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
/* 隐藏滚动条但保留滚动功能 */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 10px;
}
</style>
