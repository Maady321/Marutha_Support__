// manage_records.js - Doctor Records Management
// Handles consultations, notes, and prescriptions for doctors

document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initSearch();
    loadDashboardData();
});

var availablePatients = [];


// ---- Tab Switching ----
function initTabs() {
    var hash = window.location.hash.replace("#", "");
    var validTabs = ["consultations", "records", "prescriptions", "reports"];
    if (validTabs.indexOf(hash) >= 0) {
        switchRecordsTab(hash);
    }
}

function switchRecordsTab(tabId) {
    var allTabs = document.querySelectorAll(".tab-content");
    for (var i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.remove("active");
    }

    var allBtns = document.querySelectorAll(".tab-btn");
    for (var j = 0; j < allBtns.length; j++) {
        allBtns[j].classList.remove("active");
    }

    var allLinks = document.querySelectorAll(".sidebar-link");
    for (var k = 0; k < allLinks.length; k++) {
        allLinks[k].classList.remove("active");
    }

    var targetContent = document.getElementById("content-" + tabId);
    if (targetContent) targetContent.classList.add("active");

    var tabBtn = document.getElementById("tab-" + tabId);
    if (tabBtn) tabBtn.classList.add("active");

    var navBtn = document.getElementById("nav-" + tabId);
    if (navBtn) navBtn.classList.add("active");
}


// ---- Search Filtering ----
function initSearch() {
    var searchInputs = document.querySelectorAll('.item-search input');

    for (var i = 0; i < searchInputs.length; i++) {
        searchInputs[i].addEventListener('input', function(e) {
            var query = e.target.value.toLowerCase();
            var container = e.target.closest('.tab-content');

            // Filter tables
            var table = container.querySelector('table');
            if (table) {
                var rows = table.querySelectorAll('tbody tr');
                for (var j = 0; j < rows.length; j++) {
                    var text = rows[j].innerText.toLowerCase();
                    if (text.indexOf(query) >= 0) {
                        rows[j].style.display = '';
                    } else {
                        rows[j].style.display = 'none';
                    }
                }
            }

            // Filter notes grid
            var notesGrid = container.querySelector('#notes-container');
            if (notesGrid) {
                var cards = notesGrid.querySelectorAll('div[data-note]');
                for (var k = 0; k < cards.length; k++) {
                    var cardText = cards[k].innerText.toLowerCase();
                    if (cardText.indexOf(query) >= 0) {
                        cards[k].style.display = '';
                    } else {
                        cards[k].style.display = 'none';
                    }
                }
            }
        });
    }
}


// ---- Load All Data ----
async function loadDashboardData() {
    await fetchPatients();
    await fetchConsultations();
    await fetchNotes();
    await fetchPrescriptions();
}


async function fetchPatients() {
    try {
        var res = await apiFetch('/patients/');
        if (res.ok) {
            availablePatients = await res.json();
            populatePatientSelects();
        }
    } catch (e) {
        console.error("Error fetching patients", e);
    }
}


function populatePatientSelects() {
    var selectIds = ['notePatientSelect', 'scriptPatientSelect'];

    for (var i = 0; i < selectIds.length; i++) {
        var el = document.getElementById(selectIds[i]);
        if (el) {
            el.innerHTML = '<option value="">Select a patient...</option>';
            for (var j = 0; j < availablePatients.length; j++) {
                var p = availablePatients[j];
                var opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name + ' (ID: ' + p.id + ')';
                el.appendChild(opt);
            }
        }
    }
}


async function fetchConsultations() {
    try {
        var res = await apiFetch('/doctors/appointments');
        if (res.ok) {
            var consultations = await res.json();
            var tbody = document.querySelector('#content-consultations tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (consultations.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No patients found waiting for consultation.</td></tr>';
                return;
            }

            for (var i = 0; i < consultations.length; i++) {
                var c = consultations[i];
                var row = document.createElement('tr');
                var dateStr = new Date(c.created_at).toLocaleDateString();
                var reason = c.notes || 'Routine Checkup';
                var patientName = c.patient_name || ('Patient #' + c.patient_id);

                row.innerHTML =
                    '<td style="color: var(--text-muted)">' + dateStr + '</td>' +
                    '<td style="font-weight: 600; color: var(--medical-blue)">' + patientName + '</td>' +
                    '<td>' + reason + '</td>' +
                    '<td><span class="badge" style="background: #ecfdf5; color: #047857;">SCHEDULED</span></td>' +
                    '<td>' +
                        '<button class="btn btn-sm btn-outline-lavender" onclick="openViewActionModal(' + c.patient_id + ', \'' + (c.patient_name || 'Patient').replace(/'/g, "\\'") + '\')">Action</button> ' +
                        '<button class="btn btn-sm btn-outline-medical" onclick="window.location.href=\'chat_doctor.html?userId=' + c.patient_user_id + '\'">' +
                            '<i class="fas fa-comment"></i> Chat</button>' +
                    '</td>';
                tbody.appendChild(row);
            }
        }
    } catch (e) {
        console.error("Error fetching consultations", e);
    }
}


async function fetchNotes() {
    try {
        var res = await apiFetch('/notes/my');
        if (res.ok) {
            var notes = await res.json();
            var container = document.getElementById('notes-container');
            if (!container) return;
            container.innerHTML = '';

            if (notes.length === 0) {
                container.innerHTML = '<div style="color:var(--text-muted); padding:10px;">No clinical notes found.</div>';
                return;
            }

            for (var i = 0; i < notes.length; i++) {
                var n = notes[i];
                var card = document.createElement('div');
                card.setAttribute('data-note', 'true');
                card.style.cssText = "padding: 24px; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);";

                var dateText = new Date(n.created_at).toLocaleString();
                var patientText = n.patient_name || ('ID: ' + n.patient_id);

                card.innerHTML =
                    '<div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 8px;">' +
                        '<i class="far fa-clock"></i> ' + dateText +
                    '</div>' +
                    '<div style="font-weight: 600; color: var(--medical-blue); margin-bottom: 12px;">' +
                        'Patient: ' + patientText +
                    '</div>' +
                    '<p style="color: var(--text-main); font-size: 0.95rem; line-height: 1.5; white-space: pre-wrap;">' + n.note_content + '</p>';

                container.appendChild(card);
            }
        }
    } catch (e) {
        console.error("Error fetching notes", e);
    }
}


async function fetchPrescriptions() {
    try {
        var res = await apiFetch('/prescriptions/my');
        if (res.ok) {
            var scripts = await res.json();
            var tbody = document.querySelector('#content-prescriptions tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (scripts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No prescriptions found.</td></tr>';
                return;
            }

            for (var i = 0; i < scripts.length; i++) {
                var s = scripts[i];
                var row = document.createElement('tr');
                var dateStr = new Date(s.created_at).toLocaleDateString();
                var patientName = s.patient_name || ('Patient #' + s.patient_id);

                row.innerHTML =
                    '<td style="color: var(--text-muted)">' + dateStr + '</td>' +
                    '<td style="font-weight: 600; color: var(--medical-blue)">' + patientName + '</td>' +
                    '<td>' + s.medication + '</td>' +
                    '<td>' + s.dosage + '</td>' +
                    '<td><button class="btn btn-sm btn-outline-lavender" onclick="printPrescription(\'' + patientName.replace(/'/g, "\\'") + '\', \'' + s.medication.replace(/'/g, "\\'") + '\', \'' + s.dosage.replace(/'/g, "\\'") + '\', \'' + (s.instructions || '').replace(/'/g, "\\'") + '\', \'' + dateStr + '\')"><i class="fas fa-print"></i></button></td>';

                tbody.appendChild(row);
            }
        }
    } catch (e) {
        console.error("Error fetching prescriptions", e);
    }
}


// ---- Modal Logic ----
function openNoteModal() {
    document.getElementById('noteContent').value = '';
    document.getElementById('notePatientSelect').value = '';
    document.getElementById('noteModal').style.display = 'flex';
}

function openScriptModal() {
    document.getElementById('scriptMedication').value = '';
    document.getElementById('scriptDosage').value = '';
    document.getElementById('scriptInstructions').value = '';
    document.getElementById('scriptPatientSelect').value = '';
    document.getElementById('scriptModal').style.display = 'flex';
}

function closeModals() {
    document.getElementById('noteModal').style.display = 'none';
    document.getElementById('scriptModal').style.display = 'none';
    document.getElementById('viewActionModal').style.display = 'none';
}


async function saveNote() {
    var pId = document.getElementById('notePatientSelect').value;
    var content = document.getElementById('noteContent').value;

    if (!pId || !content.trim()) {
        alert("Please select a patient and enter note content.");
        return;
    }

    try {
        var res = await apiFetch('/notes/', {
            method: 'POST',
            body: JSON.stringify({ patient_id: parseInt(pId), note_content: content })
        });
        if (res.ok) {
            alert("Note saved!");
            closeModals();
            await fetchNotes();
        } else {
            alert("Failed to save note.");
        }
    } catch (e) {
        alert("Network error.");
    }
}


async function saveScript() {
    var pId = document.getElementById('scriptPatientSelect').value;
    var med = document.getElementById('scriptMedication').value;
    var dose = document.getElementById('scriptDosage').value;
    var ins = document.getElementById('scriptInstructions').value;

    if (!pId || !med.trim() || !dose.trim()) {
        alert("Please fill required fields (Patient, Medication, Dosage).");
        return;
    }

    try {
        var res = await apiFetch('/prescriptions/', {
            method: 'POST',
            body: JSON.stringify({ patient_id: parseInt(pId), medication: med, dosage: dose, instructions: ins })
        });
        if (res.ok) {
            alert("Prescription saved!");
            closeModals();
            await fetchPrescriptions();
        } else {
            alert("Failed to save script.");
        }
    } catch (e) {
        alert("Network error.");
    }
}


async function openViewActionModal(patientId, patientName) {
    document.getElementById('viewPatientName').textContent = patientName;
    document.getElementById('viewActionModal').style.display = 'flex';

    // Load patient-specific notes and prescriptions
    var notesContainer = document.getElementById('viewActionNotes');
    var scriptsContainer = document.getElementById('viewActionPrescriptions');
    notesContainer.innerHTML = 'Loading...';
    scriptsContainer.innerHTML = 'Loading...';

    try {
        var notesRes = await apiFetch('/notes/patient/' + patientId);
        var scriptsRes = await apiFetch('/prescriptions/patient/' + patientId);

        if (notesRes.ok) {
            var notes = await notesRes.json();
            if (notes.length === 0) {
                notesContainer.innerHTML = '<div style="color:var(--text-muted)">No notes found.</div>';
            } else {
                notesContainer.innerHTML = '';
                for (var i = 0; i < notes.length; i++) {
                    var n = notes[i];
                    notesContainer.innerHTML = notesContainer.innerHTML +
                        '<div style="background:var(--bg-warm); padding:16px; border-radius:8px; border:1px solid var(--border-color);">' +
                            '<div style="font-size:0.8rem; color:var(--text-light); margin-bottom:8px;">' + new Date(n.created_at).toLocaleString() + '</div>' +
                            '<p style="margin:0; font-size:0.95rem; white-space:pre-wrap; line-height:1.5;">' + n.note_content + '</p>' +
                        '</div>';
                }
            }
        }

        if (scriptsRes.ok) {
            var scripts = await scriptsRes.json();
            if (scripts.length === 0) {
                scriptsContainer.innerHTML = '<div style="color:var(--text-muted)">No prescriptions found.</div>';
            } else {
                scriptsContainer.innerHTML = '';
                for (var j = 0; j < scripts.length; j++) {
                    var s = scripts[j];
                    scriptsContainer.innerHTML = scriptsContainer.innerHTML +
                        '<div style="background:var(--bg-warm); padding:16px; border-radius:8px; border:1px solid var(--border-color);">' +
                            '<div style="font-size:0.8rem; color:var(--text-light); margin-bottom:8px;">' + new Date(s.created_at).toLocaleString() + '</div>' +
                            '<div style="font-weight:600; color:var(--medical-blue);">' + s.medication + '</div>' +
                            '<div style="font-size:0.9rem; color:var(--text-main); margin-bottom:4px;">Dosage: ' + s.dosage + '</div>' +
                            '<div style="font-size:0.85rem; color:var(--text-muted); font-style:italic;">"' + (s.instructions || 'No special instructions') + '"</div>' +
                        '</div>';
                }
            }
        }
    } catch (e) {
        console.error(e);
        notesContainer.innerHTML = "Failed to load.";
        scriptsContainer.innerHTML = "Failed to load.";
    }
}


// ---- Print Prescription ----
function printPrescription(patientName, medication, dosage, instructions, dateStr) {
    var rxWindow = window.open('', '_blank', 'width=800,height=600');
    if (!rxWindow) {
        alert("Please allow popups to print prescriptions.");
        return;
    }

    var html = '<!DOCTYPE html><html><head>' +
        '<title>Prescription - ' + patientName + '</title>' +
        '<style>' +
            'body { font-family: Arial, sans-serif; padding: 40px; color: #333; }' +
            '.header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }' +
            '.brand { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }' +
            '.sub { font-size: 14px; color: #666; }' +
            '.rx-symbol { font-size: 48px; font-weight: bold; margin-bottom: 20px; }' +
            '.row { display: flex; justify-content: space-between; margin-bottom: 15px; }' +
            '.label { font-weight: bold; width: 120px; display: inline-block; }' +
            '.box { border: 1px solid #ccc; padding: 15px; margin-top: 20px; min-height: 100px; border-radius: 5px; }' +
            '.footer { margin-top: 50px; text-align: right; }' +
            '.signature-line { border-top: 1px solid #000; width: 200px; display: inline-block; padding-top: 5px; }' +
        '</style>' +
        '</head><body>' +
        '<div class="header"><div class="brand">Marutha Support Healthcare</div><div class="sub">Official Medical Prescription</div></div>' +
        '<div class="row"><div><span class="label">Patient Name:</span> ' + patientName + '</div><div><span class="label">Date:</span> ' + dateStr + '</div></div>' +
        '<div class="rx-symbol">℞</div>' +
        '<div style="margin-bottom: 15px;"><span class="label">Medication:</span> <span style="font-size: 1.1em; font-weight: bold;">' + medication + '</span></div>' +
        '<div style="margin-bottom: 15px;"><span class="label">Dosage:</span> ' + dosage + '</div>' +
        '<div class="box"><span class="label" style="display:block; margin-bottom:10px;">Instructions:</span>' + (instructions || 'Use as directed.') + '</div>' +
        '<div class="footer"><br><br><br><div class="signature-line">Doctor\'s Signature</div></div>' +
        '<script>window.onload = function() { window.print(); }<\/script>' +
        '</body></html>';

    rxWindow.document.open();
    rxWindow.document.write(html);
    rxWindow.document.close();
}


// Make functions available globally
window.switchTab = switchRecordsTab;
window.openNoteModal = openNoteModal;
window.openScriptModal = openScriptModal;
window.closeModals = closeModals;
window.saveNote = saveNote;
window.saveScript = saveScript;
window.openViewActionModal = openViewActionModal;
window.printPrescription = printPrescription;
