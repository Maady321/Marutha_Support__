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
        await fetchHealthLogs(patientId);
    }
}


// ---- Fetch Patient Health Logs ----
async function fetchHealthLogs(id) {
    try {
        var response = await apiFetch('/vitals/patient/' + id);
        if (response.ok) {
            var logs = await response.json();
            renderHealthLogs(logs);
        }
    } catch (error) {
        console.error('Error fetching patient health logs:', error);
    }
}


function renderHealthLogs(logs) {
    var tbody = document.getElementById('logs-history-body');
    if (!tbody) return;

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">No logs available</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    for (var i = 0; i < logs.length; i++) {
        var log = logs[i];
        var date = new Date(log.timestamp).toLocaleString();
        var bp = log.bp || '-';
        var hr = log.heart_rate ? log.heart_rate + ' bpm' : '-';
        var sleep = log.sleep_hours ? log.sleep_hours + ' hrs' : '-';

        var row = document.createElement('tr');
        row.innerHTML = 
            '<td>' + date + '</td>' +
            '<td><span class="badge" style="background:var(--lavender-soft); color:var(--medical-blue)">' + log.mood + '</span></td>' +
            '<td>' + log.pain_level + '/10</td>' +
            '<td>BP: ' + bp + '<br>HR: ' + hr + '<br>Sleep: ' + sleep + '</td>' +
            '<td>' + (log.notes || '-') + '</td>';
        tbody.appendChild(row);
        
        // Update stats if this is the newest
        if (i === 0) {
            var statPain = document.getElementById('stat-pain');
            if (statPain) statPain.innerHTML = log.pain_level + '<span style="font-size:1.2rem; color:var(--text-muted)">/10</span>';
        }
    }
    
    // Render sleep chart
    renderSleepChart(logs);
}


function renderSleepChart(logs) {
    var canvas = document.getElementById('sleepChart');
    if (!canvas || typeof Chart === 'undefined') return;

    var sleepLogs = [];
    for(var i=0; i<logs.length; i++){
        if(logs[i].sleep_hours != null){
            sleepLogs.push(logs[i]);
            if(sleepLogs.length === 7) break;
        }
    }
    sleepLogs = sleepLogs.reverse();

    var labels = [];
    var sleepData = [];

    for (var i = 0; i < sleepLogs.length; i++) {
        var date = new Date(sleepLogs[i].timestamp);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        sleepData.push(sleepLogs[i].sleep_hours);
    }

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sleep (hrs)',
                data: sleepData,
                backgroundColor: '#8b5cf6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 16
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
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
