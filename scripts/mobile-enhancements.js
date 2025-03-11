/**
 * mobile-enhancements.js
 * Enhance mobile responsiveness and add touch gestures
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize mobile enhancements
  initializeMobileEnhancements();
});

/**
 * Initialize mobile enhancements
 */
function initializeMobileEnhancements() {
  // Add viewport meta tag if not present
  ensureViewportMeta();
  
  // Enable swipe gestures
  enableSwipeGestures();
  
  // Add mobile navigation toggle
  enhanceMobileNavigation();
  
  // Add scroll to top button
  addScrollToTopButton();
  
  // Improve form usability on mobile
  improveMobileFormUsability();
  
  // Add FastClick to eliminate the 300ms delay on click events
  eliminateClickDelay();
}

/**
 * Ensure proper viewport meta tag is present
 */
function ensureViewportMeta() {
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(viewportMeta);
  }
}

/**
 * Enable swipe gestures for carousel-like elements
 */
function enableSwipeGestures() {
  // Add swipe detection to gallery section
  const gallerySection = document.getElementById('photoGallery');
  if (gallerySection) {
    addSwipeDetection(gallerySection, (direction) => {
      if (direction === 'left') {
        // Next photo
        if (window.currentPhotoIndex < window.currentViewingPhotos.length - 1) {
          showNextPhoto();
        }
      } else if (direction === 'right') {
        // Previous photo
        if (window.currentPhotoIndex > 0) {
          showPreviousPhoto();
        }
      }
    });
  }
  
  // Add swipe detection to weather forecast
  const forecastSection = document.getElementById('forecastWeather');
  if (forecastSection) {
    addSwipeDetection(forecastSection);
  }
}

/**
 * Add swipe detection to an element
 */
function addSwipeDetection(element, callback) {
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;
  
  element.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, false);
  
  element.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe(callback);
  }, false);
  
  function handleSwipe(callback) {
    // Calculate horizontal and vertical distance
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // Only register as swipe if horizontal movement is significant
    // and greater than vertical movement (to avoid scrolling)
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        // Swiped right
        if (callback) callback('right');
      } else {
        // Swiped left
        if (callback) callback('left');
      }
    }
  }
}

/**
 * Enhance mobile navigation
 */
function enhanceMobileNavigation() {
  // Add mobile-specific classes
  document.body.classList.add('has-mobile-enhancements');
  
  // Add styles for mobile navigation
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .app-header {
        position: sticky;
        top: 0;
        z-index: 100;
      }
      
      .sidebar {
        width: 85%;
        max-width: 300px;
      }
      
      .sidebar-close {
        display: flex;
        justify-content: flex-end;
        padding: 1rem;
        cursor: pointer;
      }
      
      .mobile-navigation-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 90;
        display: none;
      }
      
      .mobile-navigation-overlay.active {
        display: block;
      }
      
      .scroll-to-top {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        background-color: #0a9396;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 80;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }
      
      .scroll-to-top.visible {
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Add mobile navigation overlay
  const overlay = document.createElement('div');
  overlay.className = 'mobile-navigation-overlay';
  document.body.appendChild(overlay);
  
  // Show overlay when sidebar is shown
  const sidebar = document.getElementById('sidebar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  
  if (sidebar && mobileMenuBtn) {
    const originalClickHandler = mobileMenuBtn.onclick;
    
    mobileMenuBtn.onclick = function(event) {
      if (originalClickHandler) {
        originalClickHandler.call(this, event);
      }
      
      overlay.classList.add('active');
    };
    
    // Close sidebar when overlay is clicked
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('show');
      overlay.classList.remove('active');
    });
    
    // Update close button handler
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    if (sidebarCloseBtn) {
      const originalCloseHandler = sidebarCloseBtn.onclick;
      
      sidebarCloseBtn.onclick = function(event) {
        if (originalCloseHandler) {
          originalCloseHandler.call(this, event);
        }
        
        overlay.classList.remove('active');
      };
    }
  }
}

/**
 * Add scroll to top button
 */
function addScrollToTopButton() {
  // Create scroll to top button
  const scrollBtn = document.createElement('div');
  scrollBtn.className = 'scroll-to-top';
  scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  document.body.appendChild(scrollBtn);
  
  // Show button when scrolled down
  window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  });
  
  // Scroll to top when clicked
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * Improve form usability on mobile
 */
function improveMobileFormUsability() {
  // Add smooth scrolling to form sections
  const formSections = document.querySelectorAll('form');
  
  formSections.forEach(form => {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        // Wait for keyboard to appear
        setTimeout(() => {
          const inputRect = input.getBoundingClientRect();
          const scrollY = window.scrollY + inputRect.top - 150;
          
          window.scrollTo({
            top: scrollY,
            behavior: 'smooth'
          });
        }, 300);
      });
      
      // Add 'has-value' class to parent when input has value
      input.addEventListener('input', () => {
        if (input.value) {
          input.classList.add('has-value');
        } else {
          input.classList.remove('has-value');
        }
      });
      
      // Initialize has-value class
      if (input.value) {
        input.classList.add('has-value');
      }
    });
  });
  
  // Add styles for better form inputs on mobile
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      input, select, textarea {
        font-size: 16px !important; /* Prevents iOS zoom */
      }
      
      .form-group {
        margin-bottom: 1.5rem;
      }
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      
      button {
        min-height: 44px; /* Apple's recommended minimum touch target size */
      }
      
      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: #0a9396;
        box-shadow: 0 0 0 3px rgba(10, 147, 150, 0.2);
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Eliminate 300ms delay on click events on mobile
 */
function eliminateClickDelay() {
  // Simplified version of FastClick
  document.addEventListener('touchstart', function() {}, {passive: true});
}

// Expose functions globally
window.initializeMobileEnhancements = initializeMobileEnhancements;
