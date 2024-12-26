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
