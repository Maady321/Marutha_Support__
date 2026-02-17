const CONFIG = {
    API_BASE_URL: 'http://127.0.0.1:8009'
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize global UI features
    initNavigation();
    initNotifications();
    checkAuth();
});

/**
 * Handle navigation interactions
 */
function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentPath = window.location.pathname;

    sidebarLinks.forEach(link => {
        // Highlight active link
        if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }

        // Logout functionality
        if (link.innerText.includes('Logout')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        }
    });
}

/**
 * Simple Authentication Check
 */
function checkAuth() {
    const publicPages = ['login.html', 'register.html', 'create_account.html', 'landing.html', 'index.html'];
    const isPublicPage = publicPages.some(page => window.location.pathname.endsWith(page));
    
    // For demo purposes, we don't force redirect, but we log the state
    const userRole = localStorage.getItem('userRole');
    console.log(`Current Session - Role: ${userRole || 'Guest'}`);
}

/**
 * Handle Logout
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
    }
}

/**
 * Simple Notification System
 */
function initNotifications() {
    // Placeholder for global notification logic
    console.log('Notification system initialized');
}

/**
 * Utility: Format Date
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date);
}

/**
 * Utility: Get URL Parameter
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
/**
 * Utility: API Fetch Wrapper
 */
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Token expired or invalid
        handleLogout();
        throw new Error('Session expired');
    }

    return response;
}
