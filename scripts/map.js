// map.js

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
      // 先清理旧Marker、再添加(视需求实现)，这里就略
      locData.forEach(loc => {
        let markerIcon;
        if (loc.type === 'visited') {
          // 显示“已访问”的图标
          markerIcon = L.icon({
            iconUrl: 'assets/markers/marker-visited.png', 
            iconSize: [30, 40]
          });
        } else {
          // “plan”或默认
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

/**
 * 让地图移动/缩放到指定坐标
 */
function centerMap(lat, lng, zoom = 8) {
  if (!map) return;
  map.setView([parseFloat(lat), parseFloat(lng)], zoom);
}

// 可选的地图图例
function addMapLegend() {
  const legendControl = L.control({ position: 'bottomleft' });
  legendControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <h3>地图图例</h3>
      <div class="legend-item">
        <span class="legend-color" style="background: #FF0000;"></span>
        <span>已访问</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #0000FF;"></span>
        <span>计划</span>
      </div>
    `;
    return div;
  };
  legendControl.addTo(map);
}

window.centerMap = centerMap;