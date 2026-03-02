/**
 * doctor_profile.js — Load and display doctor details for patients
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('id');

    if (!doctorId) {
        document.getElementById('docName').textContent = 'Doctor Not Found';
        document.getElementById('docSpecialty').textContent = 'No doctor ID provided in URL.';
        return;
    }

    try {
        // Fetch doctor profile (public endpoint)
        const response = await apiFetch(`/doctors/${doctorId}`);
        if (!response.ok) {
            throw new Error('Doctor not found');
        }

        const doc = await response.json();
        renderDoctorProfile(doc);

    } catch (error) {
        console.error('Failed to load doctor profile:', error);
        document.getElementById('docName').textContent = 'Profile Unavailable';
        document.getElementById('docSpecialty').textContent = 'Could not load doctor details.';
    }
});

function renderDoctorProfile(doc) {
    // Avatar initials
    const name = doc.name || 'Doctor';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('docAvatar').textContent = initials;

    // Name & specialty
    document.getElementById('docName').textContent = name;
    document.getElementById('docSpecialty').textContent = doc.specialty || 'General Medicine';

    // Online status
    const statusDot = document.getElementById('docStatusDot');
    if (doc.is_online) {
        statusDot.classList.add('online');
    }

    // Badges
    const badgesContainer = document.getElementById('docBadges');
    badgesContainer.innerHTML = '';

    if (doc.specialty) {
        badgesContainer.innerHTML += `
            <span class="badge" style="background: var(--lavender-soft); color: var(--medical-blue)">
                <i class="fas fa-stethoscope" style="margin-right: 4px"></i> ${doc.specialty}
            </span>`;
    }

    if (doc.experience) {
        badgesContainer.innerHTML += `
            <span class="badge" style="background: #dbeafe; color: #1e40af">
                <i class="fas fa-clock" style="margin-right: 4px"></i> ${doc.experience}+ Years
            </span>`;
    }

    if (doc.qualification) {
        badgesContainer.innerHTML += `
            <span class="badge" style="background: #d1fae5; color: #059669">
                <i class="fas fa-graduation-cap" style="margin-right: 4px"></i> ${doc.qualification}
            </span>`;
    }

    badgesContainer.innerHTML += `
        <span class="badge" style="background: ${doc.is_online ? '#d1fae5' : '#fef3c7'}; color: ${doc.is_online ? '#059669' : '#d97706'}">
            <i class="fas fa-circle" style="margin-right: 4px; font-size: 0.5rem"></i> 
            ${doc.is_online ? 'Available Now' : 'Currently Offline'}
        </span>`;

    // Stats row
    document.getElementById('docExperience').textContent =
        doc.experience ? `${doc.experience} yrs` : '—';
    document.getElementById('docQualification').textContent =
        doc.qualification || '—';
    document.getElementById('docLicense').textContent =
        doc.license_id || '—';

    // Bio
    const bioEl = document.getElementById('docBio');
    if (doc.bio) {
        bioEl.textContent = doc.bio;
    } else {
        bioEl.innerHTML = '<span style="color: var(--text-light); font-style: italic">This doctor has not added a bio yet.</span>';
    }

    // Contact info
    document.getElementById('docPhone').textContent = doc.phone || 'Not provided';
    document.getElementById('docLicense2').textContent = doc.license_id || 'Not provided';

    // Try to get email from user account (if we have it)
    // Since the doctor profile doesn't include email, we can use user_id
    document.getElementById('docEmail').textContent = 'Available after consultation';

    // Chat link
    const chatLink = document.getElementById('chatLink');
    if (doc.user_id) {
        chatLink.href = `chat.html?userId=${doc.user_id}`;
    }

    // Request button — store doctorId for requestThisDoctor()
    document.getElementById('requestBtn').dataset.doctorId = doc.id;
}

async function requestThisDoctor() {
    const btn = document.getElementById('requestBtn');
    const doctorId = btn.dataset.doctorId;
    if (!doctorId) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px"></i> Sending...';

    try {
        const response = await apiFetch('/consultations/', {
            method: 'POST',
            body: JSON.stringify({
                doctor_id: parseInt(doctorId),
                reason: 'Consultation request from doctor profile page'
            })
        });

        if (response.ok) {
            btn.innerHTML = '<i class="fas fa-check" style="margin-right: 8px"></i> Request Sent!';
            btn.style.background = '#d1fae5';
            btn.style.color = '#059669';
            showNotification('Consultation request sent successfully!', 'success');
        } else {
            const err = await response.json();
            btn.innerHTML = '<i class="fas fa-exclamation-triangle" style="margin-right: 8px"></i> Failed';
            btn.disabled = false;
            showNotification(err.detail || 'Failed to send request', 'error');
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right: 8px"></i> Send Request';
            }, 2000);
        }
    } catch (error) {
        console.error('Request error:', error);
        btn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right: 8px"></i> Send Request';
        btn.disabled = false;
        showNotification('Network error. Try again.', 'error');
    }
}
