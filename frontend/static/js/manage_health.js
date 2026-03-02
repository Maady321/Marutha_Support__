/**
 * Marutha Support - Patient Health Management JS
 */

document.addEventListener('DOMContentLoaded', () => {
    initRange();
    
    // Check for hash in URL to switch tab
    const hash = window.location.hash.replace("#", "");
    const validTabs = ["logs", "appointments", "find-doctor"];
    
    if (validTabs.includes(hash)) {
        switchHealthTab(hash);
    } else {
        // Default to logs if no hash
        loadHealthLogs();
    }
});

/**
 * Switch Tabs Logic
 */
function switchHealthTab(tabId) {
    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"));
    
    // Remove active class from buttons
    document.querySelectorAll(".tab-btn").forEach((el) => el.classList.remove("active"));
    document.querySelectorAll(".sidebar-link").forEach((el) => el.classList.remove("active"));

    // Activate selected content
    const targetContent = document.getElementById("content-" + tabId);
    if (targetContent) targetContent.classList.add("active");

    // Activate tab button
    const tabBtn = document.getElementById("tab-" + tabId);
    if (tabBtn) tabBtn.classList.add("active");

    // Handle sidebar active state shim
    const navLogs = document.getElementById("nav-logs");
    const navAppts = document.getElementById("nav-appointments");

    if (tabId === "logs" && navLogs) {
        navLogs.classList.add("active");
    } else if ((tabId === "appointments" || tabId === "find-doctor") && navAppts) {
        navAppts.classList.add("active");
    }

    // Load dynamic data
    if (tabId === "find-doctor") {
        loadDoctors();
    } else if (tabId === "logs") {
        loadHealthLogs();
    } else if (tabId === "appointments") {
        loadAppointments();
    }
}

/**
 * Initialize Range Input
 */
function initRange() {
    const range = document.getElementById("pain_range");
    const display = document.getElementById("pain_val");
    if (range && display) {
        range.addEventListener("input", (e) => {
            display.innerText = e.target.value;
        });
    }
}

/**
 * Handle Log Submission
 */
async function submitLog(e) {
    e.preventDefault();
    
    const painRange = document.getElementById("pain_range");
    const moodInput = document.getElementById("mood_select");
    const notesArea = e.target.querySelector('textarea');

    const payload = {
        pain_level: parseInt(painRange?.value || 5),
        mood: moodInput?.value || 'Stable',
        notes: notesArea?.value || ''
    };

    try {
        const response = await apiFetch('/vitals/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Health log submitted successfully!");
            e.target.reset();
            const display = document.getElementById("pain_val");
            if (display) display.innerText = "5";
            loadHealthLogs(); // Refresh list
        } else {
            const data = await response.json();
            alert(`Error: ${data.detail}`);
        }
    } catch (error) {
        console.error('Submit log error:', error);
        alert("Failed to submit log. Please try again.");
    }
}

/**
 * Load Health Logs
 */
async function loadHealthLogs() {
    const tbody = document.getElementById('logs-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Loading logs...</td></tr>';

    try {
        const response = await apiFetch('/vitals/my');
        if (response.ok) {
            const logs = await response.json();
            renderLogs(logs, tbody);
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red; padding:20px;">Failed to load logs</td></tr>';
        }
    } catch (error) {
        console.error("Error loading logs:", error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red; padding:20px;">Error connecting to server</td></tr>';
    }
}

function renderLogs(logs, tbody) {
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted)">No logs recorded yet.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    logs.forEach(log => {
        const date = new Date(log.timestamp);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Mood badge color
        let badgeClass = 'mood-badge';
        if (['Happy', 'Peaceful'].includes(log.mood)) badgeClass += ' mood-peaceful';
        else if (log.mood === 'Stable') badgeClass += ' mood-stable';
        else badgeClass += ' mood-anxious'; // simplistic fallback

        const row = `
            <tr>
                <td>${dateStr}</td>
                <td><span class="${badgeClass}">${log.mood}</span></td>
                <td>${log.pain_level}/10</td>
                <td>${log.notes || '-'}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

/**
 * Load Appointments
 */
async function loadAppointments() {
    const grid = document.getElementById('appointments-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px;">Loading appointments...</div>';

    try {
        const response = await apiFetch('/consultations/my');
        if (response.ok) {
            const appointments = await response.json();
            renderAppointments(appointments, grid);
        } else {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:red; padding:20px;">Failed to load appointments</div>';
        }
    } catch (error) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:red; padding:20px;">Error connecting to server</div>';
    }
}

function renderAppointments(appointments, container) {
    if (appointments.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted)">No scheduled appointments. <br><button class="btn btn-outline-lavender" onclick="switchTab(\'find-doctor\')" style="margin-top:10px">Find a Specialist</button></div>';
        return;
    }

    container.innerHTML = '';
    appointments.forEach(appt => {
        const initials = appt.doctor_name ? appt.doctor_name.split(' ').map(n=>n[0]).join('') : 'Dr';
        const dateObj = appt.appointment_time ? new Date(appt.appointment_time) : null;
        const dateStr = dateObj ? dateObj.toLocaleString() : 'Scheduling...';
        
        let statusColor = 'var(--text-muted)';
        let badgeStyle = "background: #e2e8f0; color: #64748b";
        
        if (appt.status === 'accepted') {
             statusColor = 'var(--hope-green)';
             badgeStyle = "background: #dcfce7; color: #166534";
        } else if (appt.status === 'pending') {
             statusColor = '#f59e0b';
             badgeStyle = "background: #fef3c7; color: #d97706";
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '24px';
        card.style.borderLeft = `4px solid ${appt.status === 'accepted' ? 'var(--medical-blue)' : '#cbd5e1'}`;
        card.style.background = '#f8fafc';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span class="badge" style="${badgeStyle}">${appt.status.toUpperCase()}</span>
                <span style="font-weight: 600; color: var(--medical-blue)">${dateStr}</span>
            </div>
            <h4 style="margin-bottom: 4px">${appt.doctor_name || 'Doctor Assigned Soon'}</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
                General Consultation
            </p>
            <div style="display: flex; gap: 8px">
                <button class="btn btn-sm btn-outline-lavender" onclick="window.location.href='doctor_profile.html?id=${appt.doctor_id}'">View Details</button>
                <button class="btn btn-sm btn-outline-medical" onclick="window.location.href='chat.html?userId=${appt.doctor_user_id}'">
                    <i class="fas fa-comment"></i> Chat
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}


/**
 * Load Doctors List
 */
async function loadDoctors() {
    const grid = document.getElementById('doctor-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem">Searching for online doctors...</div>';

    try {
        const response = await apiFetch('/patients/online/doctors');
        if (response.ok) {
            const doctors = await response.json();
            renderDoctors(doctors, grid);
        } else {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--danger)">Failed to load doctors</div>';
        }
    } catch (error) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem">Error connecting to care network</div>';
    }
}

function renderDoctors(doctors, container) {
    if (doctors.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted)">No doctors are currently online. Please check back later.</div>';
        return;
    }

    container.innerHTML = '';
    doctors.forEach(doc => {
        const initials = doc.name.split(' ').map(n => n[0]).join('');
        const card = document.createElement('div');
        card.className = "card doctor-card fade-in";
        card.style.padding = "32px";
        card.style.textAlign = "center";

        card.innerHTML = `
            <div class="profile-pic" style="width: 80px; height: 80px; margin: 0 auto 16px; font-size: 1.5rem; background: var(--lavender-soft); color: var(--medical-blue);">
                ${initials}
            </div>
            <h4 style="margin-bottom: 4px">${doc.name}</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
                ${doc.specialty} • Specialist
            </p>
            <div style="display: flex; gap: 8px; justify-content: center">
                <button class="btn btn-sm btn-primary" onclick="requestDoctor(${doc.id})">Request Now</button>
                <button class="btn btn-sm btn-outline-lavender" onclick="window.location.href='doctor_profile.html?id=${doc.id}'">View Profile</button>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Request a doctor
 */
async function requestDoctor(doctorId) {
    if (!confirm('Would you like to send a consultation request to this doctor?')) return;

    try {
        const response = await apiFetch(`/patients/request_doctor/${doctorId}`, {
            method: 'POST',
            body: JSON.stringify({})
        });

        if (response.ok) {
            alert('Request sent successfully! The doctor will notify you shortly.');
        } else {
            const data = await response.json();
            alert(`Error: ${data.detail || 'Could not send request'}`);
        }
    } catch (error) {
        alert('Failed to send request.');
    }
}

// Global shims
window.switchTab = switchHealthTab;
window.submitLog = submitLog;
window.updatePainValue = (val) => document.getElementById('pain_val').innerText = val;
window.requestDoctor = requestDoctor;
