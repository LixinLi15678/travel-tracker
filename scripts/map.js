/**
 * map.js
 * Leaflet地图逻辑 + 新增 drawVisitedLine(自动适应) + clearVisitedLines
 */

let map;

document.addEventListener('DOMContentLoaded', () => {
  initializeMap();
});

function initializeMap() {
  try {
    map = L.map('map').setView([30, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    loadLocationsAndMark();
    addMapLegend();
  } catch (error) {
    console.error("地图初始化失败：", error);
  }
}

function loadLocationsAndMark() {
  fetch('data/locations.json')
    .then(res => res.json())
    .then(locData => {
      locData.forEach(loc => {
        let markerIcon;
        if (loc.type === 'visited') {
          markerIcon = L.icon({
            iconUrl: 'assets/markers/marker-visited.png',
            iconSize: [30, 40]
          });
        } else {
          markerIcon = L.icon({
            iconUrl: 'assets/markers/marker-plan.png',
            iconSize: [30, 40]
          });
        }

        const marker = L.marker([loc.latitude, loc.longitude], { icon: markerIcon }).addTo(map);
        marker.bindPopup(`
          <h3>${loc.cityZH}（${loc.city}）</h3>
          <p>国家：${loc.countryZH}（${loc.country}）</p>
          <p>坐标：${loc.latitude}, ${loc.longitude}</p>
          <p>类型：${loc.type || '无'}</p>
        `);
      });
    })
    .catch(err => {
      console.error("地点数据加载失败：", err);
    });
}

function addMapLegend() {
  const legendControl = L.control({ position: 'bottomleft' });
  legendControl.onAdd = function() {
    // 外层容器
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <h3 class="legend-title">地图图例</h3>

      <div class="legend-item">
        <!-- 让图片更小一些，比如宽30，高自动计算，也可直接宽高都定死 -->
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
 * 移动 & 缩放地图到指定坐标
 */
function centerMap(lat, lng, zoom = 8) {
  if (!map) return;
  map.setView([parseFloat(lat), parseFloat(lng)], zoom);
}
window.centerMap = centerMap;

/**
 * 全局存放已绘制的 polyline
 */
window.drawnPolylines = [];

/**
 * 绘制访问线路，自动适应地图到折线范围
 */
function drawVisitedLine(coordsArray, color = '#ff0000', autoFit = true) {
  if (!map || !coordsArray || coordsArray.length < 2) return;

  const latlngs = coordsArray.map(c => [c.lat, c.lng]);
  const polyline = L.polyline(latlngs, {
    color: color,
    weight: 3,
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
 * 清除所有已绘制的线路
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
