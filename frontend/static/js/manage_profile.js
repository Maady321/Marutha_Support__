/**
 * Marutha Support - Profile Management JS
 */

document.addEventListener('DOMContentLoaded', () => {
    initProfilePage();
});

async function initProfilePage() {
    // Determine user role
    const userRole = localStorage.getItem('userRole') || 'patient';
    
    // Initial data load
    await loadExistingProfile(userRole);

    // Tab logic
    const hash = window.location.hash.replace('#', '');
    if (['view', 'edit'].includes(hash)) {
        switchTab(hash);
    }

    const profileForm = document.querySelector('#content-edit form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => handleProfileSave(e, userRole));
    }
}

/**
 * Load existing profile data from backend
 */
async function loadExistingProfile(role) {
    let endpoint = '/patients/me';
    if (role === 'doctor') endpoint = '/doctors/me'; // Note: check if exists in backend
    if (role === 'volunteer') endpoint = '/volunteers/me';

    try {
        const [profRes, userRes] = await Promise.all([
             apiFetch(endpoint).catch(() => null),
             apiFetch('/users/me').catch(() => null)
        ]);

        let profile = {};
        let user = null;

        if (profRes && profRes.ok) {
             profile = await profRes.json();
        }
        
        if (userRes && userRes.ok) {
             user = await userRes.json();
             // Ensure name exists if only user account is found
             if (user.name && !profile.name) {
                  profile.name = user.name;
             }
        }

        populateProfileUI(profile, user);
    } catch (err) {
        console.log("Error loading profile", err);
    }
}

function populateProfileUI(p, user) {
    // View Tab — generic fields
    const nameView = document.getElementById('view-name');
    const ageView = document.getElementById('view-age');
    const stageView = document.getElementById('view-stage');
    const emailView = document.getElementById('view-email');
    
    if (nameView) nameView.textContent = p.name || 'Set Name';
    if (ageView && p.age) ageView.textContent = p.age + " Years";
    if (stageView && p.stage) stageView.textContent = p.stage;
    if (emailView && user) emailView.textContent = user.email;

    // Edit Tab — generic fields
    const nameInput = document.getElementById('name');
    const ageInput = document.getElementById('age');
    const stageInput = document.getElementById('stage');
    const emailInput = document.getElementById('email');

    if (nameInput) nameInput.value = p.name || '';
    if (ageInput && p.age) ageInput.value = p.age;
    if (stageInput && p.stage) stageInput.value = p.stage;
    if (emailInput && user) emailInput.value = user.email;

    // Doctor-specific fields (edit form)
    const specialtyInput = document.getElementById('specialty');
    const experienceInput = document.getElementById('experience');
    const qualificationInput = document.getElementById('qualification');
    const bioInput = document.getElementById('bio');
    const phoneInput = document.getElementById('phone');
    const licenseInput = document.getElementById('license_id');

    if (specialtyInput) specialtyInput.value = p.specialty || '';
    if (experienceInput && p.experience) experienceInput.value = p.experience;
    if (qualificationInput) qualificationInput.value = p.qualification || '';
    if (bioInput) bioInput.value = p.bio || '';
    if (phoneInput) phoneInput.value = p.phone || '';
    if (licenseInput) licenseInput.value = p.license_id || '';
}

/**
 * Handle Profile Save
 */
async function handleProfileSave(e, role) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    // Convert numeric fields to int
    if (payload.age) payload.age = parseInt(payload.age);
    if (payload.experience) payload.experience = parseInt(payload.experience);

    let endpoint = '/patients/me';
    if (role === 'doctor') endpoint = '/doctors/me';
    if (role === 'volunteer') endpoint = '/volunteers/me';

    try {
        const response = await apiFetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showNotification('Profile saved successfully!', 'success');
            await loadExistingProfile(role);
            switchTab('view');
        } else {
            const data = await response.json();
            showNotification(`Error: ${data.detail || 'Could not save profile'}`, 'error');
        }
    } catch (error) {
        showNotification('An error occurred while saving profile.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const content = document.getElementById('content-' + tabId);
    const btn = document.getElementById('tab-' + tabId);

    if (content) content.classList.add('active');
    if (btn) btn.classList.add('active');

    window.history.pushState(null, null, `#${tabId}`);
}

window.switchTab = switchTab;
