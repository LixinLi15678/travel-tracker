/**
 * api.js
 * 定义API路由，如获取/保存用户数据
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * 示例：从文件系统读取 user-data.json 并返回
 */
router.get('/user-data', (req, res) => {
  // 假设你的 user-data.json 放在根目录下的 /data 里
  const dataPath = path.join(__dirname, '../../data/user-data.json');

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error("读取 user-data.json 失败：", err);
      return res.status(500).json({ error: '无法读取用户数据' });
    }

    // 返回解析后的数据
    try {
      const userData = JSON.parse(data);
      res.json(userData);
    } catch (parseErr) {
      console.error("解析 user-data.json 失败：", parseErr);
      res.status(500).json({ error: '数据解析失败' });
    }
  });
});

/**
 * 示例：将新的用户数据写入 user-data.json
 */
router.post('/user-data', (req, res) => {
  const newUserData = req.body;
  console.log("收到用户数据：", newUserData);

  // 写入文件(演示)
  const dataPath = path.join(__dirname, '../../data/user-data.json');
  fs.writeFile(dataPath, JSON.stringify(newUserData, null, 2), 'utf8', (err) => {
    if (err) {
      console.error("写入 user-data.json 失败：", err);
      return res.status(500).json({ error: '无法保存用户数据' });
    }
    // 返回存储结果
    res.json({ success: true, message: "用户数据已保存" });
  });
});

module.exports = router;
