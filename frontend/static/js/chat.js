// chat.js - WhatsApp-style Chat
// Works across patient, doctor, and volunteer chat pages
// Uses Socket.io for real-time messaging

// Store chat state
var chatSocket = null;
var chatCurrentUser = null;
var chatActiveRecipientId = null;
var chatBaseUrl = (typeof CONFIG !== 'undefined') ? CONFIG.API_BASE_URL : 'http://localhost:8009';
var chatContacts = [];
var chatLastRenderedDate = null;


document.addEventListener('DOMContentLoaded', function() {
    // Only start chat if Socket.io library is loaded
    if (typeof io !== 'undefined') {
        initChat();
    } else {
        console.warn('Socket.io library not found. Chat disabled.');
    }
});


// ---- Initialize Chat ----
async function initChat() {
    // Get current user info
    try {
        var response = await apiFetch('/users/me');
        if (response.ok) {
            chatCurrentUser = await response.json();
            localStorage.setItem('userData', JSON.stringify(chatCurrentUser));
        } else {
            console.error('Chat: Not logged in');
            return;
        }
    } catch (err) {
        console.error('Chat init: API unreachable', err);
        return;
    }

    connectChatSocket();
    setupChatListeners();
    await loadChatContacts();
}


// ---- Socket.io Connection ----
function connectChatSocket() {
    var token = localStorage.getItem('authToken');
    if (!token) return;

    chatSocket = io(chatBaseUrl, {
        path: '/socket.io',
        auth: { token: token }
    });

    chatSocket.on('connect', function() {
        console.log('Connected to chat server');
        var statusEl = document.getElementById('chatHeaderStatus');
        if (statusEl) statusEl.textContent = 'Online';
    });

    chatSocket.on('disconnect', function() {
        console.log('Disconnected from chat server');
    });

    // Listen for incoming messages
    chatSocket.on('receive_message', function(data) {
        // Only show message in the active conversation
        if (chatActiveRecipientId) {
            var senderMatch = String(data.sender_id) === String(chatActiveRecipientId);
            var selfMatch = String(data.sender_id) === String(chatCurrentUser.id);
            if (senderMatch || selfMatch) {
                appendChatMessage(data);
                scrollChatToBottom();
            }
        }

        // Update contact list preview (highlight unread)
        updateChatContactPreview(data);
    });

    chatSocket.on('connect_error', function(error) {
        console.error('Socket connection error:', error.message);
    });
}


// ---- Event Listeners ----
function setupChatListeners() {
    var sendBtn = document.getElementById('chatSendBtn');
    var messageInput = document.getElementById('messageInput');
    var searchInput = document.getElementById('chatSearchInput');

    // Send button click
    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            sendChatMessage();
        });
    }

    // Enter key to send
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }

    // Search contacts
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            var query = e.target.value.toLowerCase();
            var listContainer = document.getElementById('chatListContainer');
            var items = listContainer.querySelectorAll('.chat-contact');

            for (var i = 0; i < items.length; i++) {
                var nameEl = items[i].querySelector('.contact-name');
                var name = nameEl ? nameEl.textContent.toLowerCase() : '';

                if (name.indexOf(query) >= 0) {
                    items[i].style.display = 'flex';
                } else {
                    items[i].style.display = 'none';
                }
            }
        });
    }
}


// ---- Send Message ----
async function sendChatMessage() {
    var messageInput = document.getElementById('messageInput');
    var text = messageInput ? messageInput.value.trim() : '';
    if (!text || !chatActiveRecipientId) return;

    // Clear input immediately
    messageInput.value = '';
    messageInput.focus();

    try {
        var response = await apiFetch('/chats/', {
            method: 'POST',
            body: JSON.stringify({
                recipient_id: parseInt(chatActiveRecipientId),
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


// ---- Load Contacts ----
async function loadChatContacts() {
    var listContainer = document.getElementById('chatListContainer');
    if (!listContainer) return;

    try {
        var response = await apiFetch('/chats/contacts');
        if (!response.ok) {
            listContainer.innerHTML = '<div class="chat-empty-state" style="padding: 40px 24px"><i class="fas fa-exclamation-circle"></i><p>Failed to load contacts</p></div>';
            return;
        }

        chatContacts = await response.json();

        if (chatContacts.length === 0) {
            listContainer.innerHTML = '<div class="chat-empty-state" style="padding: 40px 24px"><i class="fas fa-user-friends"></i><p>No contacts yet. Contacts appear after a doctor accepts your consultation request.</p></div>';
            return;
        }

        renderChatContacts();
        autoSelectChatContact();

    } catch (error) {
        console.error('Failed to load contacts:', error);
        listContainer.innerHTML = '<div class="chat-empty-state" style="padding: 40px 24px"><i class="fas fa-wifi" style="color: var(--danger)"></i><p>Connection error</p></div>';
    }
}


function renderChatContacts() {
    var listContainer = document.getElementById('chatListContainer');
    listContainer.innerHTML = '';

    for (var i = 0; i < chatContacts.length; i++) {
        var contact = chatContacts[i];

        // Get initials from name
        var nameParts = contact.name.split(' ');
        var initials = '';
        for (var j = 0; j < nameParts.length; j++) {
            initials = initials + nameParts[j][0];
        }
        initials = initials.substring(0, 2).toUpperCase();

        // Set colors based on role
        var avatarBg = '#eff6ff';
        var avatarColor = '#1e40af';
        if (contact.role === 'doctor') {
            avatarBg = 'var(--lavender-soft)';
            avatarColor = 'var(--medical-blue)';
        } else if (contact.role === 'volunteer') {
            avatarBg = '#ecfdf5';
            avatarColor = '#047857';
        }

        var el = document.createElement('div');
        el.className = 'chat-contact';
        el.setAttribute('data-user-id', contact.user_id);

        el.innerHTML =
            '<div class="contact-avatar" style="background: ' + avatarBg + '; color: ' + avatarColor + '">' + initials + '</div>' +
            '<div class="contact-info">' +
                '<div class="contact-name">' + contact.name + '</div>' +
                '<div class="contact-role">' + contact.role + '</div>' +
            '</div>';

        // Use closure to capture the current contact
        (function(c, element) {
            element.addEventListener('click', function() {
                selectChatContact(c, element);
            });
        })(contact, el);

        listContainer.appendChild(el);
    }
}


function autoSelectChatContact() {
    var listContainer = document.getElementById('chatListContainer');

    // Check URL param first
    var urlParams = new URLSearchParams(window.location.search);
    var targetId = urlParams.get('userId');

    if (targetId) {
        // Find the matching contact
        for (var i = 0; i < chatContacts.length; i++) {
            if (String(chatContacts[i].user_id) === String(targetId)) {
                var el = listContainer.querySelector('[data-user-id="' + targetId + '"]');
                if (el) {
                    selectChatContact(chatContacts[i], el);
                    return;
                }
            }
        }
    }

    // Default to first contact
    if (chatContacts.length > 0) {
        var firstEl = listContainer.querySelector('.chat-contact');
        selectChatContact(chatContacts[0], firstEl);
    }
}


// ---- Select Contact & Load History ----
async function selectChatContact(contact, element) {
    chatActiveRecipientId = contact.user_id;
    chatLastRenderedDate = null;

    // Update sidebar active state
    var listContainer = document.getElementById('chatListContainer');
    var allContacts = listContainer.querySelectorAll('.chat-contact');
    for (var i = 0; i < allContacts.length; i++) {
        allContacts[i].classList.remove('active');
    }
    if (element) element.classList.add('active');

    // Update header
    var nameParts = contact.name.split(' ');
    var initials = '';
    for (var j = 0; j < nameParts.length; j++) {
        initials = initials + nameParts[j][0];
    }
    initials = initials.substring(0, 2).toUpperCase();

    var headerName = document.getElementById('chatHeaderName');
    var headerAvatar = document.getElementById('chatHeaderAvatar');
    var headerStatus = document.getElementById('chatHeaderStatus');

    if (headerName) headerName.textContent = contact.name;
    if (headerAvatar) headerAvatar.textContent = initials;
    if (headerStatus) headerStatus.textContent = contact.role;

    // Show input bar
    var inputBar = document.getElementById('chatInputBar');
    if (inputBar) inputBar.style.display = 'flex';

    // Show loading in messages area
    var messagesArea = document.getElementById('chatMessagesArea');
    if (messagesArea) {
        messagesArea.innerHTML = '<div class="chat-empty-state"><i class="fas fa-spinner fa-spin" style="font-size: 1.5rem"></i><p>Loading messages...</p></div>';
    }

    await loadChatHistory(contact.user_id);
}


async function loadChatHistory(friendId) {
    var messagesArea = document.getElementById('chatMessagesArea');

    try {
        var response = await apiFetch('/chats/history/' + friendId);
        if (!response.ok) {
            messagesArea.innerHTML = '<div class="chat-empty-state"><i class="fas fa-exclamation-triangle" style="color: var(--danger)"></i><p>Failed to load messages</p></div>';
            return;
        }

        var history = await response.json();
        messagesArea.innerHTML = '';
        chatLastRenderedDate = null;

        if (history.length === 0) {
            messagesArea.innerHTML = '<div class="chat-empty-state"><i class="fas fa-hand-holding-heart"></i><p>No messages yet. Say hello! 👋</p></div>';
            return;
        }

        for (var i = 0; i < history.length; i++) {
            appendChatMessage(history[i]);
        }
        scrollChatToBottom();

    } catch (error) {
        console.error('Error loading chat history:', error);
        messagesArea.innerHTML = '<div class="chat-empty-state"><i class="fas fa-wifi" style="color: var(--danger)"></i><p>Connection error</p></div>';
    }
}


// ---- Render Messages ----
function appendChatMessage(data) {
    var messagesArea = document.getElementById('chatMessagesArea');
    if (!messagesArea) return;

    // Remove empty state if present
    var emptyState = messagesArea.querySelector('.chat-empty-state');
    if (emptyState) emptyState.remove();

    var isSent = String(data.sender_id) === String(chatCurrentUser.id);
    var timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

    // Date separator
    var dateStr = timestamp.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (dateStr !== chatLastRenderedDate) {
        chatLastRenderedDate = dateStr;

        var today = new Date();
        var yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        var displayDate = dateStr;
        if (timestamp.toDateString() === today.toDateString()) {
            displayDate = 'Today';
        } else if (timestamp.toDateString() === yesterday.toDateString()) {
            displayDate = 'Yesterday';
        }

        var sep = document.createElement('div');
        sep.className = 'msg-date-sep';
        sep.innerHTML = '<span>' + displayDate + '</span>';
        messagesArea.appendChild(sep);
    }

    // Message bubble
    var row = document.createElement('div');
    if (isSent) {
        row.className = 'msg-row sent';
    } else {
        row.className = 'msg-row received';
    }

    row.innerHTML =
        '<div class="msg-bubble">' +
            '<div class="msg-text">' + escapeHtml(data.message) + '</div>' +
        '</div>';

    messagesArea.appendChild(row);
}


function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function scrollChatToBottom() {
    var messagesArea = document.getElementById('chatMessagesArea');
    if (messagesArea) {
        requestAnimationFrame(function() {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        });
    }
}


// ---- Contact List Updates ----
function updateChatContactPreview(data) {
    var listContainer = document.getElementById('chatListContainer');
    if (!listContainer) return;

    var contactEl = listContainer.querySelector('[data-user-id="' + data.sender_id + '"]');
    if (contactEl && !contactEl.classList.contains('active')) {
        contactEl.style.background = 'rgba(45, 74, 138, 0.06)';
    }
}
