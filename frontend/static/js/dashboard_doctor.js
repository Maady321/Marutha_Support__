// dashboard_doctor.js - Doctor Dashboard
// Loads the doctor's profile, online status toggle, and pending requests

document.addEventListener('DOMContentLoaded', function() {
    loadDoctorDashboard();
});


async function loadDoctorDashboard() {
    await loadDoctorProfile();
    await loadPendingRequests();
}


// ---- Load Doctor Profile ----
async function loadDoctorProfile() {
    try {
        var res = await apiFetch('/doctors/me');
        if (!res.ok) return;

        var doc = await res.json();

        // Fill in doctor info on dashboard
        var greetingName = document.getElementById('doctor-greeting-name');
        var profileName = document.getElementById('user-name-display');
        
        if (greetingName) {
            var fullName = doc.name || 'Doctor';
            var firstName = fullName.split(' ')[0];
            greetingName.textContent = firstName;
        }
        
        if (profileName) profileName.textContent = doc.name || 'Doctor';

        // Update online status UI
        updateOnlineStatusUI(doc.is_online);

    } catch (e) {
        console.error('Error loading doctor profile:', e);
    }
}


// ---- Update Online Status UI ----
function updateOnlineStatusUI(isOnline) {
    var statusDot = document.getElementById('status-dot');
    var statusText = document.getElementById('status-text');
    var toggleBtn = document.getElementById('toggle-status-btn');

    if (statusDot) {
        if (isOnline) {
            statusDot.classList.add('online');
            statusDot.style.background = '#10b981';
            statusDot.style.boxShadow = '0 0 8px #10b981';
        } else {
            statusDot.classList.remove('online');
            statusDot.style.background = '#94a3b8';
            statusDot.style.boxShadow = 'none';
        }
    }

    if (statusText) {
        statusText.textContent = isOnline ? 'Online' : 'Offline';
    }

    if (toggleBtn) {
        toggleBtn.textContent = isOnline ? 'Go Offline' : 'Go Online';
        if (isOnline) {
            toggleBtn.classList.add('btn-primary');
            toggleBtn.classList.remove('btn-outline-lavender');
            toggleBtn.style.background = '#10b981';
            toggleBtn.style.color = 'white';
            toggleBtn.style.borderColor = '#10b981';
        } else {
            toggleBtn.classList.remove('btn-primary');
            toggleBtn.classList.add('btn-outline-lavender');
            toggleBtn.style.background = '';
            toggleBtn.style.color = '';
            toggleBtn.style.borderColor = '';
        }
    }
}


// ---- Toggle Online Status ----
async function toggleOnlineStatus() {
    var statusText = document.getElementById('status-text');
    var currentStatus = (statusText && statusText.textContent === 'Online');
    var newStatus = !currentStatus;

    try {
        var res = await apiFetch('/doctors/me/status?status=' + newStatus, {
            method: 'POST'
        });

        if (res.ok) {
            updateOnlineStatusUI(newStatus);
        } else {
            console.error('Failed to update online status');
        }
    } catch(e) {
        console.error('Error toggling status:', e);
    }
}


// ---- Load Pending Requests ----
async function loadPendingRequests() {
    var tableBody = document.getElementById('appointments-table-body');
    var statAppointments = document.getElementById('stat-appointments');
    var statPatients = document.getElementById('stat-patients');

    if (!tableBody) return;

    try {
        var res = await apiFetch('/doctors/requests/pending');
        if (!res.ok) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red">Failed to load</td></tr>';
            return;
        }

        var requests = await res.json();

        // Update stats
        if (statAppointments) statAppointments.textContent = requests.length;

        if (requests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="dash-empty">No pending requests</td></tr>';
            return;
        }

        tableBody.innerHTML = '';

        for (var i = 0; i < requests.length; i++) {
            var req = requests[i];
            var tr = document.createElement('tr');
            
            var patientName = req.patient_name || ('Patient #' + req.patient_id);
            var dateText = req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Today';

            tr.innerHTML =
                '<td>' +
                    '<div style="font-weight: 600; color: var(--medical-blue)">' + patientName + '</div>' +
                    '<div style="font-size: 0.75rem; color: var(--text-muted)">ID: ' + req.patient_id + '</div>' +
                '</td>' +
                '<td>' + dateText + '</td>' +
                '<td>Consultation</td>' +
                '<td><span class="status-badge warning">Pending</span></td>' +
                '<td>' +
                    '<div style="display: flex; gap: 8px">' +
                        '<button class="btn btn-sm" onclick="acceptDashRequest(' + req.id + ')" style="background: #10b981; color: white">' +
                            '<i class="fas fa-check"></i>' +
                        '</button>' +
                        '<button class="btn btn-sm btn-outline-lavender" onclick="declineDashRequest(' + req.id + ')" style="color: #ef4444; border-color: #fca5a5">' +
                            '<i class="fas fa-times"></i>' +
                        '</button>' +
                    '</div>' +
                '</td>';

            tableBody.appendChild(tr);
        }

    } catch (e) {
        console.error('Error loading requests:', e);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red">Error connecting to server</td></tr>';
    }
}


// ---- Accept Request ----
async function acceptDashRequest(requestId) {
    var dateVal = document.getElementById('acceptDate');
    var timeVal = document.getElementById('acceptTime');
    
    // For simplicity, we'll use a prompt if the modal isn't ready, 
    // but the modal in HTML is better. Let's try the modal first.
    var modal = document.getElementById('acceptRequestModal');
    if (modal) {
        modal.classList.add('active');
        // We'll need a way to pass the request ID to the confirmation button
        window.currentAcceptRequestId = requestId;
    } else {
        var timeInput = prompt('Enter appointment date/time (YYYY-MM-DDTHH:MM):');
        if (!timeInput) return;
        confirmAcceptRequestWithTime(requestId, timeInput + ':00');
    }
}

async function confirmAcceptRequest() {
    var requestId = window.currentAcceptRequestId;
    var dateStr = document.getElementById('acceptDate').value;
    var timeStr = document.getElementById('acceptTime').value;

    if (!dateStr || !timeStr) {
        alert('Please select both date and time');
        return;
    }

    var fullTime = dateStr + 'T' + timeStr + ':00';
    await confirmAcceptRequestWithTime(requestId, fullTime);
    closeAcceptModal();
}

async function confirmAcceptRequestWithTime(requestId, timeStr) {
    try {
        var res = await apiFetch('/doctors/requests/' + requestId + '/accept', {
            method: 'POST',
            body: JSON.stringify({ appointment_time: timeStr })
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

function closeAcceptModal() {
    var modal = document.getElementById('acceptRequestModal');
    if (modal) modal.classList.remove('active');
}


// ---- Decline Request ----
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
window.toggleOnlineStatus = toggleOnlineStatus;
window.acceptDashRequest = acceptDashRequest;
window.confirmAcceptRequest = confirmAcceptRequest;
window.closeAcceptModal = closeAcceptModal;
window.declineDashRequest = declineDashRequest;
