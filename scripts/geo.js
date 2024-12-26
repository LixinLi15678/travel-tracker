/**
 * geo.js
 * 使用 Nominatim API + 自定义下拉搜索菜单
 */
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('plannedCity');
    const cityList = document.getElementById('citySearchList'); // <ul>
    const latInput = document.getElementById('plannedLat');
    const lngInput = document.getElementById('plannedLng');
  
    if (!cityInput || !cityList || !latInput || !lngInput) return;
  
    let lastSearchTerm = '';
    let currentResults = []; // 存储本次搜索得到的结果数组
  
    // 监听输入事件
    cityInput.addEventListener('input', async () => {
      const query = cityInput.value.trim();
      // 若与上次搜索相同或为空，则不请求
      if (!query) {
        cityList.innerHTML = '';
        cityList.style.display = 'none';
        return;
      }
      if (query === lastSearchTerm) {
        // 如果两次输入相同就不重复请求
        return;
      }
      lastSearchTerm = query;
  
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();
  
        currentResults = data; // 存下来
        // 更新下拉列表
        renderSearchList(data, query);
      } catch (err) {
        console.error("城市搜索失败：", err);
        cityList.innerHTML = '';
        cityList.style.display = 'none';
      }
    });
  
    // 点击外面时隐藏
    document.addEventListener('click', (e) => {
      if (!cityList.contains(e.target) && e.target !== cityInput) {
        cityList.innerHTML = '';
        cityList.style.display = 'none';
      }
    });
  
    // 渲染下拉列表
    function renderSearchList(data, keyword) {
      if (!data || data.length === 0) {
        cityList.innerHTML = '';
        cityList.style.display = 'none';
        return;
      }
      cityList.innerHTML = data.map((item, idx) => {
        // item.display_name
        // lat => item.lat
        // lon => item.lon
        return `<li data-idx="${idx}">${item.display_name}</li>`;
      }).join('');
  
      cityList.style.display = 'block';
  
      // 每个 li 可点击
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
  