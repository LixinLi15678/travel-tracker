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
    
    // Fetch locations
    const locRes = await fetch('/api/locations');
    const locations = await locRes.json();
    const userLocations = locations.filter(loc => loc.username === savedUser.username);
    
    // Process statistics based on data structure
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
      'Other': 0
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

    // Check which data structure is being used
    if (Array.isArray(userData.visitedCountries) && userData.visitedCountries.length > 0) {
      // Using nested structure
      visitedCountriesCount = userData.visitedCountries.length;
      
      // Count unique cities
      let uniqueCities = new Set();
      userData.visitedCountries.forEach(country => {
        // Update continent count
        const continent = continentMapping[country.country] || 
                          continentMapping[country.countryZH] || 'Other';
        continentData[continent]++;
        
        // Update yearly stats
        if (!yearlyStats[country.year]) {
          yearlyStats[country.year] = 0;
        }
        
        if (Array.isArray(country.cities)) {
          yearlyStats[country.year] += country.cities.length;
          country.cities.forEach(city => {
            uniqueCities.add(city.city);
          });
        }
      });
      
      visitedCitiesCount = uniqueCities.size;
    } else if (Array.isArray(userData.visitedCities) && userData.visitedCities.length > 0) {
      // Using flat structure
      const countries = new Set();
      const cities = new Set();
      const yearCityCounts = {};
      
      userData.visitedCities.forEach(visit => {
        countries.add(visit.country);
        cities.add(visit.city);
        
        // Update continent count
        const continent = continentMapping[visit.country] || 
                          continentMapping[visit.countryZH] || 'Other';
        continentData[continent]++;
        
        // Update yearly stats
        const year = visit.year;
        if (!yearCityCounts[year]) {
          yearCityCounts[year] = 0;
        }
        yearCityCounts[year]++;
      });
      
      visitedCountriesCount = countries.size;
      visitedCitiesCount = cities.size;
      yearlyStats = yearCityCounts;
    } else {
      // Try to get data directly from locations
      const visitedLocations = userLocations.filter(loc => loc.type === 'visited');
      
      if (visitedLocations.length > 0) {
        const countries = new Set();
        const cities = new Set();
        const yearCityCounts = {};
        
        visitedLocations.forEach(loc => {
          countries.add(loc.country);
          cities.add(loc.city);
          
          // Update continent count
          const continent = continentMapping[loc.country] || 
                            continentMapping[loc.countryZH] || 'Other';
          continentData[continent]++;
          
          // Update yearly stats
          const year = loc.year;
          if (year) {
            if (!yearCityCounts[year]) {
              yearCityCounts[year] = 0;
            }
            yearCityCounts[year]++;
          }
        });
        
        visitedCountriesCount = countries.size;
        visitedCitiesCount = cities.size;
        yearlyStats = yearCityCounts;
      }
    }
    
    // Update DOM with proper error handling
    const totalCountriesCountEl = document.getElementById('totalCountriesCount');
    const totalCitiesCountEl = document.getElementById('totalCitiesCount');
    const plannedLocationsCountEl = document.getElementById('plannedLocationsCount');
    
    if (totalCountriesCountEl) totalCountriesCountEl.textContent = visitedCountriesCount;
    if (totalCitiesCountEl) totalCitiesCountEl.textContent = visitedCitiesCount;
    
    // Update planned locations count
    let plannedCount = Array.isArray(userData.travelPlans) ? userData.travelPlans.length : 0;
    
    // If no travel plans found in userData, check locations
    if (plannedCount === 0) {
      plannedCount = userLocations.filter(loc => loc.type === 'plan').length;
    }
    
    if (plannedLocationsCountEl) plannedLocationsCountEl.textContent = plannedCount;
    
    // Calculate total distance
    calculateTotalDistance(userLocations);
    
    // Create charts with error handling
    try {
      createYearlyStatsChart(yearlyStats);
    } catch (err) {
      console.error("Error creating yearly stats chart:", err);
      // Create empty chart as fallback
      createYearlyStatsChart({});
    }
    
    try {
      createContinentCoverageChart(continentData);
    } catch (err) {
      console.error("Error creating continent coverage chart:", err);
      // Create empty chart as fallback
      createContinentCoverageChart({});
    }
    
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
function calculateTotalDistance(locations) {
  if (!locations || locations.length < 2) {
    document.getElementById('totalDistance').textContent = '0';
    return;
  }
  
  const visitedLocations = locations.filter(loc => loc.type === 'visited');
  if (visitedLocations.length < 2) {
    document.getElementById('totalDistance').textContent = '0';
    return;
  }
  
  // Sort locations by year
  visitedLocations.sort((a, b) => a.year - b.year);
  
  let totalDistance = 0;
  for (let i = 0; i < visitedLocations.length - 1; i++) {
    const loc1 = visitedLocations[i];
    const loc2 = visitedLocations[i + 1];
    
    totalDistance += calculateHaversineDistance(
      loc1.latitude, loc1.longitude,
      loc2.latitude, loc2.longitude
    );
  }
  
  document.getElementById('totalDistance').textContent = Math.round(totalDistance).toLocaleString();
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
    console.error("Cannot find yearlyStatsChart canvas element or getContext is not available");
    return;
  }
  
  const context = ctx.getContext('2d');
  
  // If there's an existing chart, destroy it properly
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
    console.error("Cannot find continentCoverageChart canvas element or getContext is not available");
    return;
  }
  
  const context = ctx.getContext('2d');
  
  // If there's an existing chart, destroy it properly
  if (window.continentCoverageChart instanceof Chart) {
    window.continentCoverageChart.destroy();
    window.continentCoverageChart = null;
  }
  
  if (!continentData || Object.values(continentData).every(v => v === 0)) {
    // Create empty chart
    window.continentCoverageChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: []
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          }
        }
      }
    });
    return;
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
  
  Object.keys(continentData).forEach((continent, index) => {
    if (continentData[continent] > 0) {
      labels.push(continent);
      data.push(continentData[continent]);
    }
  });
  
  // Create chart
  window.continentCoverageChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, data.length)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
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