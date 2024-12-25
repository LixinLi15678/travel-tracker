/**
 * main.js
 * 主功能脚本：侧边栏、登录/注册弹窗、访问记录渲染、旅行计划管理等
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
  
    // ========== 登录/注册弹窗 ==========
    const authModal = document.getElementById('authModal');
    const loginOpenBtn = document.getElementById('loginOpenBtn');
    const authCloseBtn = document.getElementById('authCloseBtn');
  
    if (loginOpenBtn) {
      loginOpenBtn.addEventListener('click', () => {
        openAuthModal();
      });
    }
    if (authCloseBtn) {
      authCloseBtn.addEventListener('click', () => {
        closeAuthModal();
      });
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
  
    // 登录/注册表单事件
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const loginEmail = e.target.loginEmail.value;
        const loginPassword = e.target.loginPassword.value;
        console.log("登录表单提交:", loginEmail, loginPassword);
        // TODO: 调用后端API验证
        // ...
  
        closeAuthModal();
        updateUserInfo({ nickname: '示例用户', email: loginEmail });
      });
    }
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const registerEmail = e.target.registerEmail.value;
        const registerNickname = e.target.registerNickname.value;
        const registerPassword = e.target.registerPassword.value;
        console.log("注册表单提交:", registerEmail, registerNickname, registerPassword);
        // TODO: 调用后端API注册
        // ...
  
        closeAuthModal();
        updateUserInfo({ nickname: registerNickname, email: registerEmail });
      });
    }
  
    // “开始记录”按钮
    const startBtn = document.getElementById('startTrackingBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        alert("开始记录你的旅行足迹吧！");
        document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
      });
    }
  
    // 加载 & 渲染已访问数据
    renderVisitedList();
  
    // 旅行计划：添加 & 渲染
    const travelPlanForm = document.getElementById('travelPlanForm');
    if (travelPlanForm) {
      travelPlanForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const plannedCountry = e.target.plannedCountry.value.trim();
        const plannedCity = e.target.plannedCity.value.trim();
        const plannedYear = e.target.plannedYear.value.trim();
  
        if (!plannedCountry || !plannedCity || !plannedYear) return;
  
        addTravelPlan(plannedCountry, plannedCity, plannedYear);
        e.target.reset();
      });
    }
    renderTravelPlanList();
  });
  
  /**
   * 打开登录/注册弹窗
   */
  function openAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.style.display = 'block';
  }
  /**
   * 关闭登录/注册弹窗
   */
  function closeAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.style.display = 'none';
  }
  
  /**
   * 更新用户信息UI（例如侧边栏昵称）
   */
  function updateUserInfo(userObj) {
    const usernameEl = document.getElementById('username');
    if (usernameEl && userObj.nickname) {
      usernameEl.textContent = userObj.nickname;
    }
  }
  
  /**
   * 渲染已访问的国家/城市列表 + 统计
   */
  function renderVisitedList() {
    fetch('data/user-data.json')
      .then(response => response.json())
      .then(userData => {
        const visitedListEl = document.getElementById('visitedList');
        const visitedStatsEl = document.getElementById('visitedStats');
        if (!visitedListEl || !visitedStatsEl) return;
  
        visitedListEl.innerHTML = ''; // 清空
  
        const countries = userData.visitedCountries;
        if (!countries || !Array.isArray(countries) || countries.length === 0) {
          visitedStatsEl.textContent = "暂无记录";
          return;
        }
  
        // 计算汇总
        const totalCountries = countries.length;
        let totalCities = 0;
        countries.forEach(item => {
          totalCities += item.cities.length;
        });
  
        // 显示统计
        visitedStatsEl.textContent = `已访问 ${totalCountries} 个国家，共 ${totalCities} 个城市。`;
  
        // 列表渲染
        countries.forEach(item => {
          // 你也可以遍历 item.cities 显示得更详细
          const li = document.createElement('li');
          li.textContent = `${item.countryZH}（${item.country}） - ${item.cities.length} 个城市`;
          visitedListEl.appendChild(li);
        });
      })
      .catch(err => {
        console.error("加载用户访问记录失败：", err);
      });
  }
  
  /**
   * 旅行计划：添加一条计划并保存到LocalStorage
   */
  function addTravelPlan(country, city, year) {
    let planList = loadDataFromLocal('travelPlanList') || [];
    planList.push({ country, city, year });
    saveDataToLocal('travelPlanList', planList);
    renderTravelPlanList();
  }
  
  /**
   * 旅行计划：渲染
   */
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
      removeBtn.addEventListener('click', () => {
        planList.splice(index, 1);
        saveDataToLocal('travelPlanList', planList);
        renderTravelPlanList();
      });
  
      li.appendChild(removeBtn);
      travelPlanListEl.appendChild(li);
    });
  }
  