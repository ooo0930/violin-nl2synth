#!/bin/bash
set -e

# 啟動 Node.js backend
cd violin-nl2synth-backend
npm install
echo "[Backend] 啟動..."
npm run dev &
BACKEND_PID=$!
cd ..

# 啟動 React frontend
cd violin-nl2synth-frontend
npm install
echo "[Frontend] 啟動..."
npm run dev &
FRONTEND_PID=$!
cd ..

# 提示用戶
sleep 2
echo "\n所有服務已啟動！"
echo "- 後端: http://localhost:3000"
echo "- 前端: http://localhost:5173 (或 Vite 預設 port)"
echo "- 若需停止服務，請執行: kill $BACKEND_PID $FRONTEND_PID"
