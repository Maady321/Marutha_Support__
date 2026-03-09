// dashboard_doctor.js - Doctor Dashboard
// Loads the doctor's profile, online status toggle, and pending requests

document.addEventListener('DOMContentLoaded', function() {
    loadDoctorDashboard();
});


async function loadDoctorDashboard() {
    await loadDoctorProfile();
    await loadPendingRequests();
    initOnlineToggle();
}


// ---- Load Doctor Profile ----
async function loadDoctorProfile() {
    try {
        var res = await apiFetch('/doctors/me');
        if (!res.ok) return;

        var doc = await res.json();

        // Fill in doctor info on dashboard
        var nameEl = document.getElementById('doctorName');
        var specEl = document.getElementById('doctorSpecialty');
        var statusEl = document.getElementById('onlineStatus');
        var toggleEl = document.getElementById('onlineToggle');

        if (nameEl) nameEl.textContent = doc.name || 'Doctor';
        if (specEl) specEl.textContent = doc.specialty || 'General';

        if (statusEl) {
            if (doc.is_online) {
                statusEl.textContent = 'Online';
                statusEl.style.color = '#10b981';
            } else {
                statusEl.textContent = 'Offline';
                statusEl.style.color = '#ef4444';
            }
        }

        if (toggleEl) {
            toggleEl.checked = doc.is_online;
        }

    } catch (e) {
        console.error('Error loading doctor profile:', e);
    }
}


// ---- Online/Offline Toggle ----
function initOnlineToggle() {
    var toggleEl = document.getElementById('onlineToggle');
    if (!toggleEl) return;

    toggleEl.addEventListener('change', async function() {
        var newStatus = toggleEl.checked;
        var statusEl = document.getElementById('onlineStatus');

        try {
            var res = await apiFetch('/doctors/me/status?status=' + newStatus, {
                method: 'POST'
            });

            if (res.ok && statusEl) {
                if (newStatus) {
                    statusEl.textContent = 'Online';
                    statusEl.style.color = '#10b981';
                } else {
                    statusEl.textContent = 'Offline';
                    statusEl.style.color = '#ef4444';
                }
            }
        } catch(e) {
            console.error('Error toggling status:', e);
        }
    });
}


// ---- Load Pending Requests ----
async function loadPendingRequests() {
    var container = document.getElementById('pendingRequestsContainer');
    var countEl = document.getElementById('pendingCount');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted)">Loading requests...</div>';

    try {
        var res = await apiFetch('/doctors/requests/pending');
        if (!res.ok) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: red">Failed to load</div>';
            return;
        }

        var requests = await res.json();

        if (countEl) {
            countEl.textContent = requests.length;
        }

        if (requests.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 30px; color: var(--text-muted)"><i class="fas fa-check-circle" style="font-size: 2rem; color: #10b981; display: block; margin-bottom: 12px"></i>No pending requests right now.</div>';
            return;
        }

        container.innerHTML = '';

        for (var i = 0; i < requests.length; i++) {
            var req = requests[i];
            var card = document.createElement('div');
            card.className = 'card fade-in';
            card.style.padding = '20px';
            card.style.marginBottom = '12px';
            card.id = 'req-' + req.id;

            var patientName = req.patient_name || ('Patient #' + req.patient_id);
            var dateText = '';
            if (req.created_at) {
                dateText = new Date(req.created_at).toLocaleDateString();
            } else {
                dateText = 'Today';
            }

            card.innerHTML =
                '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">' +
                    '<h4 style="color: var(--medical-blue); margin: 0">' + patientName + '</h4>' +
                    '<span style="font-size: 0.85rem; color: var(--text-muted)">' + dateText + '</span>' +
                '</div>' +
                '<p style="color: var(--text-muted); margin-bottom: 12px; font-size: 0.9rem">' + (req.notes || 'General Consultation') + '</p>' +
                '<div style="display: flex; gap: 8px">' +
                    '<button class="btn btn-sm btn-primary" onclick="acceptDashRequest(' + req.id + ')" style="background: #10b981; border-color: #10b981">' +
                        '<i class="fas fa-check" style="margin-right: 4px"></i> Accept' +
                    '</button>' +
                    '<button class="btn btn-sm btn-outline-lavender" onclick="declineDashRequest(' + req.id + ')" style="color: #ef4444; border-color: #fca5a5">' +
                        '<i class="fas fa-times"></i>' +
                    '</button>' +
                '</div>';

            container.appendChild(card);
        }

    } catch (e) {
        console.error('Error loading requests:', e);
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: red">Error connecting to server</div>';
    }
}


// ---- Accept Request (Dashboard) ----
async function acceptDashRequest(requestId) {
    var timeInput = prompt('Enter appointment date/time (YYYY-MM-DDTHH:MM):');
    if (!timeInput) return;

    try {
        var res = await apiFetch('/doctors/requests/' + requestId + '/accept', {
            method: 'POST',
            body: JSON.stringify({ appointment_time: timeInput + ':00' })
        });

        if (res.ok) {
            alert('Request accepted!');
            loadPendingRequests();
        } else {
            var data = await res.json();
            alert('Error: ' + (data.detail || 'Failed'));
        }
    } catch (e) {
        alert('Error connecting to server.');
    }
}


// ---- Decline Request (Dashboard) ----
async function declineDashRequest(requestId) {
    if (!confirm('Decline this request?')) return;

    try {
        var res = await apiFetch('/doctors/requests/' + requestId + '/decline', {
            method: 'POST'
        });

        if (res.ok) {
            alert('Request declined');
            loadPendingRequests();
        } else {
            alert('Failed to decline request');
        }
    } catch (e) {
        alert('Error connecting to server.');
    }
}


// Make functions available globally for inline onclick handlers
window.acceptDashRequest = acceptDashRequest;
window.declineDashRequest = declineDashRequest;
