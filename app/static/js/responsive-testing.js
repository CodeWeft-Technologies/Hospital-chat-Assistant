// ===== RESPONSIVE DESIGN TESTING TOOL =====

class ResponsiveTesting {
  constructor() {
    this.testResults = {};
    this.currentTest = null;
    this.init();
  }

  init() {
    this.createTestUI();
    this.setupTestScenarios();
    this.runAutomaticTests();
  }

  // ===== TEST UI CREATION =====
  createTestUI() {
    const testPanel = document.createElement('div');
    testPanel.id = 'responsive-test-panel';
    testPanel.innerHTML = `
      <div class="test-panel-header">
        <h3>🔧 Responsive Testing Tool</h3>
        <button id="toggle-test-panel" class="test-toggle-btn">Hide</button>
      </div>
      
      <div class="test-controls">
        <div class="device-selector">
          <label>Device Preview:</label>
          <select id="device-select">
            <option value="mobile-portrait">Mobile Portrait (375x667)</option>
            <option value="mobile-landscape">Mobile Landscape (667x375)</option>
            <option value="tablet-portrait">Tablet Portrait (768x1024)</option>
            <option value="tablet-landscape">Tablet Landscape (1024x768)</option>
            <option value="desktop-small">Desktop Small (1280x720)</option>
            <option value="desktop-large">Desktop Large (1920x1080)</option>
            <option value="custom">Custom Size</option>
          </select>
        </div>
        
        <div class="test-actions">
          <button id="run-tests" class="test-btn primary">Run Tests</button>
          <button id="screenshot" class="test-btn">Screenshot</button>
          <button id="export-report" class="test-btn">Export Report</button>
        </div>
        
        <div class="custom-size-inputs" id="custom-size-inputs" style="display: none;">
          <input type="number" id="custom-width" placeholder="Width" value="800">
          <input type="number" id="custom-height" placeholder="Height" value="600">
          <button id="apply-custom">Apply</button>
        </div>
      </div>
      
      <div class="test-results">
        <h4>Test Results:</h4>
        <div id="test-output"></div>
      </div>
      
      <div class="performance-metrics">
        <h4>Performance:</h4>
        <div id="performance-data"></div>
      </div>
    `;

    testPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      max-height: 80vh;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      overflow-y: auto;
    `;

    // Add styles for test panel
    const styles = `
      .test-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px 10px 0 0;
      }
      
      .test-panel-header h3 {
        margin: 0;
        font-size: 16px;
      }
      
      .test-toggle-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .test-controls {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .device-selector {
        margin-bottom: 12px;
      }
      
      .device-selector label {
        display: block;
        margin-bottom: 4px;
        font-weight: 600;
        color: #374151;
      }
      
      #device-select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
      }
      
      .test-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      
      .test-btn {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
      }
      
      .test-btn:hover {
        background: #f3f4f6;
      }
      
      .test-btn.primary {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      
      .test-btn.primary:hover {
        background: #2563eb;
      }
      
      .custom-size-inputs {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .custom-size-inputs input {
        flex: 1;
        padding: 6px 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 12px;
      }
      
      .test-results, .performance-metrics {
        padding: 16px;
      }
      
      .test-results h4, .performance-metrics h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #374151;
      }
      
      .test-item {
        padding: 8px 12px;
        margin: 4px 0;
        border-radius: 6px;
        font-size: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .test-pass {
        background: #d1fae5;
        color: #065f46;
        border-left: 4px solid #10b981;
      }
      
      .test-fail {
        background: #fee2e2;
        color: #991b1b;
        border-left: 4px solid #ef4444;
      }
      
      .test-warning {
        background: #fef3c7;
        color: #92400e;
        border-left: 4px solid #f59e0b;
      }
      
      .test-status {
        font-weight: 600;
      }
      
      .performance-item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 12px;
        color: #6b7280;
      }
      
      .performance-value {
        font-weight: 600;
        color: #374151;
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    document.body.appendChild(testPanel);
    this.setupTestPanelEvents();
  }

  setupTestPanelEvents() {
    const panel = document.getElementById('responsive-test-panel');
    const toggleBtn = document.getElementById('toggle-test-panel');
    const deviceSelect = document.getElementById('device-select');
    const customInputs = document.getElementById('custom-size-inputs');
    const runTestsBtn = document.getElementById('run-tests');
    const screenshotBtn = document.getElementById('screenshot');
    const exportBtn = document.getElementById('export-report');
    const applyCustomBtn = document.getElementById('apply-custom');

    // Toggle panel visibility
    toggleBtn.addEventListener('click', () => {
      const isHidden = panel.style.display === 'none';
      panel.style.display = isHidden ? 'block' : 'none';
      toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
    });

    // Device selector
    deviceSelect.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        customInputs.style.display = 'flex';
      } else {
        customInputs.style.display = 'none';
        this.applyDeviceSize(e.target.value);
      }
    });

    // Custom size application
    applyCustomBtn.addEventListener('click', () => {
      const width = document.getElementById('custom-width').value;
      const height = document.getElementById('custom-height').value;
      this.applyCustomSize(width, height);
    });

    // Test buttons
    runTestsBtn.addEventListener('click', () => this.runAllTests());
    screenshotBtn.addEventListener('click', () => this.takeScreenshot());
    exportBtn.addEventListener('click', () => this.exportReport());
  }

  // ===== DEVICE SIZE SIMULATION =====
  applyDeviceSize(device) {
    const sizes = {
      'mobile-portrait': { width: 375, height: 667 },
      'mobile-landscape': { width: 667, height: 375 },
      'tablet-portrait': { width: 768, height: 1024 },
      'tablet-landscape': { width: 1024, height: 768 },
      'desktop-small': { width: 1280, height: 720 },
      'desktop-large': { width: 1920, height: 1080 }
    };

    const size = sizes[device];
    if (size) {
      this.simulateDevice(size.width, size.height);
    }
  }

  applyCustomSize(width, height) {
    this.simulateDevice(parseInt(width), parseInt(height));
  }

  simulateDevice(width, height) {
    // Create a viewport container
    const viewport = document.createElement('div');
    viewport.id = 'test-viewport';
    viewport.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${Math.min(width, window.innerWidth - 400)}px;
      height: ${Math.min(height, window.innerHeight - 100)}px;
      border: 3px solid #3b82f6;
      border-radius: 12px;
      background: white;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      z-index: 9999;
      overflow: auto;
      resize: both;
    `;

    // Remove existing viewport
    const existingViewport = document.getElementById('test-viewport');
    if (existingViewport) {
      existingViewport.remove();
    }

    document.body.appendChild(viewport);

    // Clone the main content
    const mainContent = document.querySelector('.container');
    if (mainContent) {
      const clonedContent = mainContent.cloneNode(true);
      clonedContent.style.width = '100%';
      clonedContent.style.height = '100%';
      viewport.appendChild(clonedContent);
    }

    // Update test panel
    this.updateTestPanel(`Simulating: ${width}x${height}`);
  }

  updateTestPanel(message) {
    const output = document.getElementById('test-output');
    if (output) {
      output.innerHTML = `<div class="test-item test-pass">${message}</div>`;
    }
  }

  // ===== TEST SCENARIOS =====
  setupTestScenarios() {
    this.testScenarios = [
      {
        name: 'Layout Responsiveness',
        test: () => this.testLayoutResponsiveness()
      },
      {
        name: 'Touch Target Sizes',
        test: () => this.testTouchTargets()
      },
      {
        name: 'Text Readability',
        test: () => this.testTextReadability()
      },
      {
        name: 'Navigation Accessibility',
        test: () => this.testNavigation()
      },
      {
        name: 'Performance Metrics',
        test: () => this.testPerformance()
      },
      {
        name: 'Animation Performance',
        test: () => this.testAnimations()
      }
    ];
  }

  // ===== INDIVIDUAL TESTS =====
  testLayoutResponsiveness() {
    const results = [];
    const container = document.querySelector('.container');
    const menuCards = document.querySelectorAll('.menu-card');
    const chatShell = document.querySelector('.chat-shell');

    // Test container width
    if (container) {
      const containerWidth = container.offsetWidth;
      const viewportWidth = window.innerWidth;
      const widthRatio = containerWidth / viewportWidth;
      
      if (widthRatio > 0.9 && widthRatio < 1.1) {
        results.push({ status: 'pass', message: 'Container width is appropriate' });
      } else {
        results.push({ status: 'warning', message: `Container width ratio: ${widthRatio.toFixed(2)}` });
      }
    }

    // Test menu card layout
    if (menuCards.length > 0) {
      const firstCard = menuCards[0];
      const cardWidth = firstCard.offsetWidth;
      const cardHeight = firstCard.offsetHeight;
      
      if (cardWidth >= 200 && cardHeight >= 80) {
        results.push({ status: 'pass', message: 'Menu cards have adequate size' });
      } else {
        results.push({ status: 'fail', message: `Menu cards too small: ${cardWidth}x${cardHeight}` });
      }
    }

    // Test chat shell responsiveness
    if (chatShell) {
      const chatHeight = chatShell.offsetHeight;
      const viewportHeight = window.innerHeight;
      const heightRatio = chatHeight / viewportHeight;
      
      if (heightRatio > 0.3 && heightRatio < 0.8) {
        results.push({ status: 'pass', message: 'Chat shell height is appropriate' });
      } else {
        results.push({ status: 'warning', message: `Chat shell height ratio: ${heightRatio.toFixed(2)}` });
      }
    }

    return results;
  }

  testTouchTargets() {
    const results = [];
    const touchElements = document.querySelectorAll('button, .menu-card, .dept-card, .doctor-card');

    touchElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // Minimum touch target size

      if (rect.width >= minSize && rect.height >= minSize) {
        results.push({ 
          status: 'pass', 
          message: `Touch target ${index + 1}: ${Math.round(rect.width)}x${Math.round(rect.height)}` 
        });
      } else {
        results.push({ 
          status: 'fail', 
          message: `Touch target ${index + 1} too small: ${Math.round(rect.width)}x${Math.round(rect.height)}` 
        });
      }
    });

    return results;
  }

  testTextReadability() {
    const results = [];
    const textElements = document.querySelectorAll('h1, h2, h3, p, .menu-title, .subtitle');

    textElements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = parseFloat(computedStyle.lineHeight);
      
      if (fontSize >= 14) {
        results.push({ 
          status: 'pass', 
          message: `Text element ${index + 1}: ${fontSize}px font size` 
        });
      } else {
        results.push({ 
          status: 'warning', 
          message: `Text element ${index + 1} may be too small: ${fontSize}px` 
        });
      }

      if (lineHeight >= 1.4) {
        results.push({ 
          status: 'pass', 
          message: `Text element ${index + 1}: Good line height` 
        });
      }
    });

    return results;
  }

  testNavigation() {
    const results = [];
    const navElements = document.querySelectorAll('button, .menu-card, .dept-card, .doctor-card');

    // Test keyboard navigation
    let focusableCount = 0;
    navElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex !== '-1' && !element.disabled) {
        focusableCount++;
      }
    });

    if (focusableCount === navElements.length) {
      results.push({ status: 'pass', message: 'All interactive elements are focusable' });
    } else {
      results.push({ status: 'warning', message: `${focusableCount}/${navElements.length} elements focusable` });
    }

    return results;
  }

  testPerformance() {
    const results = [];
    
    // Measure page load time
    const loadTime = performance.now();
    if (loadTime < 1000) {
      results.push({ status: 'pass', message: `Page load time: ${Math.round(loadTime)}ms` });
    } else {
      results.push({ status: 'warning', message: `Page load time: ${Math.round(loadTime)}ms` });
    }

    // Measure memory usage (if available)
    if (performance.memory) {
      const memoryUsed = performance.memory.usedJSHeapSize / 1024 / 1024;
      results.push({ status: 'info', message: `Memory usage: ${memoryUsed.toFixed(2)}MB` });
    }

    return results;
  }

  testAnimations() {
    const results = [];
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      results.push({ status: 'info', message: 'Reduced motion preference detected' });
    }

    // Test animation performance
    const animatedElements = document.querySelectorAll('[style*="animation"], [class*="animate"]');
    results.push({ status: 'info', message: `${animatedElements.length} animated elements found` });

    return results;
  }

  // ===== TEST EXECUTION =====
  runAllTests() {
    const output = document.getElementById('test-output');
    const performanceData = document.getElementById('performance-data');
    
    if (!output) return;

    output.innerHTML = '<div class="test-item">Running tests...</div>';
    
    const allResults = [];
    
    this.testScenarios.forEach(scenario => {
      try {
        const results = scenario.test();
        allResults.push({ scenario: scenario.name, results });
      } catch (error) {
        allResults.push({ 
          scenario: scenario.name, 
          results: [{ status: 'fail', message: `Error: ${error.message}` }] 
        });
      }
    });

    this.displayResults(allResults);
    this.updatePerformanceMetrics();
  }

  displayResults(allResults) {
    const output = document.getElementById('test-output');
    let html = '';

    allResults.forEach(({ scenario, results }) => {
      html += `<div style="margin-bottom: 12px;"><strong>${scenario}:</strong></div>`;
      
      results.forEach(result => {
        html += `<div class="test-item test-${result.status}">
          <span>${result.message}</span>
          <span class="test-status">${result.status.toUpperCase()}</span>
        </div>`;
      });
    });

    output.innerHTML = html;
  }

  updatePerformanceMetrics() {
    const performanceData = document.getElementById('performance-data');
    if (!performanceData) return;

    const metrics = {
      'Viewport Size': `${window.innerWidth}x${window.innerHeight}`,
      'Device Pixel Ratio': window.devicePixelRatio || 1,
      'Connection Type': navigator.connection?.effectiveType || 'unknown',
      'Touch Support': 'ontouchstart' in window ? 'Yes' : 'No',
      'Orientation': window.screen?.orientation?.type || 'unknown'
    };

    let html = '';
    Object.entries(metrics).forEach(([key, value]) => {
      html += `<div class="performance-item">
        <span>${key}:</span>
        <span class="performance-value">${value}</span>
      </div>`;
    });

    performanceData.innerHTML = html;
  }

  // ===== AUTOMATIC TESTING =====
  runAutomaticTests() {
    // Run tests on load
    setTimeout(() => {
      this.runAllTests();
    }, 1000);

    // Run tests on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.runAllTests();
      }, 500);
    });
  }

  // ===== SCREENSHOT FUNCTIONALITY =====
  takeScreenshot() {
    // This would require a backend service to capture screenshots
    alert('Screenshot functionality requires backend implementation');
  }

  // ===== REPORT EXPORT =====
  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      userAgent: navigator.userAgent,
      tests: this.testResults
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responsive-test-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Only show testing tool in development or when explicitly enabled
  const urlParams = new URLSearchParams(window.location.search);
  const enableTesting = urlParams.get('test') === 'true' || window.location.hostname === 'localhost';
  
  if (enableTesting) {
    window.responsiveTesting = new ResponsiveTesting();
    console.log('Responsive testing tool initialized');
  }
});
