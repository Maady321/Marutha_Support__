// manage_profile.js - Profile Management
// Handles loading and saving user profiles (patient, doctor, volunteer)

document.addEventListener('DOMContentLoaded', function() {
    initProfilePage();
});


async function initProfilePage() {
    // Get user role from localStorage
    var userRole = localStorage.getItem('userRole') || 'patient';

    // Load existing profile from API
    await loadExistingProfile(userRole);

    // Check if URL has a tab hash
    var hash = window.location.hash.replace('#', '');
    if (hash === 'view' || hash === 'edit') {
        switchTab(hash);
    }

    // Add form submit handler
    var profileForm = document.querySelector('#content-edit form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            handleProfileSave(e, userRole);
        });
    }
}


// ---- Load Profile Data ----
async function loadExistingProfile(role) {
    // Choose the right API endpoint based on role
    var endpoint = '/patients/me';
    if (role === 'doctor') endpoint = '/doctors/me';
    if (role === 'volunteer') endpoint = '/volunteers/me';

    try {
        // Fetch both profile and user data at the same time
        var profRes = null;
        var userRes = null;

        try { profRes = await apiFetch(endpoint); } catch(e) { /* ok */ }
        try { userRes = await apiFetch('/users/me'); } catch(e) { /* ok */ }

        var profile = {};
        var user = null;

        if (profRes && profRes.ok) {
            profile = await profRes.json();
        }

        if (userRes && userRes.ok) {
            user = await userRes.json();
            // If profile doesn't have a name, use the account name
            if (user.name && !profile.name) {
                profile.name = user.name;
            }
        }

        populateProfileUI(profile, user);

    } catch (err) {
        console.log("Error loading profile", err);
    }
}


// ---- Fill in Profile Fields ----
function populateProfileUI(p, user) {
    // View Tab
    var nameView = document.getElementById('view-name');
    var ageView = document.getElementById('view-age');
    var stageView = document.getElementById('view-stage');
    var emailView = document.getElementById('view-email');

    if (nameView) nameView.textContent = p.name || 'Set Name';
    if (ageView && p.age) ageView.textContent = p.age + " Years";
    if (stageView && p.stage) stageView.textContent = p.stage;
    if (emailView && user) emailView.textContent = user.email;

    // Edit Tab
    var nameInput = document.getElementById('name');
    var ageInput = document.getElementById('age');
    var stageInput = document.getElementById('stage');
    var emailInput = document.getElementById('email');

    if (nameInput) nameInput.value = p.name || '';
    if (ageInput && p.age) ageInput.value = p.age;
    if (stageInput && p.stage) stageInput.value = p.stage;
    if (emailInput && user) emailInput.value = user.email;

    // Doctor-specific fields
    var specialtyInput = document.getElementById('specialty');
    var experienceInput = document.getElementById('experience');
    var qualificationInput = document.getElementById('qualification');
    var bioInput = document.getElementById('bio');
    var phoneInput = document.getElementById('phone');
    var licenseInput = document.getElementById('license_id');

    if (specialtyInput) specialtyInput.value = p.specialty || '';
    if (experienceInput && p.experience) experienceInput.value = p.experience;
    if (qualificationInput) qualificationInput.value = p.qualification || '';
    if (bioInput) bioInput.value = p.bio || '';
    if (phoneInput) phoneInput.value = p.phone || '';
    if (licenseInput) licenseInput.value = p.license_id || '';
}


// ---- Save Profile ----
async function handleProfileSave(e, role) {
    e.preventDefault();
    var btn = e.target.querySelector('button[type="submit"]');
    var originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;

    // Get form data
    var formData = new FormData(e.target);
    var payload = {};

    // Convert FormData to a simple object
    formData.forEach(function(value, key) {
        payload[key] = value;
    });

    // Convert numeric fields to numbers
    if (payload.age) payload.age = parseInt(payload.age);
    if (payload.experience) payload.experience = parseInt(payload.experience);

    // Choose endpoint based on role
    var endpoint = '/patients/me';
    if (role === 'doctor') endpoint = '/doctors/me';
    if (role === 'volunteer') endpoint = '/volunteers/me';

    try {
        var response = await apiFetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showNotification('Profile saved successfully!', 'success');
            await loadExistingProfile(role);
            switchTab('view');
        } else {
            var data = await response.json();
            showNotification('Error: ' + (data.detail || 'Could not save profile'), 'error');
        }
    } catch (error) {
        showNotification('An error occurred while saving profile.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}


// ---- Tab Switching ----
function switchTab(tabId) {
    var allTabs = document.querySelectorAll('.tab-content');
    for (var i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.remove('active');
    }

    var allBtns = document.querySelectorAll('.tab-btn');
    for (var j = 0; j < allBtns.length; j++) {
        allBtns[j].classList.remove('active');
    }

    var content = document.getElementById('content-' + tabId);
    var btn = document.getElementById('tab-' + tabId);

    if (content) content.classList.add('active');
    if (btn) btn.classList.add('active');

    window.history.pushState(null, null, '#' + tabId);
}

window.switchTab = switchTab;
