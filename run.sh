#!/bin/bash

echo "=== 旅行足迹 WebApp: 启动中 ==="

# 1) 如果没装依赖，可在此加: npm install
# npm install

# 2) 启动 Node.js 服务 (后台模式)
node server/app.js &

# 让服务先起来，等待1-2秒
sleep 2

# 3) 自动在默认浏览器打开 (Mac 下用 'open')
open http://localhost:3001

echo "=== 已在浏览器打开 http://localhost:3001 ==="
echo "=== 若要停止服务，请在终端执行 'kill -9 [PID]' 或 Ctrl+C (如果前台运行) ==="