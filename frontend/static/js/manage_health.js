// manage_health.js - Patient Health Management
// Handles health logs, appointments, and finding doctors

document.addEventListener('DOMContentLoaded', function() {
    initRange();

    // Check for hash in URL to switch tab
    var hash = window.location.hash.replace("#", "");
    var validTabs = ["logs", "appointments", "find-doctor"];

    if (validTabs.indexOf(hash) >= 0) {
        switchHealthTab(hash);
    } else {
        // Default to logs
        loadHealthLogs();
    }
});


// ---- Switch Tabs ----
function switchHealthTab(tabId) {
    // Hide all tabs
    var allTabs = document.querySelectorAll(".tab-content");
    for (var i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.remove("active");
    }

    // Remove active class from buttons
    var allBtns = document.querySelectorAll(".tab-btn");
    for (var j = 0; j < allBtns.length; j++) {
        allBtns[j].classList.remove("active");
    }

    var allLinks = document.querySelectorAll(".sidebar-link");
    for (var k = 0; k < allLinks.length; k++) {
        allLinks[k].classList.remove("active");
    }

    // Activate selected content
    var targetContent = document.getElementById("content-" + tabId);
    if (targetContent) targetContent.classList.add("active");

    // Activate tab button
    var tabBtn = document.getElementById("tab-" + tabId);
    if (tabBtn) tabBtn.classList.add("active");

    // Handle sidebar active state
    var navLogs = document.getElementById("nav-logs");
    var navAppts = document.getElementById("nav-appointments");

    if (tabId === "logs" && navLogs) {
        navLogs.classList.add("active");
    } else if ((tabId === "appointments" || tabId === "find-doctor") && navAppts) {
        navAppts.classList.add("active");
    }

    // Load data for the selected tab
    if (tabId === "find-doctor") {
        loadDoctors();
    } else if (tabId === "logs") {
        loadHealthLogs();
    } else if (tabId === "appointments") {
        loadAppointments();
    }
}


// ---- Initialize Pain Range Slider ----
function initRange() {
    var range = document.getElementById("pain_range");
    var display = document.getElementById("pain_val");
    if (range && display) {
        range.addEventListener("input", function(e) {
            display.innerText = e.target.value;
        });
    }
}


// ---- Submit Health Log ----
async function submitLog(e) {
    e.preventDefault();

    var painRange = document.getElementById("pain_range");
    var moodInput = document.getElementById("mood_select");
    var notesArea = e.target.querySelector('textarea');

    var painValue = 5;
    if (painRange) painValue = parseInt(painRange.value);

    var moodValue = 'Stable';
    if (moodInput) moodValue = moodInput.value;

    var notesValue = '';
    if (notesArea) notesValue = notesArea.value;

    var payload = {
        pain_level: painValue,
        mood: moodValue,
        bp: document.getElementById("bp_input") ? document.getElementById("bp_input").value : null,
        heart_rate: document.getElementById("hr_input") ? parseInt(document.getElementById("hr_input").value) || null : null,
        sleep_hours: document.getElementById("sleep_input") ? parseInt(document.getElementById("sleep_input").value) || null : null,
        notes: notesValue
    };

    try {
        var response = await apiFetch('/vitals/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showNotification("Health log submitted successfully!", 'success');
            e.target.reset();
            var display = document.getElementById("pain_val");
            if (display) display.innerText = "5";
            loadHealthLogs(); // Refresh list
        } else {
            var data = await response.json();
            showNotification('Error: ' + data.detail, 'error');
        }
    } catch (error) {
        console.error('Submit log error:', error);
        showNotification("Failed to submit log. Please try again.", 'error');
    }
}


// ---- Load Health Logs ----
async function loadHealthLogs() {
    var tbody = document.getElementById('logs-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Loading logs...</td></tr>';

    try {
        var response = await apiFetch('/vitals/my');
        if (response.ok) {
            var logs = await response.json();
            renderLogs(logs, tbody);
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">Failed to load logs</td></tr>';
        }
    } catch (error) {
        console.error("Error loading logs:", error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">Error connecting to server</td></tr>';
    }
}


function renderLogs(logs, tbody) {
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted)">No logs recorded yet.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    for (var i = 0; i < logs.length; i++) {
        var log = logs[i];
        var date = new Date(log.timestamp);
        var dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        // Set badge color based on mood
        var badgeClass = 'mood-badge';
        if (log.mood === 'Happy' || log.mood === 'Peaceful') {
            badgeClass = badgeClass + ' mood-peaceful';
        } else if (log.mood === 'Stable') {
            badgeClass = badgeClass + ' mood-stable';
        } else {
            badgeClass = badgeClass + ' mood-anxious';
        }

        var notesText = log.notes || '-';
        var bpText = log.bp || '-';
        var hrText = log.heart_rate ? log.heart_rate + ' bpm' : '-';
        var sleepText = log.sleep_hours ? log.sleep_hours + ' hrs' : '-';

        var row = '<tr>' +
            '<td>' + dateStr + '</td>' +
            '<td><span class="' + badgeClass + '">' + log.mood + '</span></td>' +
            '<td>' + log.pain_level + '/10</td>' +
            '<td>BP: ' + bpText + '<br>HR: ' + hrText + '<br>Sleep: ' + sleepText + '</td>' +
            '<td>' + notesText + '</td>' +
        '</tr>';

        tbody.innerHTML = tbody.innerHTML + row;
    }
}


// ---- Load Appointments ----
async function loadAppointments() {
    var grid = document.getElementById('appointments-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px;">Loading appointments...</div>';

    try {
        var response = await apiFetch('/consultations/my');
        if (response.ok) {
            var appointments = await response.json();
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

    for (var i = 0; i < appointments.length; i++) {
        var appt = appointments[i];

        // Get initials
        var initials = 'Dr';
        if (appt.doctor_name) {
            var parts = appt.doctor_name.split(' ');
            initials = '';
            for (var j = 0; j < parts.length; j++) {
                initials = initials + parts[j][0];
            }
        }

        // Format date
        var dateStr = 'Scheduling...';
        if (appt.appointment_time) {
            dateStr = new Date(appt.appointment_time).toLocaleString();
        }

        // Set status colors
        var badgeStyle = "background: #e2e8f0; color: #64748b";
        if (appt.status === 'accepted') {
            badgeStyle = "background: #dcfce7; color: #166534";
        } else if (appt.status === 'pending') {
            badgeStyle = "background: #fef3c7; color: #d97706";
        }

        var borderColor = appt.status === 'accepted' ? 'var(--medical-blue)' : '#cbd5e1';

        var card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '24px';
        card.style.borderLeft = '4px solid ' + borderColor;
        card.style.background = '#f8fafc';

        card.innerHTML =
            '<div style="display: flex; justify-content: space-between; margin-bottom: 12px;">' +
                '<span class="badge" style="' + badgeStyle + '">' + appt.status.toUpperCase() + '</span>' +
                '<span style="font-weight: 600; color: var(--medical-blue)">' + dateStr + '</span>' +
            '</div>' +
            '<h4 style="margin-bottom: 4px">' + (appt.doctor_name || 'Doctor Assigned Soon') + '</h4>' +
            '<p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">General Consultation</p>' +
            '<div style="display: flex; gap: 8px">' +
                '<button class="btn btn-sm btn-outline-lavender" onclick="window.location.href=\'doctor_profile.html?id=' + appt.doctor_id + '\'">View Details</button>' +
                '<button class="btn btn-sm btn-outline-medical" onclick="window.location.href=\'chat.html?userId=' + appt.doctor_user_id + '\'">' +
                    '<i class="fas fa-comment"></i> Chat</button>' +
            '</div>';

        container.appendChild(card);
    }
}


// ---- Load Doctors List ----
async function loadDoctors() {
    var grid = document.getElementById('doctor-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem">Searching for online doctors...</div>';

    try {
        var response = await apiFetch('/patients/online/doctors');
        if (response.ok) {
            var doctors = await response.json();
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

    for (var i = 0; i < doctors.length; i++) {
        var doc = doctors[i];

        // Get initials
        var parts = doc.name.split(' ');
        var initials = '';
        for (var j = 0; j < parts.length; j++) {
            initials = initials + parts[j][0];
        }

        var card = document.createElement('div');
        card.className = "card doctor-card fade-in";
        card.style.padding = "32px";
        card.style.textAlign = "center";

        card.innerHTML =
            '<div class="profile-pic" style="width: 80px; height: 80px; margin: 0 auto 16px; font-size: 1.5rem; background: var(--lavender-soft); color: var(--medical-blue);">' +
                initials +
            '</div>' +
            '<h4 style="margin-bottom: 4px">' + doc.name + '</h4>' +
            '<p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">' +
                doc.specialty + ' • Specialist' +
            '</p>' +
            '<div style="display: flex; gap: 8px; justify-content: center">' +
                '<button class="btn btn-sm btn-primary" onclick="requestDoctor(' + doc.id + ')">Request Now</button>' +
                '<button class="btn btn-sm btn-outline-lavender" onclick="window.location.href=\'doctor_profile.html?id=' + doc.id + '\'">View Profile</button>' +
            '</div>';

        container.appendChild(card);
    }
}


// ---- Request a Doctor ----
async function requestDoctor(doctorId) {
    if (!confirm('Would you like to send a consultation request to this doctor?')) return;

    try {
        var response = await apiFetch('/patients/request_doctor/' + doctorId, {
            method: 'POST',
            body: JSON.stringify({})
        });

        if (response.ok) {
            showNotification('Request sent successfully! The doctor will notify you shortly.', 'success');
        } else {
            var data = await response.json();
            showNotification('Error: ' + (data.detail || 'Could not send request'), 'error');
        }
    } catch (error) {
        showNotification('Failed to send request.', 'error');
    }
}


window.switchTab = switchHealthTab;
window.submitLog = submitLog;
window.updatePainValue = function (val) {
    document.getElementById("pain_val").innerText = val;
};
window.requestDoctor = requestDoctor;
