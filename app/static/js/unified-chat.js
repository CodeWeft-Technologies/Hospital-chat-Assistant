// ===== UNIFIED CHAT INTERFACE JAVASCRIPT =====

class UnifiedChat {
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
    const sendBtn = document.getElementById('unifiedSendBtn');
    const messageInput = document.getElementById('unifiedMessageInput');
    
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

    // Header buttons
    const backBtn = document.getElementById('unifiedBackBtn');
    const languageBtn = document.getElementById('unifiedLanguageBtn');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        // Go back to main menu
        window.location.href = '/chat';
      });
    }

    if (languageBtn) {
      languageBtn.addEventListener('click', () => {
        window.location.href = '/language';
      });
    }
  }

  initializeChat() {
    // Add initial welcome message
    setTimeout(() => {
      this.addMessage({
        type: 'system',
        content: 'Welcome! I\'m your AI assistant, ready to help with all your healthcare needs.',
        timestamp: new Date()
      });
    }, 1000);
  }

  setupAutoResize() {
    const messageInput = document.getElementById('unifiedMessageInput');
    
    if (messageInput) {
      messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
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
    const statusElement = document.getElementById('unifiedChatHeading');
    
    if (statusElement) {
      const currentText = statusElement.textContent;
      const newText = currentText.replace(/(Online|Offline)$/, status === 'online' ? 'Online' : 'Offline');
      statusElement.textContent = newText;
    }

    this.connectionStatus = status;
  }

  sendMessage() {
    const messageInput = document.getElementById('unifiedMessageInput');
    
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
    const chatMessages = document.getElementById('unifiedChatMessages');
    
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
    messageDiv.className = `unified-message ${messageData.type}`;
    
    const content = document.createElement('div');
    content.textContent = messageData.content;
    messageDiv.appendChild(content);

    // Add timestamp for user messages
    if (messageData.type === 'user') {
      const timestamp = document.createElement('div');
      timestamp.className = 'unified-timestamp';
      timestamp.textContent = this.formatTime(messageData.timestamp);
      timestamp.style.cssText = 'font-size: 0.75rem; opacity: 0.6; margin-top: 0.5rem; font-weight: 400;';
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
    container.className = 'unified-quick-replies';
    container.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem;';
    
    replies.forEach(reply => {
      const button = document.createElement('button');
      button.className = 'unified-quick-reply-btn';
      button.textContent = reply;
      button.style.cssText = `
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 1rem;
        color: rgba(255, 255, 255, 0.9);
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.85rem;
        font-weight: 500;
      `;
      
      button.addEventListener('click', () => {
        document.getElementById('unifiedMessageInput').value = reply;
        this.sendMessage();
      });
      
      container.appendChild(button);
    });

    return container;
  }

  showTypingIndicator() {
    if (this.isTyping) return;

    this.isTyping = true;
    const chatMessages = document.getElementById('unifiedChatMessages');
    
    if (!chatMessages) {
      console.warn('No chat messages container found for typing indicator');
      return;
    }
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'unified-typing';
    typingDiv.innerHTML = `
      <div class="unified-typing-dots">
        <div class="unified-typing-dot"></div>
        <div class="unified-typing-dot"></div>
        <div class="unified-typing-dot"></div>
      </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typingIndicator = document.querySelector('.unified-typing');
    if (typingIndicator) {
      typingIndicator.remove();
    }
    this.isTyping = false;
  }

  processMessage(message) {
    this.hideTypingIndicator();

    // Enhanced response logic
    let response = this.generateResponse(message);
    
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

  generateResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Booking related
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
      return {
        content: 'I\'d be happy to help you book an appointment! Let me guide you through our scheduling system.',
        quickReplies: ['Yes, book appointment', 'Check availability', 'View departments', 'Cancel'],
        action: 'booking'
      };
    }

    // My appointments
    if (lowerMessage.includes('my appointment') || lowerMessage.includes('check appointment') || lowerMessage.includes('upcoming')) {
      return {
        content: 'I can help you manage your appointments. Let me show you your upcoming visits and available options.',
        quickReplies: ['View my appointments', 'Reschedule appointment', 'Cancel appointment', 'Get directions'],
        action: 'my-appointments'
      };
    }

    // General queries
    if (lowerMessage.includes('general') || lowerMessage.includes('question') || lowerMessage.includes('information')) {
      return {
        content: 'I\'m here to provide comprehensive information about our healthcare services. What would you like to know?',
        quickReplies: ['Hospital services', 'Contact information', 'Insurance info', 'Emergency services'],
        action: 'general-query'
      };
    }

    // Emergency
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('help')) {
      return {
        content: 'For medical emergencies, please call our 24/7 emergency line at (555) 911-HELP immediately, or visit our emergency department.',
        quickReplies: ['Call emergency', 'Get directions', 'Emergency contacts', 'Back to main menu']
      };
    }

    // Default response
    return {
      content: 'Thank you for your message! I\'m here to assist you with your healthcare needs. How can I help you today?',
      quickReplies: ['Book appointment', 'My appointments', 'General information', 'Emergency']
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
    this.updateChatHeading('Booking Assistant - Online');
    
    this.addMessage({
      type: 'bot',
      content: 'Let\'s get started with booking your appointment. I\'ll guide you through our scheduling system.',
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
    this.updateChatHeading('Appointment Manager - Online');
    
    this.addMessage({
      type: 'bot',
      content: 'I can help you manage your appointments. Let me show you your upcoming visits and available options.',
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
    this.updateChatHeading('General Query Assistant - Online');
    
    this.addMessage({
      type: 'bot',
      content: 'I\'m here to answer your questions about our healthcare services. What would you like to know?',
      timestamp: new Date(),
      quickReplies: ['Hospital Services', 'Insurance Info', 'Contact Details', 'Visit Information']
    });
    
    // Initialize general query flow if available
    if (window.startGeneralQueryFlow) {
      window.startGeneralQueryFlow(window.currentLang || 'english');
    }
  }

  updateChatHeading(heading) {
    const headingElement = document.getElementById('unifiedChatHeading');
    if (headingElement) {
      headingElement.textContent = heading;
    }
  }

  autoResizeTextarea() {
    const messageInput = document.getElementById('unifiedMessageInput');
    
    if (messageInput && messageInput.style) {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }
  }

  scrollToBottom() {
    const chatMessages = document.getElementById('unifiedChatMessages');
    
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
    const chatMessages = document.getElementById('unifiedChatMessages');
    if (chatMessages) {
      chatMessages.innerHTML = '';
    }
    this.messages = [];
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.UnifiedChat = UnifiedChat;
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedChat;
}
