// app.js - Main Application Script
// This file runs on every page and handles shared features like
// navigation, authentication checks, notifications, and profile display.

// API URL configuration
var CONFIG = {
    API_BASE_URL: ''
};

// Set the API URL based on whether we're running locally or on Vercel
if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    CONFIG.API_BASE_URL = 'http://127.0.0.1:8009';
} else {
    CONFIG.API_BASE_URL = '/api';
}

// Run when the page finishes loading
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initMobileSidebar();
    initMobileNav();
    initNotifications();
    checkAuth();
    populateGlobalProfile();
});


// ---- Navigation ----
// Highlights the current page in the sidebar and handles logout clicks

function initNavigation() {
    var sidebarLinks = document.querySelectorAll('.sidebar-link');
    var currentPath = window.location.pathname;

    for (var i = 0; i < sidebarLinks.length; i++) {
        var link = sidebarLinks[i];

        // Highlight the link if it matches the current page
        var href = link.getAttribute('href');
        if (href && currentPath.includes(href)) {
            link.classList.add('active');
        }

        // Add logout click handler
        if (link.innerText.includes('Logout')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                handleLogout();
            });
        }
    }
}


// ---- Mobile Sidebar Toggle ----
// Creates a hamburger menu button for mobile dashboard pages

function initMobileSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Create overlay (dark background when sidebar is open)
    var overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    // Create toggle button
    var toggle = document.querySelector('.sidebar-toggle');
    if (!toggle) {
        toggle = document.createElement('button');
        toggle.className = 'sidebar-toggle';
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        toggle.setAttribute('aria-label', 'Toggle menu');
        document.body.appendChild(toggle);
    }

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        toggle.innerHTML = '<i class="fas fa-times"></i>';
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
    }

    toggle.addEventListener('click', function() {
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    overlay.addEventListener('click', closeSidebar);

    // Close sidebar when a link is clicked on mobile
    var links = sidebar.querySelectorAll('.sidebar-link');
    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    }
}


// ---- Mobile Navigation Toggle ----
// Creates a hamburger menu for the landing/public pages

function initMobileNav() {
    var nav = document.querySelector('nav');
    if (!nav) return;

    // Create toggle button
    var toggle = nav.querySelector('.nav-toggle');
    if (!toggle) {
        toggle = document.createElement('button');
        toggle.className = 'nav-toggle';
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        toggle.setAttribute('aria-label', 'Toggle navigation');
        nav.appendChild(toggle);
    }

    // Create mobile navigation menu
    var mobileNav = document.querySelector('.nav-mobile');
    if (!mobileNav) {
        var links = nav.querySelector('.nav-links');
        if (!links) return;

        mobileNav = document.createElement('div');
        mobileNav.className = 'nav-mobile';

        // Copy all links into mobile nav
        var allLinks = links.querySelectorAll('a');
        for (var i = 0; i < allLinks.length; i++) {
            var clone = allLinks[i].cloneNode(true);
            mobileNav.appendChild(clone);
        }

        var container = nav.closest('.container');
        if (container) {
            container.after(mobileNav);
        } else {
            nav.after(mobileNav);
        }
    }

    toggle.addEventListener('click', function() {
        mobileNav.classList.toggle('open');
        var isOpen = mobileNav.classList.contains('open');
        if (isOpen) {
            toggle.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            toggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
}


// ---- Authentication Check ----
// Makes sure users are logged in and on the right pages for their role

function checkAuth() {
    var publicPages = ['login.html', 'register.html', 'create_account.html', 'landing.html', 'index.html', 'forgot_password.html', 'reset_password.html', '/'];
    var currentPath = window.location.pathname;

    // Check if current page is a public page
    var isPublicPage = false;
    for (var i = 0; i < publicPages.length; i++) {
        if (currentPath.endsWith(publicPages[i])) {
            isPublicPage = true;
            break;
        }
    }

    var userRole = localStorage.getItem('userRole');
    console.log('Current Session - Role: ' + (userRole || 'Guest'));

    // If not on a public page and not logged in, redirect to login
    if (!isPublicPage && !userRole) {
        window.location.href = 'login.html';
        return;
    }

    // If logged in and on a protected page, check role permissions
    if (userRole && !isPublicPage) {
        var doctorPages = ['dashboard_doctor.html', 'patients.html', 'requests.html', 'manage_records_doctor.html', 'manage_profile_doctor.html', 'chat_doctor.html', 'patient_details.html'];
        var patientPages = ['dashboard_patient.html', 'manage_health_patient.html', 'chat.html', 'manage_profile_patient.html', 'doctor_profile.html'];
        var volunteerPages = ['dashboard_volunteer.html', 'chat_volunteer.html', 'manage_profile_volunteer.html', 'assigned_patients.html', 'volunteer_activities.html', 'setup_profile_volunteer.html'];

        var isDoctorPage = false;
        var isPatientPage = false;
        var isVolunteerPage = false;

        for (var j = 0; j < doctorPages.length; j++) {
            if (currentPath.endsWith('/' + doctorPages[j]) || currentPath === doctorPages[j]) {
                isDoctorPage = true;
                break;
            }
        }
        for (var k = 0; k < patientPages.length; k++) {
            if (currentPath.endsWith('/' + patientPages[k]) || currentPath === patientPages[k]) {
                isPatientPage = true;
                break;
            }
        }
        for (var l = 0; l < volunteerPages.length; l++) {
            if (currentPath.endsWith('/' + volunteerPages[l]) || currentPath === volunteerPages[l]) {
                isVolunteerPage = true;
                break;
            }
        }

        // Redirect if user is on a page they shouldn't be on
        if (userRole === 'patient' && (isDoctorPage || isVolunteerPage)) {
            window.location.href = 'dashboard_patient.html';
        } else if (userRole === 'doctor' && (isPatientPage || isVolunteerPage)) {
            window.location.href = 'dashboard_doctor.html';
        } else if (userRole === 'volunteer' && (isPatientPage || isDoctorPage)) {
            window.location.href = 'dashboard_volunteer.html';
        }
    }
}


// ---- Logout ----
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
    }
}


// ---- Notifications ----
function initNotifications() {
    console.log('Notification system initialized');
}


// ---- Utility: Format Date ----
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date);
}


// ---- Utility: Get URL Parameter ----
function getQueryParam(param) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}


// ---- Utility: Show Toast Notification ----
function showNotification(message, type) {
    // Default type to 'info'
    if (!type) type = 'info';

    // Remove existing notification
    var existing = document.getElementById('global-notification');
    if (existing) existing.remove();

    // Set colors based on type
    var bg, color, border, icon;

    if (type === 'success') {
        bg = '#d1fae5';
        color = '#065f46';
        border = '#a7f3d0';
        icon = 'fa-check-circle';
    } else if (type === 'error') {
        bg = '#fee2e2';
        color = '#991b1b';
        border = '#fca5a5';
        icon = 'fa-exclamation-circle';
    } else {
        bg = '#dbeafe';
        color = '#1e40af';
        border = '#93c5fd';
        icon = 'fa-info-circle';
    }

    // Create the toast element
    var toast = document.createElement('div');
    toast.id = 'global-notification';
    toast.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 10000; padding: 14px 24px; border-radius: 12px; font-weight: 500; background: ' + bg + '; color: ' + color + '; border: 1px solid ' + border + '; box-shadow: 0 4px 16px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; animation: slideInRight 0.3s ease; max-width: 400px; font-size: 0.95rem;';
    toast.innerHTML = '<i class="fas ' + icon + '"></i> ' + message;
    document.body.appendChild(toast);

    // Auto-dismiss after 4 seconds
    setTimeout(function() {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 4000);

    // Add animation keyframes (only once)
    if (!document.getElementById('notification-keyframes')) {
        var style = document.createElement('style');
        style.id = 'notification-keyframes';
        style.textContent = '@keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100px); opacity: 0; } }';
        document.head.appendChild(style);
    }
}


// ---- Utility: API Fetch Wrapper ----
// This function adds the auth token to every API request automatically

async function apiFetch(endpoint, options) {
    if (!options) options = {};

    var token = localStorage.getItem('authToken');

    // Build headers
    var headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    // Add any extra headers from options
    if (options.headers) {
        var keys = Object.keys(options.headers);
        for (var i = 0; i < keys.length; i++) {
            headers[keys[i]] = options.headers[keys[i]];
        }
    }

    // Make the request
    var response = await fetch(CONFIG.API_BASE_URL + endpoint, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body || undefined
    });

    // If unauthorized, log the user out
    if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired');
    }

    return response;
}


// ---- Populate Profile Info Across Pages ----
// Fills in the user's name and initials in the sidebar profile snippet

async function populateGlobalProfile() {
    var role = localStorage.getItem('userRole');
    if (!role) return;

    // Choose the right endpoint based on role
    var endpoint = '';
    if (role === 'patient') {
        endpoint = '/patients/me';
    } else if (role === 'doctor') {
        endpoint = '/doctors/me';
    } else if (role === 'volunteer') {
        endpoint = '/volunteers/me';
    } else {
        return;
    }

    try {
        var res = await apiFetch(endpoint);
        if (!res.ok) return;

        var data = await res.json();
        var rawName = data.name || 'User';

        // Add "Dr." prefix for doctors
        var displayName = rawName;
        if (role === 'doctor' && displayName.toLowerCase().indexOf('dr.') === -1) {
            displayName = 'Dr. ' + displayName;
        }

        // Generate initials from name
        var nameForInitials = displayName.replace('Dr. ', '').trim();
        var words = nameForInitials.split(' ');
        var initials = words[0].charAt(0).toUpperCase();
        if (words.length > 1) {
            initials = initials + words[words.length - 1].charAt(0).toUpperCase();
        } else if (words[0].length > 1) {
            initials = initials + words[0].charAt(1).toUpperCase();
        }

        // Generate subtitle based on role
        var subtitle = role.charAt(0).toUpperCase() + role.slice(1);
        if (role === 'patient' && data.stage) {
            subtitle = 'Stage: ' + data.stage;
        } else if (role === 'doctor') {
            subtitle = data.specialty || 'General Practitioner';
        } else if (role === 'volunteer') {
            subtitle = 'Volunteer Team';
        }

        // Update profile snippets in the sidebar
        var snippets = document.querySelectorAll('.profile-snippet');
        for (var i = 0; i < snippets.length; i++) {
            var snippet = snippets[i];
            var textContainer = snippet.querySelector('div[style*="text-align: right"]');
            var picDiv = snippet.querySelector('.profile-pic');

            if (textContainer) {
                var divs = textContainer.querySelectorAll('div');
                if (divs.length >= 2) {
                    divs[0].textContent = displayName;
                    divs[1].textContent = subtitle;
                }
            }

            if (picDiv) {
                picDiv.textContent = initials;
            }
        }

        // Update welcome heading
        var h2Tags = document.querySelectorAll('h2');
        for (var j = 0; j < h2Tags.length; j++) {
            var h2 = h2Tags[j];
            if (h2.innerHTML.includes('Welcome back')) {
                var childNodes = h2.childNodes;
                for (var k = 0; k < childNodes.length; k++) {
                    var node = childNodes[k];
                    if (node.nodeType === 3 && node.nodeValue.includes('Welcome back')) {
                        var firstName = rawName.split(' ')[0];
                        if (role === 'volunteer') {
                            node.nodeValue = ' Welcome back, ' + firstName + '. Thank you for your service today.';
                        } else if (role === 'patient') {
                            node.nodeValue = ' Welcome back, ' + firstName;
                        } else {
                            node.nodeValue = ' Welcome back, ' + displayName;
                        }
                    }
                }
            }
        }

        // Update any element with id "user-name-display"
        var explicitName = document.getElementById('user-name-display');
        if (explicitName) {
            explicitName.textContent = displayName;
        }

    } catch (e) {
        console.error("Failed to load profile for global snippet", e);
    }
}
