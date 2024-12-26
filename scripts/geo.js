/**
 * geo.js
 * 使用 Nominatim API + 自定义下拉搜索菜单 + 防抖 & 缓存
 */
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('plannedCity');
    const cityList = document.getElementById('citySearchList'); // <ul>
    const latInput = document.getElementById('plannedLat');
    const lngInput = document.getElementById('plannedLng');
  
    if (!cityInput || !cityList || !latInput || !lngInput) return;
  
    let lastSearchTerm = '';
    let currentResults = [];
    let searchTimer = null;         // 用来做防抖
    let cache = {};                // 简易缓存：{ query -> data }
  
    cityInput.addEventListener('input', () => {
      const query = cityInput.value.trim();
      // 若空直接清空列表
      if (!query) {
        cityList.innerHTML = '';
        cityList.style.display = 'none';
        return;
      }
      // 若和上次相同也不重复请求
      if (query === lastSearchTerm) {
        return;
      }
      lastSearchTerm = query;
  
      // 防抖：先清除上一次的计时器
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
      // 等待 300ms 后再请求
      searchTimer = setTimeout(() => {
        doSearch(query);
      }, 300);
    });
  
    // 点击页面空白区隐藏下拉
    document.addEventListener('click', (e) => {
      if (!cityList.contains(e.target) && e.target !== cityInput) {
        cityList.innerHTML = '';
        cityList.style.display = 'none';
      }
    });
  
    async function doSearch(query) {
      // 1) 若缓存里有，就直接渲染
      if (cache[query]) {
        currentResults = cache[query];
        renderSearchList(currentResults);
        return;
      }
      // 2) 否则发请求
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();
        currentResults = data;
        // 存入缓存
        cache[query] = data;
        // 渲染
        renderSearchList(data);
      } catch (err) {
        console.error("城市搜索失败：", err);
        cityList.innerHTML = '';
        cityList.style.display = 'none';
      }
    }
  
    function renderSearchList(data) {
      if (!data || data.length === 0) {
        cityList.innerHTML = '';
        cityList.style.display = 'none';
        return;
      }
      cityList.innerHTML = data.map((item, idx) => {
        return `<li data-idx="${idx}">${item.display_name}</li>`;
      }).join('');
  
      cityList.style.display = 'block';
  
      const liEls = cityList.querySelectorAll('li');
      liEls.forEach(li => {
        li.addEventListener('click', () => {
          const i = parseInt(li.dataset.idx, 10);
          const chosen = data[i];
          if (chosen) {
            cityInput.value = chosen.display_name;
            latInput.value = chosen.lat;
            lngInput.value = chosen.lon;
          }
          // 隐藏下拉
          cityList.innerHTML = '';
          cityList.style.display = 'none';
        });
      });
    }
  });
  