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

/**
 * GET /api/diaries
 * Get all diaries from diaries.json
 */
router.get('/diaries', (req, res) => {
  const dataPath = path.join(__dirname, '../../data/diaries.json');
  
  // Check if file exists
  if (!fs.existsSync(dataPath)) {
    // Create empty diaries.json
    fs.writeFileSync(dataPath, '[]', 'utf8');
    return res.json([]);
  }
  
  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('读取 diaries.json 失败：', err);
      return res.status(500).json({ error: '无法读取日记数据' });
    }
    
    try {
      const diaries = JSON.parse(fileData);
      res.json(diaries);
    } catch (parseErr) {
      console.error('解析 diaries.json 失败：', parseErr);
      res.status(500).json({ error: '数据解析失败' });
    }
  });
});

/**
 * GET /api/diaries/:id
 * Get a specific diary by ID
 */
router.get('/diaries/:id', (req, res) => {
  const diaryId = req.params.id;
  const dataPath = path.join(__dirname, '../../data/diaries.json');
  
  if (!fs.existsSync(dataPath)) {
    return res.json({ 
      success: false, 
      message: '日记不存在' 
    });
  }
  
  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('读取 diaries.json 失败：', err);
      return res.status(500).json({ 
        success: false, 
        message: '无法读取日记数据' 
      });
    }
    
    try {
      const diaries = JSON.parse(fileData);
      const diary = diaries.find(d => d.id === diaryId);
      
      if (!diary) {
        return res.json({ 
          success: false, 
          message: '日记不存在' 
        });
      }
      
      res.json({ 
        success: true, 
        diary: diary 
      });
    } catch (parseErr) {
      console.error('解析 diaries.json 失败：', parseErr);
      res.status(500).json({ 
        success: false, 
        message: '数据解析失败' 
      });
    }
  });
});

/**
 * POST /api/diaries
 * Add or update a diary entry
 */
router.post('/diaries', (req, res) => {
  const diaryData = req.body;
  const dataPath = path.join(__dirname, '../../data/diaries.json');
  
  // Check if required fields are present
  if (!diaryData.username || !diaryData.title || !diaryData.content) {
    return res.status(400).json({ 
      success: false, 
      message: '缺少必要字段' 
    });
  }
  
  // Check if file exists
  let diaries = [];
  if (fs.existsSync(dataPath)) {
    try {
      const fileData = fs.readFileSync(dataPath, 'utf8');
      diaries = JSON.parse(fileData);
    } catch (err) {
      console.error('读取 diaries.json 失败：', err);
    }
  }
  
  // Check if updating existing diary
  const existingIndex = diaries.findIndex(d => d.id === diaryData.id);
  if (existingIndex !== -1) {
    // Update existing diary
    diaries[existingIndex] = diaryData;
  } else {
    // Add new diary
    // Ensure ID is set
    if (!diaryData.id) {
      diaryData.id = Date.now().toString();
    }
    
    // Ensure timestamp is set
    if (!diaryData.timestamp) {
      diaryData.timestamp = Date.now();
    }
    
    diaries.push(diaryData);
  }
  
  // Write back to file
  fs.writeFile(dataPath, JSON.stringify(diaries, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('写入 diaries.json 失败：', err);
      return res.status(500).json({ 
        success: false, 
        message: '保存日记失败' 
      });
    }
    
    res.json({ 
      success: true, 
      message: existingIndex !== -1 ? '日记已更新' : '日记已保存', 
      diary: diaryData 
    });
  });
});

/**
 * DELETE /api/diaries/:id
 * Delete a diary by ID
 */
router.delete('/diaries/:id', (req, res) => {
  const diaryId = req.params.id;
  const dataPath = path.join(__dirname, '../../data/diaries.json');
  
  if (!fs.existsSync(dataPath)) {
    return res.status(404).json({ 
      success: false, 
      message: '日记不存在' 
    });
  }
  
  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('读取 diaries.json 失败：', err);
      return res.status(500).json({ 
        success: false, 
        message: '无法读取日记数据' 
      });
    }
    
    try {
      let diaries = JSON.parse(fileData);
      const initialLength = diaries.length;
      
      // Filter out the diary to delete
      diaries = diaries.filter(d => d.id !== diaryId);
      
      if (diaries.length === initialLength) {
        return res.json({ 
          success: false, 
          message: '日记不存在' 
        });
      }
      
      // Write back to file
      fs.writeFile(dataPath, JSON.stringify(diaries, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('写入 diaries.json 失败：', writeErr);
          return res.status(500).json({ 
            success: false, 
            message: '删除日记失败' 
          });
        }
        
        res.json({ 
          success: true, 
          message: '日记已删除' 
        });
      });
    } catch (parseErr) {
      console.error('解析 diaries.json 失败：', parseErr);
      res.status(500).json({ 
        success: false, 
        message: '数据解析失败' 
      });
    }
  });
});

/**
 * Create an empty diaries.json file if it doesn't exist
 */
(function createDiariesFile() {
  const dataPath = path.join(__dirname, '../../data/diaries.json');
  if (!fs.existsSync(dataPath)) {
    try {
      fs.writeFileSync(dataPath, '[]', 'utf8');
      console.log('Created empty diaries.json file');
    } catch (err) {
      console.error('Error creating diaries.json:', err);
    }
  }
})();

/**
 * GET /api/photos
 * Get all photos from photos.json
 */
router.get('/photos', (req, res) => {
  const dataPath = path.join(__dirname, '../../data/photos.json');
  
  // Check if file exists
  if (!fs.existsSync(dataPath)) {
    // Create empty photos.json
    fs.writeFileSync(dataPath, '[]', 'utf8');
    return res.json([]);
  }
  
  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('读取 photos.json 失败：', err);
      return res.status(500).json({ error: '无法读取照片数据' });
    }
    
    try {
      const photos = JSON.parse(fileData);
      res.json(photos);
    } catch (parseErr) {
      console.error('解析 photos.json 失败：', parseErr);
      res.status(500).json({ error: '数据解析失败' });
    }
  });
});

/**
 * POST /api/photos
 * Add a new photo to photos.json
 */
router.post('/photos', (req, res) => {
  const photoData = req.body;
  const dataPath = path.join(__dirname, '../../data/photos.json');
  
  // Check if required fields are present
  if (!photoData.username || !photoData.title || !photoData.url) {
    return res.status(400).json({ 
      success: false, 
      message: '缺少必要字段' 
    });
  }
  
  // Check if file exists
  let photos = [];
  if (fs.existsSync(dataPath)) {
    try {
      const fileData = fs.readFileSync(dataPath, 'utf8');
      photos = JSON.parse(fileData);
    } catch (err) {
      console.error('读取 photos.json 失败：', err);
    }
  }
  
  // Add ID and timestamp
  photoData.id = Date.now().toString();
  if (!photoData.timestamp) {
    photoData.timestamp = Date.now();
  }
  
  // Add photo to array
  photos.push(photoData);
  
  // Write back to file
  fs.writeFile(dataPath, JSON.stringify(photos, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('写入 photos.json 失败：', err);
      return res.status(500).json({ 
        success: false, 
        message: '保存照片失败' 
      });
    }
    
    res.json({ 
      success: true, 
      message: '照片已保存', 
      photo: photoData 
    });
  });
});

/**
 * GET /api/photos/:id
 * Get a specific photo by ID
 */
router.get('/photos/:id', (req, res) => {
  const photoId = req.params.id;
  const dataPath = path.join(__dirname, '../../data/photos.json');
  
  if (!fs.existsSync(dataPath)) {
    return res.status(404).json({ 
      success: false, 
      message: '照片不存在' 
    });
  }
  
  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('读取 photos.json 失败：', err);
      return res.status(500).json({ 
        success: false, 
        message: '无法读取照片数据' 
      });
    }
    
    try {
      const photos = JSON.parse(fileData);
      const photo = photos.find(p => p.id === photoId);
      
      if (!photo) {
        return res.status(404).json({ 
          success: false, 
          message: '照片不存在' 
        });
      }
      
      res.json({ 
        success: true, 
        photo: photo 
      });
    } catch (parseErr) {
      console.error('解析 photos.json 失败：', parseErr);
      res.status(500).json({ 
        success: false, 
        message: '数据解析失败' 
      });
    }
  });
});

/**
 * DELETE /api/photos/:id
 * Delete a photo by ID
 */
router.delete('/photos/:id', (req, res) => {
  const photoId = req.params.id;
  const dataPath = path.join(__dirname, '../../data/photos.json');
  
  if (!fs.existsSync(dataPath)) {
    return res.status(404).json({ 
      success: false, 
      message: '照片不存在' 
    });
  }
  
  fs.readFile(dataPath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('读取 photos.json 失败：', err);
      return res.status(500).json({ 
        success: false, 
        message: '无法读取照片数据' 
      });
    }
    
    try {
      let photos = JSON.parse(fileData);
      const photoIndex = photos.findIndex(p => p.id === photoId);
      
      if (photoIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: '照片不存在' 
        });
      }
      
      // Remove photo
      photos.splice(photoIndex, 1);
      
      // Write back to file
      fs.writeFile(dataPath, JSON.stringify(photos, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('写入 photos.json 失败：', writeErr);
          return res.status(500).json({ 
            success: false, 
            message: '删除照片失败' 
          });
        }
        
        res.json({ 
          success: true, 
          message: '照片已删除' 
        });
      });
    } catch (parseErr) {
      console.error('解析 photos.json 失败：', parseErr);
      res.status(500).json({ 
        success: false, 
        message: '数据解析失败' 
      });
    }
  });
});

/**
 * Create an empty photos.json file if it doesn't exist
 */
(function createPhotosFile() {
  const dataPath = path.join(__dirname, '../../data/photos.json');
  if (!fs.existsSync(dataPath)) {
    try {
      fs.writeFileSync(dataPath, '[]', 'utf8');
      console.log('Created empty photos.json file');
    } catch (err) {
      console.error('Error creating photos.json:', err);
    }
  }
})();
