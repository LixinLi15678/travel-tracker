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
      // 如果地图上已有Marker，可以先清除(此处省略)
      locData.forEach(loc => {
        const marker = L.marker([loc.latitude, loc.longitude]).addTo(map);
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

function addMapLegend() {
  const legendControl = L.control({ position: 'bottomleft' });
  legendControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <h3>地图图例</h3>
      <div class="legend-item">
        <span class="legend-color" style="background: #FF0000;"></span>
        <span>A类标记</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #0000FF;"></span>
        <span>B类标记</span>
      </div>
    `;
    return div;
  };
  legendControl.addTo(map);
}
