/**
 * Marutha Support - Patient Dashboard JS
 */

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

async function initDashboard() {
    await loadUserProfile();
    initGreeting();
    initHealthTrendsAndStats();
    initAppointmentsAndStatus();
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
            // Try to find if patient profile exists
            try {
                const patientResponse = await apiFetch('/patients/me');
                if (patientResponse.ok) {
                    const patient = await patientResponse.json();
                    localStorage.setItem('patientData', JSON.stringify(patient));
                }
            } catch (pErr) {
                console.log("No patient profile yet or error fetching it");
            }
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

/**
 * Handle time-based greeting
 */
function initGreeting() {
    const greetingEl = document.getElementById('greeting');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greetingPrefix = "Good evening";
    if (hour < 12) greetingPrefix = "Good morning";
    else if (hour < 18) greetingPrefix = "Good afternoon";

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const patientData = JSON.parse(localStorage.getItem('patientData') || '{}');
    
    // Prioritize patient profile name, fallback to email local part
    const name = patientData.name || userData.email?.split('@')[0] || 'User';
    
    greetingEl.innerHTML = `<i class="fas fa-sun" style="color: #f59e0b; font-size: 1.8rem"></i> ${greetingPrefix}, ${name}`;
    
    const nameDisplay = document.getElementById('user-name-display');
    if (nameDisplay) nameDisplay.textContent = name;
}

/**
 * Health Trends & Stats
 * Fetches vitals and updates chart + comfort stat + milestone
 */
async function initHealthTrendsAndStats() {
    const container = document.querySelector('.chart-container');
    const comfortStat = document.getElementById('stat-comfort');
    const milestoneStat = document.getElementById('stat-milestone');
    
    if (!container) return;

    try {
        const response = await apiFetch('/vitals/my');
        if (response.ok) {
            const logs = await response.json();
            
            // 1. Update Chart
            const recentLogs = logs.slice(0, 7).reverse();
            container.innerHTML = '';
            recentLogs.forEach(log => {
                const height = log.pain_level * 10;
                const bar = document.createElement('div');
                bar.className = 'chart-bar';
                bar.style.height = `${height}%`;
                bar.title = `Pain: ${log.pain_level}\nMood: ${log.mood}\nDate: ${new Date(log.timestamp).toLocaleDateString()}`;
                
                // Highlight stable/happy moods
                if (['Happy', 'Peaceful'].includes(log.mood)) {
                    bar.style.background = 'var(--hope-green)';
                }
                container.appendChild(bar);
            });
            
            // Fill empty slots
            for (let i = recentLogs.length; i < 7; i++) {
                 const bar = document.createElement('div');
                 bar.className = 'chart-bar';
                 bar.style.height = '5%';
                 bar.style.opacity = '0.3';
                 container.appendChild(bar);
            }

            // 2. Update Comfort Stat (Latest Log)
            if (logs.length > 0) {
                const latest = logs[0]; // Assuming API returns sorted desc
                if (comfortStat) {
                    comfortStat.innerText = latest.mood || 'Stable';
                    // Color code
                    if (['Anxious', 'Sad', 'Pain'].includes(latest.mood)) {
                        comfortStat.style.color = 'var(--medical-blue)';
                    } else {
                        comfortStat.style.color = 'var(--hope-green)';
                    }
                }
                
                // 3. Update Milestone (Days since first log)
                // If logs are desc, last element is oldest
                const oldest = logs[logs.length - 1];
                const firstDate = new Date(oldest.timestamp);
                const now = new Date();
                const diffTime = Math.abs(now - firstDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (milestoneStat) milestoneStat.innerText = `${diffDays} Days`;
            } else {
                if (comfortStat) comfortStat.innerText = '--';
                if (milestoneStat) milestoneStat.innerText = 'Day 1';
            }

        }
    } catch (e) {
        console.error("Error fetching vitals", e);
        if (container) container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted)">Unable to load trends</div>';
    }
}

/**
 * Appointments & Next Visit Stat
 */
async function initAppointmentsAndStatus() {
    const container = document.getElementById('appointments-container');
    const visitStat = document.getElementById('stat-next-visit');
    const careStat = document.getElementById('stat-care-needs');

    if (!container) return;

    container.innerHTML = '<div style="text-align:center; padding: 1rem;">Loading...</div>';

    try {
        console.log("Fetching appointments...");
        const response = await apiFetch('/consultations/my');
        if (response.ok) {
            const appointments = await response.json();
            renderAppointments(appointments, container);
            
            // Update Stats
            if (visitStat) {
                // Find next accepted appointment
                const upcoming = appointments
                    .filter(a => a.status === 'accepted' && new Date(a.appointment_time) > new Date())
                    .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));
                
                if (upcoming.length > 0) {
                    const nextDate = new Date(upcoming[0].appointment_time);
                    // Format: Tomorrow, 2 PM or Date
                    const today = new Date();
                    const isTomorrow = nextDate.getDate() === today.getDate() + 1;
                    const dateStr = isTomorrow ? 'Tomorrow' : nextDate.toLocaleDateString(undefined, {month:'short', day:'numeric'});
                    visitStat.innerText = `${dateStr}, ${nextDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                } else {
                    visitStat.innerText = "No upcoming visits";
                    visitStat.style.fontSize = "1rem";
                }
            }

            if (careStat) {
                // Check if any pending
                const pending = appointments.filter(a => a.status === 'pending');
                if (pending.length > 0) {
                    careStat.innerText = `${pending.length} Pending Actions`;
                    careStat.style.color = '#d97706'; 
                } else {
                    careStat.innerText = "All Clear";
                    careStat.style.color = 'var(--hope-green)';
                }
            }

        } else {
            container.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--danger)">Failed to load appointments.</div>';
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        container.innerHTML = '<div style="text-align:center; padding: 2rem;">Error connecting to server.</div>';
    }
}

function renderAppointments(appointments, container) {
    if (appointments.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-muted)">No upcoming appointments. <br><a href="manage_health_patient.html#find-doctor" style="color: var(--medical-blue); font-weight:600; margin-top:8px; display:inline-block">Find a doctor</a></div>';
        return;
    }

    container.innerHTML = '';
    // Show max 3 on dashboard
    appointments.slice(0, 3).forEach(appt => {
        const initials = appt.doctor_name ? appt.doctor_name.split(' ').map(n=>n[0]).join('') : 'Dr';
        const dateObj = appt.appointment_time ? new Date(appt.appointment_time) : null;
        const dateStr = dateObj ? dateObj.toLocaleString() : 'Scheduling...';
        
        let statusColor = 'var(--text-muted)';
        let badgeClass = 'badge';
        if (appt.status === 'accepted') {
            statusColor = 'var(--hope-green)';
            badgeClass += ' badge-active';
        } else if (appt.status === 'pending') {
             statusColor = '#f59e0b';
             badgeClass = 'badge'; // default style
        }

        const card = document.createElement('div');
        card.style.cssText = "display: flex; gap: 24px; padding: 24px; background: var(--bg-warm); border: 1px solid var(--medical-blue-light); border-radius: var(--radius-lg); transition: var(--transition); margin-bottom: 16px;";
        
        card.innerHTML = `
            <div class="profile-pic" style="width: 56px; height: 56px; font-size: 1.2rem; flex-shrink: 0;">
                ${initials}
            </div>
            <div style="flex: 1">
                <h4 style="font-size: 1.1rem; margin-bottom: 4px; color: var(--medical-blue);">
                    ${appt.doctor_name || 'Dr. #' + appt.doctor_id}
                </h4>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 12px;">
                    General Consultation
                </p>
                <div style="display: flex; gap: 24px; font-size: 0.85rem; color: var(--text-muted);">
                    <span><i class="far fa-calendar-check" style="margin-right: 8px; color: ${statusColor}"></i> ${dateStr}</span>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 12px;">
                <span class="${badgeClass}" style="text-transform: capitalize">${appt.status}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Log Comfort Level (Modal)
 */
function logComfortLevel() {
    let modal = document.getElementById('comfort-log-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'comfort-log-modal';
        modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;";
        modal.innerHTML = `
            <div style="background: white; padding: 32px; border-radius: 16px; width: 90%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                <h3 style="margin-bottom: 16px; color: var(--medical-blue);">Log How You Feel</h3>
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Pain Level (1-10)</label>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom: 16px;">
                    <input type="range" id="log-pain" min="1" max="10" value="5" class="range-slider" style="flex:1" oninput="document.getElementById('modal-pain-val').innerText = this.value">
                    <span id="modal-pain-val" style="font-weight:bold; color:var(--medical-blue)">5</span>
                </div>
                
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Mood</label>
                <select id="log-mood" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px;">
                    <option value="Happy">Happy</option>
                    <option value="Peaceful">Peaceful</option>
                    <option value="Stable" selected>Stable</option>
                    <option value="Anxious">Anxious</option>
                    <option value="Sad">Sad</option>
                    <option value="Tired">Tired</option>
                    <option value="Pain">In Pain</option>
                </select>
                
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Notes (Optional)</label>
                <textarea id="log-notes" rows="3" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;"></textarea>
                
                <div style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button onclick="closeComfortModal()" class="btn btn-outline-lavender" style="padding: 10px 20px;">Cancel</button>
                    <button onclick="submitComfortLog()" class="btn btn-primary" style="padding: 10px 20px;">Save Log</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
}

function closeComfortModal() {
    const modal = document.getElementById('comfort-log-modal');
    if (modal) modal.style.display = 'none';
}

async function submitComfortLog() {
    const pain = document.getElementById('log-pain').value;
    const mood = document.getElementById('log-mood').value;
    const notes = document.getElementById('log-notes').value;
    
    try {
        const response = await apiFetch('/vitals/', {
            method: 'POST',
            body: JSON.stringify({
                pain_level: parseInt(pain),
                mood: mood,
                notes: notes
            })
        });

        if (response.ok) {
            alert("Log saved successfully!");
            closeComfortModal();
            initHealthTrendsAndStats(); // Refresh charts & stats
        } else {
            alert("Failed to save log.");
        }
    } catch (error) {
        console.error("Error logging vitals:", error);
        alert("Error connecting to server.");
    }
}

// Global scope
window.logComfortLevel = logComfortLevel;
window.closeComfortModal = closeComfortModal;
window.submitComfortLog = submitComfortLog;
