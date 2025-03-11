#!/bin/bash

# 1) 切换到脚本所在目录（保证脚本能相对路径定位项目）
cd "$(dirname "$0")"

echo "=== 旅行足迹 WebApp：启动中... ==="

# 2) 如需安装依赖可加: 
# npm install

# 3) 启动 Node.js 服务 (前台方式或者后台方式)
node server/app.js &

# 等待2秒让服务先启动
sleep 2

# 4) 自动用默认浏览器打开
open http://localhost:3002

echo "=== 已打开 http://localhost:3001 ==="
echo "=== 服务器正在运行，按回车键退出并关闭窗口... ==="

# 5) 保持Terminal窗口，不至于脚本结束后立即关闭
read -p "按回车结束..."

echo "=== 即将关闭服务并退出... ==="
# 如果上面是后台启动(&)，可以在这里 kill
# pkill -f "node server/app.js"   # 根据具体进程来关闭