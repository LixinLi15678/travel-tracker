function saveDataToLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("保存到LocalStorage失败：", error);
  }
}

function loadDataFromLocal(key) {
  try {
    const rawData = localStorage.getItem(key);
    return rawData ? JSON.parse(rawData) : null;
  } catch (error) {
    console.error("从LocalStorage读取数据失败：", error);
    return null;
  }
}

// 其他可选API函数
async function saveUserDataToServer(userData) {
  try {
    const response = await fetch('/api/user-data', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(userData),
    });
    return response.json();
  } catch (err) {
    console.error("提交用户数据到服务器失败：", err);
    return null;
  }
}

async function fetchUserDataFromServer() {
  try {
    const response = await fetch('/api/user-data');
    return response.json();
  } catch (err) {
    console.error("获取用户数据失败：", err);
    return null;
  }
}

// 标记已访问
router.post('/user-data/markVisited', (req, res) => {
  const { username, country, city, year } = req.body;
  if (!username || !country || !city) {
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
      data = JSON.parse(fileData);
    } catch(e) {
      console.error('解析 user-data.json 失败：', e);
      return res.status(500).json({ error: '数据解析失败' });
    }

    // 保证结构
    if (!data.users) data.users = {};
    if (!data.users[username]) {
      data.users[username] = { visitedCities: [], travelPlans: [] };
    }

    const userObj = data.users[username];
    if (!Array.isArray(userObj.visitedCities)) {
      userObj.visitedCities = [];
    }
    if (!Array.isArray(userObj.travelPlans)) {
      userObj.travelPlans = [];
    }

    // 1) push 到 visitedCities
    userObj.visitedCities.push({
      year: parseInt(year, 10),
      country,
      city
    });

    // 2) 在 travelPlans 中删除对应
    userObj.travelPlans = userObj.travelPlans.filter(tp => {
      return !(tp.country === country && tp.city === city && String(tp.year) === String(year));
    });

    // 写回
    fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8', (err2) => {
      if (err2) {
        console.error("写 user-data.json 失败：", err2);
        return res.status(500).json({ error: '无法保存用户数据' });
      }
      console.log(`markVisited => 成功标记: ${username} 的 ${country}-${city}-${year}`);
      res.json({ success: true, data: data.users[username] });
    });
  });
});