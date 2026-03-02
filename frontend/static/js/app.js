const CONFIG = {
    API_BASE_URL: 'http://127.0.0.1:8009'
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize global UI features
    initNavigation();
    initNotifications();
    checkAuth();
    populateGlobalProfile();
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
    const publicPages = ['login.html', 'register.html', 'create_account.html', 'landing.html', 'index.html', 'forgot_password.html', 'reset_password.html', '/'];
    const currentPath = window.location.pathname;
    const isPublicPage = publicPages.some(page => currentPath.endsWith(page));
    
    const userRole = localStorage.getItem('userRole');
    console.log(`Current Session - Role: ${userRole || 'Guest'}`);

    if (!isPublicPage && !userRole) {
        window.location.href = 'login.html';
        return;
    }

    if (userRole && !isPublicPage) {
        // strict routing to prevent users entering wrong dashboards
        const doctorPages = ['dashboard_doctor.html', 'patients.html', 'requests.html', 'manage_records_doctor.html', 'manage_profile_doctor.html', 'chat_doctor.html', 'patient_details.html'];
        const patientPages = ['dashboard_patient.html', 'manage_health_patient.html', 'chat.html', 'manage_profile_patient.html', 'doctor_profile.html'];
        const volunteerPages = ['dashboard_volunteer.html', 'chat_volunteer.html', 'manage_profile_volunteer.html', 'assigned_patients.html', 'volunteer_activities.html', 'setup_profile_volunteer.html'];

        const isDoctorPage = doctorPages.some(page => currentPath.endsWith(page));
        const isPatientPage = patientPages.some(page => currentPath.endsWith(page));
        const isVolunteerPage = volunteerPages.some(page => currentPath.endsWith(page));

        if (userRole === 'patient' && (isDoctorPage || isVolunteerPage)) {
            window.location.href = 'dashboard_patient.html';
        } else if (userRole === 'doctor' && (isPatientPage || isVolunteerPage)) {
            window.location.href = 'dashboard_doctor.html';
        } else if (userRole === 'volunteer' && (isPatientPage || isDoctorPage)) {
            window.location.href = 'dashboard_volunteer.html';
        }
    }
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

/**
 * Replace dummy names across all templates using backend user profile
 */
async function populateGlobalProfile() {
    const role = localStorage.getItem('userRole');
    if (!role) return;

    let endpoint = '';
    if (role === 'patient') endpoint = '/patients/me';
    else if (role === 'doctor') endpoint = '/doctors/me';
    else if (role === 'volunteer') endpoint = '/volunteers/me';
    else return;

    try {
        const res = await apiFetch(endpoint);
        if (res.ok) {
            const data = await res.json();
            const rawName = data.name || 'User';
            
            // Format name prefix and title
            let displayName = rawName;
            if (role === 'doctor' && !displayName.toLowerCase().includes('dr.')) {
                displayName = 'Dr. ' + displayName;
            }

            // Generate initials
            const words = displayName.replace('Dr. ', '').trim().split(' ');
            let initials = words[0].charAt(0).toUpperCase();
            if (words.length > 1) {
                initials += words[words.length - 1].charAt(0).toUpperCase();
            } else if (words[0].length > 1) {
                initials += words[0].charAt(1).toUpperCase();
            }

            // Generate Subtitle
            let subtitle = role.charAt(0).toUpperCase() + role.slice(1);
            if (role === 'patient' && data.stage) subtitle = `Stage: ${data.stage}`;
            else if (role === 'doctor') subtitle = data.specialty || 'General Practitioner';
            else if (role === 'volunteer') subtitle = 'Volunteer Team';

            // 1. Update Profile Snippets
            const snippets = document.querySelectorAll('.profile-snippet');
            snippets.forEach(snippet => {
                const textContainer = snippet.querySelector('div[style*="text-align: right"]');
                const picDiv = snippet.querySelector('.profile-pic');
                
                if (textContainer) {
                    const divs = textContainer.querySelectorAll('div');
                    if (divs.length >= 2) {
                        divs[0].textContent = displayName;
                        divs[1].textContent = subtitle;
                    }
                }
                
                if (picDiv) {
                    picDiv.textContent = initials;
                }
            });

            // 2. Update Welcome Titles inside <h2>
            const h2Tags = document.querySelectorAll('h2');
            h2Tags.forEach(h2 => {
                 if (h2.innerHTML.includes('Welcome back')) {
                     // Check specific text node to replace safely without breaking inner HTML icons
                     Array.from(h2.childNodes).forEach(node => {
                         if (node.nodeType === 3 /* Text */) {
                             if (node.nodeValue.includes('Welcome back')) {
                                  if (role === 'volunteer') {
                                       node.nodeValue = ` Welcome back, ${rawName.split(' ')[0]}. Thank you for your service today.`;
                                  } else if (role === 'patient') {
                                       node.nodeValue = ` Welcome back, ${rawName.split(' ')[0]}`;
                                  } else {
                                       node.nodeValue = ` Welcome back, ${displayName}`;
                                  }
                             }
                         }
                     });
                 }
            });

            // 3. Update any explicit element IDs (e.g. settings forms)
            const explicitName = document.getElementById('user-name-display');
            if (explicitName) explicitName.textContent = displayName;
        }
    } catch (e) {
        console.error("Failed to load profile for global snippet", e);
    }
}
