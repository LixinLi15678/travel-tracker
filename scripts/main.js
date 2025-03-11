/**
 * main.js
 * 全面使用 visitedCities (扁平) + travelPlans
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log("旅行足迹 WebApp 已加载");

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
      } catch (err) {
        console.error("注册时写后端失败:", err);
      }
    });
  }

  // ====== 登录状态回显 ======
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
      alert("开始记录你的旅行吧！");
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
      const plannedCountry = e.target.plannedCountry.value.trim();
      const plannedCity = e.target.plannedCity.value.trim();
      const plannedYear = e.target.plannedYear.value.trim();
      const lat = document.getElementById('plannedLat').value.trim();
      const lng = document.getElementById('plannedLng').value.trim();

      if (!plannedCountry || !plannedCity || !plannedYear) return;

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
    });
  }

  renderTravelPlanList();
  renderVisitedList(); 
});

/**
 * handleAuthButtonClick()
 * 已登录 => 登出; 未登录 => 打开弹窗
 */
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
 * renderVisitedList(filterYear=0)
 * 扁平 => visitedCities
 * 1) 筛选 year
 * 2) 统计唯一国家/城市
 * 3) 渲染
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
    let visitedArr = userObj.visitedCities || [];

    if (filterYear !== 0) {
      visitedArr = visitedArr.filter(item => parseInt(item.year) === filterYear);
    }
    if (visitedArr.length === 0) {
      document.getElementById('visitedStats').textContent =
        filterYear !== 0 ? `没有 ${filterYear} 年的访问记录` : "暂无记录";
      document.getElementById('visitedList').innerHTML = "";
      return;
    }

    // 统计
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

    // 渲染
    let visitedListEl = document.getElementById('visitedList');
    visitedListEl.innerHTML = "";
    visitedArr.forEach(item => {
      let li = document.createElement('li');
      li.textContent = `${item.year} 年 - ${item.country} - ${item.city}`;
      visitedListEl.appendChild(li);
    });
  } catch (err) {
    console.error("renderVisitedList 出错:", err);
  }
}

/**
 * 绘制连线
 * 1) 读取 visitedCities
 * 2) 筛选 year
 * 3) locData 找坐标 => draw
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
      alert("请先登录再查看已访问数据");
      return;
    }

    // 后端 => visitedCities
    let res = await fetch('/api/user-data');
    let data = await res.json();
    if (!data.users[savedUser.username]) {
      alert("暂无访问记录");
      return;
    }
    let visitedArr = data.users[savedUser.username].visitedCities || [];
    if (filterYear !== 0) {
      visitedArr = visitedArr.filter(item => parseInt(item.year) === filterYear);
    }
    if (visitedArr.length < 2) {
      alert("至少要有2个访问城市才能连线");
      return;
    }

    // locData => coords
    let locRes = await fetch('/api/locations');
    let locData = await locRes.json();

    let coordsArray = [];
    visitedArr.forEach(item => {
      let match = locData.find(ld => 
        ld.country === item.country && ld.city === item.city
      );
      if (match) {
        coordsArray.push({ lat: match.latitude, lng: match.longitude });
      }
    });
    if (coordsArray.length < 2) {
      alert("匹配到的坐标不足2个，无法连线");
      return;
    }

    drawVisitedLine(coordsArray, lineColor, true, lineWeight);
  } catch (err) {
    console.error("drawVisitedLineHandler 出错:", err);
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
  }
}

/**
 * 标记已访问 => visitedCities push
 * 并从 travelPlans 删除
 */
async function markPlanAsVisited(country, city, year) {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser?.username) {
    console.warn("未登录, 不能标记已访问");
    return;
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
    } else {
      console.warn("标记失败:", result);
    }
  } catch (err) {
    console.error("标记已访问出错:", err);
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
  } catch (err) {
    console.error("updateLocationTypeOnServer失败:", err);
  }
}

/**
 * 渲染本地旅行计划列表
 */
function renderTravelPlanList() {
  const planList = loadDataFromLocal('travelPlanList') || [];
  const travelPlanListEl = document.getElementById('travelPlanList');
  if (!travelPlanListEl) return;

  travelPlanListEl.innerHTML = '';

  planList.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = `${item.year} 年 - ${item.country} - ${item.city}`;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = "删除";
    removeBtn.style.marginLeft = '1rem';
    removeBtn.addEventListener('click', async () => {
      if (item.lat && item.lng) {
        await removeLocationFromServer(item.lat, item.lng);
      }
      planList.splice(index,1);
      saveDataToLocal('travelPlanList', planList);
      renderTravelPlanList();
      loadLocationsAndMark();
    });

    const visitedBtn = document.createElement('button');
    visitedBtn.textContent = "标记已访问";
    visitedBtn.style.marginLeft = '1rem';
    visitedBtn.addEventListener('click', async () => {
      await markPlanAsVisited(item.country, item.city, item.year);
      if (item.lat && item.lng) {
        await updateLocationTypeOnServer(item.lat, item.lng, 'visited');
      }
      planList.splice(index,1);
      saveDataToLocal('travelPlanList', planList);
      renderTravelPlanList();
      renderVisitedList();
      loadLocationsAndMark();
    });

    li.appendChild(removeBtn);
    li.appendChild(visitedBtn);
    travelPlanListEl.appendChild(li);
  });

  // 查看访问列表(拖拽)
  const viewVisitListBtn = document.getElementById('viewVisitListBtn');
  const visitListModal = document.getElementById('visitListModal');
  const visitListCloseBtn = document.getElementById('visitListCloseBtn');
  const visitListDetail = document.getElementById('visitListDetail');

  if (viewVisitListBtn && visitListModal) {
    viewVisitListBtn.addEventListener('click', () => {
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
}

/**
 * showVisitListModal
 * 读取 visitedCities => 生成可拖拽列表 => save => reorder => POST
 */
async function showVisitListModal() {
  try {
    const res = await fetch('/api/user-data');
    const data = await res.json();

    const savedUser = loadDataFromLocal('loggedInUser');
    if(!savedUser?.username || !data.users[savedUser.username]) {
      visitListDetail.innerHTML = "<p>暂无记录</p>";
      return;
    }
    let visitedArr = data.users[savedUser.username].visitedCities || [];

    // 直接显示
    let html = `<ul id="visitDraggableList">`;
    visitedArr.forEach((item, idx)=>{
      html += `
      <li draggable="true" data-index="${idx}">
        ${item.year} - ${item.country} - ${item.city}
      </li>`;
    });
    html += `</ul><button id="saveVisitOrderBtn">保存顺序</button>`;
    visitListDetail.innerHTML = html;

    initDragForVisitList(visitedArr);
  } catch(err) {
    console.error("showVisitListModal 出错:", err);
    visitListDetail.innerHTML="<p>加载失败</p>";
  }
}

function initDragForVisitList(visitedArr){
  const listEl = document.getElementById('visitDraggableList');
  if(!listEl)return;

  let dragSrcIndex=-1;

  listEl.addEventListener('dragstart', (e)=>{
    if(e.target.matches('li[draggable="true"]')){
      dragSrcIndex= parseInt(e.target.getAttribute('data-index'),10);
      e.dataTransfer.effectAllowed='move';
    }
  });
  listEl.addEventListener('dragover',(e)=>{
    if(e.target.matches('li[draggable="true"]')){
      e.preventDefault();
      e.dataTransfer.dropEffect='move';
    }
  });
  listEl.addEventListener('drop',(e)=>{
    if(e.target.matches('li[draggable="true"]')){
      e.preventDefault();
      let dragTargetIndex= parseInt(e.target.getAttribute('data-index'),10);
      if(dragSrcIndex=== dragTargetIndex)return;
      moveItemInArray(visitedArr, dragSrcIndex, dragTargetIndex);
      reRenderDragList(visitedArr);
    }
  });

  const saveBtn = document.getElementById('saveVisitOrderBtn');
  if(saveBtn){
    saveBtn.addEventListener('click', async()=>{
      await saveNewVisitOrder(visitedArr);
      alert("已保存新的访问顺序");
      await renderVisitedList();

      // 关闭模态窗
      const visitListModal = document.getElementById('visitListModal');
      if(visitListModal){
        visitListModal.style.display='none';
      }
    });
  }
}

/**
 * moveItemInArray
 */
function moveItemInArray(arr, fromIndex, toIndex){
  if(fromIndex<0 || fromIndex>= arr.length)return;
  if(toIndex<0 || toIndex>= arr.length)return;
  const item= arr.splice(fromIndex,1)[0];
  arr.splice(toIndex,0,item);
}

/**
 * reRenderDragList
 */
function reRenderDragList(visitedArr){
  const listEl= document.getElementById('visitDraggableList');
  if(!listEl)return;
  let newHTML='';
  visitedArr.forEach((item,idx)=>{
    newHTML += `
    <li draggable="true" data-index="${idx}">
      ${item.year} - ${item.country} - ${item.city}
    </li>`;
  });
  listEl.innerHTML=newHTML;
}

/**
 * saveNewVisitOrder => 把 visitedArr 直接覆盖到 visitedCities
 */
async function saveNewVisitOrder(visitedArr){
  const savedUser = loadDataFromLocal('loggedInUser');
  if(!savedUser?.username){
    alert("未登录,无法保存顺序");
    return;
  }
  try{
    let res= await fetch('/api/user-data');
    let data= await res.json();
    if(!data.users[savedUser.username]){
      data.users[savedUser.username]= { visitedCities:[], travelPlans:[]};
    }
    // 直接覆盖 visitedCities
    data.users[savedUser.username].visitedCities= visitedArr;

    await fetch('/api/user-data',{
      method:'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    console.log("saveNewVisitOrder => visitedCities已更新");
  }catch(err){
    console.error("saveNewVisitOrder 出错:", err);
  }
}

/**
 * LocalStorage 工具
 */
function saveDataToLocal(key, data){
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch(err){
    console.error("保存到localStorage失败:", err);
  }
}
function loadDataFromLocal(key){
  try {
    const raw= localStorage.getItem(key);
    return raw? JSON.parse(raw):null;
  }catch(err){
    console.error("从localStorage读取失败:", err);
    return null;
  }
}
