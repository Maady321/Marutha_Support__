/**
 * Marutha Support - Activities JS (Volunteer)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching if not handled by app.js or manage_profile.js
    const hash = window.location.hash.replace('#', '');
    if (['tasks', 'reports'].includes(hash)) {
        switchTab(hash);
    }
    
    // Load initial data
    loadTasks();
    loadReports();
});

/**
 * Switch between Tasks and Reports tabs
 */
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));

    const content = document.getElementById('content-' + tabId);
    const btn = document.getElementById('tab-' + tabId);
    const nav = document.getElementById('nav-' + tabId);

    if (content) content.classList.add('active');
    if (btn) btn.classList.add('active');
    if (nav) nav.classList.add('active');
    
    window.history.pushState(null, null, `#${tabId}`);
}

/**
 * API Data Loaders
 */
async function loadTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    try {
        const res = await apiFetch('/volunteers/tasks');
        if (res.ok) {
            const tasks = await res.json();
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
    
    let html = '';
    let completedCount = 0;
    
    tasks.forEach(task => {
        if (task.is_completed) completedCount++;
        html += `
            <div class="card task-card fade-in" style="${task.is_completed ? 'opacity: 0.5; text-decoration: line-through;' : ''}">
                <div style="display: flex; gap: 16px; align-items: flex-start;">
                    <label class="check-container" style="margin-top: 2px">
                        <input type="checkbox" onchange="completeTask(this, ${task.id})" ${task.is_completed ? 'checked disabled' : ''}>
                        <span class="checkmark"></span>
                    </label>
                    <div style="flex: 1">
                        <div style="font-weight: 600; color: var(--medical-blue); margin-bottom: 4px;">
                            ${task.task_name}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted)">
                            For: ${task.patient_name || 'General'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Update progress
    const pct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
    const progressEl = document.getElementById('progress-percent');
    if (progressEl) progressEl.innerText = `${pct}%`;
    const textEl = document.getElementById('progress-text');
    if (textEl) textEl.innerText = `${completedCount}/${tasks.length} Tasks Done`;
    const barEl = document.getElementById('progress-bar-fill');
    if (barEl) barEl.style.width = `${pct}%`;
}

async function loadReports() {
    const container = document.getElementById('recent-history-container');
    const monthEl = document.getElementById('stat-reports-month');
    if (!container) return;

    try {
        const res = await apiFetch('/volunteers/reports');
        if (res.ok) {
            const reports = await res.json();
            if (monthEl) monthEl.innerText = reports.length;
            
            if (reports.length === 0) {
                container.innerHTML = "No recent activities recorded.";
                return;
            }
            
            let html = '<div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">';
            reports.forEach(r => {
                const dateObj = new Date(r.created_at);
                html += `
                    <div style="padding: 16px; background: white; border: 1px solid var(--border-color); border-radius: 8px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                            <strong>${r.activity_type}</strong>
                            <span style="color:var(--text-muted); font-size: 0.85rem;">${dateObj.toLocaleDateString()}</span>
                        </div>
                        <div style="color: var(--medical-blue); font-size: 0.9rem; margin-bottom: 8px;">
                            Patient: ${r.patient_name}
                        </div>
                        <p style="margin:0; font-size: 0.9rem; color:var(--text-muted)">${r.notes || ''}</p>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        }
    } catch (e) {
        console.error("Error loading reports", e);
    }
}

/**
 * Handle Task Completion
 */
async function completeTask(checkbox, taskId) {
    if (!checkbox.checked) return;
    
    const card = checkbox.closest('.card');
    card.style.opacity = '0.5';
    
    try {
        const res = await apiFetch(`/volunteers/tasks/${taskId}/complete`, { method: 'PUT' });
        if (res.ok) {
            card.style.textDecoration = 'line-through';
            alert('Task marked as complete!');
            loadTasks(); // refresh progress
        } else {
            alert('Failed to update task.');
            checkbox.checked = false;
            card.style.opacity = '1';
        }
    } catch (e) {
        console.error(e);
        checkbox.checked = false;
        card.style.opacity = '1';
    }
}

/**
 * Handle Report Submission
 */
async function submitReport(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerText;

    const patientName = document.getElementById('reportPatientName').value;
    const activityType = document.getElementById('reportActivityType').value;
    const notes = document.getElementById('reportNotes').value;

    btn.innerText = 'Submitting...';
    btn.disabled = true;

    try {
        const res = await apiFetch('/volunteers/reports', {
            method: 'POST',
            body: JSON.stringify({
                patient_name: patientName,
                activity_type: activityType,
                notes: notes
            })
        });
        
        if (res.ok) {
            alert('Activity report submitted successfully!');
            form.reset();
            loadReports();
        } else {
            const data = await res.json();
            alert(`Error: ${data.detail || 'Failed to submit.'}`);
        }
    } catch (err) {
        console.error("Submit error", err);
        alert("Action failed.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}
