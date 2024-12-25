/**
 * data.js
 * 数据管理脚本：LocalStorage读写 & 后端API交互示例
 */

/**
 * 保存数据到LocalStorage
 */
function saveDataToLocal(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("保存到LocalStorage失败：", error);
    }
  }
  
  /**
   * 从LocalStorage读取数据
   */
  function loadDataFromLocal(key) {
    try {
      const rawData = localStorage.getItem(key);
      return rawData ? JSON.parse(rawData) : null;
    } catch (error) {
      console.error("从LocalStorage读取数据失败：", error);
      return null;
    }
  }
  
  /**
   * 调用后端API: 保存用户数据 (示例)
   */
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
  
  /**
   * 调用后端API: 获取用户数据 (示例)
   */
  async function fetchUserDataFromServer() {
    try {
      const response = await fetch('/api/user-data');
      return response.json();
    } catch (err) {
      console.error("获取用户数据失败：", err);
      return null;
    }
  }
  