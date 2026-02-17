/**
 * Marutha Support - Activities JS (Volunteer)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching if not handled by app.js or manage_profile.js
    const hash = window.location.hash.replace('#', '');
    if (['tasks', 'reports'].includes(hash)) {
        switchTab(hash);
    }
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
 * Handle Task Completion
 */
function completeTask(checkbox) {
    const card = checkbox.closest('.card');
    if (checkbox.checked) {
        card.style.opacity = '0.5';
        card.style.textDecoration = 'line-through';
        
        setTimeout(() => {
            alert('Task marked as complete!');
            // In a real app: remove from UI or move to "Completed"
            card.style.opacity = '1';
            card.style.textDecoration = 'none';
            checkbox.checked = false;
        }, 600);
    }
}

/**
 * Handle Report Submission
 */
function submitReport(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerText;

    btn.innerText = 'Submitting...';
    btn.disabled = true;

    setTimeout(() => {
        alert('Activity report submitted successfully!');
        btn.innerText = originalText;
        btn.disabled = false;
        form.reset();
        
        // Optionally switch back to tasks or show success state
    }, 1200);
}
