// app.js - Main Application Script
// This file runs on every page and handles shared features like navigation and auth.

// 1. WHAT: Configuration object for the API.
// EXPLAIN: Centralizes the URL so we only have to change it in one place.
// QUESTION: Why do we use an object?
// ANSWER: Objects allow us to expand settings later (like adding timeout or version) easily.
var CONFIG = {
    API_BASE_URL: ''
};

// 2. WHAT: Environment detection logic.
// EXPLAIN: If on localhost, use the local port 8009; otherwise use the Vercel proxy.
// QUESTION: Why not use 8009 everywhere?
// ANSWER: In production, the backend is hosted differently, and we want to avoid CORS issues by using relative paths.
if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    CONFIG.API_BASE_URL = 'http://127.0.0.1:8009';
} else {
    CONFIG.API_BASE_URL = '/api';
}

// 3. WHAT: Page Load Event Listener.
// EXPLAIN: Ensures the code only runs after the HTML is fully downloaded.
// QUESTION: What happens if we don't wait?
// ANSWER: The script might try to change a button that hasn't been created yet, causing an error.
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initMobileSidebar();
    initMobileNav();
    initNotifications();
    checkAuth();
    populateGlobalProfile();
});


// ---- Navigation ----

// 4. WHAT: Sidebar Link Highlighter.
// EXPLAIN: Looks at the URL and adds the "active" style to the matching sidebar button.
function initNavigation() {
    var sidebarLinks = document.querySelectorAll('.sidebar-link');
    var currentPath = window.location.pathname;

    for (var i = 0; i < sidebarLinks.length; i++) {
        var link = sidebarLinks[i];
        var href = link.getAttribute('href');
        
        // Check if current page matches the link
        if (href && currentPath.includes(href)) {
            link.classList.add('active');
        }

        // Handle Logout clicks specifically
        if (link.innerText.includes('Logout')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                handleLogout();
            });
        }
    }
}


// ---- Mobile Sidebar Toggle ----

// 5. WHAT: Mobile Dashboard Menu.
// EXPLAIN: Adds a hamburger icon on mobile so dashbaord users can open their menu.
function initMobileSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return; // Exit if not a dashboard page

    // Dark background shown when menu is open
    var overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    var toggle = document.querySelector('.sidebar-toggle');
    if (!toggle) {
        toggle = document.createElement('button');
        toggle.className = 'sidebar-toggle';
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.appendChild(toggle);
    }

    // Opens the sidebar
    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        toggle.innerHTML = '<i class="fas fa-times"></i>';
        document.body.style.overflow = 'hidden'; // Stop background scrolling
    }

    // Closes the sidebar
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
    }

    toggle.addEventListener('click', function() {
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });

    overlay.addEventListener('click', closeSidebar);
}


// ---- Authentication Check ----

// 6. WHAT: Route Guard.
// EXPLAIN: Redirects logged-out users to login, and ensures roles match the page.
// QUESTION: Why do we have this?
// ANSWER: To prevent patients from accessing doctor dashboards and vice versa.
function checkAuth() {
    var currentPath = window.location.pathname.toLowerCase();
    var publicPages = ['login.html', 'register.html', 'create_account.html', 'landing.html', 'index.html', '/', 'forgot_password.html'];

    var isPublicPage = false;
    for (var i = 0; i < publicPages.length; i++) {
        var page = publicPages[i].toLowerCase();
        if (currentPath === page || currentPath.endsWith('/' + page)) {
            isPublicPage = true;
            break;
        }
    }

    var userRole = localStorage.getItem('userRole');

    // If logged out and trying to access private page
    if (!isPublicPage && !userRole) {
        if (!currentPath.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    // Role-based protection: redirect if user tries to enter the wrong dashboard
    if (userRole && !isPublicPage) {
        if (userRole === 'patient' && (currentPath.includes('doctor') || currentPath.includes('volunteer'))) {
            window.location.href = 'dashboard_patient.html';
        } else if (userRole === 'doctor' && (currentPath.includes('patient') || currentPath.includes('volunteer'))) {
            window.location.href = 'dashboard_doctor.html';
        } else if (userRole === 'volunteer' && (currentPath.includes('patient') || currentPath.includes('doctor'))) {
            window.location.href = 'dashboard_volunteer.html';
        }
    }
}


// ---- Logout ----

// 7. WHAT: session cleaner.
// EXPLAIN: Removes all stored user data and returns to login.
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear(); // Wipe all login info
        window.location.href = 'login.html';
    }
}


// ---- Utility: Show Toast Notification ----

// 8. WHAT: Visual Pop-up Message.
// EXPLAIN: Shows a small banner at the bottom for errors or success messages.
// QUESTION: How long does it stay?
// ANSWER: 4 seconds, then it slides out automatically.
function showNotification(message, type) {
    if (typeof message !== 'string') {
        try {
            message = JSON.stringify(message);
        } catch(e) {
            message = 'Action completed';
        }
    }

    var toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 10000; padding: 14px 24px; border-radius: 12px; background: white; box-shadow: 0 4px 16px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; animation: slideInRight 0.3s ease;';
    
    // Set color based on success/error
    if (type === 'error') {
        toast.style.color = '#991b1b';
        toast.style.borderLeft = '4px solid #ef4444';
        toast.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + message;
    } else {
        toast.style.color = '#065f46';
        toast.style.borderLeft = '4px solid #10b981';
        toast.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
    }
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// 8.1 WHAT: Notification System Initializer.
function initNotifications() {
    // Check if we have any pending message in localStorage to show after redirect
    var pendingMsg = localStorage.getItem('pendingNotification');
    if (pendingMsg) {
        try {
            var data = JSON.parse(pendingMsg);
            showNotification(data.message, data.type);
            localStorage.removeItem('pendingNotification');
        } catch(e) {
            localStorage.removeItem('pendingNotification');
        }
    }
}

// 8.2 WHAT: Landing Page Mobile Nav.
function initMobileNav() {
    var nav = document.querySelector('.main-nav');
    if (!nav) return;

    var toggle = document.querySelector('.mobile-nav-toggle');
    if (toggle) {
        toggle.addEventListener('click', function() {
            nav.classList.toggle('nav-open');
        });
    }
}


// ---- Utility: API Fetch Wrapper ----

// 9. WHAT: Shared API logic.
// EXPLAIN: Adds the "Authorization" token automatically so individual pages don't have to.
// QUESTION: What happens if the token expires (401 error)?
// ANSWER: The function detects it and redirects the user to the login page immediately.
async function apiFetch(endpoint, options) {
    options = options || {};
    options.headers = options.headers || {};

    var token = localStorage.getItem('authToken');
    if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
    }

    if (options.body && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
    }

    var response = await fetch(CONFIG.API_BASE_URL + endpoint, options);

    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'login.html';
    }

    return response;
}
window.apiFetch = apiFetch;


// ---- Populate Profile Info Across Pages ----

// 10. WHAT: Global Name Display.
// EXPLAIN: Fetches the user's real name from the database and puts it in the sidebar.
// QUESTION: Why not store name in localStorage?
// ANSWER: Fetching from DB ensures the name is always up-to-date if changed.
async function populateGlobalProfile() {
    var role = localStorage.getItem('userRole');
    if (!role) return;

    var endpoint = (role === 'doctor') ? '/doctors/me' : (role === 'volunteer') ? '/volunteers/me' : '/patients/me';

    try {
        var res = await apiFetch(endpoint);
        if (!res.ok) return;

        var data = await res.json();
        var displayName = (role === 'doctor' && !data.name.startsWith('Dr.')) ? 'Dr. ' + data.name : data.name;

        // Update name in sidebar snippets
        var snippets = document.querySelectorAll('.profile-snippet');
        snippets.forEach(snippet => {
            var divs = snippet.querySelectorAll('div');
            if (divs.length >= 2) { divs[0].textContent = displayName; }
        });

    } catch (e) {
        console.error("Profile load failed", e);
    }
}


