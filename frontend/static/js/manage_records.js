/**
 * Marutha Support - Doctor Records Management JS
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSearch();
});

/**
 * Handle Tab Switching
 */
function initTabs() {
    const hash = window.location.hash.replace("#", "");
    const validTabs = ["consultations", "records", "prescriptions", "reports"];
    if (validTabs.includes(hash)) {
        switchRecordsTab(hash);
    }
}

function switchRecordsTab(tabId) {
    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"));
    
    // Remove active class from buttons
    document.querySelectorAll(".tab-btn").forEach((el) => el.classList.remove("active"));
    document.querySelectorAll(".sidebar-link").forEach((el) => el.classList.remove("active"));

    // Activate selected content
    const targetContent = document.getElementById("content-" + tabId);
    if (targetContent) targetContent.classList.add("active");

    // Activate tab button
    const tabBtn = document.getElementById("tab-" + tabId);
    if (tabBtn) tabBtn.classList.add("active");

    // Activate Sidebar
    const navBtn = document.getElementById("nav-" + tabId);
    if (navBtn) navBtn.classList.add("active");
}

/**
 * Handle Search Filtering
 */
function initSearch() {
    const searchInputs = document.querySelectorAll('.item-search input');
    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const table = e.target.closest('.tab-content').querySelector('table');
            if (!table) return;

            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    });
}

// Global shims for legacy inline handlers
window.switchTab = switchRecordsTab;
