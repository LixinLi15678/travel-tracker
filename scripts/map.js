/**
 * map.js
 * 实现地图也支持按年份过滤，只加载匹配 year 的地点。
 * 若 filterYear=0，就加载全部。
 */

let map;

// 用来管理 Marker，方便清除旧的
let markerGroup = null;

document.addEventListener('DOMContentLoaded', () => {
  initializeMap();
});

function initializeMap() {
  try {
    // 初始化地图
    map = L.map('map').setView([30, 0], 2);

    // 使用OpenStreetMap的瓦片
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 默认加载所有地点
    loadLocationsAndMark(0);

    // 可选：添加图例
    addMapLegend();

  } catch (error) {
    console.error("地图初始化失败：", error);
  }
}

/**
 * 根据 filterYear 过滤地点，只对匹配到的地点生成 Marker
 * 如果 filterYear=0 => 显示全部
 */
function loadLocationsAndMark(filterYear = 0) {
  // 先清除旧 markers
  if (markerGroup) {
    map.removeLayer(markerGroup);
    markerGroup = null;
  }
  markerGroup = L.layerGroup().addTo(map);

  // ★ 获取当前登录用户
  const savedUser = loadDataFromLocal('loggedInUser');
  const currentUsername = savedUser?.username || null;

  fetch('data/locations.json')
    .then(res => res.json())
    .then(locData => {
      locData.forEach(loc => {
        // ★ 如果 loc.username 跟当前用户不匹配，就不渲染
        if (!currentUsername || loc.username !== currentUsername) {
          return; 
        }

        // 如果 filterYear !=0，要匹配 loc.year
        if (filterYear !== 0 && parseInt(loc.year) !== filterYear) {
          return;
        }

        // ★ 匹配到后，再创建 Marker
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

        const marker = L.marker([loc.latitude, loc.longitude], { icon: markerIcon });
        marker.bindPopup(`
          <h3>${loc.cityZH}（${loc.city}）</h3>
          <p>国家：${loc.countryZH}（${loc.country}）</p>
          <p>坐标：${loc.latitude}, ${loc.longitude}</p>
          <p>年份：${loc.year || '无'}</p>
          <p>类型：${loc.type || '无'}</p>
        `);
        marker.addTo(markerGroup);
      });
    })
    .catch(err => {
      console.error("地点数据加载失败：", err);
    });
}


/**
 * 添加图例(可自定义)
 */
function addMapLegend() {
  const legendControl = L.control({ position: 'bottomleft' });
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
 * 让 main.js 能直接调用
 */
window.loadLocationsAndMark = loadLocationsAndMark;

/**
 * 移动 & 缩放到指定坐标
 */
function centerMap(lat, lng, zoom = 8) {
  if (!map) return;
  map.setView([parseFloat(lat), parseFloat(lng)], zoom);
}
window.centerMap = centerMap;

/**
 * 用于存放折线(若使用画线功能)
 */
window.drawnPolylines = [];

/**
 * 画一条线路
 */
function drawVisitedLine(coordsArray, color = '#ff0000', autoFit = true, weight = 3) {
  if (!map || !coordsArray || coordsArray.length < 2) return;

  const latlngs = coordsArray.map(c => [c.lat, c.lng]);
  const polyline = L.polyline(latlngs, {
    color: color,
    weight: weight,
    opacity: 0.8
  }).addTo(map);

  // 存入全局
  window.drawnPolylines.push(polyline);

  // 自动适应
  if (autoFit) {
    map.fitBounds(polyline.getBounds());
  }
}
window.drawVisitedLine = drawVisitedLine;

/**
 * 清除已绘制线路
 */
function clearVisitedLines() {
  if (!map || !window.drawnPolylines) return;

  // 逐个从地图移除
  window.drawnPolylines.forEach(pl => {
    map.removeLayer(pl);
  });
  // 清空数组
  window.drawnPolylines = [];
}
window.clearVisitedLines = clearVisitedLines;
