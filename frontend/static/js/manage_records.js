/**
 * Marutha Support - Doctor Records Management JS
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSearch();
    loadDashboardData();
});

let availablePatients = [];

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
    document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach((el) => el.classList.remove("active"));
    document.querySelectorAll(".sidebar-link").forEach((el) => el.classList.remove("active"));

    const targetContent = document.getElementById("content-" + tabId);
    if (targetContent) targetContent.classList.add("active");

    const tabBtn = document.getElementById("tab-" + tabId);
    if (tabBtn) tabBtn.classList.add("active");

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
            const container = e.target.closest('.tab-content');
            
            // Filter tables
            const table = container.querySelector('table');
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.innerText.toLowerCase();
                    row.style.display = text.includes(query) ? '' : 'none';
                });
            }
            // Filter notes grid
            const notesGrid = container.querySelector('#notes-container');
            if (notesGrid) {
                const cards = notesGrid.querySelectorAll('div[data-note]');
                cards.forEach(card => {
                    const text = card.innerText.toLowerCase();
                    card.style.display = text.includes(query) ? '' : 'none';
                });
            }
        });
    });
}

/**
 * API Data Loading
 */
async function loadDashboardData() {
    await fetchPatients();
    await fetchConsultations();
    await fetchNotes();
    await fetchPrescriptions();
}

async function fetchPatients() {
    try {
        const res = await apiFetch('/patients/');
        if (res.ok) {
            availablePatients = await res.json();
            populatePatientSelects();
        }
    } catch (e) { console.error("Error fetching patients", e); }
}

function populatePatientSelects() {
    const selects = ['notePatientSelect', 'scriptPatientSelect'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '<option value="">Select a patient...</option>';
            availablePatients.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.name} (ID: ${p.id})`;
                el.appendChild(opt);
            });
        }
    });
}

async function fetchConsultations() {
    try {
        // Fetch accepted appointments (patients waiting for consultation)
        const res = await apiFetch('/doctors/appointments');
        if (res.ok) {
            const consultations = await res.json();
            const tbody = document.querySelector('#content-consultations tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            
            if (consultations.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No patients found waiting for consultation.</td></tr>';
                return;
            }

            consultations.forEach(c => {
                const row = document.createElement('tr');
                const dateStr = new Date(c.created_at).toLocaleDateString();
                const reason = c.notes || 'Routine Checkup';
                let style = 'background: #ecfdf5; color: #047857;';
                
                row.innerHTML = `
                    <td style="color: var(--text-muted)">${dateStr}</td>
                    <td style="font-weight: 600; color: var(--medical-blue)">${c.patient_name || 'Patient #' + c.patient_id}</td>
                    <td>${reason}</td>
                    <td><span class="badge" style="${style}">SCHEDULED</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-lavender" onclick="openViewActionModal(${c.patient_id}, '${c.patient_name || 'Patient'}')">Action</button>
                        <button class="btn btn-sm btn-outline-medical" onclick="window.location.href='chat_doctor.html?userId=${c.patient_user_id}'">
                            <i class="fas fa-comment"></i> Chat
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (e) { console.error("Error fetching consultations", e); }
}

async function fetchNotes() {
    try {
        const res = await apiFetch('/notes/my');
        if (res.ok) {
            const notes = await res.json();
            const container = document.getElementById('notes-container');
            if (!container) return;
            container.innerHTML = '';
            
            if (notes.length === 0) {
                container.innerHTML = '<div style="color:var(--text-muted); padding:10px;">No clinical notes found.</div>';
                return;
            }

            notes.forEach(n => {
                const card = document.createElement('div');
                card.setAttribute('data-note', 'true');
                card.style.cssText = "padding: 24px; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);";
                card.innerHTML = `
                    <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 8px;">
                        <i class="far fa-clock"></i> ${new Date(n.created_at).toLocaleString()}
                    </div>
                    <div style="font-weight: 600; color: var(--medical-blue); margin-bottom: 12px;">
                        Patient: ${n.patient_name || 'ID: ' + n.patient_id}
                    </div>
                    <p style="color: var(--text-main); font-size: 0.95rem; line-height: 1.5; white-space: pre-wrap;">${n.note_content}</p>
                `;
                container.appendChild(card);
            });
        }
    } catch (e) { console.error("Error fetching notes", e); }
}

async function fetchPrescriptions() {
    try {
        const res = await apiFetch('/prescriptions/my');
        if (res.ok) {
            const scripts = await res.json();
            const tbody = document.querySelector('#content-prescriptions tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (scripts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No prescriptions found.</td></tr>';
                return;
            }

            scripts.forEach(s => {
                const row = document.createElement('tr');
                const dateStr = new Date(s.created_at).toLocaleDateString();
                row.innerHTML = `
                    <td style="color: var(--text-muted)">${dateStr}</td>
                    <td style="font-weight: 600; color: var(--medical-blue)">${s.patient_name || 'Patient #' + s.patient_id}</td>
                    <td>${s.medication}</td>
                    <td>${s.dosage}</td>
                    <td><button class="btn btn-sm btn-outline-lavender" onclick="printPrescription('${(s.patient_name || 'Patient').replace(/'/g, "\\'")}', '${s.medication.replace(/'/g, "\\'")}', '${s.dosage.replace(/'/g, "\\'")}', '${(s.instructions || '').replace(/'/g, "\\'")}', '${dateStr}')"><i class="fas fa-print"></i></button></td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (e) { console.error("Error fetching prescriptions", e); }
}

/**
 * Modals Logic
 */
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
    const pId = document.getElementById('notePatientSelect').value;
    const content = document.getElementById('noteContent').value;
    if (!pId || !content.trim()) return alert("Please select a patient and enter note content.");

    try {
        const res = await apiFetch('/notes/', {
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
    const pId = document.getElementById('scriptPatientSelect').value;
    const med = document.getElementById('scriptMedication').value;
    const dose = document.getElementById('scriptDosage').value;
    const ins = document.getElementById('scriptInstructions').value;
    if (!pId || !med.trim() || !dose.trim()) return alert("Please fill required fields (Patient, Medication, Dosage).");

    try {
        const res = await apiFetch('/prescriptions/', {
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
    
    // Load patient-specific notes and scripts
    const notesContainer = document.getElementById('viewActionNotes');
    const scriptsContainer = document.getElementById('viewActionPrescriptions');
    notesContainer.innerHTML = 'Loading...';
    scriptsContainer.innerHTML = 'Loading...';

    try {
        const notesRes = await apiFetch(`/notes/patient/${patientId}`);
        const scriptsRes = await apiFetch(`/prescriptions/patient/${patientId}`);

        if (notesRes.ok) {
            const notes = await notesRes.json();
            notesContainer.innerHTML = notes.length ? '' : '<div style="color:var(--text-muted)">No notes found.</div>';
            notes.forEach(n => {
                notesContainer.innerHTML += `
                    <div style="background:var(--bg-warm); padding:16px; border-radius:8px; border:1px solid var(--border-color);">
                        <div style="font-size:0.8rem; color:var(--text-light); margin-bottom:8px;">${new Date(n.created_at).toLocaleString()}</div>
                        <p style="margin:0; font-size:0.95rem; white-space:pre-wrap; line-height:1.5;">${n.note_content}</p>
                    </div>
                `;
            });
        }
        
        if (scriptsRes.ok) {
            const scripts = await scriptsRes.json();
            scriptsContainer.innerHTML = scripts.length ? '' : '<div style="color:var(--text-muted)">No prescriptions found.</div>';
            scripts.forEach(s => {
                scriptsContainer.innerHTML += `
                    <div style="background:var(--bg-warm); padding:16px; border-radius:8px; border:1px solid var(--border-color);">
                        <div style="font-size:0.8rem; color:var(--text-light); margin-bottom:8px;">${new Date(s.created_at).toLocaleString()}</div>
                        <div style="font-weight:600; color:var(--medical-blue);">${s.medication}</div>
                        <div style="font-size:0.9rem; color:var(--text-main); margin-bottom:4px;">Dosage: ${s.dosage}</div>
                        <div style="font-size:0.85rem; color:var(--text-muted); font-style:italic;">"${s.instructions || 'No special instructions'}"</div>
                    </div>
                `;
            });
        }
    } catch (e) {
        console.error(e);
        notesContainer.innerHTML = "Failed to load.";
        scriptsContainer.innerHTML = "Failed to load.";
    }
}

window.switchTab = switchRecordsTab;
window.openNoteModal = openNoteModal;
window.openScriptModal = openScriptModal;
window.closeModals = closeModals;
window.saveNote = saveNote;
window.saveScript = saveScript;
window.openViewActionModal = openViewActionModal;

/**
 * Print Prescription
 */
function printPrescription(patientName, medication, dosage, instructions, dateStr) {
    const rxWindow = window.open('', '_blank', 'width=800,height=600');
    if (!rxWindow) {
        alert("Please allow popups to print prescriptions.");
        return;
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Prescription - ${patientName}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                .brand { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
                .sub { font-size: 14px; color: #666; }
                .rx-symbol { font-size: 48px; font-weight: bold; margin-bottom: 20px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 15px; }
                .label { font-weight: bold; width: 120px; display: inline-block; }
                .box { border: 1px solid #ccc; padding: 15px; margin-top: 20px; min-height: 100px; border-radius: 5px; }
                .footer { margin-top: 50px; text-align: right; }
                .signature-line { border-top: 1px solid #000; width: 200px; display: inline-block; padding-top: 5px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="brand">Marutha Support Healthcare</div>
                <div class="sub">Official Medical Prescription</div>
            </div>
            
            <div class="row">
                <div><span class="label">Patient Name:</span> ${patientName}</div>
                <div><span class="label">Date:</span> ${dateStr}</div>
            </div>
            
            <div class="rx-symbol">℞</div>
            
            <div style="margin-bottom: 15px;">
                <span class="label">Medication:</span> <span style="font-size: 1.1em; font-weight: bold;">${medication}</span>
            </div>
            <div style="margin-bottom: 15px;">
                <span class="label">Dosage:</span> ${dosage}
            </div>
            
            <div class="box">
                <span class="label" style="display:block; margin-bottom:10px;">Instructions:</span>
                ${instructions || 'Use as directed.'}
            </div>
            
            <div class="footer">
                <br><br><br>
                <div class="signature-line">Doctor's Signature</div>
            </div>
            
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    rxWindow.document.open();
    rxWindow.document.write(html);
    rxWindow.document.close();
}

window.printPrescription = printPrescription;
