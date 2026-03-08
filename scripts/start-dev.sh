#!/bin/bash

# Gomoku Multiplayer - 启动开发环境脚本

# 确保在根目录下运行
ROOT_DIR=$(pwd)

echo "🚀 Starting Gomoku Multiplayer development environment..."

# 启动后端 (5000 端口)
echo "📡 Starting backend on port 5000..."
cd $ROOT_DIR/backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi
npm run dev &
BACKEND_PID=$!

# 启动前端 (3000 端口)
echo "🌐 Starting frontend on port 3000..."
cd $ROOT_DIR/frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!

echo "✨ All systems go!"
echo "- Frontend: http://localhost:3000"
echo "- Backend:  http://localhost:5000"
echo "Press Ctrl+C to stop both services."

# 捕获终止信号以同时关闭子进程
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT
wait
