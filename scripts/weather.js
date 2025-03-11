/**
 * weather.js
 * Handles weather information display for Travel Tracker
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize weather components
  initializeWeather();
  
  // Load weather locations based on user data
  loadWeatherLocations();
});

/**
 * Initialize weather components and event listeners
 */
function initializeWeather() {
  // Weather location select
  const locationSelect = document.getElementById('weatherLocationSelect');
  if (locationSelect) {
    locationSelect.addEventListener('change', fetchWeatherForSelectedLocation);
  }
  
  // Weather type tabs
  const weatherTabs = document.querySelectorAll('.weather-tab');
  if (weatherTabs) {
    weatherTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        weatherTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding weather content
        const weatherType = tab.getAttribute('data-type');
        showWeatherContent(weatherType);
      });
    });
  }
}

/**
 * Load available locations for weather display
 */
async function loadWeatherLocations() {
  try {
    const savedUser = loadDataFromLocal('loggedInUser');
    if (!savedUser || !savedUser.username) {
      showPlaceholderWeather("请先登录，再查看天气");
      return;
    }
    
    // Fetch user locations
    let locRes;
    try {
      locRes = await fetch('/api/locations');
    } catch (err) {
      showPlaceholderWeather("无法获取地点数据");
      return;
    }
    
    const locations = await locRes.json();
    const userLocations = locations.filter(loc => loc.username === savedUser.username);
    
    if (userLocations.length === 0) {
      showPlaceholderWeather("暂无地点数据，请先添加地点");
      return;
    }
    
    // Populate location select
    const locationSelect = document.getElementById('weatherLocationSelect');
    locationSelect.innerHTML = '<option value="" disabled selected>选择地点</option>';
    
    userLocations.forEach(loc => {
      const option = document.createElement('option');
      option.value = JSON.stringify({ lat: loc.latitude, lon: loc.longitude, name: loc.cityZH || loc.city });
      option.textContent = `${loc.countryZH || loc.country} - ${loc.cityZH || loc.city}`;
      locationSelect.appendChild(option);
    });
    
  } catch (err) {
    console.error("Error loading weather locations:", err);
    showPlaceholderWeather("加载地点数据时出错");
  }
}

/**
 * Show placeholder message in weather section
 */
function showPlaceholderWeather(message) {
  const currentWeather = document.getElementById('currentWeather');
  const forecastWeather = document.getElementById('forecastWeather');
  
  if (currentWeather) {
    currentWeather.innerHTML = `
      <div class="weather-card-placeholder">
        <i class="fas fa-cloud-sun"></i>
        <p>${message}</p>
      </div>
    `;
  }
  
  if (forecastWeather) {
    forecastWeather.innerHTML = `
      <div class="weather-card-placeholder">
        <i class="fas fa-cloud-sun-rain"></i>
        <p>${message}</p>
      </div>
    `;
  }
}

/**
 * Fetch weather data for selected location
 */
async function fetchWeatherForSelectedLocation() {
  const locationSelect = document.getElementById('weatherLocationSelect');
  const selectedOption = locationSelect.value;
  
  if (!selectedOption) {
    showPlaceholderWeather("请选择一个地点");
    return;
  }
  
  try {
    const locationData = JSON.parse(selectedOption);
    
    // Show loading state
    showPlaceholderWeather("正在获取天气数据...");
    
    // In a real application, you would fetch from a real weather API like OpenWeatherMap
    // For this demo, we'll simulate weather data
    setTimeout(() => {
      const weatherData = generateDemoWeatherData(locationData.name);
      displayWeatherData(weatherData);
    }, 800);
    
  } catch (err) {
    console.error("Error fetching weather:", err);
    showPlaceholderWeather("获取天气数据时出错");
  }
}

/**
 * Generate demo weather data (in a real app, this would come from an API)
 */
function generateDemoWeatherData(locationName) {
  const currentDate = new Date();
  const temperatures = [22, 24, 21, 23, 25, 20, 19];
  const conditions = ['晴天', '多云', '阴天', '小雨', '雷阵雨', '晴转多云', '多云转晴'];
  const icons = ['sun', 'cloud-sun', 'cloud', 'cloud-rain', 'cloud-bolt', 'cloud-sun', 'sun'];
  
  // Current weather
  const currentTemp = temperatures[Math.floor(Math.random() * temperatures.length)];
  const currentConditionIndex = Math.floor(Math.random() * conditions.length);
  
  const current = {
    temperature: currentTemp,
    feels_like: currentTemp - 2 + Math.floor(Math.random() * 4),
    humidity: 40 + Math.floor(Math.random() * 40),
    wind_speed: 1 + Math.floor(Math.random() * 10),
    condition: conditions[currentConditionIndex],
    icon: icons[currentConditionIndex]
  };
  
  // Forecast for next 5 days
  const forecast = [];
  for (let i = 0; i < 5; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(currentDate.getDate() + i + 1);
    
    const conditionIndex = Math.floor(Math.random() * conditions.length);
    
    forecast.push({
      date: forecastDate,
      temperature: {
        min: 15 + Math.floor(Math.random() * 10),
        max: 20 + Math.floor(Math.random() * 10)
      },
      condition: conditions[conditionIndex],
      icon: icons[conditionIndex]
    });
  }
  
  return {
    location: locationName,
    current: current,
    forecast: forecast,
    last_updated: new Date()
  };
}

/**
 * Display weather data
 */
function displayWeatherData(weatherData) {
  const currentWeather = document.getElementById('currentWeather');
  const forecastWeather = document.getElementById('forecastWeather');
  
  if (!currentWeather || !forecastWeather) return;
  
  // Display current weather
  currentWeather.innerHTML = `
    <div class="weather-card">
      <div class="weather-location">
        <h3>${weatherData.location}</h3>
        <p>更新于: ${weatherData.last_updated.toLocaleTimeString()}</p>
      </div>
      
      <div class="weather-current">
        <div class="weather-temp-main">
          <i class="fas fa-${weatherData.current.icon}"></i>
          <span class="temperature">${Math.round(weatherData.current.temperature)}°C</span>
        </div>
        
        <div class="weather-details">
          <p class="weather-condition">${weatherData.current.condition}</p>
          <p>体感温度: ${Math.round(weatherData.current.feels_like)}°C</p>
          <p>湿度: ${weatherData.current.humidity}%</p>
          <p>风速: ${weatherData.current.wind_speed} km/h</p>
        </div>
      </div>
    </div>
  `;
  
  // Display forecast
  let forecastHTML = '';
  
  weatherData.forecast.forEach(day => {
    const dayName = day.date.toLocaleDateString('zh-CN', { weekday: 'short' });
    const date = day.date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    
    forecastHTML += `
      <div class="forecast-day">
        <div class="forecast-date">${dayName} ${date}</div>
        <div class="forecast-icon"><i class="fas fa-${day.icon}"></i></div>
        <div class="forecast-temp">${Math.round(day.temperature.max)}°</div>
        <div class="forecast-temp-min">${Math.round(day.temperature.min)}°</div>
        <div class="forecast-desc">${day.condition}</div>
      </div>
    `;
  });
  
  forecastWeather.innerHTML = forecastHTML;
  
  // Show current weather by default
  showWeatherContent('current');
}

/**
 * Show weather content based on type
 */
function showWeatherContent(type) {
  const currentWeather = document.getElementById('currentWeather');
  const forecastWeather = document.getElementById('forecastWeather');
  
  if (type === 'current') {
    currentWeather.style.display = 'block';
    forecastWeather.style.display = 'none';
  } else {
    currentWeather.style.display = 'none';
    forecastWeather.style.display = 'grid';
  }
}

// Add weather-specific styles
document.addEventListener('DOMContentLoaded', () => {
  const weatherStyles = document.createElement('style');
  weatherStyles.textContent = `
    .weather-card {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .weather-location {
      border-bottom: 1px solid #eee;
      padding-bottom: 1rem;
    }
    
    .weather-location h3 {
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
      color: #333;
    }
    
    .weather-location p {
      color: #666;
      font-size: 0.9rem;
    }
    
    .weather-current {
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    
    .weather-temp-main {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    
    .weather-temp-main i {
      font-size: 3rem;
      color: #0a9396;
    }
    
    .weather-temp-main .temperature {
      font-size: 2.5rem;
      font-weight: 700;
    }
    
    .weather-details {
      flex: 1;
    }
    
    .weather-condition {
      font-size: 1.2rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    
    .weather-details p {
      margin-bottom: 0.5rem;
      color: #666;
    }
    
    @media (max-width: 768px) {
      .weather-current {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      
      .weather-details {
        text-align: center;
      }
    }
  `;
  document.head.appendChild(weatherStyles);
});

// Export functions for global access
window.loadWeatherLocations = loadWeatherLocations;
window.initializeWeather = initializeWeather;
