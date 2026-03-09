// patient_details.js - Patient Details Page (Doctor View)
// Shows individual patient information and tabs

document.addEventListener('DOMContentLoaded', function() {
    initPatientDetails();
});


async function initPatientDetails() {
    var urlParams = new URLSearchParams(window.location.search);
    var patientId = urlParams.get('id');

    if (patientId) {
        await fetchPatientData(patientId);
    }
}


// ---- Fetch Patient Info ----
async function fetchPatientData(id) {
    try {
        var response = await apiFetch('/patients/' + id);
        if (response.ok) {
            var patient = await response.json();
            renderPatientHeader(patient);
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}


function renderPatientHeader(p) {
    var nameEl = document.getElementById('patient-name');
    var idEl = document.getElementById('patient-id-display');
    var ageEl = document.getElementById('patient-age');
    var stageEl = document.getElementById('patient-stage-badge');
    var picEl = document.getElementById('patient-pic');

    if (nameEl) nameEl.textContent = p.name;
    if (idEl) idEl.textContent = '#' + p.id;
    if (ageEl) ageEl.textContent = p.age;
    if (stageEl) stageEl.textContent = p.stage;

    if (picEl) {
        var parts = p.name.split(' ');
        var initials = '';
        for (var i = 0; i < parts.length; i++) {
            initials = initials + parts[i][0];
        }
        picEl.textContent = initials;
    }
}


// ---- Tab Switching ----
function switchTab(btn, tabId) {
    // Hide all tabs
    var allTabs = document.querySelectorAll(".tab-content");
    for (var i = 0; i < allTabs.length; i++) {
        allTabs[i].style.display = "none";
        allTabs[i].classList.remove("active");
    }

    // Show selected tab
    var targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.style.display = "block";
        targetTab.classList.add("active");
    }

    // Update button styles
    var allBtns = document.querySelectorAll(".tab-btn");
    for (var j = 0; j < allBtns.length; j++) {
        allBtns[j].style.background = "transparent";
        allBtns[j].style.color = "var(--text-muted)";
        allBtns[j].style.borderBottom = "3px solid transparent";
        allBtns[j].classList.remove("active");
    }

    if (btn) {
        btn.style.background = "white";
        btn.style.color = "var(--medical-blue)";
        btn.style.borderBottom = "3px solid var(--medical-blue)";
        btn.classList.add("active");
    }
}

window.switchTab = switchTab;
