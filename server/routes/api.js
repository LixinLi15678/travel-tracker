/**
 * api.js
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * GET /api/user-data
 * 读取 user-data.json
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
 * POST /api/user-data
 * 这里合并 newData.users 到 existingData.users
 */
router.post('/user-data', (req, res) => {
  const newData = req.body;  // 期待结构 { "users": { "Leo": {...} } }
  const dataPath = path.join(__dirname, '../../data/user-data.json');

  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    let existingData = { users: {} };
    if (!err && fileData) {
      try {
        existingData = JSON.parse(fileData); // 现有 user-data.json
      } catch (parseErr) {
        console.error("解析 user-data.json 失败：", parseErr);
      }
    }
    if (!existingData.users) existingData.users = {};

    // 合并
    if (newData && newData.users) {
      for (const username in newData.users) {
        if (!existingData.users[username]) {
          existingData.users[username] = newData.users[username];
        } else {
          // 合并 visitedCountries, travelPlans
          mergeUserData(existingData.users[username], newData.users[username]);
        }
      }
    } else {
      console.warn("newData.users 不存在，可能什么也不会更新");
    }

    fs.writeFile(dataPath, JSON.stringify(existingData, null, 2), 'utf8', (err2) => {
      if (err2) {
        console.error('写入 user-data.json 失败：', err2);
        return res.status(500).json({ error: '无法保存用户数据' });
      }
      res.json({ success: true, message: '已合并保存 user-data', data: existingData });
    });
  });
});

/** 合并逻辑，可自定义 */
function mergeUserData(oldUserData, newUserData) {
  if (!oldUserData.visitedCountries) oldUserData.visitedCountries = [];
  if (!oldUserData.travelPlans) oldUserData.travelPlans = [];

  if (newUserData.visitedCountries) {
    // 这里可以做更细的去重等
    oldUserData.visitedCountries = newUserData.visitedCountries;
  }
  if (newUserData.travelPlans) {
    oldUserData.travelPlans = newUserData.travelPlans;
  }
}
/**
 * 获取 locations.json
 */
router.get('/locations', (req, res) => {
  const dataPath = path.join(__dirname, '../../data/locations.json');
  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('读取 locations.json 失败：', err);
      return res.status(500).json({ error: '无法读取地点数据' });
    }
    try {
      const locations = JSON.parse(fileData);
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
  const newLoc = req.body; // { username, latitude, longitude, city, country, type }
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

/**
 * 删除地点: POST /locations/remove
 * 前端会提交 { latitude, longitude, city, country } 等信息
 */
router.post('/locations/remove', (req, res) => {
  const { latitude, longitude, city, country } = req.body;
  const dataPath = path.join(__dirname, '../../data/locations.json');

  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('读取 locations.json 失败：', err);
      return res.status(500).json({ error: '无法读取地点数据' });
    }

    let locations = [];
    try {
      locations = JSON.parse(fileData);
    } catch (e) {
      console.error("解析 locations.json 失败：", e);
    }

    // 过滤出所有与提交 lat, lng 不匹配的
    // 或者你想多一重city/country判断，也可以
    const filtered = locations.filter(loc => {
      // 用 parseFloat 避免类型问题
      const latMatches = parseFloat(loc.latitude) === parseFloat(latitude);
      const lngMatches = parseFloat(loc.longitude) === parseFloat(longitude);
      return !(latMatches && lngMatches);
    });

    fs.writeFile(dataPath, JSON.stringify(filtered, null, 2), 'utf8', (err2) => {
      if (err2) {
        console.error('写入 locations.json 失败：', err2);
        return res.status(500).json({ error: '无法保存地点数据' });
      }
      res.json({ success: true, message: '地点已删除' });
    });
  });
});

/**
 * 更新某个地点（主要是修改 type = 'visited' 或 'plan'）
 */
router.patch('/locations', (req, res) => {
  const { latitude, longitude, newType } = req.body; // newType = 'visited' / 'plan'
  const dataPath = path.join(__dirname, '../../data/locations.json');

  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('读取 locations.json 失败：', err);
      return res.status(500).json({ error: '无法读取地点数据' });
    }

    let locations = [];
    try {
      locations = JSON.parse(fileData);
    } catch (e) {
      console.error("解析 locations.json 失败：", e);
    }

    let updated = false;
    // 根据 lat/lng 找到要改的点
    locations.forEach(loc => {
      if (
        parseFloat(loc.latitude) === parseFloat(latitude) &&
        parseFloat(loc.longitude) === parseFloat(longitude)
      ) {
        loc.type = newType;
        updated = true;
      }
    });

    if (!updated) {
      return res.json({ success: false, message: '未找到对应坐标' });
    }

    fs.writeFile(dataPath, JSON.stringify(locations, null, 2), 'utf8', (err2) => {
      if (err2) {
        console.error('写入 locations.json 失败：', err2);
        return res.status(500).json({ error: '无法更新地点数据' });
      }
      res.json({ success: true, message: `地点已更新为 ${newType}` });
    });
  });
});


module.exports = router;