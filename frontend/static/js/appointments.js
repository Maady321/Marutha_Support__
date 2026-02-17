/**
 * Marutha Support - Appointments Management JS (Doctor)
 */

document.addEventListener('DOMContentLoaded', () => {
    initAppointmentsPage();
});

async function initAppointmentsPage() {
    loadPendingRequests();
    loadUpcomingSchedule();
}

/**
 * Load Pending Requests
 */
async function loadPendingRequests() {
    const tbody = document.getElementById("pending-requests-body");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px">Loading requests...</td></tr>';

    try {
        const response = await apiFetch('/doctors/requests/pending');
        if (response.ok) {
            const requests = await response.json();
            renderPendingRequests(requests, tbody);
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red; padding:20px">Failed to load requests</td></tr>';
        }
    } catch (error) {
        console.error('Error loading pending requests:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red; padding:20px">Error connecting to server</td></tr>';
    }
}

function renderPendingRequests(requests, tbody) {
    const badge = document.getElementById("pending-count-badge");
    if (badge) {
        if (requests.length > 0) {
            badge.style.display = "inline-block";
            badge.innerText = `${requests.length} Pending`;
        } else {
            badge.style.display = "none";
        }
    }

    if (requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 32px; color: var(--text-muted);">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: #10b981; margin-bottom: 12px; display: block;"></i>
                    All pending requests have been reviewed.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    requests.forEach(req => {
        const initials = req.patient_name ? req.patient_name.split(' ').map(n=>n[0]).join('') : 'P';
        // Random bg color for avatar
        const colors = ['#eff6ff', '#fdf2f8', '#f0fdf4', '#fff7ed'];
        const types = ['Consultation', 'Teleconsultation', 'Follow-up'];
        const bg = colors[req.id % colors.length];
        const textColor = bg === '#eff6ff' ? '#1e40af' : (bg === '#fdf2f8' ? '#db2777' : '#ea580c');
        
        const reqType = "General Consultation";
        const reqStage = req.patient_stage || "Unknown Stage";

        const row = document.createElement('tr');
        row.id = `req-${req.id}`;
        
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 12px">
                    <div class="profile-pic" style="width: 36px; height: 36px; font-size: 0.9rem; background: ${bg}; color: ${textColor};">
                        ${initials}
                    </div>
                    <span style="font-weight: 600; color: var(--medical-blue)">${req.patient_name || ('Patient #' + req.patient_id)}</span>
                </div>
            </td>
            <td style="color: var(--text-main)">${req.created_at ? new Date(req.created_at).toLocaleString() : 'Today'}</td>
            <td style="color: var(--text-muted)">${reqType}</td>
            <td>
                <span class="badge" style="background: #e0f2fe; color: #0284c7">${reqStage}</span>
            </td>
            <td>
                <div style="display: flex; gap: 8px">
                    <button onclick="handleRequest('accept', ${req.id}, this)" class="btn btn-sm btn-primary" style="background: #10b981; border-color: #10b981; padding: 6px 12px;">
                        <i class="fas fa-check" style="margin-right: 4px"></i> Accept
                    </button>
                    <button onclick="handleRequest('decline', ${req.id}, this)" class="btn btn-sm btn-outline-lavender" style="color: #ef4444; border-color: #fca5a5; padding: 6px 12px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Load Upcoming Schedule (Accepted Appointments)
 */
async function loadUpcomingSchedule() {
    const tbody = document.getElementById("upcoming-schedule-body");
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px">Loading schedule...</td></tr>';

    try {
        const response = await apiFetch('/doctors/appointments');
        if (response.ok) {
            const appointments = await response.json();
            renderSchedule(appointments, tbody);
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red; padding:20px">Failed to load schedule</td></tr>';
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red; padding:20px">Error connecting to server</td></tr>';
    }
}

function renderSchedule(appointments, tbody) {
    if (appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 32px; color: var(--text-muted);">No upcoming appointments.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    appointments.forEach(appt => {
        const initials = appt.patient_name ? appt.patient_name.split(' ').map(n=>n[0]).join('') : 'P';
        const dateObj = appt.appointment_time ? new Date(appt.appointment_time) : null;
        const timeStr = dateObj ? dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD';
        
        const row = `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px">
                        <div class="profile-pic" style="width: 36px; height: 36px; font-size: 0.9rem; background: var(--lavender-soft); color: var(--medical-blue);">
                            ${initials}
                        </div>
                        <span style="font-weight: 600; color: var(--medical-blue)">${appt.patient_name || ('Patient #' + appt.patient_id)}</span>
                    </div>
                </td>
                <td style="color: var(--text-main); font-weight: 500">${timeStr}</td>
                <td style="color: var(--text-muted)">Check-up</td>
                <td>
                    <span class="badge" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">Confirmed</span>
                </td>
                <td>
                    <a href="#" class="btn btn-sm btn-outline-lavender" onclick="alert('Viewing specific details...')">Details</a>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

/**
 * Handle Request Action
 */
async function handleRequest(action, requestId, btn) {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;

    const row = document.getElementById(`req-${requestId}`);
    
    // UI Loading state
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        let response;
        if (action === 'accept') {
            response = await apiFetch(`/doctors/requests/${requestId}/accept`, { method: 'POST' });
        } else {
            // Decline not implemented in backend yet? Assuming simulation or I need to add decline endpoint.
            // For now, if decline, we just hide it (client-side only?) -> User asked for REAL data.
            // If backend doesn't support decline, I should alert user "Not implemented".
            alert("Decline feature not yet implemented in backend.");
            btn.innerHTML = originalContent;
            btn.disabled = false;
            return;
        }

        if (response && response.ok) {
            // Animate removal
            if (row) {
                 row.style.transition = "all 0.3s ease";
                 row.style.opacity = "0";
                 row.style.transform = "translateX(20px)";
                 setTimeout(() => {
                     // Reload full list to update badge and ensure consistency
                     loadPendingRequests();

                     // Refresh upcoming schedule if accepted
                     if (action === 'accept') {
                         loadUpcomingSchedule();
                     }
                 }, 300);
            }
            showToast(action === "accept" ? "Appointment Confirmed!" : "Request Declined");
        } else {
            const data = await response.json();
            alert(`Error: ${data.detail || 'Failed'}`);
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Error handling request:", error);
        alert("Action failed.");
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

/**
 * Show Toast Notification
 */
function showToast(message) {
    let toast = document.getElementById("toast");
    if (!toast) {
         toast = document.createElement("div");
         toast.id = "toast";
         toast.className = "toast";
         document.body.appendChild(toast);
    }

    toast.innerText = message;
    toast.className = "toast show";

    setTimeout(function () {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}

// Global scope
window.handleRequest = handleRequest;
window.showToast = showToast;
