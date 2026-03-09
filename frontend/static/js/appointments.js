// appointments.js - Doctor Appointments Management
// Handles pending requests, schedule, and calendar

document.addEventListener('DOMContentLoaded', function() {
    initAppointmentsPage();
});


async function initAppointmentsPage() {
    loadPendingRequests();
    loadUpcomingSchedule();
}


// ---- Load Pending Requests ----
async function loadPendingRequests() {
    var tbody = document.getElementById("pending-requests-body");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px">Loading requests...</td></tr>';

    try {
        var response = await apiFetch('/doctors/requests/pending');
        if (response.ok) {
            var requests = await response.json();
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
    // Update badge
    var badge = document.getElementById("pending-count-badge");
    if (badge) {
        if (requests.length > 0) {
            badge.style.display = "inline-block";
            badge.innerText = requests.length + " Pending";
        } else {
            badge.style.display = "none";
        }
    }

    if (requests.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="5" style="text-align: center; padding: 32px; color: var(--text-muted);">' +
            '<i class="fas fa-check-circle" style="font-size: 2rem; color: #10b981; margin-bottom: 12px; display: block;"></i>' +
            'All pending requests have been reviewed.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    var colors = ['#eff6ff', '#fdf2f8', '#f0fdf4', '#fff7ed'];

    for (var i = 0; i < requests.length; i++) {
        var req = requests[i];

        // Get initials
        var initials = 'P';
        if (req.patient_name) {
            var parts = req.patient_name.split(' ');
            initials = '';
            for (var j = 0; j < parts.length; j++) {
                initials = initials + parts[j][0];
            }
        }

        var bg = colors[req.id % colors.length];
        var textColor = '#1e40af';
        if (bg === '#fdf2f8') textColor = '#db2777';
        else if (bg === '#fff7ed') textColor = '#ea580c';

        var reqStage = req.patient_stage || "Unknown Stage";
        var patientName = req.patient_name || ('Patient #' + req.patient_id);

        var dateText = 'Today';
        if (req.created_at) {
            dateText = new Date(req.created_at).toLocaleString();
        }

        var row = document.createElement('tr');
        row.id = 'req-' + req.id;

        row.innerHTML =
            '<td>' +
                '<div style="display: flex; align-items: center; gap: 12px">' +
                    '<div class="profile-pic" style="width: 36px; height: 36px; font-size: 0.9rem; background: ' + bg + '; color: ' + textColor + ';">' + initials + '</div>' +
                    '<span style="font-weight: 600; color: var(--medical-blue)">' + patientName + '</span>' +
                '</div>' +
            '</td>' +
            '<td style="color: var(--text-main)">' + dateText + '</td>' +
            '<td style="color: var(--text-muted)">General Consultation</td>' +
            '<td><span class="badge" style="background: #e0f2fe; color: #0284c7">' + reqStage + '</span></td>' +
            '<td>' +
                '<div style="display: flex; gap: 8px">' +
                    '<button onclick="handleRequest(\'accept\', ' + req.id + ', this)" class="btn btn-sm btn-primary" style="background: #10b981; border-color: #10b981; padding: 6px 12px;">' +
                        '<i class="fas fa-check" style="margin-right: 4px"></i> Accept</button>' +
                    '<button onclick="handleRequest(\'decline\', ' + req.id + ', this)" class="btn btn-sm btn-outline-lavender" style="color: #ef4444; border-color: #fca5a5; padding: 6px 12px;">' +
                        '<i class="fas fa-times"></i></button>' +
                '</div>' +
            '</td>';

        tbody.appendChild(row);
    }
}


// ---- Load Upcoming Schedule ----
async function loadUpcomingSchedule() {
    var tbody = document.getElementById("upcoming-schedule-body");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px">Loading schedule...</td></tr>';

    try {
        var response = await apiFetch('/doctors/appointments');
        if (response.ok) {
            var appointments = await response.json();
            window.globalAppointments = appointments;
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

    for (var i = 0; i < appointments.length; i++) {
        var appt = appointments[i];

        var initials = 'P';
        if (appt.patient_name) {
            var parts = appt.patient_name.split(' ');
            initials = '';
            for (var j = 0; j < parts.length; j++) {
                initials = initials + parts[j][0];
            }
        }

        var timeStr = 'TBD';
        if (appt.appointment_time) {
            timeStr = new Date(appt.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        var patientName = appt.patient_name || ('Patient #' + appt.patient_id);

        tbody.innerHTML = tbody.innerHTML +
            '<tr>' +
                '<td>' +
                    '<div style="display: flex; align-items: center; gap: 12px">' +
                        '<div class="profile-pic" style="width: 36px; height: 36px; font-size: 0.9rem; background: var(--lavender-soft); color: var(--medical-blue);">' + initials + '</div>' +
                        '<span style="font-weight: 600; color: var(--medical-blue)">' + patientName + '</span>' +
                    '</div>' +
                '</td>' +
                '<td style="color: var(--text-main); font-weight: 500">' + timeStr + '</td>' +
                '<td style="color: var(--text-muted)">Check-up</td>' +
                '<td><span class="badge" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">Confirmed</span></td>' +
                '<td><button class="btn btn-sm btn-outline-lavender" onclick="window.location.href=\'patient_details.html?id=' + appt.patient_id + '\'">Details</button></td>' +
            '</tr>';
    }
}


// ---- Handle Request Action ----
var currentAcceptId = null;
var currentAcceptBtn = null;

async function handleRequest(action, requestId, btn) {
    if (action === 'accept') {
        currentAcceptId = requestId;
        currentAcceptBtn = btn;
        document.getElementById('acceptRequestModal').style.display = 'flex';
        return;
    }

    if (!confirm('Are you sure you want to ' + action + ' this request?')) return;

    // Decline logic
    var originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        var response = await apiFetch('/doctors/requests/' + requestId + '/decline', {
            method: 'POST'
        });

        if (response && response.ok) {
            var row = document.getElementById('req-' + requestId);
            if (row) {
                row.style.transition = "all 0.3s ease";
                row.style.opacity = "0";
                row.style.transform = "translateX(20px)";
                setTimeout(function() {
                    loadPendingRequests();
                }, 300);
            } else {
                loadPendingRequests();
            }
            if (typeof showToast === "function") showToast("Request Declined");
            else alert("Request Declined");
        } else {
            var data = {};
            try { data = await response.json(); } catch(e) {}
            alert('Error: ' + (data.detail || 'Failed to decline request'));
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Error declining request:", error);
        alert("Action failed.");
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}


function closeAcceptModal() {
    document.getElementById('acceptRequestModal').style.display = 'none';
    currentAcceptId = null;
    currentAcceptBtn = null;
}


async function confirmAcceptRequest() {
    if (!currentAcceptId) return;

    var inputDate = document.getElementById('acceptDate').value;
    var inputTime = document.getElementById('acceptTime').value;

    if (!inputDate || !inputTime) {
        alert("Please set a date and time for the consultation.");
        return;
    }

    var appointmentTime = inputDate + 'T' + inputTime + ':00';

    // Loading state
    var originalContent = currentAcceptBtn ? currentAcceptBtn.innerHTML : 'Accept';
    if (currentAcceptBtn) {
        currentAcceptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        currentAcceptBtn.disabled = true;
    }

    try {
        var response = await apiFetch('/doctors/requests/' + currentAcceptId + '/accept', {
            method: 'POST',
            body: JSON.stringify({ appointment_time: appointmentTime })
        });

        if (response && response.ok) {
            closeAcceptModal();
            var row = document.getElementById('req-' + currentAcceptId);
            if (row) {
                row.style.transition = "all 0.3s ease";
                row.style.opacity = "0";
                row.style.transform = "translateX(20px)";
                setTimeout(function() {
                    loadPendingRequests();
                    loadUpcomingSchedule();
                }, 300);
            } else {
                loadPendingRequests();
                loadUpcomingSchedule();
            }
            showToast("Appointment Confirmed!");
        } else {
            var data = await response.json();
            alert('Error: ' + (data.detail || 'Failed'));
            if (currentAcceptBtn) {
                currentAcceptBtn.innerHTML = originalContent;
                currentAcceptBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error("Error handling request:", error);
        alert("Action failed.");
        if (currentAcceptBtn) {
            currentAcceptBtn.innerHTML = originalContent;
            currentAcceptBtn.disabled = false;
        }
    }
}


// ---- Toast Notification ----
function showToast(message) {
    var toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    toast.innerText = message;
    toast.className = "toast show";

    setTimeout(function() {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}


// ---- Calendar Logic ----
var currentCalendarDate = new Date();
window.globalAppointments = [];

window.openCalendarModal = function(e) {
    if (e) e.preventDefault();
    document.getElementById('calendarModal').style.display = 'block';
    document.getElementById('calendarDetails').style.display = 'none';
    currentCalendarDate = new Date();
    renderCalendar();
};

window.closeCalendarModal = function() {
    document.getElementById('calendarModal').style.display = 'none';
};

window.onclick = function(event) {
    var modal = document.getElementById('calendarModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

window.changeMonth = function(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
    document.getElementById('calendarDetails').style.display = 'none';
};


function renderCalendar() {
    var year = currentCalendarDate.getFullYear();
    var month = currentCalendarDate.getMonth();

    // Update Header
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('calendarMonthYear').innerText = monthNames[month] + ' ' + year;

    // Get first day and total days
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    var grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    var today = new Date();

    // Empty prefix cells
    for (var i = 0; i < firstDay; i++) {
        var emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        grid.appendChild(emptyCell);
    }

    // Days of month
    for (var d = 1; d <= daysInMonth; d++) {
        var cellDate = new Date(year, month, d);
        var cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.innerText = d;

        // Highlight today
        if (cellDate.getDate() === today.getDate() &&
            cellDate.getMonth() === today.getMonth() &&
            cellDate.getFullYear() === today.getFullYear()) {
            cell.classList.add('today');
        }

        // Get events for this day
        var dayEvents = [];
        var allAppts = window.globalAppointments || [];

        for (var e = 0; e < allAppts.length; e++) {
            if (!allAppts[e].appointment_time) continue;
            var aDate = new Date(allAppts[e].appointment_time);
            if (aDate.getDate() === d && aDate.getMonth() === month && aDate.getFullYear() === year) {
                dayEvents.push(allAppts[e]);
            }
        }

        if (dayEvents.length > 0) {
            cell.classList.add('has-events');
            var dot = document.createElement('span');
            dot.className = 'event-dot';
            cell.appendChild(dot);

            if (dayEvents.length > 1) {
                var numStr = document.createElement('span');
                numStr.className = 'event-count';
                numStr.innerText = dayEvents.length + ' Appts';
                cell.appendChild(numStr);
            }
        }

        // Click event (use closure to capture variables)
        (function(cDate, events) {
            cell.onclick = function() {
                showDateDetails(cDate, events);
            };
        })(cellDate, dayEvents);

        grid.appendChild(cell);
    }
}


function showDateDetails(date, events) {
    var detailBox = document.getElementById('calendarDetails');
    var title = document.getElementById('selectedDateTitle');
    var eventsContainer = document.getElementById('selectedDateEvents');

    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    title.innerText = date.toLocaleDateString(undefined, options);

    eventsContainer.innerHTML = '';

    if (!events || events.length === 0) {
        eventsContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.95rem;">No appointments scheduled for this day.</div>';
    } else {
        for (var i = 0; i < events.length; i++) {
            var evt = events[i];
            var timeStr = 'TBD';
            if (evt.appointment_time) {
                timeStr = new Date(evt.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            eventsContainer.innerHTML = eventsContainer.innerHTML +
                '<div style="background: #fff; border-left: 4px solid var(--medical-blue); padding: 12px 16px; border-radius: var(--radius-sm); box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">' +
                    '<div>' +
                        '<div style="font-weight: 600; color: var(--medical-blue); margin-bottom: 4px;">' + (evt.patient_name || 'Patient') + '</div>' +
                        '<div style="font-size: 0.85rem; color: var(--text-muted);"><i class="fas fa-notes-medical" style="margin-right: 4px;"></i>' + (evt.notes || 'Check-up') + '</div>' +
                    '</div>' +
                    '<div style="display: flex; flex-direction: column; align-items: flex-end;">' +
                        '<span style="font-weight: 700; color: var(--text-main);">' + timeStr + '</span>' +
                        '<span class="badge" style="background: #ecfdf5; color: #047857; margin-top: 6px; font-size: 0.65rem;">Confirmed</span>' +
                    '</div>' +
                '</div>';
        }
    }

    detailBox.style.display = 'block';
    detailBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


// Make functions available globally
window.handleRequest = handleRequest;
window.showToast = showToast;
window.closeAcceptModal = closeAcceptModal;
window.confirmAcceptRequest = confirmAcceptRequest;
