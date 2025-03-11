/**
 * main.js
 * Main application logic for Travel Tracker
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log("旅行足迹 WebApp 已加载");

  if (!sessionStorage.getItem('demoLoginDeclined')) {
    updateLoginState();
  }

  // ====== 侧边栏 ======
  const sidebar = document.getElementById('sidebar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.add('show');
    });
  }
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', () => {
      sidebar.classList.remove('show');
    });
  }
  window.addEventListener('click', (event) => {
    if (
      event.target !== sidebar &&
      !sidebar.contains(event.target) &&
      mobileMenuBtn &&
      !mobileMenuBtn.contains(event.target)
    ) {
      sidebar.classList.remove('show');
    }
  });

  // ====== 登录/注册弹窗 ======
  const authModal = document.getElementById('authModal');
  const loginOpenBtn = document.getElementById('loginOpenBtn');
  const loginOpenBtnHeader = document.getElementById('loginOpenBtnHeader');
  const authCloseBtn = document.getElementById('authCloseBtn');
  if (loginOpenBtn) {
    loginOpenBtn.addEventListener('click', handleAuthButtonClick);
  }
  if (loginOpenBtnHeader) {
    loginOpenBtnHeader.addEventListener('click', handleAuthButtonClick);
  }
  if (authCloseBtn) {
    authCloseBtn.addEventListener('click', closeAuthModal);
  }
  window.addEventListener('click', (event) => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });

  // ====== Tab切换 ======
  const tablinks = document.querySelectorAll('.tablink');
  const tabContents = document.querySelectorAll('.tab-content');
  tablinks.forEach(tab => {
    tab.addEventListener('click', () => {
      tablinks.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetSelector = tab.getAttribute('data-target');
      const targetContent = document.querySelector(targetSelector);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // ====== 登录/注册表单 ======
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = e.target.loginUsername.value.trim();
      if (!username) return;
      // 本地存 + 更新UI + 关弹窗
      saveDataToLocal('loggedInUser', { username });
      updateUserInfo({ nickname: username });
      closeAuthModal();
      loadAllUserData();
      showNotification("登录成功", "success");
    });
  }
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = e.target.registerUsername.value.trim();
      if (!username) return;
      // 1) 本地
      saveDataToLocal('loggedInUser', { username });
      updateUserInfo({ nickname: username });
      closeAuthModal();
      // 2) 后端 => user-data
      try {
        let res = await fetch('/api/user-data');
        let data = await res.json();
        if (!data.users) data.users = {};
        if (!data.users[username]) {
          data.users[username] = {
            visitedCities: [],
            travelPlans: []
          };
        }
        await fetch('/api/user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        console.log("注册: 已在后端创建用户", username);
        showNotification("注册成功", "success");
        loadAllUserData();
      } catch (err) {
        console.error("注册时写后端失败:", err);
        showNotification("注册部分成功，但数据保存失败", "warning");
      }
    });
  }

  // ====== 登录状态回显 ======
  updateLoginState();

  // "开始记录"按钮
  const startBtn = document.getElementById('startTrackingBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const savedUser = loadDataFromLocal('loggedInUser');
      if (!savedUser || !savedUser.username) {
        showNotification("请先登录，再开始记录旅行", "warning");
        showDemoLoginOption();
        return;
      }
      document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ====== 已访问列表 & 地图筛选 ======
  renderVisitedList(); // 初始时显示
  const filterYearBtn = document.getElementById('filterYearBtn');
  const showAllBtn = document.getElementById('showAllBtn');
  if (filterYearBtn) {
    filterYearBtn.addEventListener('click', () => {
      const yearValue = parseInt(document.getElementById('filterYear').value, 10) || 0;
      renderVisitedList(yearValue);
      loadLocationsAndMark(yearValue); // 地图也筛选
    });
  }
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      document.getElementById('filterYear').value = '';
      renderVisitedList(0);
      loadLocationsAndMark(0);
    });
  }

  // 连线按钮
  const drawLinesBtn = document.getElementById('drawLinesBtn');
  if (drawLinesBtn) {
    drawLinesBtn.addEventListener('click', () => {
      clearAllVisitedLines();
      drawVisitedLineHandler();
    });
  }
  const clearLinesBtn = document.getElementById('clearLinesBtn');
  if (clearLinesBtn) {
    clearLinesBtn.addEventListener('click', () => {
      clearAllVisitedLines();
    });
  }

  // 旅行计划 => submit
  const travelPlanForm = document.getElementById('travelPlanForm');
  if (travelPlanForm) {
    travelPlanForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const savedUser = loadDataFromLocal('loggedInUser');
      if (!savedUser || !savedUser.username) {
        showNotification("请先登录，再添加旅行计划", "warning");
        showDemoLoginOption();
        return;
      }
      
      const plannedCountry = e.target.plannedCountry.value.trim();
      const plannedCity = e.target.plannedCity.value.trim();
      const plannedYear = e.target.plannedYear.value.trim();
      const lat = document.getElementById('plannedLat').value.trim();
      const lng = document.getElementById('plannedLng').value.trim();

      if (!plannedCountry || !plannedCity || !plannedYear) {
        showNotification("请填写完整的旅行计划信息", "warning");
        return;
      }

      try {
        // 本地
        addTravelPlanLocal(plannedCountry, plannedCity, plannedYear, lat, lng);
        // 后端 => travelPlans
        await addPlanToUserData(plannedCountry, plannedCity, plannedYear);

        // locations.json => type='plan'
        if (lat && lng) {
          await addLocationToServer(plannedCountry, plannedCity, lat, lng, 'plan', plannedYear);
        }
        e.target.reset();
        document.getElementById('plannedLat').value = '';
        document.getElementById('plannedLng').value = '';

        renderTravelPlanList();
        showNotification("旅行计划已添加", "success");
      } catch (err) {
        console.error("添加旅行计划失败:", err);
        showNotification("添加旅行计划失败，请稍后再试", "error");
      }
    });
  }

  renderTravelPlanList();
  
  // 查看访问列表(拖拽)
  const viewVisitListBtn = document.getElementById('viewVisitListBtn');
  const visitListModal = document.getElementById('visitListModal');
  const visitListCloseBtn = document.getElementById('visitListCloseBtn');

  if (viewVisitListBtn && visitListModal) {
    viewVisitListBtn.addEventListener('click', () => {
      const savedUser = loadDataFromLocal('loggedInUser');
      if (!savedUser || !savedUser.username) {
        showNotification("请先登录，再查看访问列表", "warning");
        showDemoLoginOption();
        return;
      }
      visitListModal.style.display = 'block';
      showVisitListModal();
    });
  }
  if (visitListCloseBtn) {
    visitListCloseBtn.addEventListener('click', () => {
      visitListModal.style.display='none';
    });
  }
  window.addEventListener('click', (e)=>{
    if (e.target === visitListModal) {
      visitListModal.style.display='none';
    }
  });
  
  // 创建通知容器
  createNotificationContainer();
});

/**
 * Creates a container for notifications if it doesn't exist
 */
function createNotificationContainer() {
  if (!document.getElementById('notification-container')) {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * handleAuthButtonClick()
 * 已登录 => 登出; 未登录 => 打开弹窗
 */
function handleAuthButtonClick() {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (savedUser && savedUser.username) {
    localStorage.removeItem('loggedInUser');
    updateUserInfo(null);
    showNotification("已登出", "info");
    // Reset all lists
    document.getElementById('visitedStats').textContent = "暂无记录";
    document.getElementById('visitedList').innerHTML = "";
    document.getElementById('travelPlanList').innerHTML = "";
    clearAllVisitedLines();
    loadLocationsAndMark(0);
    
    // Show demo login option again
    setTimeout(() => {
      showDemoLoginOption();
    }, 500);
  } else {
    openAuthModal();
  }
}

/**
 * Open login/register modal
 */
function openAuthModal() {
  const authModal = document.getElementById('authModal');
  if (authModal) authModal.style.display = 'block';
}

/**
 * Close login/register modal
 */
function closeAuthModal() {
  const authModal = document.getElementById('authModal');
  if (authModal) authModal.style.display = 'none';
}

/**
 * 更新登录按钮 & 侧边栏昵称
 */
function updateUserInfo(userObj) {
  const usernameEl = document.getElementById('username');
  const loginBtnHeader = document.getElementById('loginOpenBtnHeader');
  const loginBtnSidebar = document.getElementById('loginOpenBtn');
  if (userObj && userObj.nickname) {
    const uname = userObj.nickname;
    if (usernameEl) usernameEl.textContent = uname;
    if (loginBtnHeader) loginBtnHeader.textContent = uname + " (登出)";
    if (loginBtnSidebar) loginBtnSidebar.textContent = uname + " (登出)";
  } else {
    if (usernameEl) usernameEl.textContent = "未登录";
    if (loginBtnHeader) loginBtnHeader.textContent = "登录 / 注册";
    if (loginBtnSidebar) loginBtnSidebar.textContent = "登录 / 注册";
  }
}

/**
 * Update login state and show demo option
 */
function updateLoginState() {
  const savedUser = loadDataFromLocal('loggedInUser');
  updateUserInfo(savedUser);
  
  // If user is logged in, load all data
  if (savedUser && savedUser.username) {
    loadAllUserData();
  } else {
    showDemoLoginOption();
  }
}

/**
 * Enhanced showDemoLoginOption that ensures the demo login prompt is displayed
 */
function showDemoLoginOption() {
  // Skip if user is already logged in
  const savedUser = loadDataFromLocal('loggedInUser');
  if (savedUser && savedUser.username) {
    return;
  }
  
  // Remove any existing prompt
  const existingPrompt = document.querySelector('.demo-login-prompt');
  if (existingPrompt) {
    document.body.removeChild(existingPrompt);
  }

  // Create the demo login prompt
  const demoPrompt = document.createElement('div');
  demoPrompt.className = 'demo-login-prompt';
  demoPrompt.innerHTML = `
    <div class="demo-login-content">
      <h3>欢迎使用旅行足迹!</h3>
      <p>您需要登录才能使用完整功能。要使用演示账号查看所有功能吗？</p>
      <div class="demo-login-buttons">
        <button class="btn-cancel">暂不需要</button>
        <button class="btn-primary">使用演示账号</button>
      </div>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(demoPrompt);
  
  // Add event listeners
  const cancelBtn = demoPrompt.querySelector('.btn-cancel');
  const demoBtn = demoPrompt.querySelector('.btn-primary');
  
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(demoPrompt);
    
    // Create a sessionStorage flag instead of localStorage
    // This makes the prompt show again on page refresh
    sessionStorage.setItem('demoLoginDeclined', 'true');
  });
  
  demoBtn.addEventListener('click', () => {
    loginAsDemoUser();
    document.body.removeChild(demoPrompt);
    
    // Store in sessionStorage to remember during the session
    sessionStorage.setItem('demoLoginShown', 'true');
  });
}

/**
 * Login as demo user and load all data
 */
function loginAsDemoUser() {
  // Login as demo user
  saveDataToLocal('loggedInUser', { username: 'demo' });
  updateUserInfo({ nickname: 'demo' });
  
  // Show success message
  showNotification('已登录为演示账号', 'success');
  
  // Load all data
  loadAllUserData();
}

/**
 * Load all user data
 */
function loadAllUserData() {
  renderVisitedList();
  renderTravelPlanList();
  loadLocationsAndMark();
  if (typeof updateStatistics === 'function') updateStatistics();
  if (typeof loadPhotoGallery === 'function') loadPhotoGallery();
  if (typeof loadDiaryEntries === 'function') loadDiaryEntries();
  if (typeof loadWeatherLocations === 'function') loadWeatherLocations();
}

/**
 * renderVisitedList(filterYear=0)
 * Enhanced function that handles both data structures
 */
async function renderVisitedList(filterYear = 0) {
  try {
    const res = await fetch('/api/user-data');
    const data = await res.json();
    const savedUser = loadDataFromLocal('loggedInUser');
    
    if (!savedUser?.username || !data.users[savedUser.username]) {
      document.getElementById('visitedStats').textContent = "暂无记录";
      document.getElementById('visitedList').innerHTML = "";
      return;
    }

    let userObj = data.users[savedUser.username];
    let visitedArr = [];
    
    // Handle both data structures - check if using visitedCities or visitedCountries
    if (Array.isArray(userObj.visitedCities) && userObj.visitedCities.length > 0) {
      // Using the flat structure (visitedCities)
      visitedArr = userObj.visitedCities;
    } else if (Array.isArray(userObj.visitedCountries)) {
      // Using the nested structure (visitedCountries)
      // Convert from nested structure to flat for consistent processing
      userObj.visitedCountries.forEach(country => {
        if (Array.isArray(country.cities)) {
          country.cities.forEach(city => {
            visitedArr.push({
              year: country.year,
              country: country.country,
              countryZH: country.countryZH || country.country,
              city: city.city,
              cityZH: city.cityZH || city.city
            });
          });
        }
      });
    }

    if (filterYear !== 0) {
      visitedArr = visitedArr.filter(item => parseInt(item.year) === filterYear);
    }
    
    if (visitedArr.length === 0) {
      document.getElementById('visitedStats').textContent =
        filterYear !== 0 ? `没有 ${filterYear} 年的访问记录` : "暂无记录";
      document.getElementById('visitedList').innerHTML = "";
      return;
    }

    // Statistics
    let countrySet = new Set();
    let citySet = new Set();
    visitedArr.forEach(item => {
      countrySet.add(item.country);
      citySet.add(item.city);
    });
    let totalCountries = countrySet.size;
    let totalCities = citySet.size;

    document.getElementById('visitedStats').textContent =
      `已访问 ${totalCountries} 个国家，共 ${totalCities} 个唯一城市。`;

    // Render list with improved formatting
    let visitedListEl = document.getElementById('visitedList');
    visitedListEl.innerHTML = "";
    visitedArr.forEach(item => {
      let li = document.createElement('li');
      li.className = 'visited-item';
      
      // Use cityZH/countryZH if available, otherwise use city/country
      const displayCity = item.cityZH || item.city;
      const displayCountry = item.countryZH || item.country;
      
      li.innerHTML = `
        <span class="visited-year">${item.year}</span>
        <span class="visited-location">${displayCountry} - ${displayCity}</span>
      `;
      visitedListEl.appendChild(li);
    });
    
    // Store the processed visited array globally for drawing lines
    window.processedVisitedLocations = visitedArr;
  } catch (err) {
    console.error("renderVisitedList 出错:", err);
    document.getElementById('visitedStats').textContent = "加载失败";
    document.getElementById('visitedList').innerHTML = "";
  }
}

/**
 * Enhanced drawVisitedLineHandler that works with the processed data
 */
async function drawVisitedLineHandler() {
  try {
    const colorPicker = document.getElementById('lineColor');
    let lineColor = colorPicker ? colorPicker.value : '#ff0000';
    const weightInput = document.getElementById('lineWeight');
    let lineWeight = weightInput ? parseInt(weightInput.value, 10) || 3 : 3;

    const filterYear = parseInt(document.getElementById('filterYear').value, 10) || 0;
    const savedUser = loadDataFromLocal('loggedInUser');
    if (!savedUser?.username) {
      showNotification("请先登录再查看已访问数据", "warning");
      return;
    }

    // Use the globally stored processed visited locations
    let visitedArr = window.processedVisitedLocations || [];
    if (!visitedArr.length) {
      await renderVisitedList(filterYear);
      visitedArr = window.processedVisitedLocations || [];
    }
    
    if (filterYear !== 0) {
      visitedArr = visitedArr.filter(item => parseInt(item.year) === filterYear);
    }
    
    if (visitedArr.length < 2) {
      showNotification("至少要有2个访问城市才能连线", "warning");
      return;
    }

    // Get location coordinates from the API
    let locRes = await fetch('/api/locations');
    let locData = await locRes.json();

    let coordsArray = [];
    visitedArr.forEach(item => {
      let match = locData.find(ld => 
        (ld.country === item.country || ld.countryZH === item.country) && 
        (ld.city === item.city || ld.cityZH === item.city)
      );
      if (match) {
        coordsArray.push({ lat: match.latitude, lng: match.longitude });
      }
    });
    
    if (coordsArray.length < 2) {
      showNotification("匹配到的坐标不足2个，无法连线", "warning");
      return;
    }

    drawVisitedLine(coordsArray, lineColor, true, lineWeight);
    showNotification(`已绘制 ${coordsArray.length} 个地点的连线`, "success");
  } catch (err) {
    console.error("drawVisitedLineHandler 出错:", err);
    showNotification("连线失败，请稍后再试", "error");
  }
}

/**
 * 清除所有连线
 */
function clearAllVisitedLines() {
  clearVisitedLines();
  console.log("清除连线完成");
}

/**
 * 旅行计划：本地加
 */
function addTravelPlanLocal(country, city, year, lat, lng) {
  let planList = loadDataFromLocal('travelPlanList') || [];
  planList.push({ country, city, year, lat, lng });
  saveDataToLocal('travelPlanList', planList);
}

/**
 * 旅行计划 => 后端
 */
async function addPlanToUserData(country, city, year) {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser?.username) return;
  try {
    let res = await fetch('/api/user-data');
    let data = await res.json();
    if (!data.users[savedUser.username]) {
      data.users[savedUser.username] = { visitedCities: [], travelPlans: [] };
    }
    let userObj = data.users[savedUser.username];
    if (!Array.isArray(userObj.travelPlans)) {
      userObj.travelPlans = [];
    }
    userObj.travelPlans.push({ country, city, year });

    await fetch('/api/user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error("addPlanToUserData失败:", err);
    throw err;
  }
}

/**
 * 往 locations.json => 追加一个标记
 */
async function addLocationToServer(country, city, lat, lng, type, year) {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser?.username) {
    console.warn("未登录, 无法添加地点");
    return;
  }
  try {
    const newLoc = {
      username: savedUser.username,
      country,
      countryZH: country,
      city,
      cityZH: city,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      type,
      year: parseInt(year) || 0
    };
    let res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(newLoc)
    });
    await res.json();
    console.log("已写入 locations.json:", newLoc);

    loadLocationsAndMark(0);
  } catch (err) {
    console.error("addLocationToServer 失败:", err);
    throw err;
  }
}

/**
 * 删除地点 (后端)
 */
async function removeLocationFromServer(lat, lng) {
  try {
    const body = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
    await fetch('/api/locations/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });
    console.log(`已删除地图标记 lat=${lat}, lng=${lng}`);
  } catch (err) {
    console.error("removeLocationFromServer 出错:", err);
    throw err;
  }
}

/**
 * 标记已访问 => visitedCities push
 * 并从 travelPlans 删除
 */
async function markPlanAsVisited(country, city, year) {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser?.username) {
    showNotification("未登录, 不能标记已访问", "warning");
    return false;
  }
  try {
    const body = {
      username: savedUser.username,
      country,
      city,
      year
    };
    const res = await fetch('/api/user-data/markVisited', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await res.json();
    if (result.success) {
      console.log("标记已访问成功", result.data);
      // 这里再刷新前端UI
      await renderVisitedList();
      renderTravelPlanList();
      return true;
    } else {
      console.warn("标记失败:", result);
      return false;
    }
  } catch (err) {
    console.error("标记已访问出错:", err);
    return false;
  }
}

/**
 * 更新地点类型
 */
async function updateLocationTypeOnServer(lat, lng, newType) {
  try {
    const body = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      newType
    };
    let res = await fetch('/api/locations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });
    let result = await res.json();
    console.log("updateLocationTypeOnServer =>", result);
    return result.success;
  } catch (err) {
    console.error("updateLocationTypeOnServer失败:", err);
    return false;
  }
}

/**
 * 渲染本地旅行计划列表
 */
async function renderTravelPlanList() {
  const travelPlanListEl = document.getElementById('travelPlanList');
  if (!travelPlanListEl) return;

  try {
    // Check if user is logged in
    const savedUser = loadDataFromLocal('loggedInUser');
    if (!savedUser?.username) {
      travelPlanListEl.innerHTML = '<p class="empty-message">请先登录，再查看旅行计划</p>';
      return;
    }

    // Combine plans from local storage and server
    const localPlanList = loadDataFromLocal('travelPlanList') || [];
    
    // Get plans from user-data.json on the server
    const userRes = await fetch('/api/user-data');
    const userData = await userRes.json();
    
    // Get plans from locations.json (for coordinates)
    const locRes = await fetch('/api/locations');
    const locations = await locRes.json();
    
    // Find user's server-side travel plans
    let serverPlans = [];
    if (userData.users && userData.users[savedUser.username] && 
        userData.users[savedUser.username].travelPlans) {
      serverPlans = userData.users[savedUser.username].travelPlans;
    }
    
    // Find locations marked as plan type for this user
    const planLocations = locations.filter(loc => 
      loc.username === savedUser.username && 
      loc.type === 'plan'
    );
    
    // Merge plans from all sources, removing duplicates
    let allPlans = [...localPlanList];
    
    // Add server plans if they're not already in local plans
    serverPlans.forEach(serverPlan => {
      const exists = allPlans.some(localPlan => 
        localPlan.country === serverPlan.country && 
        localPlan.city === serverPlan.city && 
        String(localPlan.year) === String(serverPlan.year)
      );
      
      if (!exists) {
        // Find coordinates from locations if available
        const matchingLoc = planLocations.find(loc => 
          (loc.country === serverPlan.country || loc.countryZH === serverPlan.country) &&
          (loc.city === serverPlan.city || loc.cityZH === serverPlan.city)
        );
        
        allPlans.push({
          country: serverPlan.country,
          city: serverPlan.city,
          year: serverPlan.year,
          lat: matchingLoc ? matchingLoc.latitude : null,
          lng: matchingLoc ? matchingLoc.longitude : null
        });
      }
    });
    
    // Add plan locations that aren't already in the plans list
    planLocations.forEach(loc => {
      const exists = allPlans.some(plan => 
        (plan.country === loc.country || plan.country === loc.countryZH) && 
        (plan.city === loc.city || plan.city === loc.cityZH) && 
        (plan.lat === loc.latitude || plan.lng === loc.longitude)
      );
      
      if (!exists) {
        allPlans.push({
          country: loc.countryZH || loc.country,
          city: loc.cityZH || loc.city,
          year: loc.year || new Date().getFullYear(),
          lat: loc.latitude,
          lng: loc.longitude
        });
      }
    });
    
    // If no plans, show empty message
    if (allPlans.length === 0) {
      travelPlanListEl.innerHTML = '<p class="empty-message">暂无旅行计划</p>';
      return;
    }

    travelPlanListEl.innerHTML = '';

    allPlans.forEach((item, index) => {
      const li = document.createElement('li');
      
      // Use the Chinese name if available
      const displayCountry = item.countryZH || item.country;
      const displayCity = item.cityZH || item.city;
      
      li.innerHTML = `
        <div class="plan-info">
          <span class="plan-year">${item.year}</span>
          <span class="plan-location">${displayCountry} - ${displayCity}</span>
        </div>
        <div class="plan-actions">
          <button class="visited-btn">标记已访问</button>
          <button class="remove-btn">删除</button>
        </div>
      `;

      // Add event listeners to the buttons
      const removeBtn = li.querySelector('.remove-btn');
      removeBtn.addEventListener('click', async () => {
        try {
          // First remove from local storage
          const localPlans = loadDataFromLocal('travelPlanList') || [];
          const updatedLocalPlans = localPlans.filter((localPlan, localIndex) => {
            if (index < localPlans.length) {
              return localIndex !== index;
            }
            return true;
          });
          saveDataToLocal('travelPlanList', updatedLocalPlans);
          
          // Then try to remove from server if coordinates are available
          if (item.lat && item.lng) {
            await removeLocationFromServer(item.lat, item.lng);
          }
          
          // Also try to remove from user-data.json travel plans
          try {
            const userDataRes = await fetch('/api/user-data');
            const userData = await userDataRes.json();
            
            if (userData.users && userData.users[savedUser.username]) {
              const userPlans = userData.users[savedUser.username].travelPlans || [];
              
              // Filter out the plan to remove
              userData.users[savedUser.username].travelPlans = userPlans.filter(plan => 
                !(plan.country === item.country && 
                  plan.city === item.city && 
                  String(plan.year) === String(item.year))
              );
              
              // Save updated user data
              await fetch('/api/user-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
              });
            }
          } catch (err) {
            console.error("Error removing plan from user data:", err);
          }
          
          renderTravelPlanList();
          loadLocationsAndMark();
          showNotification("旅行计划已删除", "info");
        } catch (err) {
          console.error("Error removing travel plan:", err);
          showNotification("删除旅行计划失败", "error");
        }
      });

      const visitedBtn = li.querySelector('.visited-btn');
      visitedBtn.addEventListener('click', async () => {
        try {
          // Show loading state
          visitedBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          visitedBtn.disabled = true;
          
          const success = await markPlanAsVisited(item.country, item.city, item.year);
          
          if (success) {
            if (item.lat && item.lng) {
              await updateLocationTypeOnServer(item.lat, item.lng, 'visited');
            }
            
            // Remove from local plans
            const localPlans = loadDataFromLocal('travelPlanList') || [];
            const updatedLocalPlans = localPlans.filter((localPlan, localIndex) => {
              if (index < localPlans.length) {
                return localIndex !== index;
              }
              return true;
            });
            saveDataToLocal('travelPlanList', updatedLocalPlans);
            
            renderTravelPlanList();
            renderVisitedList();
            loadLocationsAndMark();
            showNotification("已标记为已访问", "success");
          } else {
            // Reset button
            visitedBtn.innerHTML = '标记已访问';
            visitedBtn.disabled = false;
            showNotification("标记失败，请稍后再试", "error");
          }
        } catch (err) {
          console.error("Error marking as visited:", err);
          visitedBtn.innerHTML = '标记已访问';
          visitedBtn.disabled = false;
          showNotification("标记失败，请稍后再试", "error");
        }
      });

      travelPlanListEl.appendChild(li);
    });
  } catch (err) {
    console.error("Error rendering travel plans:", err);
    travelPlanListEl.innerHTML = '<p class="empty-message">加载旅行计划失败</p>';
  }
}

/**
 * Enhanced showVisitListModal with improved drag and drop
 */
async function showVisitListModal() {
  try {
    const res = await fetch('/api/user-data');
    const data = await res.json();

    const savedUser = loadDataFromLocal('loggedInUser');
    if (!savedUser?.username || !data.users[savedUser.username]) {
      document.getElementById('visitListDetail').innerHTML = "<p class='empty-message'>暂无记录</p>";
      return;
    }

    let userObj = data.users[savedUser.username];
    let visitedArr = [];
    
    // Handle both data structures
    if (Array.isArray(userObj.visitedCities) && userObj.visitedCities.length > 0) {
      visitedArr = userObj.visitedCities;
    } else if (Array.isArray(userObj.visitedCountries)) {
      userObj.visitedCountries.forEach(country => {
        if (Array.isArray(country.cities)) {
          country.cities.forEach(city => {
            visitedArr.push({
              year: country.year,
              country: country.country,
              countryZH: country.countryZH || country.country,
              city: city.city,
              cityZH: city.cityZH || city.city
            });
          });
        }
      });
    }

    if (visitedArr.length === 0) {
      document.getElementById('visitListDetail').innerHTML = "<p class='empty-message'>暂无访问记录</p>";
      return;
    }

    // Create HTML for the draggable list
    let html = `
      <div class="visit-list-container">
        <div class="visit-list-header">
          <h3>访问列表</h3>
          <p class="drag-instructions">拖动项目可以调整顺序</p>
        </div>
        <ul id="visitDraggableList" class="visit-draggable-list">
    `;
    
    visitedArr.forEach((item, idx) => {
      const displayCity = item.cityZH || item.city;
      const displayCountry = item.countryZH || item.country;
      
      html += `
        <li draggable="true" data-index="${idx}" class="visit-item">
          <div class="visit-item-content">
            <span class="visit-year">${item.year}</span>
            <span class="visit-location">${displayCountry} - ${displayCity}</span>
          </div>
          <div class="visit-drag-handle">
            <i class="fas fa-grip-lines"></i>
          </div>
        </li>
      `;
    });
    
    html += `
        </ul>
        <button id="saveVisitOrderBtn" class="save-order-btn">
          <i class="fas fa-save"></i> 保存顺序
        </button>
      </div>
    `;
    
    document.getElementById('visitListDetail').innerHTML = html;

    // Initialize drag and drop
    initEnhancedDragForVisitList(visitedArr);
  } catch (err) {
    console.error("showVisitListModal 出错:", err);
    document.getElementById('visitListDetail').innerHTML = "<p class='empty-message'>加载失败</p>";
  }
}

/**
 * Initialize enhanced drag and drop for visit list
 */
function initEnhancedDragForVisitList(visitedArr) {
  const listEl = document.getElementById('visitDraggableList');
  if (!listEl) return;

  let draggedItem = null;
  let dragSrcIndex = -1;

  // Add event listeners for all list items
  const items = listEl.querySelectorAll('li');
  items.forEach(item => {
    // Dragstart event
    item.addEventListener('dragstart', (e) => {
      dragSrcIndex = parseInt(item.getAttribute('data-index'), 10);
      draggedItem = item;
      
      // Add styling during drag
      setTimeout(() => {
        item.classList.add('dragging');
      }, 0);
      
      // Set drag data
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragSrcIndex);
    });
    
    // Dragend event
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggedItem = null;
    });
    
    // Dragover event
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    
    // Dragenter event - add visual feedback
    item.addEventListener('dragenter', (e) => {
      e.preventDefault();
      item.classList.add('drag-over');
    });
    
    // Dragleave event - remove visual feedback
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    
    // Drop event
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      
      let dragTargetIndex = parseInt(item.getAttribute('data-index'), 10);
      if (dragSrcIndex === dragTargetIndex) return;
      
      // Move the item in the array
      moveItemInArray(visitedArr, dragSrcIndex, dragTargetIndex);
      
      // Re-render the list
      reRenderDragList(visitedArr);
    });
  });

  // Save button event listener
  const saveBtn = document.getElementById('saveVisitOrderBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      // Show loading state
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
      saveBtn.disabled = true;
      
      // Save the new order
      const success = await saveNewVisitOrder(visitedArr);
      
      if (success) {
        // Show success message
        saveBtn.innerHTML = '<i class="fas fa-check"></i> 已保存';
        showNotification("访问顺序已保存", "success");
        
        // Reload data to reflect changes
        setTimeout(() => {
          renderVisitedList();
          
          // Close modal
          const visitListModal = document.getElementById('visitListModal');
          if (visitListModal) {
            visitListModal.style.display = 'none';
          }
        }, 1000);
      } else {
        // Show error state
        saveBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 保存失败，请重试';
        saveBtn.disabled = false;
      }
    });
  }
}

/**
 * Move an item in an array from one position to another
 */
function moveItemInArray(arr, fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= arr.length) return;
  if (toIndex < 0 || toIndex >= arr.length) return;
  
  const item = arr.splice(fromIndex, 1)[0];
  arr.splice(toIndex, 0, item);
}

/**
 * Re-render the draggable list with updated data
 */
function reRenderDragList(visitedArr) {
  const listEl = document.getElementById('visitDraggableList');
  if (!listEl) return;
  
  listEl.innerHTML = '';
  
  visitedArr.forEach((item, idx) => {
    const displayCity = item.cityZH || item.city;
    const displayCountry = item.countryZH || item.country;
    
    const li = document.createElement('li');
    li.className = 'visit-item';
    li.draggable = true;
    li.setAttribute('data-index', idx);
    
    li.innerHTML = `
      <div class="visit-item-content">
        <span class="visit-year">${item.year}</span>
        <span class="visit-location">${displayCountry} - ${displayCity}</span>
      </div>
      <div class="visit-drag-handle">
        <i class="fas fa-grip-lines"></i>
      </div>
    `;
    
    listEl.appendChild(li);
  });
  
  // Reinitialize drag events
  initEnhancedDragForVisitList(visitedArr);
}

/**
 * Save the new visit order to the server
 */
async function saveNewVisitOrder(visitedArr) {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser?.username) {
    showNotification("未登录，无法保存顺序", "error");
    return false;
  }
  
  try {
    let res = await fetch('/api/user-data');
    let data = await res.json();
    
    if (!data.users[savedUser.username]) {
      data.users[savedUser.username] = { visitedCities: [], travelPlans: [] };
    }
    
    // Directly overwrite visitedCities with the new order
    data.users[savedUser.username].visitedCities = visitedArr;
    
    const saveRes = await fetch('/api/user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!saveRes.ok) {
      throw new Error('Failed to save order');
    }
    
    console.log("saveNewVisitOrder => visitedCities已更新");
    return true;
  } catch (err) {
    console.error("saveNewVisitOrder 出错:", err);
    showNotification("保存顺序失败", "error");
    return false;
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info', duration = 3000) {
  if (typeof window.showNotification === 'function') {
    // Use the one from utils.js if available
    window.showNotification(message, type, duration);
    return;
  }
  
  // Check if notification container exists, if not create it
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-end';
    document.body.appendChild(container);
  }
  
  // Get the right notification color based on type
  let color;
  let icon;
  switch (type) {
    case 'success':
      color = '#4CAF50';
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      color = '#F44336';
      icon = '<i class="fas fa-times-circle"></i>';
      break;
    case 'warning':
      color = '#FF9800';
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      color = '#2196F3';
      icon = '<i class="fas fa-info-circle"></i>';
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.padding = '12px 20px';
  notification.style.marginBottom = '10px';
  notification.style.backgroundColor = color;
  notification.style.color = 'white';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.16)';
  notification.style.animation = 'slideIn 0.3s ease';
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.maxWidth = '300px';
  
  notification.innerHTML = `${icon} <span style="margin-left: 10px;">${message}</span>`;
  container.appendChild(notification);
  
  // Remove notification after duration
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
      if (container.contains(notification)) {
        container.removeChild(notification);
      }
    }, 300);
  }, duration);
}

/**
 * LocalStorage 工具
 */
function saveDataToLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch(err) {
    console.error("保存到localStorage失败:", err);
  }
}

function loadDataFromLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch(err) {
    console.error("从localStorage读取失败:", err);
    return null;
  }
}

// Make functions globally available
window.renderVisitedList = renderVisitedList;
window.drawVisitedLineHandler = drawVisitedLineHandler;
window.clearAllVisitedLines = clearAllVisitedLines;
window.addTravelPlanLocal = addTravelPlanLocal;
window.addPlanToUserData = addPlanToUserData;
window.addLocationToServer = addLocationToServer;
window.removeLocationFromServer = removeLocationFromServer;
window.markPlanAsVisited = markPlanAsVisited;
window.updateLocationTypeOnServer = updateLocationTypeOnServer;
window.renderTravelPlanList = renderTravelPlanList;
window.showVisitListModal = showVisitListModal;
window.moveItemInArray = moveItemInArray;
window.reRenderDragList = reRenderDragList;
window.saveNewVisitOrder = saveNewVisitOrder;
window.updateLoginState = updateLoginState;
window.showDemoLoginOption = showDemoLoginOption;
window.loginAsDemoUser = loginAsDemoUser;
window.loadAllUserData = loadAllUserData;
window.handleAuthButtonClick = handleAuthButtonClick;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.updateUserInfo = updateUserInfo;
window.showNotification = showNotification;
window.saveDataToLocal = saveDataToLocal;
window.loadDataFromLocal = loadDataFromLocal;
