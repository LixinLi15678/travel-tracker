/**
 * gallery.js
 * Handles photo gallery, uploading, viewing, and filtering
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize gallery components
  initializeGallery();
  
  // Set up upload modal
  setupPhotoUploadModal();
  
  // Set up photo view modal
  setupPhotoViewModal();
  
  // Load photos
  loadPhotoGallery();
});

/**
 * Initialize gallery components and event listeners
 */
function initializeGallery() {
  // Gallery filters
  const yearFilter = document.getElementById('galleryFilterYear');
  const countryFilter = document.getElementById('galleryFilterCountry');
  const cityFilter = document.getElementById('galleryFilterCity');
  
  if (yearFilter) {
    yearFilter.addEventListener('change', () => {
      loadPhotoGallery();
      
      // Update country filter options based on selected year
      updateCountryFilterOptions(yearFilter.value);
    });
  }
  
  if (countryFilter) {
    countryFilter.addEventListener('change', () => {
      loadPhotoGallery();
      
      // Update city filter options based on selected country
      updateCityFilterOptions(yearFilter.value, countryFilter.value);
    });
  }
  
  if (cityFilter) {
    cityFilter.addEventListener('change', () => {
      loadPhotoGallery();
    });
  }
  
  // Upload button
  const uploadBtn = document.getElementById('uploadPhotoBtn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', openPhotoUploadModal);
  }
}

/**
 * Set up photo upload modal
 */
function setupPhotoUploadModal() {
  const modal = document.getElementById('photoUploadModal');
  const closeBtn = document.getElementById('photoUploadCloseBtn');
  const form = document.getElementById('photoUploadForm');
  const fileInput = document.getElementById('photoFile');
  const preview = document.getElementById('photoPreview');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  if (fileInput && preview) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        preview.style.display = 'none';
      }
    });
  }
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      uploadPhoto();
    });
  }
}

/**
 * Set up photo view modal
 */
function setupPhotoViewModal() {
  const modal = document.getElementById('photoViewModal');
  const closeBtn = document.getElementById('photoViewCloseBtn');
  const prevBtn = document.getElementById('prevPhotoBtn');
  const nextBtn = document.getElementById('nextPhotoBtn');
  const deleteBtn = document.getElementById('deletePhotoBtn');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  if (prevBtn) {
    prevBtn.addEventListener('click', showPreviousPhoto);
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', showNextPhoto);
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteCurrentPhoto);
  }
}

/**
 * Open photo upload modal and populate filters
 */
async function openPhotoUploadModal() {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    alert('请先登录，再上传照片');
    return;
  }
  
  const modal = document.getElementById('photoUploadModal');
  const yearSelect = document.getElementById('photoYear');
  const countrySelect = document.getElementById('photoCountry');
  const citySelect = document.getElementById('photoCity');
  
  if (!modal || !yearSelect || !countrySelect || !citySelect) {
    return;
  }
  
  try {
    // Fetch user data to get visited countries and years
    const res = await fetch('/api/user-data');
    const data = await res.json();
    
    if (!data.users[savedUser.username]) {
      alert('没有找到您的旅行记录，请先添加访问记录');
      return;
    }
    
    const visitedCountries = data.users[savedUser.username].visitedCountries || [];
    
    // Populate year select
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
    yearSelect.addEventListener('change', () => {
      updateUploadCountryOptions(yearSelect.value);
    });
    
    // Update city options based on selected country
    countrySelect.addEventListener('change', () => {
      updateUploadCityOptions(yearSelect.value, countrySelect.value);
    });
    
    // Initialize country options
    if (years.length > 0) {
      updateUploadCountryOptions(years[0]);
    }
    
    // Show modal
    modal.style.display = 'block';
    
  } catch (err) {
    console.error("Error opening photo upload modal:", err);
    alert('加载数据时出错，请稍后再试');
  }
}

/**
 * Update country options in the upload form based on selected year
 */
async function updateUploadCountryOptions(year) {
  const savedUser = loadDataFromLocal('loggedInUser');
  const countrySelect = document.getElementById('photoCountry');
  
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
      updateUploadCityOptions(year, countriesForYear[0].country);
    } else {
      document.getElementById('photoCity').innerHTML = '';
    }
    
  } catch (err) {
    console.error("Error updating country options:", err);
  }
}

/**
 * Update city options in the upload form based on selected year and country
 */
async function updateUploadCityOptions(year, country) {
  const savedUser = loadDataFromLocal('loggedInUser');
  const citySelect = document.getElementById('photoCity');
  
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
 * Update filter options for gallery
 */
async function updateFilterOptions() {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    return;
  }
  
  try {
    // Fetch photos
    const photosRes = await fetch('/api/photos');
    const photos = await photosRes.json();
    
    // Filter photos by current user
    const userPhotos = photos.filter(photo => photo.username === savedUser.username);
    
    // Get unique years, countries, and cities
    const years = [...new Set(userPhotos.map(photo => photo.year))].sort((a, b) => b - a);
    const countries = [...new Set(userPhotos.map(photo => photo.country))].sort();
    const cities = [...new Set(userPhotos.map(photo => photo.city))].sort();
    
    // Populate year filter
    const yearFilter = document.getElementById('galleryFilterYear');
    if (yearFilter) {
      yearFilter.innerHTML = '<option value="all">全部年份</option>';
      years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
      });
    }
    
    // Populate country filter
    const countryFilter = document.getElementById('galleryFilterCountry');
    if (countryFilter) {
      countryFilter.innerHTML = '<option value="all">全部国家</option>';
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        
        // Try to find countryZH from user data
        const photo = userPhotos.find(p => p.country === country);
        const displayName = photo && photo.countryZH ? `${photo.countryZH} (${country})` : country;
        
        option.textContent = displayName;
        countryFilter.appendChild(option);
      });
    }
    
    // Populate city filter
    const cityFilter = document.getElementById('galleryFilterCity');
    if (cityFilter) {
      cityFilter.innerHTML = '<option value="all">全部城市</option>';
      cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        
        // Try to find cityZH from user data
        const photo = userPhotos.find(p => p.city === city);
        const displayName = photo && photo.cityZH ? `${photo.cityZH} (${city})` : city;
        
        option.textContent = displayName;
        cityFilter.appendChild(option);
      });
    }
    
  } catch (err) {
    console.error("Error updating filter options:", err);
  }
}

/**
 * Update country filter options based on selected year
 */
async function updateCountryFilterOptions(year) {
  if (year === 'all') {
    // Reset all filters to show all options
    updateFilterOptions();
    return;
  }
  
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    return;
  }
  
  try {
    // Fetch photos
    const photosRes = await fetch('/api/photos');
    const photos = await photosRes.json();
    
    // Filter photos by current user and selected year
    const userPhotos = photos.filter(photo => 
      photo.username === savedUser.username && 
      (year === 'all' || photo.year == year)
    );
    
    // Get unique countries
    const countries = [...new Set(userPhotos.map(photo => photo.country))].sort();
    
    // Populate country filter
    const countryFilter = document.getElementById('galleryFilterCountry');
    if (countryFilter) {
      countryFilter.innerHTML = '<option value="all">全部国家</option>';
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        
        // Try to find countryZH from user data
        const photo = userPhotos.find(p => p.country === country);
        const displayName = photo && photo.countryZH ? `${photo.countryZH} (${country})` : country;
        
        option.textContent = displayName;
        countryFilter.appendChild(option);
      });
    }
    
    // Also update city filter
    updateCityFilterOptions(year, 'all');
    
  } catch (err) {
    console.error("Error updating country filter options:", err);
  }
}

/**
 * Update city filter options based on selected year and country
 */
async function updateCityFilterOptions(year, country) {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    return;
  }
  
  try {
    // Fetch photos
    const photosRes = await fetch('/api/photos');
    const photos = await photosRes.json();
    
    // Filter photos by current user, year, and country
    const userPhotos = photos.filter(photo => 
      photo.username === savedUser.username && 
      (year === 'all' || photo.year == year) &&
      (country === 'all' || photo.country === country)
    );
    
    // Get unique cities
    const cities = [...new Set(userPhotos.map(photo => photo.city))].sort();
    
    // Populate city filter
    const cityFilter = document.getElementById('galleryFilterCity');
    if (cityFilter) {
      cityFilter.innerHTML = '<option value="all">全部城市</option>';
      cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        
        // Try to find cityZH from user data
        const photo = userPhotos.find(p => p.city === city);
        const displayName = photo && photo.cityZH ? `${photo.cityZH} (${city})` : city;
        
        option.textContent = displayName;
        cityFilter.appendChild(option);
      });
    }
    
  } catch (err) {
    console.error("Error updating city filter options:", err);
  }
}

/**
 * Load photo gallery based on filters
 */
async function loadPhotoGallery() {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    showEmptyGallery('请先登录，再查看照片');
    return;
  }
  
  try {
    // First update filter options if needed
    await updateFilterOptions();
    
    // Get selected filters
    const yearFilter = document.getElementById('galleryFilterYear').value;
    const countryFilter = document.getElementById('galleryFilterCountry').value;
    const cityFilter = document.getElementById('galleryFilterCity').value;
    
    // Fetch photos
    let photosRes;
    try {
      photosRes = await fetch('/api/photos');
    } catch (err) {
      // Photos API endpoint might not exist yet, show empty gallery
      showEmptyGallery('尚未有照片，或照片 API 尚未实现');
      return;
    }
    
    const photos = await photosRes.json();
    
    // Filter photos
    const filteredPhotos = photos.filter(photo => 
      photo.username === savedUser.username &&
      (yearFilter === 'all' || photo.year == yearFilter) &&
      (countryFilter === 'all' || photo.country === countryFilter) &&
      (cityFilter === 'all' || photo.city === cityFilter)
    );
    
    // Render gallery
    renderPhotoGallery(filteredPhotos);
    
  } catch (err) {
    console.error("Error loading photo gallery:", err);
    showEmptyGallery('加载照片时出错');
  }
}

/**
 * Render photo gallery with provided photos
 */
function renderPhotoGallery(photos) {
  const galleryEl = document.getElementById('photoGallery');
  if (!galleryEl) return;
  
  if (!photos || photos.length === 0) {
    showEmptyGallery('暂无照片，请上传你的旅行照片');
    return;
  }
  
  galleryEl.innerHTML = '';
  
  photos.forEach((photo, index) => {
    const photoItem = document.createElement('div');
    photoItem.className = 'gallery-item';
    photoItem.dataset.index = index;
    
    photoItem.innerHTML = `
      <img src="${photo.url}" alt="${photo.title}">
      <div class="gallery-item-info">
        <h4 class="gallery-item-title">${photo.title}</h4>
        <p class="gallery-item-location">${photo.cityZH || photo.city}, ${photo.countryZH || photo.country} (${photo.year})</p>
      </div>
    `;
    
    photoItem.addEventListener('click', () => {
      openPhotoViewModal(photos, index);
    });
    
    galleryEl.appendChild(photoItem);
  });
  
  // Save current photos list to window for navigation
  window.currentGalleryPhotos = photos;
}

/**
 * Show empty state in gallery
 */
function showEmptyGallery(message) {
  const galleryEl = document.getElementById('photoGallery');
  if (!galleryEl) return;
  
  galleryEl.innerHTML = `
    <div class="gallery-empty-state">
      <i class="fas fa-images"></i>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Open photo view modal
 */
function openPhotoViewModal(photos, index) {
  const modal = document.getElementById('photoViewModal');
  if (!modal) return;
  
  // Save current photos and index
  window.currentViewingPhotos = photos;
  window.currentPhotoIndex = index;
  
  // Update modal content
  updatePhotoViewContent();
  
  // Show modal
  modal.style.display = 'block';
}

/**
 * Update photo view modal content
 */
function updatePhotoViewContent() {
  const photos = window.currentViewingPhotos;
  const index = window.currentPhotoIndex;
  
  if (!photos || photos.length === 0 || index < 0 || index >= photos.length) {
    return;
  }
  
  const photo = photos[index];
  
  // Update elements
  document.getElementById('photoViewImage').src = photo.url;
  document.getElementById('photoViewTitle').textContent = photo.title;
  document.getElementById('photoViewLocation').textContent = `${photo.cityZH || photo.city}, ${photo.countryZH || photo.country}`;
  document.getElementById('photoViewDate').textContent = `${photo.year}年`;
  document.getElementById('photoViewDescription').textContent = photo.description || '无描述';
  
  // Update navigation buttons
  document.getElementById('prevPhotoBtn').disabled = index === 0;
  document.getElementById('nextPhotoBtn').disabled = index === photos.length - 1;
}

/**
 * Show previous photo
 */
function showPreviousPhoto() {
  if (window.currentPhotoIndex > 0) {
    window.currentPhotoIndex--;
    updatePhotoViewContent();
  }
}

/**
 * Show next photo
 */
function showNextPhoto() {
  if (window.currentPhotoIndex < window.currentViewingPhotos.length - 1) {
    window.currentPhotoIndex++;
    updatePhotoViewContent();
  }
}

/**
 * Delete current photo
 */
async function deleteCurrentPhoto() {
  if (!window.currentViewingPhotos || !window.currentPhotoIndex) {
    return;
  }
  
  const photo = window.currentViewingPhotos[window.currentPhotoIndex];
  if (!photo || !photo.id) {
    alert('无法删除照片，缺少照片ID');
    return;
  }
  
  if (!confirm('确定要删除这张照片吗？此操作无法撤销。')) {
    return;
  }
  
  try {
    // Call API to delete photo
    const res = await fetch(`/api/photos/${photo.id}`, {
      method: 'DELETE'
    });
    
    const result = await res.json();
    if (result.success) {
      // Close modal
      document.getElementById('photoViewModal').style.display = 'none';
      
      // Reload gallery
      loadPhotoGallery();
      
      // Show success message
      alert('照片已成功删除');
    } else {
      alert('删除照片失败：' + (result.message || '未知错误'));
    }
  } catch (err) {
    console.error("Error deleting photo:", err);
    alert('删除照片时出错，请稍后再试');
  }
}

/**
 * Upload photo
 */
async function uploadPhoto() {
  const savedUser = loadDataFromLocal('loggedInUser');
  if (!savedUser || !savedUser.username) {
    alert('请先登录，再上传照片');
    return;
  }
  
  // Get form values
  const year = document.getElementById('photoYear').value;
  const country = document.getElementById('photoCountry').value;
  const city = document.getElementById('photoCity').value;
  const title = document.getElementById('photoTitle').value;
  const description = document.getElementById('photoDescription').value;
  const fileInput = document.getElementById('photoFile');
  
  if (!year || !country || !city || !title || !fileInput.files || fileInput.files.length === 0) {
    alert('请填写所有必填字段');
    return;
  }
  
  const file = fileInput.files[0];
  if (!file.type.startsWith('image/')) {
    alert('请选择有效的图片文件');
    return;
  }
  
  try {
    // In a real app, you would upload the file to a server
    // For this demo, we'll use a data URL
    const reader = new FileReader();
    reader.onload = async (e) => {
      const photoData = {
        username: savedUser.username,
        year: parseInt(year),
        country: country,
        city: city,
        title: title,
        description: description,
        url: e.target.result,
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
            photoData.countryZH = countryData.countryZH;
            
            const cityData = countryData.cities.find(c => c.city === city);
            if (cityData) {
              photoData.cityZH = cityData.cityZH;
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching translations:", err);
      }
      
      try {
        // Save photo data
        const saveRes = await fetch('/api/photos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(photoData)
        });
        
        const result = await saveRes.json();
        if (result.success) {
          // Close modal
          document.getElementById('photoUploadModal').style.display = 'none';
          
          // Reset form
          document.getElementById('photoUploadForm').reset();
          document.getElementById('photoPreview').style.display = 'none';
          
          // Reload gallery
          loadPhotoGallery();
          
          // Show success message
          alert('照片上传成功');
        } else {
          alert('上传照片失败：' + (result.message || '未知错误'));
        }
      } catch (err) {
        // Photos API might not exist yet
        console.error("Error saving photo:", err);
        alert('上传照片时出错，可能是因为 Photos API 尚未实现');
        
        // Close modal anyway
        document.getElementById('photoUploadModal').style.display = 'none';
      }
    };
    
    reader.readAsDataURL(file);
    
  } catch (err) {
    console.error("Error uploading photo:", err);
    alert('上传照片时出错，请稍后再试');
  }
}

// Expose functions globally
window.loadPhotoGallery = loadPhotoGallery;
