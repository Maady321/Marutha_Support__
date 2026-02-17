/**
 * Marutha Support - Doctor Dashboard JS
 */

let doctorStatus = false;

document.addEventListener('DOMContentLoaded', () => {
    initDoctorDashboard();
});

async function initDoctorDashboard() {
    await loadUserProfile();
    await loadDoctorProfile();
    await loadRequests();
}

/**
 * Load user profile from API (Basic user info)
 */
async function loadUserProfile() {
    try {
        const response = await apiFetch('/users/me');
        if (response.ok) {
            const user = await response.json();
            localStorage.setItem('userData', JSON.stringify(user));
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

/**
 * Load detailed doctor profile (includes is_online)
 */
async function loadDoctorProfile() {
    try {
        const response = await apiFetch('/doctors/me');
        if (response.ok) {
            const doctor = await response.json();
            doctorStatus = doctor.is_online;
            
            // Update UI with doctor info
            const nameDisplay = document.getElementById('user-name-display');
            if (nameDisplay) nameDisplay.textContent = doctor.name;
            
            updateStatusUI(doctorStatus);
        }
    } catch (error) {
        console.error('Failed to load doctor profile:', error);
    }
}

/**
 * Toggle Online/Offline Status
 */
async function toggleOnlineStatus() {
    const newStatus = !doctorStatus;
    const btn = document.getElementById('toggle-status-btn');
    const originalText = btn.innerText;
    
    btn.innerText = 'Updating...';
    btn.disabled = true;

    try {
        const response = await apiFetch(`/doctors/me/status?status=${newStatus}`, {
            method: 'POST'
        });

        if (response.ok) {
            doctorStatus = newStatus;
            updateStatusUI(doctorStatus);
        } else {
            alert('Failed to update status');
        }
    } catch (error) {
        console.error('Status toggle error:', error);
    } finally {
        btn.disabled = false;
    }
}

/**
 * Update UI elements based on online status
 */
function updateStatusUI(isOnline) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    const btn = document.getElementById('toggle-status-btn');

    if (isOnline) {
        dot.style.background = '#10b981'; // Success Green
        text.innerText = 'Online';
        text.style.color = '#059669';
        btn.innerText = 'Go Offline';
        btn.classList.remove('btn-outline-lavender');
        btn.classList.add('btn-primary');
    } else {
        dot.style.background = '#94a3b8'; // Muted Gray
        text.innerText = 'Offline';
        text.style.color = 'var(--text-muted)';
        btn.innerText = 'Go Online';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-lavender');
    }
}

/**
 * Load pending consultation requests
 */
async function loadRequests() {
    const tableBody = document.getElementById('appointments-table-body');
    if (!tableBody) return;

    try {
        const response = await apiFetch('/doctors/requests/pending');
        if (response.ok) {
            const requests = await response.json();
            renderRequests(requests, tableBody);
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Failed to load requests</td></tr>';
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Error connecting to server</td></tr>';
    }
}

function renderRequests(requests, container) {
    if (requests.length === 0) {
        container.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted)">No pending requests found.</td></tr>';
        return;
    }

    container.innerHTML = '';
    requests.forEach(req => {
        const row = document.createElement('tr');
        
        // Map status to badge styles
        let badgeStyle = 'background: #fffbeb; color: #92400e; border: 1px solid #fcd34d;'; // Pending default
        if (req.status === 'accepted') {
            badgeStyle = 'background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;';
        }

        row.innerHTML = `
            <td>
                <div style="font-weight: 500; color: var(--medical-blue);">${req.patient_name || ('Patient #' + req.patient_id)}</div>
            </td>
            <td style="color: var(--text-muted);">${req.created_at ? new Date(req.created_at).toLocaleTimeString() : 'N/A'}</td>
            <td style="color: var(--text-muted);">Consultation</td>
            <td>
                <span class="badge" style="padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; ${badgeStyle}">
                    ${req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="acceptRequest(${req.id})" style="padding: 6px 12px; font-size: 0.8rem; margin-right: 8px">
                    Accept
                </button>
                <button class="btn btn-sm btn-outline-lavender" style="padding: 6px 12px; font-size: 0.8rem;">
                    View
                </button>
            </td>
        `;
        container.appendChild(row);
    });
}

/**
 * Accept a request
 */
async function acceptRequest(requestId) {
    if (!confirm('Are you sure you want to accept this consultation request?')) return;

    try {
        const response = await apiFetch(`/doctors/requests/${requestId}/accept`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Request accepted successfully!');
            loadRequests(); // Reload list
        } else {
            const data = await response.json();
            alert(`Error: ${data.detail}`);
        }
    } catch (error) {
        alert('Failed to accept request.');
    }
}

// Global shims
window.acceptRequest = acceptRequest;
window.toggleOnlineStatus = toggleOnlineStatus;
