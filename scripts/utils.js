/**
 * utils.js - Utility functions and improved error handling
 */

/**
 * Global error handler for fetch operations
 * @param {Response} response - Fetch response object
 * @returns {Promise} - Resolved with response JSON or rejected with error
 */
async function handleFetchResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || response.statusText || 'Network response error');
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response.json();
}

/**
 * Execute a fetch request with error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} - Resolved with response data or rejected with error
 */
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return await handleFetchResponse(response);
  } catch (error) {
    console.error(`Fetch error: ${error.message}`, error);
    throw error;
  }
}

/**
 * Show notification toast
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
  // Ensure no conflicts with other showNotification implementations
  if (window.showNotification) {
    console.warn('window.showNotification is already defined. This may cause conflicts.');
  }
  // Check if notification container exists, if not create it
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      
      .notification {
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 4px;
        color: white;
        max-width: 300px;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
      }
      
      .notification-success {
        background-color: #4CAF50;
      }
      
      .notification-error {
        background-color: #F44336;
      }
      
      .notification-warning {
        background-color: #FF9800;
      }
      
      .notification-info {
        background-color: #2196F3;
      }
      
      .notification-icon {
        margin-right: 10px;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes fadeOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Get icon based on type
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle notification-icon"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-times-circle notification-icon"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle notification-icon"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle notification-icon"></i>';
  }
  
  notification.innerHTML = `${icon}${message}`;
  container.appendChild(notification);
  
  // Remove notification after duration
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
      container.removeChild(notification);
    }, 300);
  }, duration);
}

/**
 * Format date string
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format string (full, date, time, datetime)
 * @returns {string} - Formatted date string
 */
function formatDate(date, format = 'full') {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const options = {
    full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    date: { year: 'numeric', month: 'short', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  };
  
  return dateObj.toLocaleDateString('zh-CN', options[format] || options.full);
}

/**
 * Parse URL parameters
 * @returns {Object} - Object with URL parameters
 */
function getUrlParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  
  if (!queryString) {
    return params;
  }
  
  const pairs = queryString.split('&');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  
  return params;
}

/**
 * Build URL with parameters
 * @param {string} url - Base URL
 * @param {Object} params - Parameters to add
 * @returns {string} - URL with parameters
 */
function buildUrl(url, params = {}) {
  const urlObj = new URL(url, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlObj.searchParams.append(key, value);
    }
  });
  
  return urlObj.toString();
}

/**
 * Validate form inputs
 * @param {HTMLFormElement} form - Form element to validate
 * @returns {boolean} - True if form is valid
 */
function validateForm(form) {
  const inputs = form.querySelectorAll('input, select, textarea');
  let isValid = true;
  
  inputs.forEach(input => {
    // Skip inputs that don't need validation
    if (!input.hasAttribute('required') && !input.pattern) {
      return;
    }
    
    // Remove previous error message if any
    const errorEl = input.parentNode.querySelector('.input-error');
    if (errorEl) {
      input.parentNode.removeChild(errorEl);
    }
    
    // Check validity
    if (!input.checkValidity()) {
      isValid = false;
      
      // Add error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'input-error';
      errorMessage.textContent = input.validationMessage || '此字段无效';
      
      // Insert after input
      input.parentNode.insertBefore(errorMessage, input.nextSibling);
      
      // Add error class to input
      input.classList.add('input-invalid');
    } else {
      // Remove error class
      input.classList.remove('input-invalid');
    }
  });
  
  return isValid;
}

/**
 * Define custom error classes
 */
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class AuthError extends Error {
  constructor(message) {
    super(message || '认证错误，请重新登录');
    this.name = 'AuthError';
  }
}

/**
 * Check if user is logged in
 * @returns {boolean} - True if user is logged in
 */
function isUserLoggedIn() {
  const savedUser = loadDataFromLocal('loggedInUser');
  return !!(savedUser && savedUser.username);
}

/**
 * Require authentication, show login form if not logged in
 * @returns {boolean} - True if user is logged in
 */
function requireAuth() {
  if (!isUserLoggedIn()) {
    showNotification('请先登录，再执行此操作', 'warning');
    openAuthModal();
    return false;
  }
  return true;
}

/**
 * Get current user
 * @returns {Object|null} - User object or null if not logged in
 */
function getCurrentUser() {
  return loadDataFromLocal('loggedInUser');
}

/**
 * Confirm action with dialog
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button
 * @param {string} cancelText - Text for cancel button
 * @returns {Promise} - Resolved with true if confirmed, false if cancelled
 */
function confirmAction(message, confirmText = '确定', cancelText = '取消') {
  return new Promise((resolve) => {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    
    modal.innerHTML = `
      <div class="confirm-content">
        <p>${message}</p>
        <div class="confirm-buttons">
          <button class="btn-cancel">${cancelText}</button>
          <button class="btn-confirm">${confirmText}</button>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .confirm-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      
      .confirm-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .confirm-content p {
        margin-top: 0;
        margin-bottom: 20px;
      }
      
      .confirm-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      
      .btn-cancel {
        background-color: #f1f1f1;
        color: #333;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .btn-confirm {
        background-color: #0a9396;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
    
    // Add to body
    document.body.appendChild(modal);
    
    // Add event listeners
    const cancelBtn = modal.querySelector('.btn-cancel');
    const confirmBtn = modal.querySelector('.btn-confirm');
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve(false);
    });
    
    confirmBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve(true);
    });
    
    // Close on background click
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        document.body.removeChild(modal);
        resolve(false);
      }
    });
  });
}

/**
 * Add global event handler for all API errors
 */
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason instanceof ApiError) {
    // Handle API errors
    console.error('API Error:', event.reason);
    showNotification(event.reason.message, 'error');
    
    // If unauthorized, redirect to login
    if (event.reason.status === 401) {
      localStorage.removeItem('loggedInUser');
      openAuthModal();
    }
  } else if (event.reason instanceof AuthError) {
    // Handle auth errors
    console.error('Auth Error:', event.reason);
    showNotification(event.reason.message, 'error');
    
    localStorage.removeItem('loggedInUser');
    openAuthModal();
  }
});

// Expose utils globally
window.showNotification = showNotification;
window.formatDate = formatDate;
window.getUrlParams = getUrlParams;
window.buildUrl = buildUrl;
window.validateForm = validateForm;
window.isUserLoggedIn = isUserLoggedIn;
window.requireAuth = requireAuth;
window.getCurrentUser = getCurrentUser;
window.confirmAction = confirmAction;
window.fetchWithErrorHandling = fetchWithErrorHandling;
