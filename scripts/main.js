document.addEventListener('DOMContentLoaded', () => {
  console.log("旅行足迹 WebApp 已加载");

  // 侧边栏
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

  // 登录弹窗
  const authModal = document.getElementById('authModal');
  const loginOpenBtn = document.getElementById('loginOpenBtn');
  const authCloseBtn = document.getElementById('authCloseBtn');
  const loginOpenBtnHeader = document.getElementById('loginOpenBtnHeader');

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

  // Tab切换
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

  // 登录/注册事件
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = e.target.loginUsername.value.trim();
      if (!username) return;
      // 登录
      saveDataToLocal('loggedInUser', { username });
      updateUserInfo({ nickname: username });
      closeAuthModal();
    });
  }
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = e.target.registerUsername.value.trim();
      if (!username) return;
      // 注册
      saveDataToLocal('loggedInUser', { username });
      updateUserInfo({ nickname: username });
      closeAuthModal();
    });
  }

  // 登录状态
  const savedUser = loadDataFromLocal('loggedInUser');
  if (savedUser && savedUser.username) {
    updateUserInfo({ nickname: savedUser.username });
  } else {
    updateUserInfo(null);
  }

  // “开始记录”
  const startBtn = document.getElementById('startTrackingBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      alert("开始记录你的旅行足迹吧！");
      document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 渲染已访问
  renderVisitedList();

  // 年份筛选
  const filterYearInput = document.getElementById('filterYear');
  const filterYearBtn = document.getElementById('filterYearBtn');
  const showAllBtn = document.getElementById('showAllBtn');
  if (filterYearBtn) {
    filterYearBtn.addEventListener('click', () => {
      const yearValue = parseInt(filterYearInput.value, 10) || 0;
      renderVisitedList(yearValue);
    });
  }
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      filterYearInput.value = '';
      renderVisitedList();
    });
  }

  // 旅行计划
  const travelPlanForm = document.getElementById('travelPlanForm');
  if (travelPlanForm) {
    travelPlanForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const plannedCountry = e.target.plannedCountry.value.trim();
      const plannedCity = e.target.plannedCity.value.trim();
      const plannedYear = e.target.plannedYear.value.trim();

      const lat = document.getElementById('plannedLat').value.trim();
      const lng = document.getElementById('plannedLng').value.trim();

      if (!plannedCountry || !plannedCity || !plannedYear) return;

      // 1) 本地存
      addTravelPlanLocal(plannedCountry, plannedCity, plannedYear, lat, lng);

      // 2) 后端 user-data.json => travelPlans
      await addPlanToUserData(plannedCountry, plannedCity, plannedYear);

      // 3) 后端 locations.json => type='plan'
      if (lat && lng) {
        await addLocationToServer(plannedCountry, plannedCity, lat, lng, "plan");
      } else {
        console.warn("未选择城市下拉结果，无法标注地图");
      }

      e.target.reset();
      document.getElementById('plannedLat').value = '';
      document.getElementById('plannedLng').value = '';

      renderTravelPlanList();
    });
  }
  renderTravelPlanList();
});

/* ========== 登录按钮点击：已登录 => 登出; 未登录 => 打开弹窗 ========== */
function handleAuthButtonClick() {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (savedUser && savedUser.username) {
    localStorage.removeItem('loggedInUser');
    updateUserInfo(null);
  } else {
    openAuthModal();
  }
}
function openAuthModal() {
  const authModal = document.getElementById('authModal');
  if (authModal) authModal.style.display = 'block';
}
function closeAuthModal() {
  const authModal = document.getElementById('authModal');
  if (authModal) authModal.style.display = 'none';
}

/* ========== 更新登录状态 ========== */
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

/* ========== 渲染“已访问” ========== */
async function renderVisitedList(filterYear = 0) {
  try {
    const res = await fetch('/api/user-data');
    const data = await res.json();
    const savedUser = loadDataFromLocal('loggedInUser');
    let username = savedUser?.username;

    const visitedListEl = document.getElementById('visitedList');
    const visitedStatsEl = document.getElementById('visitedStats');
    if (!visitedListEl || !visitedStatsEl) return;

    visitedListEl.innerHTML = '';

    if (!username || !data.users[username]) {
      visitedStatsEl.textContent = "暂无记录";
      return;
    }

    let userObj = data.users[username];
    let countries = userObj.visitedCountries || [];
    if (filterYear !== 0) {
      countries = countries.filter(item => item.year === filterYear);
    }
    if (countries.length === 0) {
      visitedStatsEl.textContent = filterYear !== 0
        ? `没有 ${filterYear} 年的访问记录`
        : "暂无记录";
      return;
    }

    const totalCountries = countries.length;
    let totalCities = 0;
    countries.forEach(c => totalCities += c.cities.length);
    visitedStatsEl.textContent = `已访问 ${totalCountries} 个国家，共 ${totalCities} 个城市。`;

    countries.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.year} 年 - ${item.countryZH}（${item.country}） - ${item.cities.length} 个城市`;
      visitedListEl.appendChild(li);
    });
  } catch (err) {
    console.error("加载访问记录出错:", err);
  }
}

/* ========== 本地存旅行计划(带lat,lng) ========== */
function addTravelPlanLocal(country, city, year, lat, lng) {
  let planList = loadDataFromLocal('travelPlanList') || [];
  planList.push({ country, city, year, lat, lng });
  saveDataToLocal('travelPlanList', planList);
}

/* ========== 写 user-data.json => travelPlans ========== */
async function addPlanToUserData(country, city, year) {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser?.username) return;
  try {
    const res = await fetch('/api/user-data');
    const data = await res.json();
    if (!data.users[savedUser.username]) {
      data.users[savedUser.username] = {
        visitedCountries: [],
        travelPlans: []
      };
    }
    let userObj = data.users[savedUser.username];
    if (!Array.isArray(userObj.travelPlans)) {
      userObj.travelPlans = [];
    }
    userObj.travelPlans.push({ country, city, year });

    await fetch('/api/user-data', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error("addPlanToUserData 失败:", err);
  }
}

/* ========== 写 locations.json => type='plan' or 'visited' ========== */
async function addLocationToServer(country, city, lat, lng, type) {
  try {
    const newLoc = {
      country: country,
      countryZH: country,
      city: city,
      cityZH: city,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      type: type 
    };
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLoc)
    });
    await res.json();
    console.log("已写入 locations.json");

    // 刷新地图 Marker
    loadLocationsAndMark();

    // ★★ 这里加上自动聚焦
    centerMap(lat, lng, 8);

  } catch (err) {
    console.error("addLocationToServer 失败:", err);
  }
}

/* ========== 渲染本地旅行计划列表 + 标记已访问 ========== */
function renderTravelPlanList() {
  const planList = loadDataFromLocal('travelPlanList') || [];
  const travelPlanListEl = document.getElementById('travelPlanList');
  if (!travelPlanListEl) return;

  travelPlanListEl.innerHTML = '';

  planList.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = `${item.year} 年 - ${item.country} - ${item.city}`;

    // 删除按钮
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '删除';
    removeBtn.style.marginLeft = '1rem';
    removeBtn.addEventListener('click', async () => {
      // 如果地图上已经有 plan 标记 => remove
      if (item.lat && item.lng) {
        await removeLocationFromServer(item.lat, item.lng);
      }
      // 从本地移除
      planList.splice(index, 1);
      saveDataToLocal('travelPlanList', planList);
      // 重新渲染
      renderTravelPlanList();
      // 刷新地图
      loadLocationsAndMark();
    });

    // 标记已访问按钮
    const visitedBtn = document.createElement('button');
    visitedBtn.textContent = '标记已访问';
    visitedBtn.style.marginLeft = '1rem';
    visitedBtn.addEventListener('click', async () => {
      // 先后端 user-data.json => visitedCountries
      await markPlanAsVisited(item.country, item.city, item.year);

      // 再改 locations.json => set type='visited'
      if (item.lat && item.lng) {
        await updateLocationTypeOnServer(item.lat, item.lng, 'visited');
      }

      // 从本地 planList 中删掉
      planList.splice(index, 1);
      saveDataToLocal('travelPlanList', planList);

      renderTravelPlanList();
      renderVisitedList();
      loadLocationsAndMark();
    });

    // ★ 关键：把按钮加到 li，上面两段监听逻辑只在点击时才触发
    li.appendChild(removeBtn);
    li.appendChild(visitedBtn);

    // ★ 最后再把 li 添加到 travelPlanListEl
    travelPlanListEl.appendChild(li);
  });
  
  // 以下是你定义的辅助函数
  async function removeLocationFromServer(lat, lng) {
    try {
      const body = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
      await fetch('/api/locations/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      console.log(`已删除地图标记 lat=${lat}, lng=${lng}`);
    } catch (err) {
      console.error("removeLocationFromServer 出错:", err);
    }
  }

  async function updateLocationTypeOnServer(lat, lng, newType) {
    try {
      const body = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        newType
      };
      const res = await fetch('/api/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      await res.json();
      console.log(`updateLocationTypeOnServer => 已更新 type=${newType}`);
  
      // 刷新地图
      loadLocationsAndMark();
  
      // 再居中
      centerMap(lat, lng, 8);
  
    } catch (err) {
      console.error("updateLocationTypeOnServer 出错:", err);
    }
  }
  

  async function markPlanAsVisited(country, city, year) {
    const savedUser = loadDataFromLocal('loggedInUser');
    if (!savedUser || !savedUser.username) {
      console.warn("未登录，不能标记已访问");
      return;
    }
    try {
      const res = await fetch('/api/user-data');
      const data = await res.json();
      if (!data.users[savedUser.username]) {
        data.users[savedUser.username] = {
          visitedCountries: [],
          travelPlans: []
        };
      }
      let userObj = data.users[savedUser.username];
      if (!Array.isArray(userObj.visitedCountries)) {
        userObj.visitedCountries = [];
      }

      let existing = userObj.visitedCountries.find(v =>
        v.country === country && v.year === parseInt(year, 10)
      );
      if (existing) {
        existing.cities.push({ city, cityZH: city });
      } else {
        userObj.visitedCountries.push({
          country: country,
          countryZH: country,
          year: parseInt(year, 10),
          cities: [{ city, cityZH: city }]
        });
      }

      await fetch('/api/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      console.log(`已将 [${country}, ${city}, ${year}] 标记为已访问`);
    } catch (err) {
      console.error("markPlanAsVisited 出错:", err);
    }
  }
}
