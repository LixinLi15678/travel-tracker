const express = require('express');
const path = require('path');
const cors = require('cors');

const apiRoutes = require('./routes/api');
const app = express();

app.use(cors());
app.use(express.json());

// 静态文件
app.use(express.static(path.join(__dirname, '..')));

// 挂载 API
app.use('/api', apiRoutes);

// 404
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('服务器内部错误');
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`服务器已启动，http://localhost:${PORT}`);
});
