/**
 * statistics.js
 * Handles all travel statistics calculations and visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
  // Call these functions when DOM is ready
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
    
    // Calculate statistics
    updateCountryAndCityStats(userData);
    updatePlannedLocationsCount(userData);
    calculateTotalDistance(userLocations);
    
    // Create charts
    createYearlyStatsChart(userData, userLocations);
    createContinentCoverageChart(userData);
    
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
  createYearlyStatsChart(null, null);
  createContinentCoverageChart(null);
}

/**
 * Update country and city statistics
 */
function updateCountryAndCityStats(userData) {
  const visitedCountries = userData.visitedCountries || [];
  const countriesCount = visitedCountries.length;
  
  // Calculate unique cities
  let uniqueCities = new Set();
  visitedCountries.forEach(country => {
    country.cities.forEach(city => {
      uniqueCities.add(city.city);
    });
  });
  
  const citiesCount = uniqueCities.size;
  
  // Update DOM
  document.getElementById('totalCountriesCount').textContent = countriesCount;
  document.getElementById('totalCitiesCount').textContent = citiesCount;
}

/**
 * Update planned locations count
 */
function updatePlannedLocationsCount(userData) {
  const plannedCount = (userData.travelPlans || []).length;
  document.getElementById('plannedLocationsCount').textContent = plannedCount;
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
function createYearlyStatsChart(userData, locations) {
  const ctx = document.getElementById('yearlyStatsChart').getContext('2d');
  
  // If there's an existing chart, destroy it
  if (window.yearlyStatsChart) {
    window.yearlyStatsChart.destroy();
  }
  
  if (!userData || !locations || locations.length === 0) {
    // Create empty chart
    window.yearlyStatsChart = new Chart(ctx, {
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
  
  // Process data for chart
  const visitedCountries = userData.visitedCountries || [];
  
  // Count cities per year
  const yearData = {};
  visitedCountries.forEach(country => {
    const year = country.year;
    if (!yearData[year]) {
      yearData[year] = 0;
    }
    yearData[year] += country.cities.length;
  });
  
  // Sort years
  const years = Object.keys(yearData).sort();
  const cityCounts = years.map(year => yearData[year]);
  
  // Create chart
  window.yearlyStatsChart = new Chart(ctx, {
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
function createContinentCoverageChart(userData) {
  const ctx = document.getElementById('continentCoverageChart').getContext('2d');
  
  // If there's an existing chart, destroy it
  if (window.continentCoverageChart) {
    window.continentCoverageChart.destroy();
  }
  
  if (!userData) {
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
  
  // Process data for chart
  const visitedCountries = userData.visitedCountries || [];
  
  // Map countries to continents (simplified)
  const continentMapping = {
    // Asia
    'China': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia', 'Thailand': 'Asia', 
    'Vietnam': 'Asia', 'Singapore': 'Asia', 'Malaysia': 'Asia', 'Indonesia': 'Asia',
    'India': 'Asia', 'Nepal': 'Asia', 'Philippines': 'Asia', 'Cambodia': 'Asia',
    
    // Europe
    'France': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe', 'Germany': 'Europe',
    'United Kingdom': 'Europe', 'Greece': 'Europe', 'Switzerland': 'Europe',
    'Netherlands': 'Europe', 'Sweden': 'Europe', 'Norway': 'Europe',
    
    // North America
    'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
    
    // South America
    'Brazil': 'South America', 'Argentina': 'South America', 'Peru': 'South America',
    'Chile': 'South America', 'Colombia': 'South America',
    
    // Africa
    'Egypt': 'Africa', 'South Africa': 'Africa', 'Morocco': 'Africa', 
    'Kenya': 'Africa', 'Tanzania': 'Africa',
    
    // Oceania
    'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Fiji': 'Oceania'
  };
  
  // Count countries per continent
  const continentData = {
    'Asia': 0,
    'Europe': 0,
    'North America': 0,
    'South America': 0,
    'Africa': 0,
    'Oceania': 0,
    'Other': 0
  };
  
  visitedCountries.forEach(country => {
    const continent = continentMapping[country.country] || 'Other';
    continentData[continent]++;
  });
  
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

// Dispatch custom events when data is updated
function dispatchUpdateEvent(eventName) {
  const event = new CustomEvent(eventName);
  document.dispatchEvent(event);
}

// Make these functions globally available
window.updateStatistics = updateStatistics;
window.dispatchUpdateEvent = dispatchUpdateEvent;
