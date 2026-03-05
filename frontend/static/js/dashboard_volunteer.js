/**
 * Marutha Support - Volunteer Dashboard JS
 */

document.addEventListener('DOMContentLoaded', () => {
    initVolunteerDashboard();
});

async function initVolunteerDashboard() {
    await loadUserProfile();
    await initWorkTimer();
    await loadVolunteerDashboardData();
    initTaskActions();
}

/**
 * Load user profile from API
 */
async function loadUserProfile() {
    try {
        const response = await apiFetch('/users/me');
        if (response.ok) {
            const user = await response.json();
            localStorage.setItem('userData', JSON.stringify(user));
            
            // Update UI
            const nameDisplay = document.getElementById('user-name-display');
            if (nameDisplay) nameDisplay.textContent = user.email.split('@')[0];
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

/**
 * Load and display real volunteer stats
 */
async function loadVolunteerDashboardData() {
    try {
        // Fetch real data simultaneously
        const [patientsRes, tasksRes, hoursRes] = await Promise.all([
            apiFetch('/volunteers/my-patients/full'),
            apiFetch('/volunteers/tasks'),
            apiFetch('/volunteers/time-logs/total')
        ]);

        if (patientsRes.ok) {
            const patients = await patientsRes.json();
            document.getElementById('stat-patients').textContent = patients.length;
        }

        if (tasksRes.ok) {
            const tasks = await tasksRes.json();
            const completed = tasks.filter(t => t.is_completed).length;
            const pending = tasks.length - completed;
            
            document.getElementById('stat-tasks-completed').textContent = completed;
            document.getElementById('stat-tasks-pending').textContent = pending;
            
            // Populate "Today's Schedule" widget with pending tasks
            renderPendingTasksWidget(tasks.filter(t => !t.is_completed));
        }

        if (hoursRes.ok) {
            const totalHours = await hoursRes.json();
            const totalSec = Math.floor(totalHours * 3600);
            const hours = Math.floor(totalSec / 3600);
            const mins = Math.floor((totalSec % 3600) / 60);
            const secs = totalSec % 60;
            
            document.getElementById('stat-hours').innerHTML = 
                `<span style="font-size: 1.8rem">${hours}</span><small style="font-size: 1rem; opacity: 0.8">h</small> ` +
                `<span style="font-size: 1.8rem">${mins}</span><small style="font-size: 1rem; opacity: 0.8">m</small> ` +
                `<span style="font-size: 1.8rem">${secs}</span><small style="font-size: 1rem; opacity: 0.8">s</small>`;
        }

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function renderPendingTasksWidget(pendingTasks) {
    const container = document.getElementById('todays-schedule-container');
    if (!container) return;

    if (pendingTasks.length === 0) {
        container.innerHTML = `
            <div class="dash-empty">
                <i class="fas fa-calendar-check"></i>
                <p>No remaining tasks today.</p>
                <a href="volunteer_activities.html#tasks">View task history</a>
            </div>`;
        return;
    }

    // Limit to 3 tasks for the dashboard view
    const tasksHtml = pendingTasks.slice(0, 3).map(task => `
        <div style="background:var(--bg-white); border:1px solid var(--border-color); padding:16px; border-radius:12px; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:40px;height:40px;border-radius:10px;background:var(--lavender-soft);color:var(--medical-blue);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">
                    <i class="fas fa-tasks"></i>
                </div>
                <div>
                    <div style="font-weight:600; color:var(--text-main); font-size:0.95rem;">${task.task_name}</div>
                    <div style="font-size:0.8rem; color:var(--text-light); margin-top:2px;">Patient: ${task.patient_name || 'General'}</div>
                </div>
            </div>
            <a href="volunteer_activities.html#tasks" class="btn btn-sm btn-outline-lavender">View</a>
        </div>
    `).join('');

    container.innerHTML = tasksHtml;
}

/**
 * Handle Task Actions
 */
function initTaskActions() {
    const actionBtns = document.querySelectorAll('.btn-sm');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (!card) return;
            const taskHeader = card.querySelector('div[style*="font-weight: 600"]');
            if (!taskHeader) return;
            
            const taskName = taskHeader.innerText;
            if (btn.innerText.includes('View')) {
                console.log(`Viewing details for: ${taskName}`);
            } else if (btn.innerText.includes('Chat')) {
                window.location.href = 'chat_volunteer.html';
            }
        });
    });
}

function openActivityLogger() {
    window.location.href = 'volunteer_activities.html#reports';
}

// ---- Work Timer Logic ----

let workTimerRunning = false;
let workTimerInterval = null;
let shiftStartTime = null;

async function initWorkTimer() {
    try {
        const res = await apiFetch('/volunteers/time-logs/active');
        if (res.ok) {
            const activeLog = await res.json();
            if (activeLog && activeLog.id) {
                workTimerRunning = true;
                
                // Ensure browser reads it as UTC if backend omits the timezone specifier
                let startTimeStr = activeLog.start_time;
                if (!startTimeStr.endsWith('Z') && !startTimeStr.includes('+')) {
                    startTimeStr += 'Z';
                }
                shiftStartTime = new Date(startTimeStr);
                
                updateTimerUI(true);
            }
        }
    } catch (e) {
        console.error("Failed to check active timer", e);
    }
}

async function toggleWorkTimer() {
    const btn = document.getElementById('workTimerBtn');
    if (!btn) return;
    btn.disabled = true;

    try {
        if (!workTimerRunning) {
            const res = await apiFetch('/volunteers/time-logs/start', { method: 'POST' });
            if (res.ok) {
                const newLog = await res.json();
                workTimerRunning = true;
                
                let startTimeStr = newLog.start_time;
                if (!startTimeStr.endsWith('Z') && !startTimeStr.includes('+')) {
                    startTimeStr += 'Z';
                }
                shiftStartTime = new Date(startTimeStr);
                
                updateTimerUI(true);
                if (window.showNotification) showNotification('Shift started!', 'success');
                loadVolunteerDashboardData(); // live update
            }
        } else {
            const res = await apiFetch('/volunteers/time-logs/stop', { method: 'POST' });
            if (res.ok) {
                workTimerRunning = false;
                shiftStartTime = null;
                updateTimerUI(false);
                if (window.showNotification) showNotification('Shift ended!', 'info');
                loadVolunteerDashboardData(); // refresh total hours
            }
        }
    } catch (e) {
        console.error("Timer toggle error", e);
    } finally {
        btn.disabled = false;
    }
}

function updateTimerUI(isRunning) {
    const btn = document.getElementById('workTimerBtn');
    if (!btn) return;
    
    // Clear any existing interval to prevent duplicates
    if (workTimerInterval) {
        clearInterval(workTimerInterval);
        workTimerInterval = null;
    }
    
    if (isRunning) {
        btn.classList.remove('btn-outline-lavender');
        btn.style.color = 'white';
        btn.style.background = '#e11d48'; // Red for stop
        btn.style.borderColor = '#e11d48';
        
        // Start the live ticker
        const tick = () => {
            if (!shiftStartTime) return;
            const diffMs = new Date() - shiftStartTime;
            if (diffMs < 0) return; // DB time sync edge cases
            
            const totalSec = Math.floor(diffMs / 1000);
            const hours = Math.floor(totalSec / 3600);
            const mins = Math.floor((totalSec % 3600) / 60);
            const secs = totalSec % 60;
            
            // Format HH:MM:SS or MM:SS
            const formattedTime = 
                (hours > 0 ? hours + ':' : '') + 
                mins.toString().padStart(2, '0') + ':' + 
                secs.toString().padStart(2, '0');
                
            btn.innerHTML = `<i class="fas fa-stop"></i> Stop Shift (${formattedTime})`;
        };
        
        tick(); // Run immediately so there's no 1-second delay
        workTimerInterval = setInterval(tick, 1000);
        
    } else {
        btn.innerHTML = '<i class="fas fa-play"></i> Start Shift';
        btn.classList.add('btn-outline-lavender');
        btn.style.color = '';
        btn.style.background = '';
        btn.style.borderColor = '';
    }
}
window.toggleWorkTimer = toggleWorkTimer;
