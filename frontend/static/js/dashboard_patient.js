// dashboard_patient.js - Patient Dashboard
// Shows greeting, health stats, upcoming appointments, and comfort level modal

document.addEventListener('DOMContentLoaded', function() {
    loadPatientDashboard();
});


async function loadPatientDashboard() {
    updateGreeting();
    await loadHealthStats();
    await loadUpcomingAppointments();
    initComfortModal();
}


// ---- Greeting based on time of day ----
function updateGreeting() {
    var greetEl = document.getElementById('greeting-text');
    if (!greetEl) return;

    var hour = new Date().getHours();
    var greeting = '';

    if (hour < 12) {
        greeting = 'Good Morning';
    } else if (hour < 18) {
        greeting = 'Good Afternoon';
    } else {
        greeting = 'Good Evening';
    }

    greetEl.textContent = greeting;
}


// ---- Load Health Stats ----
async function loadHealthStats() {
    try {
        var res = await apiFetch('/vitals/my');
        if (!res.ok) return;

        var logs = await res.json();

        // Update stats cards
        var totalLogs = document.getElementById('stat-total-logs');
        if (totalLogs) totalLogs.textContent = logs.length;

        if (logs.length > 0) {
            // Average pain level
            var totalPain = 0;
            for (var i = 0; i < logs.length; i++) {
                totalPain = totalPain + logs[i].pain_level;
            }
            var avgPain = Math.round(totalPain / logs.length);

            var painEl = document.getElementById('stat-avg-pain');
            if (painEl) painEl.textContent = avgPain + '/10';

            // Most recent mood
            var moodEl = document.getElementById('stat-latest-mood');
            if (moodEl) moodEl.textContent = logs[0].mood;

            // Render chart if canvas exists
            renderHealthChart(logs);
            renderSleepChart(logs);
        }

    } catch (e) {
        console.error('Error loading health stats:', e);
    }
}


// ---- Render Health Trend Chart ----
function renderHealthChart(logs) {
    var canvas = document.getElementById('healthChart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Get last 7 logs (reversed to show oldest first)
    var recentLogs = logs.slice(0, 7).reverse();

    // Build labels and data arrays
    var labels = [];
    var painData = [];

    for (var i = 0; i < recentLogs.length; i++) {
        var date = new Date(recentLogs[i].timestamp);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        painData.push(recentLogs[i].pain_level);
    }

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pain Level',
                data: painData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// ---- Render Sleep Trend Chart ----
function renderSleepChart(logs) {
    var canvas = document.getElementById('sleepChart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Get last 7 logs with sleep_hours
    var sleepLogs = [];
    for(var i=0; i<logs.length; i++){
        if(logs[i].sleep_hours != null){
            sleepLogs.push(logs[i]);
            if(sleepLogs.length === 7) break;
        }
    }
    sleepLogs = sleepLogs.reverse();

    var labels = [];
    var sleepData = [];

    for (var i = 0; i < sleepLogs.length; i++) {
        var date = new Date(sleepLogs[i].timestamp);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        sleepData.push(sleepLogs[i].sleep_hours);
    }

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sleep (hrs)',
                data: sleepData,
                backgroundColor: '#8b5cf6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 16
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}


// ---- Load Upcoming Appointments ----
async function loadUpcomingAppointments() {
    var container = document.getElementById('upcoming-appointments');
    if (!container) return;

    try {
        var res = await apiFetch('/consultations/my');
        if (!res.ok) return;

        var appointments = await res.json();

        // Filter to only accepted and upcoming appointments
        var now = new Date();
        var upcoming = [];

        for (var i = 0; i < appointments.length; i++) {
            var appt = appointments[i];
            if (appt.status === 'accepted') {
                if (appt.appointment_time) {
                    var apptDate = new Date(appt.appointment_time);
                    if (apptDate >= now) {
                        upcoming.push(appt);
                    }
                }
            }
        }

        // Update count display
        var countEl = document.getElementById('stat-appointments');
        if (countEl) countEl.textContent = upcoming.length;

        if (upcoming.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted)">No upcoming appointments.</div>';
            return;
        }

        container.innerHTML = '';

        for (var j = 0; j < upcoming.length; j++) {
            var apt = upcoming[j];
            var card = document.createElement('div');
            card.className = 'card fade-in';
            card.style.padding = '16px';
            card.style.marginBottom = '10px';

            var doctorName = apt.doctor_name || 'Doctor';
            var dateStr = 'Scheduling...';
            if (apt.appointment_time) {
                dateStr = new Date(apt.appointment_time).toLocaleString();
            }

            card.innerHTML =
                '<div style="display: flex; justify-content: space-between; align-items: center">' +
                    '<div>' +
                        '<div style="font-weight: 600; color: var(--medical-blue)">' + doctorName + '</div>' +
                        '<div style="font-size: 0.85rem; color: var(--text-muted)">' + dateStr + '</div>' +
                    '</div>' +
                    '<span class="badge" style="background: #d1fae5; color: #065f46">Confirmed</span>' +
                '</div>';

            container.appendChild(card);
        }

    } catch (e) {
        console.error('Error loading appointments:', e);
    }
}


// ---- Comfort Level Modal ----
function initComfortModal() {
    var openBtn = document.getElementById('log-comfort-btn');
    var modal = document.getElementById('comfortModal');
    var closeBtn = document.getElementById('closeComfortModal');
    var form = document.getElementById('comfortForm');

    if (openBtn && modal) {
        openBtn.addEventListener('click', function() {
            modal.style.display = 'flex';
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            var painInput = document.getElementById('comfort-pain');
            var moodInput = document.getElementById('comfort-mood');
            var notesInput = document.getElementById('comfort-notes');

            var data = {
                pain_level: parseInt(painInput.value),
                mood: moodInput.value,
                notes: notesInput.value
            };

            try {
                var res = await apiFetch('/vitals/', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    if (modal) modal.style.display = 'none';
                    showNotification('Comfort level logged!', 'success');
                    loadHealthStats(); // Refresh data
                } else {
                    showNotification('Failed to log comfort level.', 'error');
                }
            } catch (err) {
                showNotification('Error connecting to server.', 'error');
            }
        });
    }
}
