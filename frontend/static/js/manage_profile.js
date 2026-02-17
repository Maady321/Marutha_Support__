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
        const response = await apiFetch(endpoint);
        if (response.ok) {
            const profile = await response.json();
            populateProfileUI(profile);
        }
    } catch (err) {
        console.log("No existing profile found to load.");
    }
}

function populateProfileUI(p) {
    // View Tab
    const nameView = document.getElementById('view-name');
    const ageView = document.getElementById('view-age');
    const stageView = document.getElementById('view-stage');
    
    if (nameView) nameView.textContent = p.name;
    if (ageView) ageView.textContent = p.age + " Years";
    if (stageView) stageView.textContent = p.stage;

    // Edit Tab
    const nameInput = document.getElementById('name');
    const ageInput = document.getElementById('age');
    const stageInput = document.getElementById('stage');

    if (nameInput) nameInput.value = p.name;
    if (ageInput) ageInput.value = p.age;
    if (stageInput) stageInput.value = p.stage;
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
    
    // Conver age to int if present
    if (payload.age) payload.age = parseInt(payload.age);

    let endpoint = '/patients/';
    if (role === 'doctor') endpoint = '/doctors/';
    if (role === 'volunteer') endpoint = '/volunteers/';

    try {
        const response = await apiFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const updatedProfile = await response.json();
            alert('Profile saved successfully!');
            populateProfileUI(updatedProfile);
            switchTab('view');
        } else {
            const data = await response.json();
            alert(`Error: ${data.detail || 'Could not save profile'}`);
        }
    } catch (error) {
        alert('An error occurred while saving profile.');
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
