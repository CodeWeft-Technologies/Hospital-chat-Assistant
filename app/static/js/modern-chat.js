// ===== MODERN CHAT INTERFACE JAVASCRIPT =====

class ModernChat {
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
    // Send button - check both old and new IDs
    const sendBtn = document.getElementById('sendBtn') || document.getElementById('modernSendBtn');
    const messageInput = document.getElementById('messageInput') || document.getElementById('modernChatInput');
    
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
    const quickActions = document.querySelectorAll('.quick-action-btn');
    quickActions.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Attachment button
    const attachmentBtn = document.getElementById('attachmentBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (attachmentBtn && fileInput) {
      attachmentBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        this.handleFileUpload(e.target.files[0]);
      });
    }

    // Header buttons - check both old and new IDs
    const backBtn = document.getElementById('backBtn') || document.getElementById('modernBackBtn');
    const languageBtn = document.getElementById('languageBtn') || document.getElementById('modernLanguageBtn');
    const settingsBtn = document.getElementById('settingsBtn');

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

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showSettings();
      });
    }
  }

  initializeChat() {
    // Add welcome message
    this.addMessage({
      type: 'system',
      content: 'Welcome! I\'m here to help you with your healthcare needs. What would you like to do?',
      timestamp: new Date()
    });

    // Hide welcome message after a delay
    setTimeout(() => {
      const welcomeMessage = document.getElementById('welcomeMessage');
      if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
      }
    }, 3000);
  }

  setupAutoResize() {
    const messageInput = document.getElementById('messageInput');
    
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    });
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
    const statusElement = document.getElementById('connectionStatus');
    const statusText = document.getElementById('chatHeading');
    
    if (statusElement) {
      statusElement.className = `connection-status ${status}`;
      statusElement.innerHTML = status === 'online' 
        ? '<i class="fas fa-wifi"></i> Online'
        : '<i class="fas fa-wifi-slash"></i> Offline';
    }

    if (statusText) {
      statusText.textContent = status === 'online' 
        ? 'Chat Assistant - Online'
        : 'Chat Assistant - Offline';
    }

    this.connectionStatus = status;
  }

  sendMessage() {
    // Check both old and new message input elements
    const messageInput = document.getElementById('messageInput') || 
                        document.getElementById('modernChatInput') || 
                        document.getElementById('chatInput');
    
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
    if (messageInput.style) {
      messageInput.style.height = 'auto';
    }

    // Show typing indicator
    this.showTypingIndicator();

    // Process message based on current mode
    setTimeout(() => {
      this.processMessage(message);
    }, 1000);
  }

  addMessage(messageData) {
    // Check both old and new chat message containers
    const chatMessages = document.getElementById('chatMessages') || 
                        document.getElementById('modernChatMessages') ||
                        document.getElementById('chatMessages');
    
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
    messageDiv.className = `message-bubble ${messageData.type}`;
    
    const content = document.createElement('div');
    content.textContent = messageData.content;
    messageDiv.appendChild(content);

    // Add timestamp for user messages
    if (messageData.type === 'user') {
      const timestamp = document.createElement('div');
      timestamp.className = 'message-timestamp';
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
    container.className = 'quick-replies';
    
    replies.forEach(reply => {
      const button = document.createElement('button');
      button.className = 'quick-reply-btn';
      button.textContent = reply;
      button.addEventListener('click', () => {
        document.getElementById('messageInput').value = reply;
        this.sendMessage();
      });
      container.appendChild(button);
    });

    return container;
  }

  showTypingIndicator() {
    if (this.isTyping) return;

    this.isTyping = true;
    const chatMessages = document.getElementById('chatMessages') || 
                        document.getElementById('modernChatMessages');
    
    if (!chatMessages) {
      console.warn('No chat messages container found for typing indicator');
      return;
    }
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
    this.isTyping = false;
  }

  processMessage(message) {
    this.hideTypingIndicator();

    // Simple response logic - in real implementation, this would connect to your AI service
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
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
      return {
        content: 'I can help you book an appointment! Let me guide you through the process.',
        quickReplies: ['Yes, book appointment', 'Check availability', 'Cancel'],
        action: 'booking'
      };
    }

    // My appointments
    if (lowerMessage.includes('my appointment') || lowerMessage.includes('check appointment')) {
      return {
        content: 'I can help you check your existing appointments. What would you like to do?',
        quickReplies: ['View my appointments', 'Reschedule', 'Cancel appointment'],
        action: 'my-appointments'
      };
    }

    // General queries
    if (lowerMessage.includes('general') || lowerMessage.includes('question')) {
      return {
        content: 'I\'m here to answer your general questions about our hospital services.',
        quickReplies: ['Hospital hours', 'Contact information', 'Services offered'],
        action: 'general-query'
      };
    }

    // Emergency
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
      return {
        content: 'For medical emergencies, please call our emergency line at (555) 123-4567 or visit our emergency department immediately.',
        quickReplies: ['Call emergency', 'Get directions', 'Back to main menu']
      };
    }

    // Default response
    return {
      content: 'Thank you for your message. How can I assist you today?',
      quickReplies: ['Book appointment', 'My appointments', 'General query', 'Emergency']
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
    this.updateQuickActions(['Select Department', 'Choose Doctor', 'Pick Date', 'Back to Main']);
    
    // Initialize booking flow if available
    if (window.startBookingFlow) {
      window.startBookingFlow();
    }
  }

  switchToAppointmentsMode() {
    this.currentMode = 'my-appointments';
    this.updateQuickActions(['View Appointments', 'Reschedule', 'Cancel', 'Back to Main']);
    
    // Initialize appointments flow if available
    if (window.startMyAppointmentChatFlow) {
      window.startMyAppointmentChatFlow(window.currentLang || 'english');
    }
  }

  switchToGeneralMode() {
    this.currentMode = 'general';
    this.updateQuickActions(['Hospital Info', 'Contact Us', 'Services', 'Back to Main']);
    
    // Initialize general query flow if available
    if (window.startGeneralQueryFlow) {
      window.startGeneralQueryFlow(window.currentLang || 'english');
    }
  }

  updateQuickActions(actions) {
    const quickActions = document.getElementById('quickActions');
    quickActions.innerHTML = '';

    actions.forEach(action => {
      const button = document.createElement('button');
      button.className = 'quick-action-btn';
      button.textContent = action;
      button.addEventListener('click', () => {
        this.handleQuickAction(action);
      });
      quickActions.appendChild(button);
    });
  }

  handleQuickAction(action) {
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes('book') || lowerAction.includes('appointment')) {
      this.switchToBookingMode();
    } else if (lowerAction.includes('my appointment')) {
      this.switchToAppointmentsMode();
    } else if (lowerAction.includes('general') || lowerAction.includes('query')) {
      this.switchToGeneralMode();
    } else if (lowerAction.includes('emergency')) {
      this.addMessage({
        type: 'bot',
        content: 'For emergencies, please call (555) 123-4567 immediately.',
        timestamp: new Date()
      });
    } else if (lowerAction.includes('back to main')) {
      this.switchToGeneralMode();
      this.updateQuickActions([
        'Book Appointment',
        'My Appointments', 
        'General Query',
        'Emergency'
      ]);
    }
  }

  handleFileUpload(file) {
    if (!file) return;

    // Show upload indicator
    const indicator = document.getElementById('fileUploadIndicator');
    indicator.classList.add('show');

    // Simulate upload process
    setTimeout(() => {
      indicator.classList.remove('show');
      
      this.addMessage({
        type: 'user',
        content: `📎 ${file.name}`,
        timestamp: new Date()
      });

      // Bot response
      setTimeout(() => {
        this.addMessage({
          type: 'bot',
          content: 'Thank you for sharing the file. I\'ve received it and will review it shortly.',
          timestamp: new Date()
        });
      }, 1000);
    }, 2000);
  }

  showSettings() {
    // Simple settings modal - in real implementation, this would be more comprehensive
    const settings = {
      notifications: true,
      sound: true,
      theme: 'light'
    };

    const message = `Settings:\n• Notifications: ${settings.notifications ? 'On' : 'Off'}\n• Sound: ${settings.sound ? 'On' : 'Off'}\n• Theme: ${settings.theme}`;
    
    this.addMessage({
      type: 'system',
      content: message,
      timestamp: new Date()
    });
  }

  autoResizeTextarea() {
    const messageInput = document.getElementById('messageInput') || 
                        document.getElementById('modernChatInput') || 
                        document.getElementById('chatInput');
    
    if (messageInput && messageInput.style) {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }
  }

  scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages') || 
                        document.getElementById('modernChatMessages');
    
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
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    this.messages = [];
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ModernChat = ModernChat;
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModernChat;
}
