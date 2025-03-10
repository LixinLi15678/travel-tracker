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
 * 前端会传入一个形如 { "users": { "Leo": { visitedCities: [...], travelPlans: [...] } } } 的数据
 * 后端需要合并到 user-data.json 中
 */
router.post('/user-data', (req, res) => {
  const newData = req.body;  // { "users": { "某个用户名": {...} } }
  const dataPath = path.join(__dirname, '../../data/user-data.json');
  console.log("dataPath =>", dataPath);

  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    // 先把本地已有的 user-data.json 读出来
    let existingData = { users: {} };
    if (!err && fileData) {
      try {
        existingData = JSON.parse(fileData);
      } catch (parseErr) {
        console.error("解析 user-data.json 失败：", parseErr);
      }
    }
    if (!existingData.users) existingData.users = {};

    // 和 newData 合并
    if (newData && newData.users) {
      // 遍历 newData.users 里的每个用户
      for (const uname in newData.users) {
        // 直接用“整对象覆盖”的方式：前端拿到最新对象后，会带着 visitedCities、travelPlans 等全量信息过来
        existingData.users[uname] = newData.users[uname];
      }
    } else {
      console.warn("newData.users 不存在，可能传了空数据？");
    }

    // 写回
    fs.writeFile(dataPath, JSON.stringify(existingData, null, 2), 'utf8', (err2) => {
      if (err2) {
        console.error('写入 user-data.json 失败：', err2);
        return res.status(500).json({ error: '无法保存用户数据' });
      }
      res.json({ success: true, message: 'user-data已合并保存', data: existingData });
    });

    // 打印下你POST的内容
    console.log("==== newData ====");
    console.log(JSON.stringify(newData, null, 2));
  });
});

/**
 * GET /api/locations
 */
router.get('/locations', (req, res) => {
  const dataPath = path.join(__dirname, '../../data/locations.json');
  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('读取 locations.json 失败：', err);
      return res.status(500).json({ error: '无法读取地点数据' });
    }
    try {
      const locs = JSON.parse(fileData);
      res.json(locs);
    } catch (parseErr) {
      console.error('解析 locations.json 失败：', parseErr);
      res.status(500).json({ error: '数据解析失败' });
    }
  });
});

/**
 * POST /api/locations
 * 添加一个地点 => locations.json
 */
router.post('/locations', (req, res) => {
  const newLoc = req.body;
  const dataPath = path.join(__dirname, '../../data/locations.json');

  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    let locations = [];
    if (!err && fileData) {
      try {
        locations = JSON.parse(fileData);
      } catch (e) {
        console.error("解析 locations.json 失败：", e);
      }
    }
    locations.push(newLoc);

    fs.writeFile(dataPath, JSON.stringify(locations, null, 2), 'utf8', (err2) => {
      if (err2) {
        console.error("写入 locations.json 失败：", err2);
        return res.status(500).json({ error: '无法保存地点数据' });
      }
      res.json({ success: true, message: "地点已保存", data: newLoc });
    });
  });
});

/**
 * POST /api/locations/remove
 * 根据 lat/lng 删除
 */
router.post('/locations/remove', (req, res) => {
  const { latitude, longitude } = req.body;
  const dataPath = path.join(__dirname, '../../data/locations.json');

  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error("读取 locations.json 失败:", err);
      return res.status(500).json({ error: '无法读取地点数据' });
    }
    let locs = [];
    try {
      locs = JSON.parse(fileData);
    } catch (e) {
      console.error("解析 locations.json 失败:", e);
    }

    const filtered = locs.filter(loc => 
      !(parseFloat(loc.latitude) === parseFloat(latitude) &&
        parseFloat(loc.longitude) === parseFloat(longitude))
    );
    fs.writeFile(dataPath, JSON.stringify(filtered, null, 2), 'utf8', (err2) => {
      if (err2) {
        console.error("写入 locations.json 失败:", err2);
        return res.status(500).json({ error: '无法保存地点数据' });
      }
      res.json({ success: true, message: "地点已删除" });
    });
  });
});

/**
 * PATCH /api/locations
 * 修改 type
 */
router.patch('/locations', (req, res) => {
  const { latitude, longitude, newType } = req.body;
  const dataPath = path.join(__dirname, '../../data/locations.json');

  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error("读取 locations.json 失败:", err);
      return res.status(500).json({ error: '无法读取地点数据' });
    }
    let locs = [];
    try {
      locs = JSON.parse(fileData);
    } catch (e) {
      console.error("解析 locations.json 失败:", e);
    }

    let updated = false;
    locs.forEach(loc => {
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

    fs.writeFile(dataPath, JSON.stringify(locs, null, 2), 'utf8', (err2) => {
      if (err2) {
        console.error("写入 locations.json 失败:", err2);
        return res.status(500).json({ error: '无法更新地点数据' });
      }
      res.json({ success: true, message: `地点已更新为 ${newType}` });
    });
  });
});

module.exports = router;

/**
 * POST /api/user-data/markVisited
 * 根据 username/country/city/year，往 visitedCities push，
 * 并从 travelPlans 删除对应条目
 */
router.post('/user-data/markVisited', (req, res) => {
  const { username, country, city, year } = req.body;
  if (!username || !country || !city || !year) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const dataPath = path.join(__dirname, '../../data/user-data.json');
  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error("读取 user-data.json 失败：", err);
      return res.status(500).json({ error: '无法读取用户数据' });
    }
    let data;
    try {
      data = JSON.parse(fileData);  // { users: { "Leo": {...} } }
    } catch(e) {
      console.error('解析 user-data.json 失败：', e);
      return res.status(500).json({ error: '数据解析失败' });
    }

    // 确保结构
    if (!data.users) data.users = {};
    if (!data.users[username]) {
      data.users[username] = { visitedCities: [], travelPlans: [] };
    }

    let userObj = data.users[username];
    if (!Array.isArray(userObj.visitedCities)) {
      userObj.visitedCities = [];
    }
    if (!Array.isArray(userObj.travelPlans)) {
      userObj.travelPlans = [];
    }

    // 1) push到 visitedCities
    userObj.visitedCities.push({
      year: parseInt(year, 10),
      country,
      city
    });

    // 2) 从 travelPlans 里删掉对应那条
    userObj.travelPlans = userObj.travelPlans.filter(tp => {
      return !(
        tp.country === country &&
        tp.city === city &&
        String(tp.year) === String(year)
      );
    });

    // 写回
    fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8', (err2) => {
      if (err2) {
        console.error("写 user-data.json 失败：", err2);
        return res.status(500).json({ error: '无法保存用户数据' });
      }
      console.log(`markVisited => 成功标记: ${username} 的 ${country}-${city}-${year}`);
      // 返回该用户最新数据
      res.json({
        success: true,
        message: '标记已访问成功',
        data: data.users[username]
      });
    });
  });
});
