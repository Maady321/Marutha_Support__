/**
 * Marutha Support - Patient Details JS (Doctor)
 */

document.addEventListener('DOMContentLoaded', () => {
    initPatientDetails();
});

async function initPatientDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');

    if (patientId) {
        await fetchPatientData(patientId);
    }
}

/**
 * Fetch specific patient information
 */
async function fetchPatientData(id) {
    try {
        const response = await apiFetch(`/patients/${id}`);
        if (response.ok) {
            const patient = await response.json();
            renderPatientHeader(patient);
            // Optionally load logs/vitals for this patient too
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

function renderPatientHeader(p) {
    const nameEl = document.getElementById('patient-name');
    const idEl = document.getElementById('patient-id-display');
    const ageEl = document.getElementById('patient-age');
    const stageEl = document.getElementById('patient-stage-badge');
    const picEl = document.getElementById('patient-pic');

    if (nameEl) nameEl.textContent = p.name;
    if (idEl) idEl.textContent = `#${p.id}`;
    if (ageEl) ageEl.textContent = p.age;
    if (stageEl) stageEl.textContent = p.stage;
    if (picEl) {
        picEl.textContent = p.name.split(' ').map(n => n[0]).join('');
    }
}

/**
 * Handle Tab Switching in Patient Details
 */
function switchTab(btn, tabId) {
    document.querySelectorAll(".tab-content").forEach((el) => {
        el.style.display = "none";
        el.classList.remove("active");
    });

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.style.display = "block";
        targetTab.classList.add("active");
    }

    document.querySelectorAll(".tab-btn").forEach((b) => {
        b.style.background = "transparent";
        b.style.color = "var(--text-muted)";
        b.style.borderBottom = "3px solid transparent";
        b.classList.remove("active");
    });

    if (btn) {
        btn.style.background = "white";
        btn.style.color = "var(--medical-blue)";
        btn.style.borderBottom = "3px solid var(--medical-blue)";
        btn.classList.add("active");
    }
}

window.switchTab = switchTab;
