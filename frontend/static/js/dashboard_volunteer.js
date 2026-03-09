// dashboard_volunteer.js - Volunteer Dashboard
// Shows stats, work timer, and pending tasks

document.addEventListener('DOMContentLoaded', function() {
    loadVolunteerDashboard();
});


async function loadVolunteerDashboard() {
    await loadVolunteerStats();
    await loadPendingTasks();
    initWorkTimer();
}


// ---- Load Stats (Assigned Patients, Completed Tasks, Hours) ----
async function loadVolunteerStats() {
    try {
        // Get assigned patients count
        var patientsRes = await apiFetch('/volunteers/my-patients/full');
        if (patientsRes.ok) {
            var patients = await patientsRes.json();
            var countEl = document.getElementById('stat-patients');
            if (countEl) countEl.textContent = patients.length;
        }

        // Get tasks and count completed
        var tasksRes = await apiFetch('/volunteers/tasks');
        if (tasksRes.ok) {
            var tasks = await tasksRes.json();
            var completedCount = 0;
            for (var i = 0; i < tasks.length; i++) {
                if (tasks[i].is_completed) {
                    completedCount = completedCount + 1;
                }
            }
            var tasksEl = document.getElementById('stat-tasks');
            if (tasksEl) tasksEl.textContent = completedCount;
        }

        // Get total hours
        var hoursRes = await apiFetch('/volunteers/time-logs/total');
        if (hoursRes.ok) {
            var totalHours = await hoursRes.json();
            var hoursEl = document.getElementById('stat-hours');
            if (hoursEl) {
                var hours = Math.floor(totalHours);
                var minutes = Math.round((totalHours - hours) * 60);
                hoursEl.textContent = hours + 'h ' + minutes + 'm';
            }
        }

    } catch (e) {
        console.error('Error loading volunteer stats:', e);
    }
}


// ---- Load Pending Tasks ----
async function loadPendingTasks() {
    var container = document.getElementById('pendingTasksContainer');
    if (!container) return;

    try {
        var res = await apiFetch('/volunteers/tasks');
        if (!res.ok) return;

        var tasks = await res.json();

        // Filter to only show incomplete tasks
        var pendingTasks = [];
        for (var i = 0; i < tasks.length; i++) {
            if (!tasks[i].is_completed) {
                pendingTasks.push(tasks[i]);
            }
        }

        if (pendingTasks.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted)">All tasks completed! 🎉</div>';
            return;
        }

        container.innerHTML = '';

        for (var j = 0; j < pendingTasks.length; j++) {
            var task = pendingTasks[j];
            var card = document.createElement('div');
            card.className = 'card fade-in';
            card.style.padding = '16px';
            card.style.marginBottom = '8px';

            card.innerHTML =
                '<div style="display: flex; align-items: center; gap: 12px">' +
                    '<input type="checkbox" onchange="quickCompleteTask(' + task.id + ', this)" style="width: 18px; height: 18px; cursor: pointer">' +
                    '<div style="flex: 1">' +
                        '<div style="font-weight: 600; color: var(--medical-blue)">' + task.task_name + '</div>' +
                        '<div style="font-size: 0.85rem; color: var(--text-muted)">For: ' + (task.patient_name || 'General') + '</div>' +
                    '</div>' +
                '</div>';

            container.appendChild(card);
        }

    } catch (e) {
        console.error('Error loading tasks:', e);
    }
}


// ---- Quick Complete Task (from dashboard) ----
async function quickCompleteTask(taskId, checkbox) {
    try {
        var res = await apiFetch('/volunteers/tasks/' + taskId + '/complete', {
            method: 'PUT'
        });

        if (res.ok) {
            showNotification('Task completed!', 'success');
            loadPendingTasks();
            loadVolunteerStats();
        } else {
            checkbox.checked = false;
            showNotification('Failed to complete task.', 'error');
        }
    } catch (e) {
        checkbox.checked = false;
        showNotification('Error connecting to server.', 'error');
    }
}

window.quickCompleteTask = quickCompleteTask;


// ---- Work Timer ----
var timerInterval = null;
var timerStartTime = null;

function initWorkTimer() {
    var startBtn = document.getElementById('startTimerBtn');
    var stopBtn = document.getElementById('stopTimerBtn');

    if (startBtn) {
        startBtn.addEventListener('click', startTimer);
    }
    if (stopBtn) {
        stopBtn.addEventListener('click', stopTimer);
    }

    // Check if there's an active timer
    checkActiveTimer();
}


async function checkActiveTimer() {
    try {
        var res = await apiFetch('/volunteers/time-logs/active');
        if (res.ok) {
            var activeLog = await res.json();
            if (activeLog && activeLog.start_time) {
                // There's an active timer, resume it
                timerStartTime = new Date(activeLog.start_time);
                showTimerRunning();
            }
        }
    } catch (e) {
        // No active timer, that's fine
    }
}


async function startTimer() {
    try {
        var res = await apiFetch('/volunteers/time-logs/start', {
            method: 'POST'
        });

        if (res.ok) {
            timerStartTime = new Date();
            showTimerRunning();
            showNotification('Timer started!', 'success');
        } else {
            var data = await res.json();
            showNotification(data.detail || 'Could not start timer', 'error');
        }
    } catch (e) {
        showNotification('Error starting timer.', 'error');
    }
}


async function stopTimer() {
    try {
        var res = await apiFetch('/volunteers/time-logs/stop', {
            method: 'POST'
        });

        if (res.ok) {
            showTimerStopped();
            showNotification('Timer stopped!', 'success');
            loadVolunteerStats(); // Refresh hours
        } else {
            showNotification('Could not stop timer.', 'error');
        }
    } catch (e) {
        showNotification('Error stopping timer.', 'error');
    }
}


function showTimerRunning() {
    var startBtn = document.getElementById('startTimerBtn');
    var stopBtn = document.getElementById('stopTimerBtn');
    var display = document.getElementById('timerDisplay');

    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';

    // Start updating the display every second
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(function() {
        if (!timerStartTime) return;

        var now = new Date();
        var diffSeconds = Math.floor((now - timerStartTime) / 1000);

        var hours = Math.floor(diffSeconds / 3600);
        var minutes = Math.floor((diffSeconds % 3600) / 60);
        var seconds = diffSeconds % 60;

        // Add leading zeros
        var hStr = hours < 10 ? '0' + hours : '' + hours;
        var mStr = minutes < 10 ? '0' + minutes : '' + minutes;
        var sStr = seconds < 10 ? '0' + seconds : '' + seconds;

        if (display) {
            display.textContent = hStr + ':' + mStr + ':' + sStr;
        }
    }, 1000);
}


function showTimerStopped() {
    var startBtn = document.getElementById('startTimerBtn');
    var stopBtn = document.getElementById('stopTimerBtn');
    var display = document.getElementById('timerDisplay');

    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    if (display) display.textContent = '00:00:00';

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerStartTime = null;
}
