/**
 * map.js
 * Leaflet地图逻辑
 */

let map;

document.addEventListener('DOMContentLoaded', () => {
  initializeMap();
});

/**
 * 初始化地图
 */
function initializeMap() {
  try {
    // 使用Leaflet加载地图
    map = L.map('map').setView([30, 0], 2);

    // 使用OpenStreetMap的TileLayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 加载地点数据并标记
    loadLocationsAndMark();

    // 可选：添加图例
    addMapLegend();

  } catch (error) {
    console.error("地图初始化失败：", error);
  }
}

/**
 * 从 data/locations.json 加载地点数据并在地图上标记
 */
function loadLocationsAndMark() {
  fetch('data/locations.json')
    .then(res => res.json())
    .then(locData => {
      locData.forEach(loc => {
        // 为每个地点创建Marker
        const marker = L.marker([loc.latitude, loc.longitude]).addTo(map);

        // 给Marker加一个Popup
        marker.bindPopup(`
          <h3>${loc.cityZH}（${loc.city}）</h3>
          <p>国家：${loc.countryZH}（${loc.country}）</p>
          <p>坐标：${loc.latitude}, ${loc.longitude}</p>
        `);
      });
    })
    .catch(err => {
      console.error("地点数据加载失败：", err);
    });
}

/**
 * 在地图上添加自定义图例(可选)
 */
function addMapLegend() {
  const legendControl = L.control({ position: 'bottomleft' });
  legendControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <h3>地图图例</h3>
      <div class="legend-item">
        <span class="legend-color" style="background: #FF0000;"></span>
        <span>标记类型A</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #0000FF;"></span>
        <span>标记类型B</span>
      </div>
    `;
    return div;
  };
  legendControl.addTo(map);
}
