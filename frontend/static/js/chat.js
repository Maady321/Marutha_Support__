/**
 * chat.js
 * Integration for real-time messaging using Socket.io
 * Specifically designed for Marutha Support Platform
 */

class ChatInterface {
    constructor() {
        this.socket = null;
        this.currentUser = JSON.parse(localStorage.getItem('userData')) || {};
        this.activeRecipientId = null;
        // Use CONFIG if available, otherwise fallback
        this.baseUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'http://localhost:8001';
        
        // DOM Elements
        this.chatForm = document.getElementById('chatForm') || document.getElementById('doctorChatForm');
        this.messageInput = document.getElementById('messageInput') || document.getElementById('msgInput');
        this.chatContainer = document.querySelector('.chat-messages'); // Corrected selector for chat messages
        this.chatListItems = document.querySelectorAll('.chat-item');
        
        this.init();
    }

    async init() {
        // If userData isn't loaded yet, try to fetch it
        if (!this.currentUser.id) {
            try {
                const response = await apiFetch('/users/me');
                if (response.ok) {
                    this.currentUser = await response.json();
                    localStorage.setItem('userData', JSON.stringify(this.currentUser));
                }
            } catch (err) {
                console.error('Chat init: User not logged in or API unreachable');
                return;
            }
        }

        this.connectSocket();
        this.setupEventListeners();
        this.loadInitialData();
    }

    connectSocket() {
        const token = localStorage.getItem('authToken');
        
        // Initialize Socket.io connection
        this.socket = io(this.baseUrl, {
            auth: {
                token: token
            }
        });

        this.socket.on('connect', () => {
            console.log('Connected to chat server');
            this.updateOnlineStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
            this.updateOnlineStatus(false);
        });

        // Listen for incoming messages
        this.socket.on('receive_message', (data) => {
            // Only append if it belongs to the active conversation
            // Or if we are the sender (for sync)
            if (data.sender_id == this.activeRecipientId || data.sender_id == this.currentUser.id) {
                this.appendMessage(data, data.sender_id == this.currentUser.id ? 'sent' : 'received');
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    setupEventListeners() {
        if (this.chatForm) {
            this.chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }

        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Sidebar items
        if (this.chatListItems.length > 0) {
            this.chatListItems.forEach(item => {
                item.addEventListener('click', () => {
                    // Extract ID from custom logic if needed 
                    // In your current UI items have names. We need IDs.
                    const recipientId = item.dataset.recipientId; 
                    const name = item.querySelector('h4')?.innerText;
                    if (recipientId) {
                        this.switchChat(recipientId, item);
                    }
                });
            });
        }
    }

    async sendMessage() {
        const messageText = this.messageInput.value.trim();
        if (!messageText || !this.activeRecipientId) return;

        const messageData = {
            recipient_id: parseInt(this.activeRecipientId),
            message: messageText,
            timestamp: new Date().toISOString()
        };

        try {
            // Emit message via socket (it will come back via receive_message)
            this.socket.emit('send_message', messageData);

            // Clear input
            this.messageInput.value = '';
            this.messageInput.focus();

            // Store in DB via API (optional if Socket.io handles broadcast)
            // But good for history
            await apiFetch('/chats/', {
                method: 'POST',
                body: JSON.stringify({
                    recipient_id: parseInt(this.activeRecipientId),
                    message: messageText
                })
            });

        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    async switchChat(recipientId, element) {
        this.activeRecipientId = recipientId;
        
        // Update UI active state
        this.chatListItems.forEach(i => i.classList.remove('active'));
        if (element) element.classList.add('active');

        // Clear and load history
        if (this.chatContainer) {
            this.chatContainer.innerHTML = '<div class="text-center p-4">Loading messages...</div>';
            await this.loadChatHistory(recipientId);
        }
    }

    async loadChatHistory(friendId) {
        try {
            const response = await apiFetch(`/chats/history/${friendId}`);
            if (response.ok) {
                const history = await response.json();
                
                this.chatContainer.innerHTML = '';
                history.forEach(msg => {
                    const type = msg.sender_id == this.currentUser.id ? 'sent' : 'received';
                    this.appendMessage(msg, type);
                });
                
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Error loading history:', error);
            this.chatContainer.innerHTML = '<div class="text-center p-4 text-danger">Failed to load messages</div>';
        }
    }

    appendMessage(data, type) {
        if (!this.chatContainer) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type} fade-in`;
        
        // Match the CSS classes from your chat.css: message sent / message received
        
        const timestampStr = data.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
        
        msgDiv.innerHTML = `
            <div class="message-content">${data.message}</div>
            <span class="message-time">${timestampStr}</span>
        `;
        
        this.chatContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.chatContainer) {
            // Some containers might be nested, handle accordingly
            const parent = this.chatContainer.parentElement;
            if (parent && parent.classList.contains('chat-main')) {
                parent.scrollTop = parent.scrollHeight;
            } else {
                this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
            }
        }
    }

    updateOnlineStatus(isOnline) {
        const indicator = document.getElementById('online-indicator');
        if (indicator) {
            indicator.className = `status-icon ${isOnline ? 'online' : 'offline'}`;
        }
    }

    loadInitialData() {
        const urlParams = new URLSearchParams(window.location.search);
        const recipientId = urlParams.get('userId');
        
        if (recipientId) {
            this.switchChat(recipientId);
        } else if (this.chatListItems.length > 0) {
            // Optionally auto-select first item
            // const firstItem = this.chatListItems[0];
            // const firstId = firstItem.dataset.recipientId;
            // if (firstId) this.switchChat(firstId, firstItem);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof io !== 'undefined') {
        window.chatApp = new ChatInterface();
    } else {
        console.warn('Socket.io not found.');
    }
});
