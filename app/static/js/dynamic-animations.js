// ===== ENHANCED DYNAMIC ANIMATIONS & INTERACTIONS =====

class DynamicAnimations {
  constructor() {
    this.animationQueue = [];
    this.isAnimating = false;
    this.init();
  }

  init() {
    this.setupScrollAnimations();
    this.setupHoverEffects();
    this.setupLoadingStates();
    this.setupMicroInteractions();
    this.setupGestureSupport();
    this.setupParallaxEffects();
  }

  // ===== SCROLL-BASED ANIMATIONS =====
  setupScrollAnimations() {
    const observerOptions = {
      threshold: [0, 0.1, 0.5, 1],
      rootMargin: '0px 0px -100px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const element = entry.target;
        const ratio = entry.intersectionRatio;
        
        if (entry.isIntersecting) {
          this.animateOnScroll(element, ratio);
        }
      });
    }, observerOptions);

    // Observe all animatable elements
    const animatableElements = document.querySelectorAll(
      '.menu-card, .dept-card, .doctor-card, .chat-shell, .header'
    );
    
    animatableElements.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
      scrollObserver.observe(element);
    });
  }

  animateOnScroll(element, ratio) {
    const progress = Math.min(ratio * 2, 1);
    
    element.style.opacity = progress;
    element.style.transform = `translateY(${30 * (1 - progress)}px)`;
    
    if (progress > 0.5) {
      element.classList.add('scrolled-in');
    }
  }

  // ===== ENHANCED HOVER EFFECTS =====
  setupHoverEffects() {
    const hoverElements = document.querySelectorAll('.menu-card, .dept-card, .doctor-card');
    
    hoverElements.forEach(element => {
      this.createHoverEffect(element);
    });
  }

  createHoverEffect(element) {
    let hoverTimeout;
    
    element.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      this.addHoverAnimation(element);
    });

    element.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        this.removeHoverAnimation(element);
      }, 100);
    });
  }

  addHoverAnimation(element) {
    element.style.transform = 'translateY(-12px) scale(1.08) rotateX(8deg)';
    element.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.2)';
    element.style.zIndex = '10';
    
    // Add glow effect
    element.style.filter = 'brightness(1.1) saturate(1.2)';
    
    // Create floating particles effect
    this.createFloatingParticles(element);
  }

  removeHoverAnimation(element) {
    element.style.transform = '';
    element.style.boxShadow = '';
    element.style.zIndex = '';
    element.style.filter = '';
    
    // Remove particles
    const particles = element.querySelectorAll('.floating-particle');
    particles.forEach(particle => particle.remove());
  }

  createFloatingParticles(element) {
    const particleCount = 6;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.8), transparent);
        border-radius: 50%;
        pointer-events: none;
        animation: floatParticle 3s ease-in-out infinite;
        animation-delay: ${i * 0.2}s;
      `;
      
      // Random position around the element
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 60 + Math.random() * 20;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      particle.style.left = `calc(50% + ${x}px)`;
      particle.style.top = `calc(50% + ${y}px)`;
      
      element.appendChild(particle);
    }
  }

  // ===== LOADING STATES & TRANSITIONS =====
  setupLoadingStates() {
    // Add loading animation to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        this.showButtonLoading(button);
      });
    });
  }

  showButtonLoading(button) {
    const originalText = button.innerHTML;
    
    button.innerHTML = `
      <div class="loading-spinner"></div>
      <span>Loading...</span>
    `;
    button.disabled = true;
    
    // Create spinner animation
    const spinner = button.querySelector('.loading-spinner');
    spinner.style.cssText = `
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 8px;
    `;
    
    // Reset after 2 seconds (or when action completes)
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 2000);
  }

  // ===== MICRO-INTERACTIONS =====
  setupMicroInteractions() {
    this.addRippleEffect();
    this.addBounceEffect();
    this.addShakeEffect();
    this.addPulseEffect();
  }

  addRippleEffect() {
    const rippleElements = document.querySelectorAll('.menu-card, .dept-card, .doctor-card, .btn');
    
    rippleElements.forEach(element => {
      element.addEventListener('click', (e) => {
        this.createRipple(e, element);
      });
    });
  }

  createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
      border-radius: 50%;
      transform: scale(0);
      animation: rippleExpand 0.6s ease-out;
      pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  addBounceEffect() {
    const bounceElements = document.querySelectorAll('.menu-card, .dept-card, .doctor-card');
    
    bounceElements.forEach(element => {
      element.addEventListener('click', () => {
        element.style.animation = 'bounceEffect 0.6s ease';
        setTimeout(() => {
          element.style.animation = '';
        }, 600);
      });
    });
  }

  addShakeEffect() {
    const shakeElements = document.querySelectorAll('.chat-input input');
    
    shakeElements.forEach(input => {
      input.addEventListener('invalid', () => {
        this.shakeElement(input);
      });
    });
  }

  shakeElement(element) {
    element.style.animation = 'shakeEffect 0.5s ease-in-out';
    setTimeout(() => {
      element.style.animation = '';
    }, 500);
  }

  addPulseEffect() {
    const pulseElements = document.querySelectorAll('.ai-doctor-icon');
    
    pulseElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        element.style.animation = 'pulseEffect 1s ease-in-out infinite';
      });
      
      element.addEventListener('mouseleave', () => {
        element.style.animation = '';
      });
    });
  }

  // ===== GESTURE SUPPORT =====
  setupGestureSupport() {
    if ('ontouchstart' in window) {
      this.addSwipeGestures();
      this.addPinchGestures();
      this.addLongPressGestures();
    }
  }

  addSwipeGestures() {
    const swipeElements = document.querySelectorAll('.menu, .department-list, .doctor-list');
    
    swipeElements.forEach(container => {
      let startX = 0;
      let startY = 0;
      let isScrolling = false;
      
      container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isScrolling = false;
      });
      
      container.addEventListener('touchmove', (e) => {
        if (!startX || !startY) return;
        
        const diffX = startX - e.touches[0].clientX;
        const diffY = startY - e.touches[0].clientY;
        
        if (Math.abs(diffY) > Math.abs(diffX)) {
          isScrolling = true;
        }
      });
      
      container.addEventListener('touchend', (e) => {
        if (isScrolling) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = startX - endX;
        const diffY = startY - endY;
        
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
          if (diffX > 0) {
            this.handleSwipeLeft(container);
          } else {
            this.handleSwipeRight(container);
          }
        }
      });
    });
  }

  handleSwipeLeft(container) {
    container.style.transform = 'translateX(-20px)';
    container.style.opacity = '0.7';
    setTimeout(() => {
      container.style.transform = '';
      container.style.opacity = '';
    }, 200);
  }

  handleSwipeRight(container) {
    container.style.transform = 'translateX(20px)';
    container.style.opacity = '0.7';
    setTimeout(() => {
      container.style.transform = '';
      container.style.opacity = '';
    }, 200);
  }

  addPinchGestures() {
    // Implement pinch-to-zoom for cards
    const pinchElements = document.querySelectorAll('.menu-card, .dept-card, .doctor-card');
    
    pinchElements.forEach(element => {
      let initialDistance = 0;
      
      element.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          initialDistance = this.getDistance(e.touches[0], e.touches[1]);
        }
      });
      
      element.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
          const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
          const scale = currentDistance / initialDistance;
          
          if (scale > 1.2) {
            this.zoomCard(element, scale);
          }
        }
      });
    });
  }

  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  zoomCard(element, scale) {
    element.style.transform = `scale(${Math.min(scale, 1.5)})`;
    element.style.zIndex = '100';
  }

  addLongPressGestures() {
    const longPressElements = document.querySelectorAll('.menu-card, .dept-card, .doctor-card');
    
    longPressElements.forEach(element => {
      let pressTimer = null;
      
      element.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => {
          this.handleLongPress(element);
        }, 500);
      });
      
      element.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
      });
      
      element.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
      });
    });
  }

  handleLongPress(element) {
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Show context menu or additional options
    this.showContextMenu(element);
  }

  showContextMenu(element) {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
      <div class="context-item">📋 Copy Info</div>
      <div class="context-item">⭐ Add to Favorites</div>
      <div class="context-item">🔗 Share</div>
    `;
    
    menu.style.cssText = `
      position: absolute;
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      padding: 8px 0;
      z-index: 1000;
      animation: contextMenuSlide 0.3s ease-out;
    `;
    
    document.body.appendChild(menu);
    
    // Position menu
    const rect = element.getBoundingClientRect();
    menu.style.left = `${rect.left + rect.width / 2 - 100}px`;
    menu.style.top = `${rect.top + rect.height + 10}px`;
    
    // Remove menu on click outside
    setTimeout(() => {
      document.addEventListener('click', () => {
        menu.remove();
      }, { once: true });
    }, 100);
  }

  // ===== PARALLAX EFFECTS =====
  setupParallaxEffects() {
    if (window.deviceInfo && !window.deviceInfo.isMobile) {
      this.addParallaxScrolling();
    }
  }

  addParallaxScrolling() {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.header, .ai-doctor-icon');
      
      parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
      });
    });
  }
}

// ===== ANIMATION STYLES =====
const animationStyles = `
  @keyframes rippleExpand {
    0% { transform: scale(0); opacity: 1; }
    100% { transform: scale(1); opacity: 0; }
  }
  
  @keyframes bounceEffect {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
  
  @keyframes shakeEffect {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  @keyframes pulseEffect {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes floatParticle {
    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
    50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
  }
  
  @keyframes contextMenuSlide {
    from { opacity: 0; transform: translateY(-10px) scale(0.9); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  .context-menu {
    min-width: 200px;
  }
  
  .context-item {
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .context-item:hover {
    background-color: #f0f4ff;
  }
  
  .loading-spinner {
    display: inline-block;
    vertical-align: middle;
  }
  
  .scrolled-in {
    animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
`;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Add animation styles to document
  const styleSheet = document.createElement('style');
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
  
  // Initialize dynamic animations
  window.dynamicAnimations = new DynamicAnimations();
  
  console.log('Dynamic animations initialized');
});

// ===== PERFORMANCE OPTIMIZATION =====
class AnimationPerformance {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.setupPerformanceMonitoring();
  }

  setupPerformanceMonitoring() {
    const monitor = () => {
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - this.lastTime >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        
        if (fps < 30) {
          this.optimizeAnimations();
        }
        
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }

  optimizeAnimations() {
    // Reduce animation complexity on low-performance devices
    document.body.classList.add('reduced-animations');
    
    // Disable parallax effects
    const parallaxElements = document.querySelectorAll('.header, .ai-doctor-icon');
    parallaxElements.forEach(element => {
      element.style.transform = '';
    });
    
    console.log('Animations optimized for performance');
  }
}

// Initialize performance monitoring
document.addEventListener('DOMContentLoaded', () => {
  window.animationPerformance = new AnimationPerformance();
});
