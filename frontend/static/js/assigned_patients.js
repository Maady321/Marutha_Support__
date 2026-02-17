/**
 * Marutha Support - Assigned Patients JS (Volunteer)
 */

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
});

/**
 * Handle Patient Search
 */
function initSearch() {
    const searchInput = document.querySelector('input[placeholder*="Search by name"]');
    const cards = document.querySelectorAll(".patient-card");

    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        cards.forEach((card) => {
            const name = card.querySelector("h3").innerText.toLowerCase();
            const id = card.querySelector('div[style*="font-size: 0.85rem"]').innerText.toLowerCase();
            
            if (name.includes(term) || id.includes(term)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });
}
