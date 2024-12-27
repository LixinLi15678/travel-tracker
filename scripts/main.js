/**
 * main.js
 * 并调用 map.js 的 drawVisitedLine(coordsArray, color) 画出折线。
 */

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

  // ========== 登录/注册弹窗 ==========
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

  // ========== Tab切换(登录/注册) ==========
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

  // ========== 登录/注册表单 ==========
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

  // ========== 登录状态回显 ==========
  const savedUser = loadDataFromLocal('loggedInUser');
  if (savedUser && savedUser.username) {
    updateUserInfo({ nickname: savedUser.username });
  } else {
    updateUserInfo(null);
  }

  // “开始记录”按钮
  const startBtn = document.getElementById('startTrackingBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      alert("开始记录吧！凝凝专属！");
      document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ========== 已访问：渲染 & 筛选 ==========
  renderVisitedList();

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

  // ========= 新增部分：清除连线按钮 =========
  const clearLinesBtn = document.getElementById('clearLinesBtn');
  if (clearLinesBtn) {
    clearLinesBtn.addEventListener('click', () => {
      clearAllVisitedLines();  // 调用 map.js 提供的函数
    });
  }

  // 绘制连线的事件
  const drawLinesBtn = document.getElementById('drawLinesBtn');
  if (drawLinesBtn) {
    drawLinesBtn.addEventListener('click', () => {
      // 若每次绘制前都清除旧线，可在这里加一行：
      clearAllVisitedLines();
      drawVisitedLineHandler();
    });
  }

  // ========== 旅行计划：添加 & 渲染 ==========
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

      // 2) 写后端 => travelPlans
      await addPlanToUserData(plannedCountry, plannedCity, plannedYear);

      // 3) locations.json => type='plan'
      if (lat && lng) {
        await addLocationToServer(plannedCountry, plannedCity, lat, lng, 'plan');
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

/* ========== 登录按钮点击：已登录 => 登出; 未登录 => 弹窗 ========== */
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

/* ========== 更新登录状态 UI ========== */
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

/* ========== 已访问：渲染 & 筛选 ========== */
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
      visitedStatsEl.textContent = (filterYear !== 0)
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

/* ========== 新功能：绘制连线按钮点击 ========== */
async function drawVisitedLineHandler() {
  try {
    // 1) 获取颜色
    const colorPicker = document.getElementById('lineColor');
    let lineColor = '#ff0000';
    if (colorPicker) {
      lineColor = colorPicker.value;
    }

    // 2) 获取线宽
    const weightInput = document.getElementById('lineWeight');
    let lineWeight = 3;
    if (weightInput) {
      lineWeight = parseInt(weightInput.value, 10) || 3;
    }

    // 3) 读取已访问记录(跟之前逻辑一样)
    const filterYear = parseInt(document.getElementById('filterYear').value, 10) || 0;
    const savedUser = loadDataFromLocal('loggedInUser');
    if (!savedUser || !savedUser.username) {
      alert("请先登录，再查看已访问数据");
      return;
    }

    const res = await fetch('/api/user-data');
    const data = await res.json();
    if (!data.users[savedUser.username]) {
      alert("暂无访问记录");
      return;
    }

    let visitedCountries = data.users[savedUser.username].visitedCountries || [];
    if (filterYear !== 0) {
      visitedCountries = visitedCountries.filter(v => v.year === filterYear);
    }
    if (visitedCountries.length === 0) {
      alert("当前没有筛选到任何访问记录");
      return;
    }

    // 扁平化
    let visitedCities = [];
    visitedCountries.forEach(vc => {
      vc.cities.forEach(ct => {
        visitedCities.push({ country: vc.country, city: ct.city });
      });
    });
    if (visitedCities.length < 2) {
      alert("至少要有2个访问城市才能绘制连线");
      return;
    }

    // 查 locations.json
    const locRes = await fetch('/api/locations');
    const locData = await locRes.json();

    let coordsArray = [];
    visitedCities.forEach(vc => {
      let match = locData.find(ld =>
        ld.city === vc.city && ld.country === vc.country
      );
      if (match) {
        coordsArray.push({ lat: match.latitude, lng: match.longitude });
      } else {
        console.warn("找不到坐标 => ", vc.city, vc.country);
      }
    });
    if (coordsArray.length < 2) {
      alert("匹配到的坐标不足2个，无法连线");
      return;
    }

    // 4) 调用 drawVisitedLine 时，带上 lineWeight
    drawVisitedLine(coordsArray, lineColor, true, lineWeight);

  } catch (err) {
    console.error("drawVisitedLineHandler出错:", err);
  }
}

/**
 * 清除当前地图上所有已绘制的连线
 */
function clearAllVisitedLines() {
  // 调用 map.js 提供的函数
  clearVisitedLines();
}

/* ========== 本地存旅行计划(带 lat,lng) ========== */
function addTravelPlanLocal(country, city, year, lat, lng) {
  let planList = loadDataFromLocal('travelPlanList') || [];
  planList.push({ country, city, year, lat, lng });
  saveDataToLocal('travelPlanList', planList);
}

/* ========== 写 user-data.json => travelPlans ========== */
async function addPlanToUserData(country, city, year) {
  // ... 与之前相同
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

/* ========== 写 locations.json => type='plan' or 'visited' + 刷新地图 + 居中 ========== */
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
    // 聚焦(若 map.js 提供了 centerMap)
    centerMap(lat, lng, 8);

  } catch (err) {
    console.error("addLocationToServer 失败:", err);
  }
}

/* ========== 删除地点: /api/locations/remove ========== */
async function removeLocationFromServer(lat, lng) {
  try {
    const body = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
    const res = await fetch('/api/locations/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    console.log(`已删除地图标记 lat=${lat}, lng=${lng}`);
  } catch (err) {
    console.error("removeLocationFromServer 出错:", err);
  }
}

/* ========== 标记已访问: 写 user-data.json => visitedCountries ========== */
async function markPlanAsVisited(country, city, year) {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser?.username) {
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

    // 如果已有相同 (country + year)，往 cities[] 追加即可
    let existing = userObj.visitedCountries.find(v =>
      v.country === country && v.year === parseInt(year, 10)
    );
    if (existing) {
      existing.cities.push({ city, cityZH: city });
    } else {
      // 新建
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

/* ========== 更新地点类型 => /api/locations PATCH ========== */
async function updateLocationTypeOnServer(lat, lng, newType) {
  try {
    const body = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      newType: newType
    };
    const res = await fetch('/api/locations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log(`updateLocationTypeOnServer => 已更新 type=${newType}`);
  } catch (err) {
    console.error("updateLocationTypeOnServer 出错:", err);
  }
}

/* ========== 渲染本地旅行计划列表 ========== */
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
      // 如果地图上有 plan 标记 => remove
      if (item.lat && item.lng) {
        await removeLocationFromServer(item.lat, item.lng);
      }
      // 本地数组里删
      planList.splice(index, 1);
      saveDataToLocal('travelPlanList', planList);
      renderTravelPlanList();
      // 刷新地图
      loadLocationsAndMark();
    });

    // 标记已访问按钮
    const visitedBtn = document.createElement('button');
    visitedBtn.textContent = '标记已访问';
    visitedBtn.style.marginLeft = '1rem';
    visitedBtn.addEventListener('click', async () => {
      // 写 user-data.json => visitedCountries
      await markPlanAsVisited(item.country, item.city, item.year);

      // 改地点 type => visited
      if (item.lat && item.lng) {
        await updateLocationTypeOnServer(item.lat, item.lng, 'visited');
      }

      // 本地删
      planList.splice(index, 1);
      saveDataToLocal('travelPlanList', planList);

      renderTravelPlanList();
      renderVisitedList();
      loadLocationsAndMark();
    });

    li.appendChild(removeBtn);
    li.appendChild(visitedBtn);
    travelPlanListEl.appendChild(li);
  });

  // ========== “查看访问列表”按钮 & 弹窗部分 (如果需要拖拽排序) ==========
  const viewVisitListBtn = document.getElementById('viewVisitListBtn');
  const visitListModal = document.getElementById('visitListModal');
  const visitListCloseBtn = document.getElementById('visitListCloseBtn');
  const visitSortSelect = document.getElementById('visitSortSelect');
  const visitListDetail = document.getElementById('visitListDetail');

  if (viewVisitListBtn && visitListModal) {
    viewVisitListBtn.addEventListener('click', () => {
      visitListModal.style.display = 'block';
      showVisitListModal();
    });
  }

  if (visitListCloseBtn) {
    visitListCloseBtn.addEventListener('click', () => {
      visitListModal.style.display = 'none';
    });
  }
  window.addEventListener('click', (event) => {
    if (event.target === visitListModal) {
      visitListModal.style.display = 'none';
    }
  });
  if (visitSortSelect) {
    visitSortSelect.addEventListener('change', () => {
      showVisitListModal();
    });
  }

  // 这个函数用来渲染模态框里访问记录 + 拖拽排序
  async function showVisitListModal() {
    try {
      const filterYear = parseInt(document.getElementById('filterYear').value, 10) || 0;
      const sortMode = visitSortSelect?.value || 'time';

      const res = await fetch('/api/user-data');
      const data = await res.json();

      const savedUser = loadDataFromLocal('loggedInUser');
      let username = savedUser?.username;
      if (!username || !data.users[username]) {
        visitListDetail.innerHTML = `<p>暂无记录</p>`;
        return;
      }

      let visited = data.users[username].visitedCountries || [];
      if (filterYear !== 0) {
        visited = visited.filter(v => v.year === filterYear);
      }
      if (visited.length === 0) {
        visitListDetail.innerHTML = `<p>暂无记录</p>`;
        return;
      }

      // 扁平化
      let detailList = [];
      visited.forEach(v => {
        v.cities.forEach(c => {
          detailList.push({
            year: v.year,
            country: v.country,
            countryZH: v.countryZH,
            city: c.city,
            cityZH: c.cityZH
          });
        });
      });

      // 简单排序
      if (sortMode === 'country') {
        detailList.sort((a, b) => a.country.localeCompare(b.country));
      } else if (sortMode === 'city') {
        detailList.sort((a, b) => a.city.localeCompare(b.city));
      }
      // 'time' => 不动

      // 生成HTML + draggable
      let listHTML = `<ul id="visitDraggableList">`;
      detailList.forEach((item, idx) => {
        listHTML += `
          <li draggable="true" data-index="${idx}">
            ${item.year} - ${item.countryZH}（${item.country}） - ${item.cityZH}（${item.city}）
          </li>`;
      });
      listHTML += `</ul>`;
      listHTML += `<button id="saveVisitOrderBtn">保存顺序</button>`;
      visitListDetail.innerHTML = listHTML;

      initDragAndDrop(detailList);
    } catch (err) {
      console.error("showVisitListModal 出错:", err);
      visitListDetail.innerHTML = `<p>加载失败</p>`;
    }
  }

  // 拖拽排序逻辑(若不需要可删除)
  function initDragAndDrop(detailList) {
    const listEl = document.getElementById('visitDraggableList');
    if (!listEl) return;

    let dragSrcIndex = -1;

    listEl.addEventListener('dragstart', (e) => {
      if (e.target && e.target.matches('li[draggable="true"]')) {
        dragSrcIndex = parseInt(e.target.getAttribute('data-index'), 10);
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    listEl.addEventListener('dragover', (e) => {
      if (e.target && e.target.matches('li[draggable="true"]')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
    });

    listEl.addEventListener('drop', (e) => {
      if (e.target && e.target.matches('li[draggable="true"]')) {
        e.preventDefault();
        let dragTargetIndex = parseInt(e.target.getAttribute('data-index'), 10);
        if (dragSrcIndex === dragTargetIndex) return;

        moveItemInArray(detailList, dragSrcIndex, dragTargetIndex);
        reRenderDragList(detailList);
      }
    });

    const saveBtn = document.getElementById('saveVisitOrderBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        await saveNewVisitOrder(detailList);
        alert("已保存新的访问顺序");
      });
    }
  }

  function moveItemInArray(arr, fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= arr.length) return;
    if (toIndex < 0 || toIndex >= arr.length) return;
    const item = arr.splice(fromIndex, 1)[0];
    arr.splice(toIndex, 0, item);
  }

  function reRenderDragList(detailList) {
    const listEl = document.getElementById('visitDraggableList');
    if (!listEl) return;
    let newHTML = '';
    detailList.forEach((item, idx) => {
      newHTML += `
        <li draggable="true" data-index="${idx}">
          ${item.year} - ${item.countryZH}（${item.country}） - ${item.cityZH}（${item.city}）
        </li>`;
    });
    listEl.innerHTML = newHTML;
  }

  async function saveNewVisitOrder(detailList) {
    const savedUser = loadDataFromLocal('loggedInUser');
    if (!savedUser?.username) {
      alert("未登录，无法保存顺序");
      return;
    }
  
    // 1) regroup: 把 detailList（扁平）重新分组 => newVisitedCountries(仅包含当前year)
    let newVisitedCountries = [];
    detailList.forEach(item => {
      let existing = newVisitedCountries.find(vc =>
        vc.year === item.year && vc.country === item.country
      );
      if (existing) {
        existing.cities.push({ city: item.city, cityZH: item.cityZH });
      } else {
        newVisitedCountries.push({
          year: item.year,
          country: item.country,
          countryZH: item.countryZH,
          cities: [{ city: item.city, cityZH: item.cityZH }]
        });
      }
    });
  
    // 2) 获取当前筛选年份
    const filterYear = parseInt(document.getElementById('filterYear').value, 10) || 0;
  
    // 3) 读 user-data 并合并
    const res = await fetch('/api/user-data');
    const data = await res.json();
    const username = savedUser.username;
  
    if (!data.users[username]) {
      data.users[username] = {
        visitedCountries: [],
        travelPlans: []
      };
    }
    let oldVisited = data.users[username].visitedCountries || [];
  
    if (filterYear !== 0) {
      // 只更新当前 year，其余保持不变
      // 先拿出不匹配 filterYear 的记录:
      const others = oldVisited.filter(vc => vc.year !== filterYear);
      // 再把新数据(本year) 和 其他年份 合并
      const finalVisited = others.concat(newVisitedCountries);
  
      data.users[username].visitedCountries = finalVisited;
    } else {
      // 说明 filterYear=0 => 用户想重排所有年份
      data.users[username].visitedCountries = newVisitedCountries;
    }
  
    // 4) POST 回后端
    await fetch('/api/user-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    console.log("已保存新的 visitedCountries 顺序 => user-data.json");
  }  
}
