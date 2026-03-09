// doctor_profile.js - Doctor Profile Page (Patient View)
// Shows doctor details and allows consultation request

document.addEventListener('DOMContentLoaded', async function() {
    var urlParams = new URLSearchParams(window.location.search);
    var doctorId = urlParams.get('id');

    if (!doctorId) {
        document.getElementById('docName').textContent = 'Doctor Not Found';
        document.getElementById('docSpecialty').textContent = 'No doctor ID provided in URL.';
        return;
    }

    try {
        var response = await apiFetch('/doctors/' + doctorId);
        if (!response.ok) {
            throw new Error('Doctor not found');
        }

        var doc = await response.json();
        renderDoctorProfile(doc);

    } catch (error) {
        console.error('Failed to load doctor profile:', error);
        document.getElementById('docName').textContent = 'Profile Unavailable';
        document.getElementById('docSpecialty').textContent = 'Could not load doctor details.';
    }
});


function renderDoctorProfile(doc) {
    var name = doc.name || 'Doctor';

    // Get initials
    var parts = name.split(' ');
    var initials = '';
    for (var i = 0; i < parts.length; i++) {
        initials = initials + parts[i][0];
    }
    initials = initials.substring(0, 2).toUpperCase();

    document.getElementById('docAvatar').textContent = initials;
    document.getElementById('docName').textContent = name;
    document.getElementById('docSpecialty').textContent = doc.specialty || 'General Medicine';

    // Online status
    var statusDot = document.getElementById('docStatusDot');
    if (doc.is_online) {
        statusDot.classList.add('online');
    }

    // Badges
    var badgesContainer = document.getElementById('docBadges');
    badgesContainer.innerHTML = '';

    if (doc.specialty) {
        badgesContainer.innerHTML = badgesContainer.innerHTML +
            '<span class="badge" style="background: var(--lavender-soft); color: var(--medical-blue)">' +
                '<i class="fas fa-stethoscope" style="margin-right: 4px"></i> ' + doc.specialty +
            '</span>';
    }

    if (doc.experience) {
        badgesContainer.innerHTML = badgesContainer.innerHTML +
            '<span class="badge" style="background: #dbeafe; color: #1e40af">' +
                '<i class="fas fa-clock" style="margin-right: 4px"></i> ' + doc.experience + '+ Years' +
            '</span>';
    }

    if (doc.qualification) {
        badgesContainer.innerHTML = badgesContainer.innerHTML +
            '<span class="badge" style="background: #d1fae5; color: #059669">' +
                '<i class="fas fa-graduation-cap" style="margin-right: 4px"></i> ' + doc.qualification +
            '</span>';
    }

    var statusBg = doc.is_online ? '#d1fae5' : '#fef3c7';
    var statusColor = doc.is_online ? '#059669' : '#d97706';
    var statusText = doc.is_online ? 'Available Now' : 'Currently Offline';

    badgesContainer.innerHTML = badgesContainer.innerHTML +
        '<span class="badge" style="background: ' + statusBg + '; color: ' + statusColor + '">' +
            '<i class="fas fa-circle" style="margin-right: 4px; font-size: 0.5rem"></i> ' + statusText +
        '</span>';

    // Stats
    var expEl = document.getElementById('docExperience');
    if (expEl) expEl.textContent = doc.experience ? (doc.experience + ' yrs') : '—';

    var qualEl = document.getElementById('docQualification');
    if (qualEl) qualEl.textContent = doc.qualification || '—';

    var licEl = document.getElementById('docLicense');
    if (licEl) licEl.textContent = doc.license_id || '—';

    // Bio
    var bioEl = document.getElementById('docBio');
    if (doc.bio) {
        bioEl.textContent = doc.bio;
    } else {
        bioEl.innerHTML = '<span style="color: var(--text-light); font-style: italic">This doctor has not added a bio yet.</span>';
    }

    // Contact info
    document.getElementById('docPhone').textContent = doc.phone || 'Not provided';
    document.getElementById('docLicense2').textContent = doc.license_id || 'Not provided';
    document.getElementById('docEmail').textContent = 'Available after consultation';

    // Chat link
    var chatLink = document.getElementById('chatLink');
    if (doc.user_id) {
        chatLink.href = 'chat.html?userId=' + doc.user_id;
    }

    // Store doctor ID for request button
    document.getElementById('requestBtn').setAttribute('data-doctor-id', doc.id);
}


async function requestThisDoctor() {
    var btn = document.getElementById('requestBtn');
    var doctorId = btn.getAttribute('data-doctor-id');
    if (!doctorId) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px"></i> Sending...';

    try {
        var response = await apiFetch('/consultations/', {
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
            var err = await response.json();
            btn.innerHTML = '<i class="fas fa-exclamation-triangle" style="margin-right: 8px"></i> Failed';
            btn.disabled = false;
            showNotification(err.detail || 'Failed to send request', 'error');
            setTimeout(function() {
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
