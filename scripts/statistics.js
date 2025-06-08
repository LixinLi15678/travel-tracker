/**
 * statistics.js
 * Handles all travel statistics calculations and visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
  // Call updateStatistics when DOM is ready
  updateStatistics();
  
  // Also update statistics when related sections are updated
  document.addEventListener('visitedListUpdated', updateStatistics);
  document.addEventListener('travelPlanUpdated', updateStatistics);
});

/**
 * Calculate and update all statistics
 */
async function updateStatistics() {
  try {
    const savedUser = loadDataFromLocal('loggedInUser');
    if (!savedUser || !savedUser.username) {
      setDefaultStatistics();
      return;
    }

    // Fetch user data
    const res = await fetch('/api/user-data');
    const data = await res.json();
    if (!data.users || !data.users[savedUser.username]) {
      setDefaultStatistics();
      return;
    }

    const userData = data.users[savedUser.username];
    
    // Process statistics based on user data structure
    let visitedCountriesCount = 0;
    let visitedCitiesCount = 0;
    let yearlyStats = {};
    let continentData = {
      'Asia': 0,
      'Europe': 0,
      'North America': 0,
      'South America': 0,
      'Africa': 0,
      'Oceania': 0,
      'Antarctica': 0
    };

    // Map countries to continents
    const continentMapping = {
      // Asia
      'China': 'Asia', '中国': 'Asia', 'Japan': 'Asia', '日本': 'Asia',
      'South Korea': 'Asia', '韩国': 'Asia', 'Thailand': 'Asia', '泰国': 'Asia',
      'Vietnam': 'Asia', '越南': 'Asia', 'Singapore': 'Asia', '新加坡': 'Asia',
      'Malaysia': 'Asia', '马来西亚': 'Asia', 'Indonesia': 'Asia', '印度尼西亚': 'Asia',
      'India': 'Asia', '印度': 'Asia', 'Nepal': 'Asia', '尼泊尔': 'Asia',
      'Philippines': 'Asia', '菲律宾': 'Asia', 'Cambodia': 'Asia', '柬埔寨': 'Asia',

      // Europe
      'France': 'Europe', '法国': 'Europe', 'Italy': 'Europe', '意大利': 'Europe',
      'Spain': 'Europe', '西班牙': 'Europe', 'Germany': 'Europe', '德国': 'Europe',
      'United Kingdom': 'Europe', '英国': 'Europe', 'Greece': 'Europe', '希腊': 'Europe',
      'Switzerland': 'Europe', '瑞士': 'Europe', 'Netherlands': 'Europe', '荷兰': 'Europe',
      'Sweden': 'Europe', '瑞典': 'Europe', 'Norway': 'Europe', '挪威': 'Europe',

      // North America
      'United States': 'North America', 'USA': 'North America', '美国': 'North America',
      'Canada': 'North America', '加拿大': 'North America', 'Mexico': 'North America', '墨西哥': 'North America',

      // South America
      'Brazil': 'South America', '巴西': 'South America', 'Argentina': 'South America', '阿根廷': 'South America',
      'Peru': 'South America', '秘鲁': 'South America', 'Chile': 'South America', '智利': 'South America',
      'Colombia': 'South America', '哥伦比亚': 'South America',

      // Africa
      'Egypt': 'Africa', '埃及': 'Africa', 'South Africa': 'Africa', '南非': 'Africa',
      'Morocco': 'Africa', '摩洛哥': 'Africa', 'Kenya': 'Africa', '肯尼亚': 'Africa',
      'Tanzania': 'Africa', '坦桑尼亚': 'Africa',

      // Oceania
      'Australia': 'Oceania', '澳大利亚': 'Oceania', 'New Zealand': 'Oceania', '新西兰': 'Oceania',
      'Fiji': 'Oceania', '斐济': 'Oceania'
    };

    // Get visited data from user data structure
    let visitedArr = [];

    // Handle both data structures - check if using visitedCities or visitedCountries
    if (Array.isArray(userData.visitedCities) && userData.visitedCities.length > 0) {
      // Using the flat structure (visitedCities)
      visitedArr = userData.visitedCities;
    } else if (Array.isArray(userData.visitedCountries)) {
      // Using the nested structure (visitedCountries)
      // Convert from nested structure to flat for consistent processing
      userData.visitedCountries.forEach(country => {
        if (Array.isArray(country.cities)) {
          country.cities.forEach(city => {
            visitedArr.push({
              year: country.year,
              country: country.country,
              countryZH: country.countryZH || country.country,
              city: city.city,
              cityZH: city.cityZH || city.city
            });
          });
        }
      });
    }

    if (visitedArr.length > 0) {
      const countries = new Set();
      const cities = new Set();
      const yearCityCounts = {};
      const continentCounts = {};

      visitedArr.forEach(item => {
        // Count unique countries and cities
        countries.add(item.country);
        cities.add(item.city);

        // Update yearly stats
        const year = parseInt(item.year);
        if (year) {
          if (!yearCityCounts[year]) {
            yearCityCounts[year] = 0;
          }
          yearCityCounts[year]++;
        }

        // Update continent count (count each country only once per continent)
        const continent = continentMapping[item.country] ||
                          continentMapping[item.countryZH] || 'Antarctica';

        if (!continentCounts[item.country]) {
          continentCounts[item.country] = continent;
          continentData[continent]++;
        }
      });

      visitedCountriesCount = countries.size;
      visitedCitiesCount = cities.size;
      yearlyStats = yearCityCounts;
    }

    console.log("Statistics calculated:", {
      countries: visitedCountriesCount,
      cities: visitedCitiesCount,
      yearlyStats: yearlyStats,
      continentData: continentData
    });

    // Update DOM
    document.getElementById('totalCountriesCount').textContent = visitedCountriesCount;
    document.getElementById('totalCitiesCount').textContent = visitedCitiesCount;

    // Update planned locations count from locations.json
    const locRes = await fetch('/api/locations');
    const locations = await locRes.json();
    const plannedCount = locations.filter(loc =>
      loc.username === savedUser.username && loc.type === 'plan'
    ).length;

    document.getElementById('plannedLocationsCount').textContent = plannedCount;

    // Calculate total distance
    calculateTotalDistance(visitedArr);

    // Create charts
    createYearlyStatsChart(yearlyStats);
    createContinentCoverageChart(continentData);

  } catch (err) {
    console.error("Error updating statistics:", err);
    setDefaultStatistics();
  }
}

/**
 * Set default values when no data available
 */
function setDefaultStatistics() {
  document.getElementById('totalCountriesCount').textContent = '0';
  document.getElementById('totalCitiesCount').textContent = '0';
  document.getElementById('plannedLocationsCount').textContent = '0';
  document.getElementById('totalDistance').textContent = '0';

  // Create empty charts
  createYearlyStatsChart({});
  createContinentCoverageChart({});
}

/**
 * Calculate approximate total travel distance in kilometers
 */
async function calculateTotalDistance(visitedArr) {
  if (!visitedArr || visitedArr.length < 2) {
    document.getElementById('totalDistance').textContent = '0';
    return;
  }

  try {
    // Get coordinates from locations.json
    const locRes = await fetch('/api/locations');
    const locations = await locRes.json();

    // Map visited locations to coordinates
    const coordsArray = [];
    visitedArr.forEach(item => {
      const loc = locations.find(l =>
        l.username === loadDataFromLocal('loggedInUser').username &&
        (l.country === item.country || l.countryZH === item.country) &&
        (l.city === item.city || l.cityZH === item.city)
      );

      if (loc) {
        coordsArray.push({
          lat: loc.latitude,
          lng: loc.longitude,
          year: item.year
        });
      }
    });

    if (coordsArray.length < 2) {
      document.getElementById('totalDistance').textContent = '0';
      return;
    }

    // Sort by year
    coordsArray.sort((a, b) => a.year - b.year);

    let totalDistance = 0;
    for (let i = 0; i < coordsArray.length - 1; i++) {
      totalDistance += calculateHaversineDistance(
        coordsArray[i].lat, coordsArray[i].lng,
        coordsArray[i + 1].lat, coordsArray[i + 1].lng
      );
    }

    document.getElementById('totalDistance').textContent = Math.round(totalDistance).toLocaleString();
  } catch (err) {
    console.error("Error calculating distance:", err);
    document.getElementById('totalDistance').textContent = '0';
  }
}

/**
 * Calculate Haversine distance between two points in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Create yearly statistics chart
 */
function createYearlyStatsChart(yearlyStats) {
  const ctx = document.getElementById('yearlyStatsChart');
  if (!ctx || !ctx.getContext) {
    console.error("Cannot find yearlyStatsChart canvas element");
    return;
  }

  const context = ctx.getContext('2d');

  // If there's an existing chart, destroy it
  if (window.yearlyStatsChart instanceof Chart) {
    window.yearlyStatsChart.destroy();
    window.yearlyStatsChart = null;
  }

  if (!yearlyStats || Object.keys(yearlyStats).length === 0) {
    // Create empty chart
    window.yearlyStatsChart = new Chart(context, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: '已访问城市数',
          data: [],
          backgroundColor: 'rgba(10, 147, 150, 0.7)',
          borderColor: '#0a9396',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
    return;
  }

  // Sort years
  const years = Object.keys(yearlyStats).sort();
  const cityCounts = years.map(year => yearlyStats[year]);

  // Create chart
  window.yearlyStatsChart = new Chart(context, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{
        label: '已访问城市数',
        data: cityCounts,
        backgroundColor: 'rgba(10, 147, 150, 0.7)',
        borderColor: '#0a9396',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

/**
 * Create continent coverage chart
 */
function createContinentCoverageChart(continentData) {
  const ctx = document.getElementById('continentCoverageChart');
  if (!ctx || !ctx.getContext) {
    console.error("Cannot find continentCoverageChart canvas element");
    return;
  }

  const context = ctx.getContext('2d');

  // If there's an existing chart, destroy it
  if (window.continentCoverageChart instanceof Chart) {
    window.continentCoverageChart.destroy();
    window.continentCoverageChart = null;
  }

  // Filter out continents with zero count
  const labels = [];
  const data = [];
  const colors = [
    'rgba(255, 99, 132, 0.7)',   // Red
    'rgba(54, 162, 235, 0.7)',   // Blue
    'rgba(255, 206, 86, 0.7)',   // Yellow
    'rgba(75, 192, 192, 0.7)',   // Teal
    'rgba(153, 102, 255, 0.7)',  // Purple
    'rgba(255, 159, 64, 0.7)',   // Orange
    'rgba(201, 203, 207, 0.7)'   // Grey
  ];

  const continentLabels = {
    'Asia': '亚洲',
    'Europe': '欧洲',
    'North America': '北美洲',
    'South America': '南美洲',
    'Africa': '非洲',
    'Oceania': '大洋洲',
    'Antarctica': '南极洲'
  };

  let colorIndex = 0;
  const selectedColors = [];

  Object.keys(continentData).forEach((continent) => {
    if (continentData[continent] > 0) {
      labels.push(continentLabels[continent] || continent);
      data.push(continentData[continent]);
      selectedColors.push(colors[colorIndex % colors.length]);
      colorIndex++;
    }
  });

  if (data.length === 0) {
    // Create empty chart
    window.continentCoverageChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['暂无数据'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(201, 203, 207, 0.3)']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          title: {
            display: false
          }
        }
      }
    });
    return;
  }

  // Create chart
  window.continentCoverageChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: selectedColors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: false
        }
      }
    }
  });
}

// Expose functions globally
window.updateStatistics = updateStatistics;
window.setDefaultStatistics = setDefaultStatistics;
window.createYearlyStatsChart = createYearlyStatsChart;
window.createContinentCoverageChart = createContinentCoverageChart;