// ===== ENHANCED RESPONSIVE INTERACTIONS =====

class ResponsiveUI {
  constructor() {
    this.isMobile = window.innerWidth <= 768;
    this.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    this.isDesktop = window.innerWidth > 1024;
    this.touchDevice = 'ontouchstart' in window;
    
    this.init();
  }

  init() {
    this.setupResponsiveListeners();
    this.enhanceTouchInteractions();
    this.setupDynamicAnimations();
    this.optimizeForDevice();
    this.setupKeyboardNavigation();
  }

  // ===== RESPONSIVE BREAKPOINT LISTENERS =====
  setupResponsiveListeners() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });

    // Orientation change for mobile devices
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 500);
    });
  }

  handleResize() {
    const wasMobile = this.isMobile;
    const wasTablet = this.isTablet;
    const wasDesktop = this.isDesktop;

    this.isMobile = window.innerWidth <= 768;
    this.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    this.isDesktop = window.innerWidth > 1024;

    // Only trigger updates if breakpoint changed
    if (wasMobile !== this.isMobile || wasTablet !== this.isTablet || wasDesktop !== this.isDesktop) {
      this.updateLayoutForBreakpoint();
      this.optimizeAnimations();
    }
  }

  handleOrientationChange() {
    // Force layout recalculation for orientation changes
    document.body.style.height = '100vh';
    setTimeout(() => {
      document.body.style.height = '';
      this.updateLayoutForBreakpoint();
    }, 100);
  }

  updateLayoutForBreakpoint() {
    const cards = document.querySelectorAll('.menu-card, .dept-card, .doctor-card');
    const chatShell = document.querySelector('.chat-shell');
    const container = document.querySelector('.container');

    if (this.isMobile) {
      this.applyMobileOptimizations(cards, chatShell, container);
    } else if (this.isTablet) {
      this.applyTabletOptimizations(cards, chatShell, container);
    } else {
      this.applyDesktopOptimizations(cards, chatShell, container);
    }
  }

  // ===== DEVICE-SPECIFIC OPTIMIZATIONS =====
  applyMobileOptimizations(cards, chatShell, container) {
    // Add mobile-specific classes
    document.body.classList.add('mobile-device');
    document.body.classList.remove('tablet-device', 'desktop-device');

    // Optimize cards for mobile
    cards.forEach(card => {
      card.classList.add('mobile-card');
      card.style.minHeight = '60px';
      card.style.padding = 'var(--space-sm)';
    });

    // Optimize chat shell for mobile
    if (chatShell) {
      chatShell.style.height = 'calc(100vh - 120px)';
      chatShell.style.margin = 'var(--space-xs)';
      chatShell.classList.add('mobile-chat');
    }

    // Adjust container padding
    if (container) {
      container.style.padding = '0 var(--space-xs)';
    }
  }

  applyTabletOptimizations(cards, chatShell, container) {
    document.body.classList.add('tablet-device');
    document.body.classList.remove('mobile-device', 'desktop-device');

    cards.forEach(card => {
      card.classList.add('tablet-card');
      card.style.minHeight = '80px';
      card.style.padding = 'var(--space-md)';
    });

    if (chatShell) {
      chatShell.style.height = 'calc(100vh - 160px)';
      chatShell.style.margin = 'var(--space-sm) var(--space-xs)';
      chatShell.classList.add('tablet-chat');
    }

    if (container) {
      container.style.padding = '0 var(--space-sm)';
    }
  }

  applyDesktopOptimizations(cards, chatShell, container) {
    document.body.classList.add('desktop-device');
    document.body.classList.remove('mobile-device', 'tablet-device');

    cards.forEach(card => {
      card.classList.add('desktop-card');
      card.style.minHeight = '120px';
      card.style.padding = 'var(--space-xl)';
    });

    if (chatShell) {
      chatShell.style.height = 'calc(100vh - 200px)';
      chatShell.style.maxWidth = '1200px';
      chatShell.style.margin = 'var(--space-xl) auto';
      chatShell.classList.add('desktop-chat');
    }

    if (container) {
      container.style.padding = '0 var(--space-lg)';
    }
  }

  // ===== ENHANCED TOUCH INTERACTIONS =====
  enhanceTouchInteractions() {
    if (!this.touchDevice) return;

    const interactiveElements = document.querySelectorAll('.menu-card, .dept-card, .doctor-card, .btn, .lang-btn');

    interactiveElements.forEach(element => {
      // Add touch feedback
      element.addEventListener('touchstart', (e) => {
        element.classList.add('touch-active');
        this.addTouchFeedback(element);
      });

      element.addEventListener('touchend', (e) => {
        setTimeout(() => {
          element.classList.remove('touch-active');
        }, 150);
      });

      element.addEventListener('touchcancel', (e) => {
        element.classList.remove('touch-active');
      });
    });
  }

  addTouchFeedback(element) {
    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (rect.width / 2 - size / 2) + 'px';
    ripple.style.top = (rect.height / 2 - size / 2) + 'px';

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  // ===== DYNAMIC ANIMATIONS =====
  setupDynamicAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe cards for animation
    const cards = document.querySelectorAll('.menu-card, .dept-card, .doctor-card');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
      observer.observe(card);
    });

    // Staggered animation for chat messages
    this.setupMessageAnimations();
  }

  setupMessageAnimations() {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;

    const messageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messages = entry.target.querySelectorAll('.msg');
          messages.forEach((msg, index) => {
            setTimeout(() => {
              msg.classList.add('animate-slideInUp');
            }, index * 100);
          });
        }
      });
    }, { threshold: 0.5 });

    messageObserver.observe(chatMessages);
  }

  // ===== DEVICE OPTIMIZATION =====
  optimizeForDevice() {
    // Reduce animations on low-end devices
    if (this.isMobile && navigator.hardwareConcurrency <= 2) {
      document.body.classList.add('reduced-animations');
    }

    // Optimize for touch vs mouse
    if (this.touchDevice) {
      document.body.classList.add('touch-device');
      this.optimizeTouchTargets();
    } else {
      document.body.classList.add('mouse-device');
      this.optimizeHoverEffects();
    }
  }

  optimizeTouchTargets() {
    const touchTargets = document.querySelectorAll('button, .menu-card, .dept-card, .doctor-card, input');
    touchTargets.forEach(target => {
      target.style.minHeight = '44px';
      target.style.minWidth = '44px';
    });
  }

  optimizeHoverEffects() {
    // Add enhanced hover effects for mouse users
    const hoverElements = document.querySelectorAll('.menu-card, .dept-card, .doctor-card');
    hoverElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        element.style.transform = 'translateY(-8px) scale(1.05) rotateX(5deg)';
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = '';
      });
    });
  }

  // ===== KEYBOARD NAVIGATION =====
  setupKeyboardNavigation() {
    const focusableElements = document.querySelectorAll(
      'button, .menu-card, .dept-card, .doctor-card, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
      element.addEventListener('keydown', (e) => {
        // Don't interfere with input fields - they need space key for typing
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          return;
        }
        
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          element.click();
          this.addKeyboardFeedback(element);
        }
      });

      element.addEventListener('focus', () => {
        element.classList.add('keyboard-focused');
      });

      element.addEventListener('blur', () => {
        element.classList.remove('keyboard-focused');
      });
    });
  }

  addKeyboardFeedback(element) {
    element.classList.add('keyboard-active');
    setTimeout(() => {
      element.classList.remove('keyboard-active');
    }, 200);
  }

  // ===== ANIMATION OPTIMIZATION =====
  optimizeAnimations() {
    // Adjust animation performance based on device capabilities
    if (this.isMobile) {
      // Reduce complex animations on mobile
      document.documentElement.style.setProperty('--transition-fast', '0.1s');
      document.documentElement.style.setProperty('--transition-normal', '0.2s');
      document.documentElement.style.setProperty('--transition-slow', '0.3s');
    } else {
      // Full animations on desktop
      document.documentElement.style.setProperty('--transition-fast', '0.15s');
      document.documentElement.style.setProperty('--transition-normal', '0.3s');
      document.documentElement.style.setProperty('--transition-slow', '0.5s');
    }
  }

  // ===== UTILITY METHODS =====
  getDeviceType() {
    return {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isDesktop: this.isDesktop,
      isTouch: this.touchDevice
    };
  }

  // Public method to refresh the UI
  refresh() {
    this.updateLayoutForBreakpoint();
    this.optimizeAnimations();
  }
}

// ===== ENHANCED MESSAGE ANIMATIONS =====
class MessageAnimations {
  constructor() {
    this.messageContainer = document.querySelector('.chat-messages');
    this.setupTypingAnimation();
    this.setupMessageTransitions();
  }

  setupTypingAnimation() {
    // Add typing indicator animation
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    typingIndicator.style.cssText = `
      display: none;
      padding: 10px 15px;
      background: linear-gradient(145deg, #f0f0f0, #e0e0e0);
      border-radius: 18px;
      margin: 10px 0;
      align-self: flex-start;
    `;

    if (this.messageContainer) {
      this.messageContainer.appendChild(typingIndicator);
    }
  }

  showTyping() {
    const indicator = document.querySelector('.typing-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
      indicator.classList.add('animate-pulse');
    }
  }

  hideTyping() {
    const indicator = document.querySelector('.typing-indicator');
    if (indicator) {
      indicator.style.display = 'none';
      indicator.classList.remove('animate-pulse');
    }
  }

  setupMessageTransitions() {
    // Enhanced message slide-in animation
    const style = document.createElement('style');
    style.textContent = `
      .typing-indicator {
        display: flex;
        gap: 4px;
        align-items: center;
        justify-content: center;
      }
      
      .typing-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #999;
        animation: typing 1.4s infinite ease-in-out;
      }
      
      .typing-dot:nth-child(1) { animation-delay: -0.32s; }
      .typing-dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes typing {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      
      .keyboard-focused {
        outline: 3px solid var(--primary-blue-400) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
      }
      
      .keyboard-active {
        transform: scale(0.98) !important;
        transition: transform 0.1s ease !important;
      }
      
      .touch-active {
        transform: scale(0.95) !important;
        transition: transform 0.1s ease !important;
      }
      
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize responsive UI
  window.responsiveUI = new ResponsiveUI();
  
  // Initialize message animations
  window.messageAnimations = new MessageAnimations();
  
  // Add global utility functions
  window.showTyping = () => window.messageAnimations.showTyping();
  window.hideTyping = () => window.messageAnimations.hideTyping();
  
  // Expose device info
  window.deviceInfo = window.responsiveUI.getDeviceType();
  
  console.log('Enhanced responsive UI initialized:', window.deviceInfo);
});

// ===== PERFORMANCE MONITORING =====
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      resizeEvents: 0,
      animationFrames: 0,
      touchEvents: 0
    };
    
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor resize performance
    let resizeTimeout;
    window.addEventListener('resize', () => {
      this.metrics.resizeEvents++;
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.logPerformance('resize');
      }, 1000);
    });

    // Monitor animation performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'measure') {
          this.metrics.animationFrames++;
        }
      });
    });
    observer.observe({ entryTypes: ['measure'] });
  }

  logPerformance(type) {
    console.log(`Performance ${type}:`, {
      timestamp: Date.now(),
      metrics: this.metrics,
      deviceInfo: window.deviceInfo
    });
  }
}

// Initialize performance monitoring
document.addEventListener('DOMContentLoaded', () => {
  window.performanceMonitor = new PerformanceMonitor();
});
