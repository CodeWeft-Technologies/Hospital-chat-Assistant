/**
 * Hospital Chat Widget Embed Script
 * This script creates a floating chat widget that can be embedded on any website
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        hospitalId: null, // Will be set dynamically
        position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
        size: 'medium', // small, medium, large
        primaryColor: '#2563eb',
        secondaryColor: '#059669',
        zIndex: 999999,
        apiBaseUrl: '/api/v1',
        widgetUrl: '/widget'
    };

    class HospitalChatWidget {
        constructor(config) {
            this.config = { ...CONFIG, ...config };
            this.isOpen = false;
            this.isInitialized = false;
            this.sessionId = this.generateSessionId();
            this.currentFlow = null;
            this.isLoading = false;
            this.init();
        }

        init() {
            if (this.isInitialized) return;
            
            this.createWidget();
            this.loadHospitalConfig();
            this.isInitialized = true;
        }

        async loadHospitalConfig() {
            try {
                const response = await fetch(`${this.config.apiBaseUrl}/hospitals/${this.config.hospitalId}/widget/config`);
                const data = await response.json();
                
                if (data.config) {
                    this.config.primaryColor = data.config.primary_color;
                    this.config.secondaryColor = data.config.secondary_color;
                    this.updateWidgetStyles();
                }
            } catch (error) {
                console.error('Error loading hospital config:', error);
            }
        }

        createWidget() {
            // Create widget container
            this.widgetContainer = document.createElement('div');
            this.widgetContainer.id = 'hospital-chat-widget-container';
            this.widgetContainer.style.cssText = `
                position: fixed;
                ${this.getPositionStyles()};
                z-index: ${this.config.zIndex};
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                box-sizing: border-box;
            `;

            // Create toggle button
            this.toggleButton = document.createElement('div');
            this.toggleButton.id = 'hospital-chat-toggle';
            this.toggleButton.innerHTML = `
                <div class="chat-toggle-button">
                    <div class="chat-toggle-icon">💬</div>
                    <div class="chat-toggle-text">Chat</div>
                </div>
            `;
            this.toggleButton.style.cssText = `
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                transition: all 0.3s ease;
                color: white;
                position: relative;
                overflow: hidden;
            `;

            // Create chat window
            this.chatWindow = document.createElement('div');
            this.chatWindow.id = 'hospital-chat-window';
            this.chatWindow.style.cssText = `
                width: ${this.getWindowSize()};
                height: 500px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                display: none;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid #e2e8f0;
                margin-bottom: 20px;
                transform: scale(0.8);
                opacity: 0;
                transition: all 0.3s ease;
            `;

            // Add event listeners
            this.toggleButton.addEventListener('click', () => this.toggleChat());
            this.toggleButton.addEventListener('mouseenter', () => {
                this.toggleButton.style.transform = 'scale(1.1)';
            });
            this.toggleButton.addEventListener('mouseleave', () => {
                this.toggleButton.style.transform = 'scale(1)';
            });

            // Create chat content
            this.createChatContent();

            // Append to DOM
            this.widgetContainer.appendChild(this.chatWindow);
            this.widgetContainer.appendChild(this.toggleButton);
            document.body.appendChild(this.widgetContainer);

            // Add CSS styles
            this.addStyles();
        }

        createChatContent() {
            // Header
            const header = document.createElement('div');
            header.className = 'chat-header';
            header.style.cssText = `
                background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                position: relative;
            `;
            header.innerHTML = `
                <div class="chat-header-info">
                    <div class="chat-header-title">Chat Assistant</div>
                    <div class="chat-header-subtitle">We're online</div>
                </div>
                <button class="chat-close-btn" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background 0.2s ease;
                ">×</button>
            `;

            // Messages container
            const messagesContainer = document.createElement('div');
            messagesContainer.className = 'chat-messages';
            messagesContainer.style.cssText = `
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
                display: flex;
                flex-direction: column;
                gap: 12px;
            `;

            // Welcome message
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'message message-bot';
            welcomeMessage.style.cssText = `
                background: linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%);
                color: #334155;
                padding: 12px 16px;
                border-radius: 18px;
                border: 1px solid #e2e8f0;
                border-bottom-left-radius: 6px;
                max-width: 80%;
                align-self: flex-start;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            `;
            welcomeMessage.innerHTML = `
                <div>Hello! 👋 Welcome to our hospital chat assistant. How can I help you today?</div>
                <div class="message-options" style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
                    <button class="option-btn" data-action="booking" style="
                        background: linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%);
                        border: 2px solid #e2e8f0;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 600;
                        color: #475569;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">📅 Book Appointment</button>
                    <button class="option-btn" data-action="check" style="
                        background: linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%);
                        border: 2px solid #e2e8f0;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 600;
                        color: #475569;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">🔍 Check Appointment</button>
                    <button class="option-btn" data-action="query" style="
                        background: linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%);
                        border: 2px solid #e2e8f0;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 600;
                        color: #475569;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">❓ General Query</button>
                </div>
            `;

            // Input container
            const inputContainer = document.createElement('div');
            inputContainer.className = 'chat-input-container';
            inputContainer.style.cssText = `
                padding: 16px 20px;
                background: white;
                border-top: 1px solid #e2e8f0;
                display: flex;
                gap: 12px;
                align-items: center;
            `;

            const messageInput = document.createElement('input');
            messageInput.type = 'text';
            messageInput.placeholder = 'Type your message...';
            messageInput.className = 'chat-input';
            messageInput.style.cssText = `
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #e2e8f0;
                border-radius: 24px;
                font-size: 14px;
                background: #f8fafc;
                transition: all 0.2s ease;
                outline: none;
            `;

            const sendButton = document.createElement('button');
            sendButton.textContent = 'Send';
            sendButton.className = 'chat-send-btn';
            sendButton.style.cssText = `
                padding: 12px 20px;
                border: none;
                border-radius: 24px;
                background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                color: white;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
            `;

            // Assemble chat window
            messagesContainer.appendChild(welcomeMessage);
            inputContainer.appendChild(messageInput);
            inputContainer.appendChild(sendButton);
            
            this.chatWindow.appendChild(header);
            this.chatWindow.appendChild(messagesContainer);
            this.chatWindow.appendChild(inputContainer);

            // Add event listeners
            const closeBtn = header.querySelector('.chat-close-btn');
            closeBtn.addEventListener('click', () => this.closeChat());
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
            });
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.background = 'none';
            });

            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            sendButton.addEventListener('click', () => this.sendMessage());

            // Option button handlers
            messagesContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('option-btn')) {
                    const action = e.target.dataset.action;
                    this.handleOptionClick(action, e.target.textContent);
                }
            });

            // Store references
            this.messagesContainer = messagesContainer;
            this.messageInput = messageInput;
            this.sendButton = sendButton;
        }

        toggleChat() {
            if (this.isOpen) {
                this.closeChat();
            } else {
                this.openChat();
            }
        }

        openChat() {
            this.isOpen = true;
            this.chatWindow.style.display = 'flex';
            
            // Animate in
            setTimeout(() => {
                this.chatWindow.style.transform = 'scale(1)';
                this.chatWindow.style.opacity = '1';
            }, 10);

            // Focus input
            setTimeout(() => {
                this.messageInput.focus();
            }, 300);

            // Update toggle button
            this.toggleButton.style.transform = 'scale(0.9)';
            this.toggleButton.style.opacity = '0.7';
        }

        closeChat() {
            this.isOpen = false;
            this.chatWindow.style.transform = 'scale(0.8)';
            this.chatWindow.style.opacity = '0';
            
            setTimeout(() => {
                this.chatWindow.style.display = 'none';
            }, 300);

            // Update toggle button
            this.toggleButton.style.transform = 'scale(1)';
            this.toggleButton.style.opacity = '1';
        }

        async sendMessage() {
            const message = this.messageInput.value.trim();
            if (!message) return;

            this.addMessage(message, true);
            this.messageInput.value = '';
            this.showLoading();

            try {
                const response = await this.apiCall('/chat', {
                    message: message,
                    session_id: this.sessionId,
                    language: 'english'
                });

                this.hideLoading();
                this.addMessage(response.response, false, response.suggestions || []);
                
            } catch (error) {
                this.hideLoading();
                this.addMessage('Sorry, I encountered an error. Please try again.', false);
                console.error('Chat error:', error);
            }
        }

        handleOptionClick(action, text) {
            this.addMessage(text, true);
            this.showLoading();

            switch (action) {
                case 'booking':
                    this.currentFlow = 'booking';
                    setTimeout(() => {
                        this.hideLoading();
                        this.addMessage('Let\'s book your appointment! Please provide your full name.', false);
                    }, 1000);
                    break;
                case 'check':
                    this.currentFlow = 'check_appointment';
                    setTimeout(() => {
                        this.hideLoading();
                        this.addMessage('To check your appointment, please provide your phone number.', false);
                    }, 1000);
                    break;
                case 'query':
                    this.currentFlow = 'general_query';
                    setTimeout(() => {
                        this.hideLoading();
                        this.addMessage('How can I help you today? Please ask your question.', false);
                    }, 1000);
                    break;
            }
        }

        addMessage(text, isUser = false, options = []) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'message-user' : 'message-bot'}`;
            messageDiv.style.cssText = `
                padding: 12px 16px;
                border-radius: 18px;
                max-width: 80%;
                word-wrap: break-word;
                animation: messageSlideIn 0.3s ease-out;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                ${isUser ? `
                    background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                    color: white;
                    align-self: flex-end;
                    border-bottom-right-radius: 6px;
                ` : `
                    background: linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%);
                    color: #334155;
                    align-self: flex-start;
                    border: 1px solid #e2e8f0;
                    border-bottom-left-radius: 6px;
                `}
            `;

            messageDiv.textContent = text;
            this.messagesContainer.appendChild(messageDiv);

            // Add options if provided
            if (options.length > 0) {
                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'message-options';
                optionsDiv.style.cssText = `
                    margin-top: 12px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                `;
                
                options.forEach(option => {
                    const button = document.createElement('button');
                    button.className = 'option-btn';
                    button.textContent = option.text;
                    button.style.cssText = `
                        background: linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%);
                        border: 2px solid #e2e8f0;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 600;
                        color: #475569;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    `;
                    button.addEventListener('click', () => {
                        this.addMessage(option.text, true);
                        // Handle option logic here
                    });
                    optionsDiv.appendChild(button);
                });
                
                this.messagesContainer.appendChild(optionsDiv);
            }

            this.scrollToBottom();
        }

        showLoading() {
            if (this.isLoading) return;
            
            this.isLoading = true;
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'message message-bot loading';
            loadingDiv.id = 'loading-message';
            loadingDiv.style.cssText = `
                background: linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%);
                color: #334155;
                padding: 12px 16px;
                border-radius: 18px;
                border: 1px solid #e2e8f0;
                border-bottom-left-radius: 6px;
                max-width: 80%;
                align-self: flex-start;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            loadingDiv.innerHTML = `
                <span>Assistant is typing</span>
                <div style="display: flex; gap: 4px;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background: #64748b; animation: loadingPulse 1.4s ease-in-out infinite both;"></div>
                    <div style="width: 6px; height: 6px; border-radius: 50%; background: #64748b; animation: loadingPulse 1.4s ease-in-out infinite both; animation-delay: -0.16s;"></div>
                    <div style="width: 6px; height: 6px; border-radius: 50%; background: #64748b; animation: loadingPulse 1.4s ease-in-out infinite both; animation-delay: -0.32s;"></div>
                </div>
            `;
            
            this.messagesContainer.appendChild(loadingDiv);
            this.scrollToBottom();
        }

        hideLoading() {
            this.isLoading = false;
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                loadingMessage.remove();
            }
        }

        async apiCall(endpoint, data) {
            const response = await fetch(`${this.config.apiBaseUrl}/hospitals/${this.config.hospitalId}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }

            return await response.json();
        }

        scrollToBottom() {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }

        generateSessionId() {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        getPositionStyles() {
            const positions = {
                'bottom-right': 'bottom: 20px; right: 20px;',
                'bottom-left': 'bottom: 20px; left: 20px;',
                'top-right': 'top: 20px; right: 20px;',
                'top-left': 'top: 20px; left: 20px;'
            };
            return positions[this.config.position] || positions['bottom-right'];
        }

        getWindowSize() {
            const sizes = {
                'small': '300px',
                'medium': '350px',
                'large': '400px'
            };
            return sizes[this.config.size] || sizes['medium'];
        }

        updateWidgetStyles() {
            // Update colors in existing elements
            const elements = this.widgetContainer.querySelectorAll('[style*="background: linear-gradient"]');
            elements.forEach(el => {
                if (el.style.background.includes(this.config.primaryColor)) {
                    el.style.background = `linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%)`;
                }
            });
        }

        addStyles() {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes messageSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes loadingPulse {
                    0%, 80%, 100% {
                        transform: scale(0);
                    }
                    40% {
                        transform: scale(1);
                    }
                }

                .chat-toggle-button:hover {
                    transform: scale(1.1) !important;
                }

                .option-btn:hover {
                    background: linear-gradient(145deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%) !important;
                    color: white !important;
                    border-color: ${this.config.primaryColor} !important;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .chat-input:focus {
                    border-color: ${this.config.primaryColor} !important;
                    background: white !important;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
                }

                .chat-send-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .chat-messages::-webkit-scrollbar {
                    width: 4px;
                }

                .chat-messages::-webkit-scrollbar-track {
                    background: transparent;
                }

                .chat-messages::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 2px;
                }

                .chat-messages::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                @media (max-width: 480px) {
                    #hospital-chat-widget-container {
                        bottom: 10px !important;
                        right: 10px !important;
                        left: 10px !important;
                    }
                    
                    #hospital-chat-window {
                        width: 100% !important;
                        height: 400px !important;
                        margin-bottom: 10px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Auto-initialize widget
    function initializeWidget() {
        // Get hospital ID from script src or data attribute
        const scripts = document.getElementsByTagName('script');
        let hospitalId = null;
        let config = {};

        for (let script of scripts) {
            if (script.src && script.src.includes('embed.js')) {
                const url = new URL(script.src);
                const pathParts = url.pathname.split('/');
                const widgetIndex = pathParts.indexOf('widget');
                if (widgetIndex !== -1 && pathParts[widgetIndex + 1]) {
                    hospitalId = pathParts[widgetIndex + 1];
                }
                break;
            }
        }

        // Check for data attributes on the widget container
        const widgetContainer = document.getElementById('hospital-chat-widget');
        if (widgetContainer) {
            hospitalId = hospitalId || widgetContainer.dataset.hospitalId;
            config.position = widgetContainer.dataset.position || config.position;
            config.size = widgetContainer.dataset.size || config.size;
            config.primaryColor = widgetContainer.dataset.primaryColor || config.primaryColor;
            config.secondaryColor = widgetContainer.dataset.secondaryColor || config.secondaryColor;
        }

        if (hospitalId) {
            config.hospitalId = hospitalId;
            window.hospitalChatWidget = new HospitalChatWidget(config);
        } else {
            console.error('Hospital ID not found. Please ensure the widget script is loaded correctly.');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWidget);
    } else {
        initializeWidget();
    }

    // Export for manual initialization
    window.HospitalChatWidget = HospitalChatWidget;

})();
