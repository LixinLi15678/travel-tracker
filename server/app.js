/**
 * app.js
 * 简单的Node.js + Express后端
 */
const express = require('express');
const path = require('path');
const app = express();
const apiRoutes = require('./routes/api');

// 解析JSON请求体
app.use(express.json());

// 静态文件托管
// 让浏览器能访问到 index.html、styles、scripts、data等
app.use(express.static(path.join(__dirname, '..')));

// 挂载API路由
app.use('/api', apiRoutes);

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器已启动，端口号：${PORT}`);
});
