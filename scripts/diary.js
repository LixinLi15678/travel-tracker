/**
 * diary.js
 * Handles travel diary functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize diary components
  initializeDiary();
  
  // Load diary entries
  loadDiaryEntries();
});

/**
 * Initialize diary components and event listeners
 */
function initializeDiary() {
  // New diary button
  const newDiaryBtn = document.getElementById('newDiaryBtn');
  if (newDiaryBtn) {
    newDiaryBtn.addEventListener('click', openDiaryEditor);
  }
  
  // Cancel button
  const cancelDiaryBtn = document.getElementById('cancelDiaryBtn');
  if (cancelDiaryBtn) {
    cancelDiaryBtn.addEventListener('click', cancelDiaryEdit);
  }
  
  // Save button
  const saveDiaryBtn = document.getElementById('saveDiaryBtn');
  if (saveDiaryBtn) {
    saveDiaryBtn.addEventListener('click', saveDiaryEntry);
  }
  
  // Year filter
  const yearFilter = document.getElementById('diaryYearFilter');
  if (yearFilter) {
    yearFilter.addEventListener('change', () => {
      loadDiaryEntries();
      
      // Update country filter options
      updateDiaryCountryFilter(yearFilter.value);
    });
  }
  
  // Country filter
  const countryFilter = document.getElementById('diaryCountryFilter');
  if (countryFilter) {
    countryFilter.addEventListener('change', () => {
      loadDiaryEntries();
    });
  }
  
  // Search input
  const searchInput = document.getElementById('diarySearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      loadDiaryEntries();
    }, 300));
  }
  
  // Year select in editor
  const yearSelect = document.getElementById('diaryYear');
  if (yearSelect) {
    yearSelect.addEventListener('change', () => {
      updateDiaryCountrySelect(yearSelect.value);
    });
  }
  
  // Country select in editor
  const countrySelect = document.getElementById('diaryCountry');
  if (countrySelect) {
    countrySelect.addEventListener('change', () => {
      updateDiaryCitySelect(
        document.getElementById('diaryYear').value,
        countrySelect.value
      );
    });
  }
}

/**
 * Debounce function to limit how often a function is called
 */
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Load diary entries based on filters
 */
async function loadDiaryEntries() {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    showEmptyDiaryList('请先登录，再查看日记');
    return;
  }
  
  try {
    // Update filter options
    await updateDiaryFilterOptions();
    
    // Get selected filters
    const yearFilter = document.getElementById('diaryYearFilter').value;
    const countryFilter = document.getElementById('diaryCountryFilter').value;
    const searchTerm = document.getElementById('diarySearchInput').value.trim().toLowerCase();
    
    // Fetch diary entries
    let diaryRes;
    try {
      diaryRes = await fetch('/api/diaries');
    } catch (err) {
      // Diary API endpoint might not exist yet
      showEmptyDiaryList('暂无日记，或日记 API 尚未实现');
      return;
    }
    
    const diaries = await diaryRes.json();
    
    // Filter diary entries
    const filteredDiaries = diaries.filter(diary => 
      diary.username === savedUser.username &&
      (yearFilter === 'all' || diary.year == yearFilter) &&
      (countryFilter === 'all' || diary.country === countryFilter) &&
      (!searchTerm || 
        diary.title.toLowerCase().includes(searchTerm) ||
        diary.content.toLowerCase().includes(searchTerm) ||
        diary.country.toLowerCase().includes(searchTerm) ||
        diary.city.toLowerCase().includes(searchTerm) ||
        (diary.countryZH && diary.countryZH.toLowerCase().includes(searchTerm)) ||
        (diary.cityZH && diary.cityZH.toLowerCase().includes(searchTerm))
      )
    );
    
    // Sort by date (newest first)
    filteredDiaries.sort((a, b) => b.timestamp - a.timestamp);
    
    // Render diary list
    renderDiaryList(filteredDiaries);
    
  } catch (err) {
    console.error("Error loading diary entries:", err);
    showEmptyDiaryList('加载日记时出错');
  }
}

/**
 * Show empty diary list with message
 */
function showEmptyDiaryList(message) {
  const diaryListEl = document.getElementById('diaryList');
  if (!diaryListEl) return;
  
  diaryListEl.innerHTML = `<li class="diary-empty">${message}</li>`;
  
  // Clear diary view
  const diaryViewEl = document.getElementById('diaryView');
  if (diaryViewEl) {
    diaryViewEl.innerHTML = `
      <div class="diary-placeholder">
        <i class="fas fa-book-open"></i>
        <p>${message}</p>
      </div>
    `;
  }
}

/**
 * Render diary list
 */
function renderDiaryList(diaries) {
  const diaryListEl = document.getElementById('diaryList');
  if (!diaryListEl) return;
  
  if (!diaries || diaries.length === 0) {
    showEmptyDiaryList('暂无日记');
    return;
  }
  
  diaryListEl.innerHTML = '';
  
  diaries.forEach(diary => {
    const diaryItem = document.createElement('li');
    diaryItem.dataset.id = diary.id;
    
    // Get mood icon
    let moodIcon = '';
    switch (diary.mood) {
      case 'happy':
        moodIcon = '<i class="fas fa-smile"></i>';
        break;
      case 'excited':
        moodIcon = '<i class="fas fa-grin-stars"></i>';
        break;
      case 'relaxed':
        moodIcon = '<i class="fas fa-smile-beam"></i>';
        break;
      case 'tired':
        moodIcon = '<i class="fas fa-tired"></i>';
        break;
      case 'sad':
        moodIcon = '<i class="fas fa-frown"></i>';
        break;
      default:
        moodIcon = '<i class="fas fa-smile"></i>';
    }
    
    diaryItem.innerHTML = `
      <div class="diary-item-title">${diary.title}</div>
      <div class="diary-item-meta">
        <span>${diary.cityZH || diary.city}, ${diary.year}</span>
        <span class="diary-item-mood">${moodIcon}</span>
      </div>
    `;
    
    diaryItem.addEventListener('click', () => {
      // Remove active class from all items
      const items = diaryListEl.querySelectorAll('li');
      items.forEach(item => item.classList.remove('active'));
      
      // Add active class to clicked item
      diaryItem.classList.add('active');
      
      // Show diary content
      viewDiaryEntry(diary);
    });
    
    diaryListEl.appendChild(diaryItem);
  });
  
  // Automatically select the first diary
  if (diaries.length > 0) {
    const firstItem = diaryListEl.querySelector('li');
    if (firstItem) {
      firstItem.classList.add('active');
      viewDiaryEntry(diaries[0]);
    }
  }
}

/**
 * View diary entry
 */
function viewDiaryEntry(diary) {
  const diaryViewEl = document.getElementById('diaryView');
  const diaryEditorEl = document.getElementById('diaryEditor');
  
  if (!diaryViewEl || !diaryEditorEl) return;
  
  // Hide editor, show view
  diaryEditorEl.style.display = 'none';
  diaryViewEl.style.display = 'block';
  
  // Format date
  const date = new Date(diary.timestamp);
  const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  
  // Get mood icon and text
  let moodIcon = '';
  let moodText = '';
  switch (diary.mood) {
    case 'happy':
      moodIcon = '<i class="fas fa-smile"></i>';
      moodText = '开心';
      break;
    case 'excited':
      moodIcon = '<i class="fas fa-grin-stars"></i>';
      moodText = '兴奋';
      break;
    case 'relaxed':
      moodIcon = '<i class="fas fa-smile-beam"></i>';
      moodText = '放松';
      break;
    case 'tired':
      moodIcon = '<i class="fas fa-tired"></i>';
      moodText = '疲惫';
      break;
    case 'sad':
      moodIcon = '<i class="fas fa-frown"></i>';
      moodText = '难过';
      break;
    default:
      moodIcon = '<i class="fas fa-smile"></i>';
      moodText = '开心';
  }
  
  diaryViewEl.innerHTML = `
    <div class="diary-view-header">
      <h2 class="diary-view-title">${diary.title}</h2>
      <div class="diary-view-meta">
        <span>${diary.cityZH || diary.city}, ${diary.countryZH || diary.country} · ${diary.year}年</span>
        <span>${formattedDate} · ${moodIcon} ${moodText}</span>
      </div>
    </div>
    
    <div class="diary-view-content">
      ${diary.content}
    </div>
    
    <div class="diary-view-actions">
      <button class="btn-primary btn-small" onclick="editDiaryEntry('${diary.id}')">
        <i class="fas fa-edit"></i> 编辑
      </button>
      <button class="btn-danger btn-small" onclick="deleteDiaryEntry('${diary.id}')">
        <i class="fas fa-trash"></i> 删除
      </button>
    </div>
  `;
}

/**
 * Open diary editor
 */
async function openDiaryEditor() {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    alert('请先登录，再写日记');
    return;
  }
  
  // Show editor, hide view
  document.getElementById('diaryView').style.display = 'none';
  document.getElementById('diaryEditor').style.display = 'block';
  
  // Set editor title
  document.getElementById('diaryEditorTitle').textContent = '写新日记';
  
  // Clear form
  document.getElementById('diaryForm').reset();
  document.getElementById('diaryId').value = '';
  
  try {
    // Fetch user data to get visited countries and years
    const res = await fetch('/api/user-data');
    const data = await res.json();
    
    if (!data.users[savedUser.username]) {
      alert('没有找到您的旅行记录，请先添加访问记录');
      return;
    }
    
    const visitedCountries = data.users[savedUser.username].visitedCountries || [];
    
    if (visitedCountries.length === 0) {
      alert('您还没有记录任何访问地点，请先添加访问记录');
      cancelDiaryEdit();
      return;
    }
    
    // Populate year select
    const yearSelect = document.getElementById('diaryYear');
    yearSelect.innerHTML = '';
    
    const years = visitedCountries.map(country => country.year)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => b - a); // Descending order
    
    years.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
    
    // Update country options based on selected year
    updateDiaryCountrySelect(years[0]);
    
  } catch (err) {
    console.error("Error opening diary editor:", err);
    alert('加载数据时出错，请稍后再试');
    cancelDiaryEdit();
  }
}

/**
 * Update country select in diary editor
 */
async function updateDiaryCountrySelect(year) {
  const savedUser = loadDataFromLocal('loggedInUser');
  const countrySelect = document.getElementById('diaryCountry');
  
  if (!savedUser || !savedUser.username || !countrySelect) {
    return;
  }
  
  try {
    const res = await fetch('/api/user-data');
    const data = await res.json();
    
    if (!data.users[savedUser.username]) {
      return;
    }
    
    const visitedCountries = data.users[savedUser.username].visitedCountries || [];
    const countriesForYear = visitedCountries.filter(country => country.year == year);
    
    countrySelect.innerHTML = '';
    
    countriesForYear.forEach(country => {
      const option = document.createElement('option');
      option.value = country.country;
      option.textContent = `${country.countryZH} (${country.country})`;
      countrySelect.appendChild(option);
    });
    
    // Update city options for the first country
    if (countriesForYear.length > 0) {
      updateDiaryCitySelect(year, countriesForYear[0].country);
    } else {
      document.getElementById('diaryCity').innerHTML = '';
    }
    
  } catch (err) {
    console.error("Error updating country options:", err);
  }
}

/**
 * Update city select in diary editor
 */
async function updateDiaryCitySelect(year, country) {
  const savedUser = loadDataFromLocal('loggedInUser');
  const citySelect = document.getElementById('diaryCity');
  
  if (!savedUser || !savedUser.username || !citySelect) {
    return;
  }
  
  try {
    const res = await fetch('/api/user-data');
    const data = await res.json();
    
    if (!data.users[savedUser.username]) {
      return;
    }
    
    const visitedCountries = data.users[savedUser.username].visitedCountries || [];
    const countryData = visitedCountries.find(c => c.year == year && c.country === country);
    
    citySelect.innerHTML = '';
    
    if (countryData && countryData.cities) {
      countryData.cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.city;
        option.textContent = `${city.cityZH} (${city.city})`;
        citySelect.appendChild(option);
      });
    }
    
  } catch (err) {
    console.error("Error updating city options:", err);
  }
}

/**
 * Update diary filter options
 */
async function updateDiaryFilterOptions() {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    return;
  }
  
  try {
    // Fetch diaries
    const diaryRes = await fetch('/api/diaries');
    const diaries = await diaryRes.json();
    
    // Filter diaries by current user
    const userDiaries = diaries.filter(diary => diary.username === savedUser.username);
    
    if (userDiaries.length === 0) {
      return;
    }
    
    // Get unique years and countries
    const years = [...new Set(userDiaries.map(diary => diary.year))].sort((a, b) => b - a);
    const countries = [...new Set(userDiaries.map(diary => diary.country))].sort();
    
    // Populate year filter
    const yearFilter = document.getElementById('diaryYearFilter');
    if (yearFilter) {
      // Keep the first option (all)
      const allOption = yearFilter.querySelector('option[value="all"]');
      yearFilter.innerHTML = '';
      yearFilter.appendChild(allOption);
      
      years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
      });
    }
    
    // Populate country filter
    updateDiaryCountryFilter('all', countries);
    
  } catch (err) {
    console.error("Error updating diary filter options:", err);
  }
}

/**
 * Update country filter options in diary list
 */
async function updateDiaryCountryFilter(year, presetCountries = null) {
  const savedUser = loadDataFromLocal('loggedInUser');
  const countryFilter = document.getElementById('diaryCountryFilter');
  
  if (!savedUser || !savedUser.username || !countryFilter) {
    return;
  }
  
  try {
    let countries = presetCountries;
    
    // If countries not provided, fetch them
    if (!countries) {
      const diaryRes = await fetch('/api/diaries');
      const diaries = await diaryRes.json();
      
      // Filter diaries by current user and year
      const filteredDiaries = diaries.filter(diary => 
        diary.username === savedUser.username &&
        (year === 'all' || diary.year == year)
      );
      
      // Get unique countries
      countries = [...new Set(filteredDiaries.map(diary => diary.country))].sort();
    }
    
    // Keep the first option (all)
    const allOption = countryFilter.querySelector('option[value="all"]');
    countryFilter.innerHTML = '';
    countryFilter.appendChild(allOption);
    
    // Populate countries
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country;
      
      // Find country display name from diaries
      const diary = diaries.find(d => 
        d.username === savedUser.username && d.country === country
      );
      
      const displayName = diary && diary.countryZH
        ? `${diary.countryZH} (${country})`
        : country;
      
      option.textContent = displayName;
      countryFilter.appendChild(option);
    });
    
  } catch (err) {
    console.error("Error updating diary country filter:", err);
  }
}

/**
 * Cancel diary edit and return to view
 */
function cancelDiaryEdit() {
  document.getElementById('diaryEditor').style.display = 'none';
  document.getElementById('diaryView').style.display = 'block';
}

/**
 * Save diary entry
 */
async function saveDiaryEntry() {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    alert('请先登录，再保存日记');
    return;
  }
  
  // Get form values
  const diaryId = document.getElementById('diaryId').value;
  const title = document.getElementById('diaryTitle').value;
  const year = document.getElementById('diaryYear').value;
  const country = document.getElementById('diaryCountry').value;
  const city = document.getElementById('diaryCity').value;
  const content = document.getElementById('diaryContent').value;
  const mood = document.querySelector('input[name="diaryMood"]:checked').value;
  
  if (!title || !year || !country || !city || !content) {
    alert('请填写所有必填字段');
    return;
  }
  
  try {
    // Create diary data
    const diaryData = {
      id: diaryId || Date.now().toString(),
      username: savedUser.username,
      title,
      year: parseInt(year),
      country,
      city,
      content,
      mood,
      timestamp: Date.now()
    };
    
    // Add country/city translations
    try {
      const res = await fetch('/api/user-data');
      const data = await res.json();
      
      if (data.users && data.users[savedUser.username]) {
        const visitedCountries = data.users[savedUser.username].visitedCountries || [];
        const countryData = visitedCountries.find(c => c.country === country && c.year == year);
        
        if (countryData) {
          diaryData.countryZH = countryData.countryZH;
          
          const cityData = countryData.cities.find(c => c.city === city);
          if (cityData) {
            diaryData.cityZH = cityData.cityZH;
          }
        }
      }
    } catch (err) {
      console.warn("Error fetching translations:", err);
    }
    
    // Save diary
    const saveRes = await fetch('/api/diaries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(diaryData)
    });
    
    const result = await saveRes.json();
    if (result.success) {
      // Hide editor
      cancelDiaryEdit();
      
      // Reload diary entries
      loadDiaryEntries();
      
      // Show success message
      alert(diaryId ? '日记已更新' : '日记已保存');
    } else {
      alert('保存日记失败：' + (result.message || '未知错误'));
    }
    
  } catch (err) {
    // Diary API might not exist yet
    console.error("Error saving diary:", err);
    alert('保存日记时出错，可能是因为 Diary API 尚未实现');
    
    // Hide editor anyway
    cancelDiaryEdit();
  }
}

/**
 * Edit diary entry
 */
async function editDiaryEntry(diaryId) {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    alert('请先登录，再编辑日记');
    return;
  }
  
  try {
    // Fetch diary
    const diaryRes = await fetch(`/api/diaries/${diaryId}`);
    const result = await diaryRes.json();
    
    if (!result.success || !result.diary) {
      alert('获取日记失败：' + (result.message || '未知错误'));
      return;
    }
    
    const diary = result.diary;
    
    // Show editor
    document.getElementById('diaryView').style.display = 'none';
    document.getElementById('diaryEditor').style.display = 'block';
    
    // Set editor title
    document.getElementById('diaryEditorTitle').textContent = '编辑日记';
    
    // Populate form
    document.getElementById('diaryId').value = diary.id;
    document.getElementById('diaryTitle').value = diary.title;
    document.getElementById('diaryContent').value = diary.content;
    
    // Set mood
    const moodRadio = document.querySelector(`input[name="diaryMood"][value="${diary.mood}"]`);
    if (moodRadio) {
      moodRadio.checked = true;
    }
    
    // Populate selects
    await updateDiaryYearSelect(diary.year);
    await updateDiaryCountrySelect(diary.year, diary.country);
    await updateDiaryCitySelect(diary.year, diary.country, diary.city);
    
  } catch (err) {
    console.error("Error editing diary:", err);
    alert('获取日记时出错，请稍后再试');
  }
}

/**
 * Update year select in diary editor with preselected value
 */
async function updateDiaryYearSelect(selectedYear) {
  const savedUser = loadDataFromLocal('loggedInUser');
  const yearSelect = document.getElementById('diaryYear');
  
  if (!savedUser || !savedUser.username || !yearSelect) {
    return;
  }
  
  try {
    const res = await fetch('/api/user-data');
    const data = await res.json();
    
    if (!data.users[savedUser.username]) {
      return;
    }
    
    const visitedCountries = data.users[savedUser.username].visitedCountries || [];
    
    yearSelect.innerHTML = '';
    
    const years = visitedCountries.map(country => country.year)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => b - a);
    
    years.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      if (year == selectedYear) {
        option.selected = true;
      }
      yearSelect.appendChild(option);
    });
    
  } catch (err) {
    console.error("Error updating year select:", err);
  }
}

/**
 * Update country select in diary editor with preselected value
 */
async function updateDiaryCountrySelect(year, selectedCountry) {
  const savedUser = loadDataFromLocal('loggedInUser');
  const countrySelect = document.getElementById('diaryCountry');
  
  if (!savedUser || !savedUser.username || !countrySelect) {
    return;
  }
  
  try {
    const res = await fetch('/api/user-data');
    const data = await res.json();
    
    if (!data.users[savedUser.username]) {
      return;
    }
    
    const visitedCountries = data.users[savedUser.username].visitedCountries || [];
    const countriesForYear = visitedCountries.filter(country => country.year == year);
    
    countrySelect.innerHTML = '';
    
    countriesForYear.forEach(country => {
      const option = document.createElement('option');
      option.value = country.country;
      option.textContent = `${country.countryZH} (${country.country})`;
      if (country.country === selectedCountry) {
        option.selected = true;
      }
      countrySelect.appendChild(option);
    });
    
  } catch (err) {
    console.error("Error updating country select:", err);
  }
}

/**
 * Update city select in diary editor with preselected value
 */
async function updateDiaryCitySelect(year, country, selectedCity) {
  const savedUser = loadDataFromLocal('loggedInUser');
  const citySelect = document.getElementById('diaryCity');
  
  if (!savedUser || !savedUser.username || !citySelect) {
    return;
  }
  
  try {
    const res = await fetch('/api/user-data');
    const data = await res.json();
    
    if (!data.users[savedUser.username]) {
      return;
    }
    
    const visitedCountries = data.users[savedUser.username].visitedCountries || [];
    const countryData = visitedCountries.find(c => c.year == year && c.country === country);
    
    citySelect.innerHTML = '';
    
    if (countryData && countryData.cities) {
      countryData.cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.city;
        option.textContent = `${city.cityZH} (${city.city})`;
        if (city.city === selectedCity) {
          option.selected = true;
        }
        citySelect.appendChild(option);
      });
    }
    
  } catch (err) {
    console.error("Error updating city select:", err);
  }
}

/**
 * Delete diary entry
 */
async function deleteDiaryEntry(diaryId) {
  if (!confirm('确定要删除这篇日记吗？此操作无法撤销。')) {
    return;
  }
  
  try {
    const res = await fetch(`/api/diaries/${diaryId}`, {
      method: 'DELETE'
    });
    
    const result = await res.json();
    if (result.success) {
      // Reload diary entries
      loadDiaryEntries();
      
      // Show success message
      alert('日记已删除');
    } else {
      alert('删除日记失败：' + (result.message || '未知错误'));
    }
  } catch (err) {
    console.error("Error deleting diary:", err);
    alert('删除日记时出错，请稍后再试');
  }
}

// Expose functions globally
window.loadDiaryEntries = loadDiaryEntries;
window.editDiaryEntry = editDiaryEntry;
window.deleteDiaryEntry = deleteDiaryEntry;
