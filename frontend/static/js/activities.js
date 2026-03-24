// activities.js - Volunteer Activities Page
// Handles tasks, reports, and work hours

document.addEventListener('DOMContentLoaded', function() {
    // Check for tab in URL hash
    var hash = window.location.hash.replace('#', '');
    if (hash === 'tasks' || hash === 'reports') {
        switchTab(hash);
    }

    // Load initial data
    loadTasks();
    loadReports();
    loadTotalHours();
});


// ---- Load Total Hours ----
async function loadTotalHours() {
    try {
        var res = await apiFetch('/volunteers/time-logs/total');
        if (res.ok) {
            var totalHours = await res.json();
            var el = document.getElementById('stat-hours-logged');
            if (el) {
                var totalSec = Math.floor(totalHours * 3600);
                var hrs = Math.floor(totalSec / 3600);
                var mins = Math.floor((totalSec % 3600) / 60);
                var secs = totalSec % 60;

                el.innerHTML =
                    '<span style="font-size: 1.5rem">' + hrs + '</span><small style="font-size: 0.9rem; opacity: 0.8">h</small> ' +
                    '<span style="font-size: 1.5rem">' + mins + '</span><small style="font-size: 0.9rem; opacity: 0.8">m</small> ' +
                    '<span style="font-size: 1.5rem">' + secs + '</span><small style="font-size: 0.9rem; opacity: 0.8">s</small>';
            }
        }
    } catch (e) {
        console.error("Failed to load total work hours");
    }
}


// ---- Switch Tabs ----
function switchTab(tabId) {
    var allTabs = document.querySelectorAll('.tab-content');
    for (var i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.remove('active');
    }

    var allBtns = document.querySelectorAll('.tab-btn');
    for (var j = 0; j < allBtns.length; j++) {
        allBtns[j].classList.remove('active');
    }

    var allLinks = document.querySelectorAll('.sidebar-link');
    for (var k = 0; k < allLinks.length; k++) {
        allLinks[k].classList.remove('active');
    }

    var content = document.getElementById('content-' + tabId);
    var btn = document.getElementById('tab-' + tabId);
    var nav = document.getElementById('nav-' + tabId);

    if (content) content.classList.add('active');
    if (btn) btn.classList.add('active');
    if (nav) nav.classList.add('active');

    window.history.pushState(null, null, '#' + tabId);
}


// ---- Load Tasks ----
async function loadTasks() {
    var container = document.getElementById('tasks-container');
    if (!container) return;

    try {
        var res = await apiFetch('/volunteers/tasks');
        if (res.ok) {
            var tasks = await res.json();
            renderTasks(tasks, container);
        } else {
            container.innerHTML = '<div style="color:red">Failed to load tasks.</div>';
        }
    } catch (e) {
        console.error("Error loading tasks:", e);
        container.innerHTML = '<div style="color:red">Network error.</div>';
    }
}


function renderTasks(tasks, container) {
    if (tasks.length === 0) {
        container.innerHTML = 'No tasks assigned today.';
        return;
    }

    var html = '';
    var completedCount = 0;

    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        if (task.is_completed) completedCount++;

        var cardStyle = '';
        if (task.is_completed) {
            cardStyle = 'opacity: 0.5; text-decoration: line-through;';
        }

        var checkedAttr = '';
        if (task.is_completed) {
            checkedAttr = 'checked disabled';
        }

        html = html +
            '<div class="card task-card fade-in" style="' + cardStyle + '">' +
                '<div style="display: flex; gap: 16px; align-items: flex-start;">' +
                    '<label class="check-container" style="margin-top: 2px">' +
                        '<input type="checkbox" onchange="completeTask(this, ' + task.id + ')" ' + checkedAttr + '>' +
                        '<span class="checkmark"></span>' +
                    '</label>' +
                    '<div style="flex: 1">' +
                        '<div style="font-weight: 600; color: var(--medical-blue); margin-bottom: 4px;">' + task.task_name + '</div>' +
                        '<div style="font-size: 0.85rem; color: var(--text-muted)">For: ' + (task.patient_name || 'General') + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    container.innerHTML = html;

    // Update progress display
    var totalTasks = tasks.length;
    var pct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    var progressEl = document.getElementById('progress-percent');
    if (progressEl) progressEl.innerText = pct + '%';

    var textEl = document.getElementById('progress-text');
    if (textEl) textEl.innerText = completedCount + '/' + totalTasks + ' Tasks Done';

    var barEl = document.getElementById('progress-bar-fill');
    if (barEl) barEl.style.width = pct + '%';
}


// ---- Load Reports ----
async function loadReports() {
    var container = document.getElementById('recent-history-container');
    var monthEl = document.getElementById('stat-reports-month');
    if (!container) return;

    try {
        var res = await apiFetch('/volunteers/reports');
        if (res.ok) {
            var reports = await res.json();
            if (monthEl) monthEl.innerText = reports.length;

            if (reports.length === 0) {
                container.innerHTML = "No recent activities recorded.";
                return;
            }

            var html = '<div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">';

            for (var i = 0; i < reports.length; i++) {
                var r = reports[i];
                var dateObj = new Date(r.created_at);

                html = html +
                    '<div style="padding: 16px; background: white; border: 1px solid var(--border-color); border-radius: 8px;">' +
                        '<div style="display:flex; justify-content:space-between; margin-bottom: 8px;">' +
                            '<strong>' + r.activity_type + '</strong>' +
                            '<span style="color:var(--text-muted); font-size: 0.85rem;">' + dateObj.toLocaleDateString() + '</span>' +
                        '</div>' +
                        '<div style="color: var(--medical-blue); font-size: 0.9rem; margin-bottom: 8px;">Patient: ' + r.patient_name + '</div>' +
                        '<p style="margin:0; font-size: 0.9rem; color:var(--text-muted)">' + (r.notes || '') + '</p>' +
                    '</div>';
            }

            html = html + '</div>';
            container.innerHTML = html;
        }
    } catch (e) {
        console.error("Error loading reports", e);
    }
}


// ---- Complete Task ----
async function completeTask(checkbox, taskId) {
    if (!checkbox.checked) return;

    var card = checkbox.closest('.card');
    card.style.opacity = '0.5';

    try {
        var res = await apiFetch('/volunteers/tasks/' + taskId + '/complete', { method: 'PUT' });
        if (res.ok) {
            card.style.textDecoration = 'line-through';
            showNotification('Task marked as complete!', 'success');
            loadTasks(); // refresh
        } else {
            showNotification('Failed to update task.', 'error');
            checkbox.checked = false;
            card.style.opacity = '1';
        }
    } catch (e) {
        console.error(e);
        checkbox.checked = false;
        card.style.opacity = '1';
    }
}


// ---- Submit Activity Report ----
async function submitReport(e) {
    e.preventDefault();
    var form = e.target;
    var btn = form.querySelector('button[type="submit"]');
    var originalText = btn.innerText;

    var patientName = document.getElementById('reportPatientName').value;
    var activityType = document.getElementById('reportActivityType').value;
    var notes = document.getElementById('reportNotes').value;

    btn.innerText = 'Submitting...';
    btn.disabled = true;

    try {
        var res = await apiFetch('/volunteers/reports', {
            method: 'POST',
            body: JSON.stringify({
                patient_name: patientName,
                activity_type: activityType,
                notes: notes
            })
        });

        if (res.ok) {
            showNotification('Activity report submitted successfully!', 'success');
            form.reset();
            loadReports();
        } else {
            var data = await res.json();
            showNotification('Error: ' + (data.detail || 'Failed to submit.'), 'error');
        }
    } catch (err) {
        console.error("Submit error", err);
        showNotification("Action failed.", 'error');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}


// ---- Add Task Modal ----
function openAddTaskModal() {
    var modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.style.display = 'flex';
        var taskName = document.getElementById('newTaskName');
        var taskPatient = document.getElementById('newTaskPatientName');
        if (taskName) taskName.value = '';
        if (taskPatient) taskPatient.value = '';
    }
}


function closeAddTaskModal() {
    var modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.style.display = 'none';
    }
}


async function submitNewTask(e) {
    e.preventDefault();
    var taskName = document.getElementById('newTaskName').value.trim();
    var patientName = document.getElementById('newTaskPatientName').value.trim();

    if (!taskName) return;
    if (!patientName) patientName = "General";

    var btn = document.getElementById('submitNewTaskBtn');
    if (btn) {
        btn.innerText = 'Adding...';
        btn.disabled = true;
    }

    try {
        var res = await apiFetch('/volunteers/tasks', {
            method: 'POST',
            body: JSON.stringify({
                task_name: taskName,
                patient_name: patientName
            })
        });

        if (res.ok) {
            closeAddTaskModal();
            showNotification('Task added successfully!', 'success');
            loadTasks();
        } else {
            showNotification('Failed to add new task.', 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('An error occurred.', 'error');
    } finally {
        if (btn) {
            btn.innerText = 'Add Task';
            btn.disabled = false;
        }
    }
}


// Make functions available globally
window.submitReport = submitReport;
window.completeTask = completeTask;
window.switchTab = switchTab;
window.openAddTaskModal = openAddTaskModal;
window.closeAddTaskModal = closeAddTaskModal;
window.submitNewTask = submitNewTask;
