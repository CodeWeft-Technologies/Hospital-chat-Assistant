// ===== PREMIUM AI CHAT INTERFACE JAVASCRIPT =====

class PremiumChat {
  constructor() {
    this.messages = [];
    this.isTyping = false;
    this.currentMode = 'general';
    this.connectionStatus = 'online';
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeChat();
    this.setupAutoResize();
    this.setupConnectionMonitoring();
  }

  setupEventListeners() {
    // Send button
    const sendBtn = document.getElementById('premiumSendBtn');
    const messageInput = document.getElementById('premiumMessageInput');
    
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }
    
    if (messageInput) {
      // Enter key to send (Shift+Enter for new line)
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto-resize textarea
      messageInput.addEventListener('input', () => {
        this.autoResizeTextarea();
      });

      // Focus management
      messageInput.addEventListener('focus', () => {
        this.scrollToBottom();
      });
    }

    // Quick action buttons
    const quickActions = document.querySelectorAll('.premium-quick-btn');
    quickActions.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Header buttons
    const backBtn = document.getElementById('premiumBackBtn');
    const languageBtn = document.getElementById('premiumLanguageBtn');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }

    if (languageBtn) {
      languageBtn.addEventListener('click', () => {
        window.location.href = '/language';
      });
    }
  }

  initializeChat() {
    // Add welcome message
    this.addMessage({
      type: 'system',
      content: 'Welcome to XYZ Hospital! I\'m your premium AI assistant, ready to help with all your healthcare needs. How can I assist you today?',
      timestamp: new Date()
    });

    // Hide welcome section after a delay
    setTimeout(() => {
      const welcomeSection = document.getElementById('premiumWelcomeSection');
      if (welcomeSection) {
        welcomeSection.style.display = 'none';
      }
    }, 5000);
  }

  setupAutoResize() {
    const messageInput = document.getElementById('premiumMessageInput');
    
    if (messageInput) {
      messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
      });
    }
  }

  setupConnectionMonitoring() {
    // Monitor connection status
    window.addEventListener('online', () => {
      this.updateConnectionStatus('online');
    });

    window.addEventListener('offline', () => {
      this.updateConnectionStatus('offline');
    });

    // Check connection status periodically
    setInterval(() => {
      if (navigator.onLine) {
        this.updateConnectionStatus('online');
      } else {
        this.updateConnectionStatus('offline');
      }
    }, 5000);
  }

  updateConnectionStatus(status) {
    const statusElement = document.getElementById('premiumChatHeading');
    
    if (statusElement) {
      statusElement.textContent = status === 'online' 
        ? 'Premium AI Assistant - Online'
        : 'Premium AI Assistant - Offline';
    }

    this.connectionStatus = status;
  }

  sendMessage() {
    const messageInput = document.getElementById('premiumMessageInput');
    
    if (!messageInput) {
      console.warn('No message input element found');
      return;
    }
    
    const message = messageInput.value.trim();

    if (!message || this.isTyping) return;

    // Add user message
    this.addMessage({
      type: 'user',
      content: message,
      timestamp: new Date()
    });

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Show typing indicator
    this.showTypingIndicator();

    // Process message based on current mode
    setTimeout(() => {
      this.processMessage(message);
    }, 1500);
  }

  addMessage(messageData) {
    const chatMessages = document.getElementById('premiumChatMessages');
    
    if (!chatMessages) {
      console.warn('No chat messages container found');
      return;
    }
    
    const messageElement = this.createMessageElement(messageData);
    
    chatMessages.appendChild(messageElement);
    this.scrollToBottom();
    
    // Store message
    this.messages.push(messageData);
  }

  createMessageElement(messageData) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `premium-message ${messageData.type}`;
    
    const content = document.createElement('div');
    content.textContent = messageData.content;
    messageDiv.appendChild(content);

    // Add timestamp for user messages
    if (messageData.type === 'user') {
      const timestamp = document.createElement('div');
      timestamp.className = 'premium-timestamp';
      timestamp.textContent = this.formatTime(messageData.timestamp);
      messageDiv.appendChild(timestamp);
    }

    // Add quick replies for bot messages
    if (messageData.type === 'bot' && messageData.quickReplies) {
      const quickReplies = this.createQuickReplies(messageData.quickReplies);
      messageDiv.appendChild(quickReplies);
    }

    return messageDiv;
  }

  createQuickReplies(replies) {
    const container = document.createElement('div');
    container.className = 'premium-quick-replies';
    
    replies.forEach(reply => {
      const button = document.createElement('button');
      button.className = 'premium-reply-btn';
      button.textContent = reply;
      button.addEventListener('click', () => {
        document.getElementById('premiumMessageInput').value = reply;
        this.sendMessage();
      });
      container.appendChild(button);
    });

    return container;
  }

  showTypingIndicator() {
    if (this.isTyping) return;

    this.isTyping = true;
    const chatMessages = document.getElementById('premiumChatMessages');
    
    if (!chatMessages) {
      console.warn('No chat messages container found for typing indicator');
      return;
    }
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'premium-typing';
    typingDiv.innerHTML = `
      <div class="premium-typing-dots">
        <div class="premium-typing-dot"></div>
        <div class="premium-typing-dot"></div>
        <div class="premium-typing-dot"></div>
      </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typingIndicator = document.querySelector('.premium-typing');
    if (typingIndicator) {
      typingIndicator.remove();
    }
    this.isTyping = false;
  }

  processMessage(message) {
    this.hideTypingIndicator();

    // Enhanced response logic for premium experience
    let response = this.generatePremiumResponse(message);
    
    this.addMessage({
      type: 'bot',
      content: response.content,
      timestamp: new Date(),
      quickReplies: response.quickReplies
    });

    // Handle special actions
    if (response.action) {
      this.handleSpecialAction(response.action);
    }
  }

  generatePremiumResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Booking related
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
      return {
        content: 'I\'d be delighted to help you book an appointment! Our premium scheduling system can find the perfect time slot for you. Let me guide you through our streamlined booking process.',
        quickReplies: ['Yes, book appointment', 'Check availability', 'View departments', 'Cancel'],
        action: 'booking'
      };
    }

    // My appointments
    if (lowerMessage.includes('my appointment') || lowerMessage.includes('check appointment') || lowerMessage.includes('upcoming')) {
      return {
        content: 'I can help you manage your appointments efficiently. Our premium patient portal provides real-time updates and easy rescheduling options.',
        quickReplies: ['View my appointments', 'Reschedule appointment', 'Cancel appointment', 'Get directions'],
        action: 'my-appointments'
      };
    }

    // General queries
    if (lowerMessage.includes('general') || lowerMessage.includes('question') || lowerMessage.includes('information')) {
      return {
        content: 'I\'m here to provide comprehensive information about our premium healthcare services. Our AI-powered system can answer questions about treatments, facilities, and more.',
        quickReplies: ['Hospital services', 'Contact information', 'Insurance info', 'Emergency services'],
        action: 'general-query'
      };
    }

    // Emergency
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('help')) {
      return {
        content: 'For medical emergencies, please call our 24/7 emergency line at (555) 911-HELP immediately, or visit our emergency department. Your safety is our top priority.',
        quickReplies: ['Call emergency', 'Get directions', 'Emergency contacts', 'Back to main menu']
      };
    }

    // Premium services
    if (lowerMessage.includes('premium') || lowerMessage.includes('vip') || lowerMessage.includes('special')) {
      return {
        content: 'Our premium healthcare services include priority scheduling, private rooms, personalized care coordination, and exclusive access to our top specialists.',
        quickReplies: ['Learn more', 'Book premium service', 'View benefits', 'Contact concierge']
      };
    }

    // Default premium response
    return {
      content: 'Thank you for choosing XYZ Hospital! I\'m here to provide you with exceptional healthcare assistance. How can I make your experience more comfortable today?',
      quickReplies: ['Book appointment', 'My appointments', 'General information', 'Premium services']
    };
  }

  handleSpecialAction(action) {
    switch (action) {
      case 'booking':
        this.switchToBookingMode();
        break;
      case 'my-appointments':
        this.switchToAppointmentsMode();
        break;
      case 'general-query':
        this.switchToGeneralMode();
        break;
    }
  }

  switchToBookingMode() {
    this.currentMode = 'booking';
    this.updateChatHeading('Premium Booking Assistant - Online');
    
    // Add booking-specific welcome message
    this.addMessage({
      type: 'bot',
      content: 'Welcome! I\'m here to help you book your appointment. Let me guide you through our premium scheduling system.',
      timestamp: new Date(),
      quickReplies: ['Select Department', 'Choose Doctor', 'Pick Date & Time']
    });
    
    // Initialize booking flow if available
    if (window.startBookingFlow) {
      window.startBookingFlow();
    }
  }

  switchToAppointmentsMode() {
    this.currentMode = 'my-appointments';
    this.updateChatHeading('Appointment Management - Online');
    
    // Add appointments-specific welcome message
    this.addMessage({
      type: 'bot',
      content: 'Welcome! I can help you manage your appointments. Let me show you your upcoming visits and available options.',
      timestamp: new Date(),
      quickReplies: ['View Appointments', 'Reschedule', 'Cancel', 'Get Reminders']
    });
    
    // Initialize appointments flow if available
    if (window.startMyAppointmentChatFlow) {
      window.startMyAppointmentChatFlow(window.currentLang || 'english');
    }
  }

  switchToGeneralMode() {
    this.currentMode = 'general';
    this.updateChatHeading('Premium AI Assistant - Online');
    
    // Add general query-specific welcome message
    this.addMessage({
      type: 'bot',
      content: 'Welcome! I\'m here to answer your questions about our premium healthcare services. What would you like to know?',
      timestamp: new Date(),
      quickReplies: ['Hospital Services', 'Insurance Info', 'Contact Details', 'Visit Information']
    });
    
    // Initialize general query flow if available
    if (window.startGeneralQueryFlow) {
      window.startGeneralQueryFlow(window.currentLang || 'english');
    }
  }

  updateChatHeading(heading) {
    const headingElement = document.getElementById('premiumChatHeading');
    if (headingElement) {
      headingElement.textContent = heading;
    }
  }

  handleQuickAction(action) {
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes('book') || lowerAction.includes('appointment')) {
      this.switchToBookingMode();
      this.addMessage({
        type: 'bot',
        content: 'Let\'s get started with booking your appointment. I\'ll guide you through our premium scheduling system.',
        timestamp: new Date(),
        quickReplies: ['Select Department', 'Choose Doctor', 'Pick Date & Time']
      });
    } else if (lowerAction.includes('my appointment')) {
      this.switchToAppointmentsMode();
      this.addMessage({
        type: 'bot',
        content: 'I can help you manage your appointments. Let me show you your upcoming visits and available options.',
        timestamp: new Date(),
        quickReplies: ['View Appointments', 'Reschedule', 'Cancel', 'Get Reminders']
      });
    } else if (lowerAction.includes('general') || lowerAction.includes('query')) {
      this.switchToGeneralMode();
      this.addMessage({
        type: 'bot',
        content: 'I\'m here to answer your questions about our premium healthcare services. What would you like to know?',
        timestamp: new Date(),
        quickReplies: ['Hospital Services', 'Insurance Info', 'Contact Details', 'Visit Information']
      });
    }
  }

  autoResizeTextarea() {
    const messageInput = document.getElementById('premiumMessageInput');
    
    if (messageInput && messageInput.style) {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
    }
  }

  scrollToBottom() {
    const chatMessages = document.getElementById('premiumChatMessages');
    
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Public methods for integration with existing chat flows
  addBotMessage(content, quickReplies = null) {
    this.addMessage({
      type: 'bot',
      content: content,
      timestamp: new Date(),
      quickReplies: quickReplies
    });
  }

  addUserMessage(content) {
    this.addMessage({
      type: 'user',
      content: content,
      timestamp: new Date()
    });
  }

  showTyping() {
    this.showTypingIndicator();
  }

  hideTyping() {
    this.hideTypingIndicator();
  }

  clearMessages() {
    const chatMessages = document.getElementById('premiumChatMessages');
    if (chatMessages) {
      chatMessages.innerHTML = '';
    }
    this.messages = [];
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.PremiumChat = PremiumChat;
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PremiumChat;
}
