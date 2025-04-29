/* 
 * Inventory Management Website 
 * Enhanced responsive functionality with accessibility improvements
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const container = document.querySelector('.reviews-container');
  const leftBtn = document.querySelector('.left-btn');
  const rightBtn = document.querySelector('.right-btn');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('nav.logo-in');
  const progressBar = document.querySelector('.progress-bar');
  const backToTopBtn = document.getElementById('back-to-top');
  const header = document.querySelector('header');
  
  // ===================================
  // Mobile Navigation Menu
  // ===================================
  if (mobileMenuBtn) {
    // Toggle mobile menu with keyboard and click support
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    mobileMenuBtn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMobileMenu();
      }
    });
    
    function toggleMobileMenu() {
      nav.classList.toggle('active');
      mobileMenuBtn.setAttribute('aria-expanded', 
        nav.classList.contains('active') ? 'true' : 'false');
      
      // Toggle aria-label for accessibility
      const isMenuOpen = nav.classList.contains('active');
      mobileMenuBtn.setAttribute('aria-label', isMenuOpen ? 'Close menu' : 'Open menu');
      
      // Toggle icon if you want to change it
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.className = isMenuOpen ? 'fas fa-times' : 'fas fa-bars';
      }
    }
  }
  
  // Close mobile menu when clicking on links
  const navLinks = document.querySelectorAll('nav.logo-in a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 767) {
        nav.classList.remove('active');
        if (mobileMenuBtn) {
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
          mobileMenuBtn.setAttribute('aria-label', 'Open menu');
          const icon = mobileMenuBtn.querySelector('i');
          if (icon) icon.className = 'fas fa-bars';
        }
      }
    });
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 767 && 
        !e.target.closest('nav.logo-in') && 
        !e.target.closest('.mobile-menu-btn') &&
        nav.classList.contains('active')) {
      nav.classList.remove('active');
      if (mobileMenuBtn) {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-label', 'Open menu');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      }
    }
  });
  
  // ===================================
  // Header Scroll Effect
  // ===================================
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  
  // ===================================
  // Back to Top Button
  // ===================================
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });
  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // Keyboard support for back to top button
  backToTopBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  });
  
  // ===================================
  // Reviews Carousel Functionality
  // ===================================
  // Setup variables
  let isScrolling = true;
  let scrollInterval;
  const scrollSpeed = 1; // Lower speed for smoother animation
  const cardWidth = getReviewCardWidth();
  let touchStartX = 0;
  let touchEndX = 0;
  let scrollPosition = 0;
  
  // Clone content for infinite scrolling effect
  if (container) {
    const originalContent = container.innerHTML;
    container.innerHTML += originalContent;
    
    // Set initial position halfway through to allow backward scrolling
    setTimeout(() => {
      if (container.scrollWidth > 0) {
        scrollPosition = container.scrollWidth / 4;
        container.scrollLeft = scrollPosition;
      }
    }, 100);
  }
  
  // Auto-scrolling function with progress bar update
  function autoScroll() {
    if (!container || !isScrolling) return;
    
    scrollPosition += scrollSpeed;
    container.scrollLeft = scrollPosition;
    
    // Reset scroll position for infinite loop
    const maxScroll = container.scrollWidth / 2;
    if (scrollPosition >= maxScroll) {
      scrollPosition = 0;
      container.scrollLeft = scrollPosition;
    }
    
    // Update progress bar
    if (progressBar) {
      const scrollPercentage = (scrollPosition / maxScroll) * 100;
      progressBar.style.width = `${scrollPercentage}%`;
    }
  }
  
  // Start auto-scrolling
  function startScrolling() {
    if (!isScrolling) {
      isScrolling = true;
      scrollInterval = setInterval(autoScroll, 20);
    }
  }
  
  // Stop auto-scrolling
  function stopScrolling() {
    isScrolling = false;
    clearInterval(scrollInterval);
  }
  
  // Function to get dynamic card width based on screen size
  function getReviewCardWidth() {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 480) return 260;
    if (viewportWidth <= 768) return 280;
    return 320;
  }
  
  // ===================================
  // Event Listeners for Reviews Carousel
  // ===================================
  if (container) {
    // Mouse interactions
    container.addEventListener('mouseenter', stopScrolling);
    container.addEventListener('mouseleave', startScrolling);
    
    // Touch interactions
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopScrolling();
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      setTimeout(startScrolling, 1000); // Delay restart after swipe
    }, { passive: true });
    
    // Handle manual navigation buttons
    if (leftBtn) {
      leftBtn.addEventListener('mouseenter', stopScrolling);
      leftBtn.addEventListener('mouseleave', startScrolling);
      leftBtn.addEventListener('click', () => {
        scrollPosition -= cardWidth * 2; // Scroll distance of 2 cards
        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      });
    }
    
    if (rightBtn) {
      rightBtn.addEventListener('mouseenter', stopScrolling);
      rightBtn.addEventListener('mouseleave', startScrolling);
      rightBtn.addEventListener('click', () => {
        scrollPosition += cardWidth * 2; // Scroll distance of 2 cards
        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      });
    }
  }
  
  // Process swipe gestures for reviews carousel
  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    if (Math.abs(swipeDistance) > 50) { // Minimum swipe distance threshold
      if (swipeDistance > 0) {
        // Swipe right (previous)
        scrollPosition -= cardWidth * 2;
      } else {
        // Swipe left (next)
        scrollPosition += cardWidth * 2;
      }
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }
  
  // ===================================
  // Visibility change handling
  // ===================================
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopScrolling();
    } else {
      startScrolling();
    }
  });
  
  // ===================================
  // Responsive adjustments
  // ===================================
  function handleResize() {
    // Update card width based on viewport
    const newCardWidth = getReviewCardWidth();
    
    // Apply responsive styles to review cards
    const reviewCards = document.querySelectorAll('.review-card');
    reviewCards.forEach(card => {
      card.style.width = `${newCardWidth}px`;
    });
    
    // Reset scrolling to prevent bugs after resize
    if (container) {
      scrollPosition = container.scrollLeft;
      if (isScrolling) {
        stopScrolling();
        startScrolling();
      }
    }
    
    // Adjust team cards for best visibility
    adjustTeamCards();
  }
  
  // ===================================
  // Team Section Enhancements
  // ===================================
  function adjustTeamCards() {
    const teamItems = document.querySelectorAll('.team-item');
    
    teamItems.forEach(item => {
      // Ensure team cards have proper height and visibility
      if (window.innerWidth <= 767) {
        item.style.height = 'auto';
        item.style.minHeight = '340px';
      } else {
        item.style.height = 'auto';
        item.style.minHeight = '380px';
      }
    });
  }
  
  // ===================================
  // Smooth scrolling for internal links
  // ===================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return; // Skip if it's just "#"
      
      const targetElement = document.querySelector(targetId);
      if (!targetElement) return; // Skip if target doesn't exist
      
      // Get the header height for offset
      const headerHeight = document.querySelector('header').offsetHeight;
      
      // Calculate scroll position
      const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      
      // Smooth scroll to target
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      
      // Close mobile menu if open
      if (nav.classList.contains('active')) {
        nav.classList.remove('active');
        if (mobileMenuBtn) {
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
          const icon = mobileMenuBtn.querySelector('i');
          if (icon) icon.className = 'fas fa-bars';
        }
      }
    });
  });
  
  // ===================================
  // Lazy loading images for performance
  // ===================================
  if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      img.src = img.dataset.src;
    });
  } else {
    // Fallback for browsers that don't support native lazy loading
    // This could be enhanced with a full IntersectionObserver implementation
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
    });
  }
  
  // ===================================
  // Animation optimizations
  // ===================================
  // Use requestAnimationFrame for smoother animations if needed
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        // Optimize any scroll-based animations here
        ticking = false;
      });
      ticking = true;
    }
  });
  
  // ===================================
  // Initialization
  // ===================================
  // Responsive resize handling with debounce
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 250);
  });
  
  // Initial setup
  window.addEventListener('load', () => {
    // Wait for images to load for proper layout
    handleResize();
    adjustTeamCards();
    
    // Start the carousel
    if (container) {
      startScrolling();
    }
    
    // Animate elements when they come into view
    animateOnScroll();
  });
  
  // Function to animate elements when scrolled into view
  function animateOnScroll() {
    // Simple animation trigger for elements with data-animate attribute
    const animatables = document.querySelectorAll('[data-animate]');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      animatables.forEach(el => observer.observe(el));
    } else {
      // Fallback for older browsers
      animatables.forEach(el => el.classList.add('animated'));
    }
  }
  
  // Apply ARIA accessibility attributes for better screen reader support
  function enhanceAccessibility() {
    // Set appropriate ARIA roles
    if (container) container.setAttribute('aria-label', 'Customer Reviews');
    if (leftBtn) leftBtn.setAttribute('aria-label', 'Previous reviews');
    if (rightBtn) rightBtn.setAttribute('aria-label', 'Next reviews');
    
    // Add keyboard support for carousel navigation
    [leftBtn, rightBtn].forEach(btn => {
      if (!btn) return;
      
      btn.setAttribute('tabindex', '0');
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }
  
  // Call accessibility enhancements
  enhanceAccessibility();
});