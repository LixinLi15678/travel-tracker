document.addEventListener('DOMContentLoaded', () => {
  console.log("旅行足迹 WebApp 已加载");

  // ========== 侧边栏 ==========
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

  // ========== 登录/注册弹窗 & 按钮 ==========
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

  // Tab 切换
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

  // 登录/注册表单
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

  // 是否已登录
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

  // 访问记录
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
    addTravelPlanLocal(plannedCountry, plannedCity, plannedYear);

    // 2) 写到后端 user-data.json (根据当前用户)
    await addPlanToUserData(plannedCountry, plannedCity, plannedYear);

    // 3) 写到 locations.json + 让地图刷新
    if (lat && lng) {
      await addLocationToServer(plannedCountry, plannedCity, lat, lng);
    } else {
      console.warn("未选择下拉结果，未获取坐标，无法标注地图");
    }

    // 重置
    e.target.reset();
    document.getElementById('plannedLat').value = '';
    document.getElementById('plannedLng').value = '';

    // 列表重新渲染
    renderTravelPlanList();
  });
}

/**
 * 如果已登录 => 登出；未登录 => 打开弹窗
 */
function handleAuthButtonClick() {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (savedUser && savedUser.username) {
    // 登出
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

/**
 * 已登录 => 显示“用户名(登出)”，侧边栏昵称
 * 未登录 => “登录/注册”
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

/* ========== 渲染已访问(含年份筛选) ========== */
async function renderVisitedList(filterYear = 0) {
  try {
    const res = await fetch('/api/user-data');
    const data = await res.json();

    // 当前登录用户
    const savedUser = loadDataFromLocal('loggedInUser');
    let username = (savedUser && savedUser.username) ? savedUser.username : null;

    let visitedListEl = document.getElementById('visitedList');
    let visitedStatsEl = document.getElementById('visitedStats');
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
      visitedStatsEl.textContent = (filterYear === 0) ? "暂无记录" : `没有 ${filterYear} 年的访问记录`;
      return;
    }
    let totalCountries = countries.length;
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

/* ========== 本地旅行计划(不分用户) ========== */
function addTravelPlanLocal(country, city, year) {
  let planList = loadDataFromLocal('travelPlanList') || [];
  planList.push({ country, city, year });
  saveDataToLocal('travelPlanList', planList);
}

/* ========== 写到 user-data.json 里的当前用户 ========== */
async function addPlanToUserData(country, city, year) {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    // 未登录就不往后端写
    return;
  }
  try {
    let res = await fetch('/api/user-data');
    let data = await res.json();
    // 如果没有 data.users[username] 就初始化
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

    // POST 回后端
    await fetch('/api/user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error("addPlanToUserData 失败:", err);
  }
}

/* ========== 写到 locations.json(带坐标)，并刷新地图 ========== */
async function addLocationToServer(country, city, lat, lng) {
  try {
    const newLoc = {
      country: country,
      countryZH: country,
      city: city,
      cityZH: city,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    };
    let res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLoc)
    });
    let result = await res.json();
    console.log("已写入 locations.json:", result);

    // 让地图重新加载
    loadLocationsAndMark();
  } catch (err) {
    console.error("addLocationToServer 失败:", err);
  }
}


/* ========== 渲染前端旅行计划列表(不分用户) ========== */
function renderTravelPlanList() {
  let planList = loadDataFromLocal('travelPlanList') || [];
  let travelPlanListEl = document.getElementById('travelPlanList');
  if (!travelPlanListEl) return;

  travelPlanListEl.innerHTML = '';
  planList.forEach((item, index) => {
    let li = document.createElement('li');
    li.textContent = `${item.year} 年 - ${item.country} - ${item.city}`;

    let removeBtn = document.createElement('button');
    removeBtn.textContent = '删除';
    removeBtn.style.marginLeft = '1rem';
    removeBtn.addEventListener('click', () => {
      planList.splice(index, 1);
      saveDataToLocal('travelPlanList', planList);
      renderTravelPlanList();
    });

    li.appendChild(removeBtn);
    travelPlanListEl.appendChild(li);
  });
}
});
