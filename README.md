
README (in Python code block, using comment-style)

# 1. 项目简介
本项目是一个“旅行足迹”Web应用，使用 Node.js + Express 提供后端，
前端结合 Leaflet 实现地图交互、城市搜索(Nominatim)等功能。
功能特点：
 - 登录/注册（仅用户名）
 - 旅行计划：在地图上标记“计划”，可添加/删除
 - 已访问：从 user-data.json 中读取并可筛选年份
 - 绘制访问连线、查看访问列表、拖拽排序等可选高级功能

# 2. 目录结构
travel-tracker/
 ├─ data/
 │   ├─ user-data.json
 │   └─ locations.json
 ├─ scripts/
 │   ├─ data.js
 │   ├─ main.js
 │   ├─ map.js
 │   ├─ geo.js
 │   └─ countries.js
 ├─ server/
 │   ├─ routes/
 │   │  └─ api.js
 │   └─ app.js
 ├─ styles/
 │   ├─ main.css
 │   └─ map.css
 ├─ index.html
 ├─ package.json
 ├─ run.sh
 └─ 旅行足迹.app

# 3. 环境准备
 - Node.js >= 14
 - npm (或 yarn)
 - 若需用到脚本或 App 的“一键运行”，在 Mac 上可创建 Automator App
   或使用 run.sh + Terminal。

# 4. 安装 & 运行 (简单方式)
 - 在项目根目录执行:
    npm install
    node server/app.js
 - 打开浏览器访问 http://localhost:3000

# 5. Mac上一键运行 - 两种方式

  (A) 使用 run.sh 脚本
   1) 在项目根目录有 run.sh
   2) 让其可执行: chmod +x run.sh
   3) 双击 run.sh （若 Finder 上双击不行，可右键 -> Open，或在 Terminal 执行 ./run.sh）
      它会自动启动 Node 服务并 open http://localhost:3000

  (B) 用 Mac Automator 制作一个 “旅行足迹.app”
   1) 打开 Automator，选 “应用程序(Application)”
   2) 在左边搜索 “运行 Shell 脚本(Run Shell Script)” 拖到右侧
   3) 在命令框里写下大致逻辑：
       cd /该项目的路径
       npm install  # 如果需要
       node server/app.js &  # 后台启动
       sleep 2
       open http://localhost:3000
   4) 存成 “旅行足迹.app”（比如放到项目下的 MacApp/ 目录）
   5) 现在只要双击 “旅行足迹.app”，它会自动运行脚本、启动服务器并用浏览器打开

# 6. 其他说明
 - 若要停止后台服务，可以到 Terminal 找到 node server/app.js 的进程，Ctrl+C 或 kill 进程
 - user-data.json / locations.json 里是可自由编辑的数据源
 - 如需更多功能或个性化改动，可查看 main.js, map.js, api.js 等核心文件
