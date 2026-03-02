/**
 * Marutha Support - Volunteer Dashboard JS
 */

document.addEventListener('DOMContentLoaded', () => {
    initVolunteerDashboard();
});

async function initVolunteerDashboard() {
    await loadUserProfile();
    initVolunteerStats();
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
 * Animate/Initialize stats
 */
function initVolunteerStats() {
    const stats = document.querySelectorAll('.stat-value');
    stats.forEach(stat => {
        const val = parseInt(stat.innerText);
        if (isNaN(val)) return;
        
        let start = 0;
        const duration = 1500;
        const stepTime = Math.abs(Math.floor(duration / val)) || 50;
        
        const timer = setInterval(() => {
            start++;
            stat.innerText = start;
            if (start >= val) {
                stat.innerText = val;
                clearInterval(timer);
            }
        }, stepTime);
    });
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
