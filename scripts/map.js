/**
 * map.js
 * 1) 支持按用户名和年份过滤 Marker (若 filterYear=0 => 全部)
 * 2) 支持画线: drawVisitedLine(coordsArray, color, autoFit, weight)
 * 3) 支持清除线: clearVisitedLines()
 */

let map;

// 用来管理 Marker，方便清除旧的 Marker
let markerGroup = null;

// 全局存放折线(若使用画线功能)
window.drawnPolylines = [];

document.addEventListener('DOMContentLoaded', () => {
  initializeMap();
});

/**
 * 初始化 Leaflet 地图
 */
function initializeMap() {
  try {
    map = L.map('map').setView([30, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 默认加载当前用户全部地点
    loadLocationsAndMark(0);

    // 可选：添加图例
    addMapLegend();
  } catch (error) {
    console.error("地图初始化失败：", error);
  }
}

/**
 * 根据 filterYear 过滤地点，只对匹配到的地点生成 Marker
 * 若 filterYear=0 => 显示全部
 * 且只加载当前登录用户(username)
 */
function loadLocationsAndMark(filterYear = 0) {
  // 清除旧 markers
  if (markerGroup) {
    map.removeLayer(markerGroup);
    markerGroup = null;
  }
  markerGroup = L.layerGroup().addTo(map);

  // ★ 获取当前登录用户
  const savedUser = loadDataFromLocal('loggedInUser');
  const currentUsername = savedUser?.username || null;

  fetch('/api/locations')
    .then(res => res.json())
    .then(locData => {
      // 逐条判断
      locData.forEach(loc => {
        // 若没有登录或 loc.username != 当前用户 => 不渲染
        if (!currentUsername || loc.username !== currentUsername) {
          return;
        }

        // 若 filterYear !=0 => 只渲染 loc.year === filterYear
        if (filterYear !== 0 && parseInt(loc.year) !== filterYear) {
          return;
        }

        // 区分已访问 vs 计划 => Marker 图标
        let markerIcon;
        if (loc.type === 'visited') {
          markerIcon = L.icon({
            iconUrl: 'assets/markers/marker-visited.png',
            iconSize: [16, 25]
          });
        } else {
          markerIcon = L.icon({
            iconUrl: 'assets/markers/marker-plan.png',
            iconSize: [16, 25]
          });
        }

        // 创建 Marker
        const marker = L.marker([loc.latitude, loc.longitude], { icon: markerIcon });
        // 绑定 Popup
        marker.bindPopup(`
          <h3>${loc.cityZH || loc.city}</h3>
          <p>国家：${loc.countryZH || loc.country}</p>
          <p>坐标：${loc.latitude}, ${loc.longitude}</p>
          <p>年份：${loc.year || '无'}</p>
          <p>类型：${loc.type === 'visited' ? '已访问' : '计划'}</p>
        `);

        marker.addTo(markerGroup);
      });
      
      // 添加图例 (确保在所有标记添加完毕后添加)
      addMapLegend();
    })
    .catch(err => {
      console.error("地点数据加载失败：", err);
      // 即使加载失败也添加图例
      addMapLegend();
    });
}

/**
 * 在地图上添加图例(可自定义)
 */
function addMapLegend() {
  // First remove any existing legend
  if (legendControl) {
    map.removeControl(legendControl);
    legendControl = null;
  }
  
  // Create a new legend
  legendControl = L.control({ position: 'bottomleft' });
  legendControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <h3 class="legend-title">地图图例</h3>
      <div class="legend-item">
        <img src="assets/markers/marker-visited.png" alt="已访问" class="legend-icon">
        <span>已访问</span>
      </div>
      <div class="legend-item">
        <img src="assets/markers/marker-plan.png" alt="计划" class="legend-icon">
        <span>计划</span>
      </div>
    `;
    return div;
  };
  legendControl.addTo(map);
}

/**
 * 在 main.js 中可以直接调用 loadLocationsAndMark(...)
 */
window.loadLocationsAndMark = loadLocationsAndMark;

/**
 * centerMap(lat, lng, zoom)
 * 移动 & 缩放到指定坐标
 */
function centerMap(lat, lng, zoom = 8) {
  if (!map) return;
  map.setView([parseFloat(lat), parseFloat(lng)], zoom);
}
window.centerMap = centerMap;

/**
 * 画线: drawVisitedLine
 * coordsArray: [{ lat, lng }, { lat, lng }, ...]
 * color: 线颜色(默认红)
 * autoFit: 是否自动 fitBounds
 * weight: 线宽(默认3)
 */
function drawVisitedLine(coordsArray, color = '#ff0000', autoFit = true, weight = 3) {
  if (!map || !coordsArray || coordsArray.length < 2) return;

  // 做个 debug
  console.log("drawVisitedLine => coords:", coordsArray, "color:", color, "weight:", weight);

  const latlngs = coordsArray.map(c => [parseFloat(c.lat), parseFloat(c.lng)]);
  const polyline = L.polyline(latlngs, {
    color: color,
    weight: weight,
    opacity: 0.8
  }).addTo(map);

  // push到全局数组
  window.drawnPolylines.push(polyline);

  // 自动视野
  if (autoFit) {
    map.fitBounds(polyline.getBounds());
  }
}

/**
 * 清除线: clearVisitedLines
 * 将 drawnPolylines 里的所有 polyline 从地图移除
 */
function clearVisitedLines() {
  if (!map || !window.drawnPolylines) return;

  console.log("clearVisitedLines => 正在移除折线数量:", window.drawnPolylines.length);
  window.drawnPolylines.forEach(pl => {
    map.removeLayer(pl);
  });
  // 清空
  window.drawnPolylines = [];
  console.log("clearVisitedLines => 已清空 drawnPolylines");
}

// 暴露给 main.js
window.drawVisitedLine = drawVisitedLine;
window.clearVisitedLines = clearVisitedLines;