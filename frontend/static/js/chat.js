/**
 * chat.js — WhatsApp-style Chat for Marutha Support
 * Works across patient, doctor, and volunteer chat pages.
 * Uses Socket.io for real-time messaging.
 */

class ChatInterface {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.activeRecipientId = null;
        this.baseUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'http://localhost:8009';
        this.contacts = [];
        this.lastRenderedDate = null; // for date separators

        // DOM Elements (new unified IDs)
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('chatSendBtn');
        this.messagesArea = document.getElementById('chatMessagesArea');
        this.inputBar = document.getElementById('chatInputBar');
        this.headerName = document.getElementById('chatHeaderName');
        this.headerAvatar = document.getElementById('chatHeaderAvatar');
        this.headerStatus = document.getElementById('chatHeaderStatus');
        this.contactListContainer = document.getElementById('chatListContainer');
        this.searchInput = document.getElementById('chatSearchInput');

        this.init();
    }

    async init() {
        // Fetch current user data
        try {
            const response = await apiFetch('/users/me');
            if (response.ok) {
                this.currentUser = await response.json();
                localStorage.setItem('userData', JSON.stringify(this.currentUser));
            } else {
                console.error('Chat: Not logged in');
                return;
            }
        } catch (err) {
            console.error('Chat init: API unreachable', err);
            return;
        }

        this.connectSocket();
        this.setupEventListeners();
        await this.loadContacts();
    }

    // ─── Socket.io Connection ───────────────────────────────

    connectSocket() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        this.socket = io(this.baseUrl, {
            path: '/socket.io',
            auth: { token: token }
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to chat server');
            if (this.headerStatus) this.headerStatus.textContent = 'Online';
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from chat server');
        });

        // Listen for incoming messages
        this.socket.on('receive_message', (data) => {
            // Only show in active conversation
            if (this.activeRecipientId &&
                (String(data.sender_id) === String(this.activeRecipientId) ||
                 String(data.sender_id) === String(this.currentUser.id))) {
                this.appendMessage(data);
                this.scrollToBottom();
            }

            // Update contact list preview
            this.updateContactPreview(data);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
        });
    }

    // ─── Event Listeners ────────────────────────────────────

    setupEventListeners() {
        // Send button
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Enter key to send
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Search contacts
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const items = this.contactListContainer.querySelectorAll('.chat-contact');
                items.forEach(item => {
                    const name = item.querySelector('.contact-name')?.textContent.toLowerCase() || '';
                    item.style.display = name.includes(query) ? 'flex' : 'none';
                });
            });
        }
    }

    // ─── Send Message ───────────────────────────────────────

    async sendMessage() {
        const text = this.messageInput?.value.trim();
        if (!text || !this.activeRecipientId) return;

        // Clear input immediately
        this.messageInput.value = '';
        this.messageInput.focus();

        try {
            const response = await apiFetch('/chats/', {
                method: 'POST',
                body: JSON.stringify({
                    recipient_id: parseInt(this.activeRecipientId),
                    message: text
                })
            });

            if (!response.ok) {
                console.error('Failed to send message');
            }
        } catch (error) {
            console.error('Send message error:', error);
        }
    }

    // ─── Load Contacts ──────────────────────────────────────

    async loadContacts() {
        if (!this.contactListContainer) return;

        try {
            const response = await apiFetch('/chats/contacts');
            if (!response.ok) {
                this.contactListContainer.innerHTML = `
                    <div class="chat-empty-state" style="padding: 40px 24px">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Failed to load contacts</p>
                    </div>`;
                return;
            }

            this.contacts = await response.json();

            if (this.contacts.length === 0) {
                this.contactListContainer.innerHTML = `
                    <div class="chat-empty-state" style="padding: 40px 24px">
                        <i class="fas fa-user-friends"></i>
                        <p>No contacts yet. Contacts appear after a doctor accepts your consultation request.</p>
                    </div>`;
                return;
            }

            this.renderContacts();
            this.autoSelectContact();

        } catch (error) {
            console.error('Failed to load contacts:', error);
            this.contactListContainer.innerHTML = `
                <div class="chat-empty-state" style="padding: 40px 24px">
                    <i class="fas fa-wifi" style="color: var(--danger)"></i>
                    <p>Connection error</p>
                </div>`;
        }
    }

    renderContacts() {
        this.contactListContainer.innerHTML = '';

        this.contacts.forEach(contact => {
            const initials = contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const el = document.createElement('div');
            el.className = 'chat-contact';
            el.dataset.userId = contact.user_id;

            const avatarBg = contact.role === 'doctor' ? 'var(--lavender-soft)' :
                             contact.role === 'volunteer' ? '#ecfdf5' : '#eff6ff';
            const avatarColor = contact.role === 'doctor' ? 'var(--medical-blue)' :
                                contact.role === 'volunteer' ? '#047857' : '#1e40af';

            el.innerHTML = `
                <div class="contact-avatar" style="background: ${avatarBg}; color: ${avatarColor}">${initials}</div>
                <div class="contact-info">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-role">${contact.role}</div>
                </div>
            `;

            el.addEventListener('click', () => this.selectContact(contact, el));
            this.contactListContainer.appendChild(el);
        });
    }

    autoSelectContact() {
        // Check URL param first
        const urlParams = new URLSearchParams(window.location.search);
        const targetId = urlParams.get('userId');

        if (targetId) {
            const contact = this.contacts.find(c => String(c.user_id) === String(targetId));
            const el = this.contactListContainer.querySelector(`[data-user-id="${targetId}"]`);
            if (contact && el) {
                this.selectContact(contact, el);
                return;
            }
        }

        // Default to first contact
        if (this.contacts.length > 0) {
            const firstEl = this.contactListContainer.querySelector('.chat-contact');
            this.selectContact(this.contacts[0], firstEl);
        }
    }

    // ─── Select Contact & Load History ──────────────────────

    async selectContact(contact, element) {
        this.activeRecipientId = contact.user_id;
        this.lastRenderedDate = null;

        // Update sidebar active state
        this.contactListContainer.querySelectorAll('.chat-contact').forEach(c => c.classList.remove('active'));
        if (element) element.classList.add('active');

        // Update header
        const initials = contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        if (this.headerName) this.headerName.textContent = contact.name;
        if (this.headerAvatar) this.headerAvatar.textContent = initials;
        if (this.headerStatus) this.headerStatus.textContent = contact.role;

        // Show input bar
        if (this.inputBar) this.inputBar.style.display = 'flex';

        // Load history
        if (this.messagesArea) {
            this.messagesArea.innerHTML = `
                <div class="chat-empty-state">
                    <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem"></i>
                    <p>Loading messages...</p>
                </div>`;
        }

        await this.loadChatHistory(contact.user_id);
    }

    async loadChatHistory(friendId) {
        try {
            const response = await apiFetch(`/chats/history/${friendId}`);
            if (!response.ok) {
                this.messagesArea.innerHTML = `
                    <div class="chat-empty-state">
                        <i class="fas fa-exclamation-triangle" style="color: var(--danger)"></i>
                        <p>Failed to load messages</p>
                    </div>`;
                return;
            }

            const history = await response.json();
            this.messagesArea.innerHTML = '';
            this.lastRenderedDate = null;

            if (history.length === 0) {
                this.messagesArea.innerHTML = `
                    <div class="chat-empty-state">
                        <i class="fas fa-hand-holding-heart"></i>
                        <p>No messages yet. Say hello! 👋</p>
                    </div>`;
                return;
            }

            history.forEach(msg => this.appendMessage(msg));
            this.scrollToBottom();

        } catch (error) {
            console.error('Error loading chat history:', error);
            this.messagesArea.innerHTML = `
                <div class="chat-empty-state">
                    <i class="fas fa-wifi" style="color: var(--danger)"></i>
                    <p>Connection error</p>
                </div>`;
        }
    }

    // ─── Render Messages (WhatsApp Style) ───────────────────

    appendMessage(data) {
        if (!this.messagesArea) return;

        // Remove empty state if present
        const emptyState = this.messagesArea.querySelector('.chat-empty-state');
        if (emptyState) emptyState.remove();

        const isSent = String(data.sender_id) === String(this.currentUser.id);
        const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

        // Date separator
        const dateStr = timestamp.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        if (dateStr !== this.lastRenderedDate) {
            this.lastRenderedDate = dateStr;
            const sep = document.createElement('div');
            sep.className = 'msg-date-sep';

            // Show "Today" or "Yesterday" if applicable  
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            let displayDate = dateStr;
            if (timestamp.toDateString() === today.toDateString()) displayDate = 'Today';
            else if (timestamp.toDateString() === yesterday.toDateString()) displayDate = 'Yesterday';

            sep.innerHTML = `<span>${displayDate}</span>`;
            this.messagesArea.appendChild(sep);
        }

        // Message bubble
        const row = document.createElement('div');
        row.className = `msg-row ${isSent ? 'sent' : 'received'}`;

        const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        row.innerHTML = `
            <div class="msg-bubble">
                <div class="msg-text">${this.escapeHtml(data.message)}</div>
                <span class="msg-time">${timeStr}</span>
            </div>
        `;

        this.messagesArea.appendChild(row);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        if (this.messagesArea) {
            requestAnimationFrame(() => {
                this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
            });
        }
    }

    // ─── Contact List Updates ───────────────────────────────

    updateContactPreview(data) {
        // Could update last message preview in Contact list
        // For now, just visually nudge if not active
        const contactEl = this.contactListContainer?.querySelector(`[data-user-id="${data.sender_id}"]`);
        if (contactEl && !contactEl.classList.contains('active')) {
            contactEl.style.background = 'rgba(45, 74, 138, 0.06)';
        }
    }
}

// ─── Initialize ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Only init if Socket.io library is loaded
    if (typeof io !== 'undefined') {
        window.chatApp = new ChatInterface();
    } else {
        console.warn('Socket.io library not found. Chat disabled.');
    }
});
