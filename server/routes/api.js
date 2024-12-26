const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * 获取 user-data.json
 */
router.get('/user-data', (req, res) => {
  const dataPath = path.join(__dirname, '../../data/user-data.json');
  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('读取 user-data.json 失败：', err);
      return res.status(500).json({ error: '无法读取用户数据' });
    }
    try {
      const json = JSON.parse(fileData);
      res.json(json);
    } catch (parseErr) {
      console.error('解析 user-data.json 失败：', parseErr);
      res.status(500).json({ error: '数据解析失败' });
    }
  });
});

/**
 * 保存 user-data.json
 * 这里假设提交的数据是: { "users": { "Alice": { ... }, "Bob": {...} } }
 */
router.post('/user-data', (req, res) => {
  const newData = req.body; // 可能是 { users: {...} } 结构
  const dataPath = path.join(__dirname, '../../data/user-data.json');

  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    let currentData = { users: {} };
    if (!err && fileData) {
      try {
        currentData = JSON.parse(fileData);
      } catch (e) {
        console.error("解析现有 user-data.json 失败：", e);
      }
    }
    // 合并
    if (newData.users) {
      currentData.users = newData.users;
    }

    fs.writeFile(dataPath, JSON.stringify(currentData, null, 2), 'utf8', (err2) => {
      if (err2) {
        console.error('写入 user-data.json 失败：', err2);
        return res.status(500).json({ error: '无法保存用户数据' });
      }
      res.json({ success: true, message: 'user-data 已保存', data: currentData });
    });
  });
});

/**
 * 获取 locations.json
 */
router.get('/locations', (req, res) => {
  const dataPath = path.join(__dirname, '../../data/locations.json');
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('读取 locations.json 失败：', err);
      return res.status(500).json({ error: '无法读取地点数据' });
    }
    try {
      const locations = JSON.parse(data);
      res.json(locations);
    } catch (parseErr) {
      console.error('解析 locations.json 失败：', parseErr);
      res.status(500).json({ error: '数据解析失败' });
    }
  });
});

/**
 * 添加地点到 locations.json
 */
router.post('/locations', (req, res) => {
  const newLoc = req.body; // { country, city, latitude, longitude, ... }
  const dataPath = path.join(__dirname, '../../data/locations.json');

  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    let locations = [];
    if (!err && fileData) {
      try {
        locations = JSON.parse(fileData);
      } catch (e) {
        console.error("解析现有 locations.json 失败：", e);
      }
    }
    locations.push(newLoc);

    fs.writeFile(dataPath, JSON.stringify(locations, null, 2), 'utf8', (err2) => {
      if (err2) {
        console.error('写入 locations.json 失败：', err2);
        return res.status(500).json({ error: '无法保存地点数据' });
      }
      res.json({ success: true, message: '地点已保存', data: newLoc });
    });
  });
});

module.exports = router;
