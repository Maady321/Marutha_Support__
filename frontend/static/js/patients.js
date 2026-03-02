/**
 * Marutha Support - Patient List JS (Doctor View)
 */

let volunteersCache = []; // Internal cache

document.addEventListener('DOMContentLoaded', () => {
    initPatientList();
});

async function initPatientList() {
    const tableBody = document.getElementById('patients-table-body');
    if (!tableBody) return;

    // Show loading
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Loading patient registry...</td></tr>';

    try {
        // Fetch Dictionary of Volunteers first
        const volResponse = await apiFetch('/doctors/volunteers');
        let volMap = {};
        if (volResponse.ok) {
            const vols = await volResponse.json();
            volunteersCache = vols; // Store for modal
            vols.forEach(v => volMap[v.id] = v.name);
        }

        const response = await apiFetch('/patients/');
        if (response.ok) {
            const patients = await response.json();
            renderPatients(patients, tableBody, volMap);
        } else {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--danger)">Failed to load patients.</td></tr>';
        }
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Error connecting to medical records server.</td></tr>';
    }
}

function renderPatients(patients, container, volMap = {}) {
    if (patients.length === 0) {
        container.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No registered patients found.</td></tr>';
        return;
    }

    container.innerHTML = '';
    patients.forEach(p => {
        const initials = p.name ? p.name.split(' ').map(n => n[0]).join('') : 'P';
        const row = document.createElement('tr');
        
        // Determine Volunteer Display
        let volunteerDisplay = '<span style="color: var(--text-muted); font-style: italic">None</span>';
        if (p.volunteer_id) {
             // If backend doesn't populate volunteer name, we might just show ID or "Assigned"
             // But I used lazy="joined" so p.volunteer object might be available if I defined response model correctly.
             // Wait, PatientDetails schema (Step 1822) has volunteer_id: Optional[int].
             // It does NOT have volunteer object nested.
             // So I only get ID.
             // I need to fetch volunteer details or update PatientDetails schema.
             // For now, I'll show "Volunteer #" + p.volunteer_id.
             // Better: Update Schema later. Or just fetch volunteers list and map ID to Name!
             // Since I fetch volunteers for modal, I can map it if I fetch all volunteers upfront.
             // Look up volunteer name from map
             const volName = volMap[p.volunteer_id] || ('Unknown #' + p.volunteer_id);
             volunteerDisplay = `<span class="badge" style="background: #e0e7ff; color: #4338ca;"><i class="fas fa-hands-helping" style="margin-right:4px"></i> ${volName}</span>`;
        } else {
             volunteerDisplay = `<button onclick="openAssignModal(${p.id})" class="btn btn-sm btn-outline-lavender" style="font-size: 0.75rem; padding: 4px 8px;">+ Assign</button>`;
        }

        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 12px">
                    <div class="profile-pic" style="width: 40px; height: 40px; font-size: 1rem; background: #eff6ff; color: #1e40af;">
                        ${initials}
                    </div>
                    <div>
                        <div style="font-weight: 600; color: var(--medical-blue)">${p.name || 'Anonymous'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-light)">ID: #${p.id}</div>
                    </div>
                </div>
            </td>
            <td style="color: var(--text-muted)">${p.age}</td>
            <td>
                <div style="color: var(--text-main); font-weight: 500">${p.stage || 'N/A'}</div>
            </td>
            <td>
                ${volunteerDisplay}
            </td>
            <td>
                <span class="badge" style="background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;">Active</span>
            </td>
            <td>
                <div style="display: flex; gap: 8px">
                    <a href="patient_details.html?id=${p.id}" class="btn btn-sm btn-outline-lavender" title="View History"><i class="fas fa-history"></i></a>
                    <a href="chat_doctor.html?userId=${p.user_id}" class="btn btn-sm btn-outline-lavender" title="Message"><i class="fas fa-comment-dots"></i></a>
                    <button onclick="openAssignModal(${p.id})" class="btn btn-sm btn-outline-lavender" title="Re-assign Volunteer"><i class="fas fa-user-plus"></i></button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
}


/**
 * Volunteer Assignment Logic
 */
async function openAssignModal(patientId) {
    const modal = document.getElementById('assignVolunteerModal');
    const input = document.getElementById('assignPatientId');
    const select = document.getElementById('volunteerSelect');
    
    if (!modal || !input || !select) return;

    input.value = patientId;
    modal.style.display = 'flex'; // Use flex for centering (updated CSS)

    // Load volunteers if empty or just reload always to be safe
    select.innerHTML = '<option value="">Loading volunteers...</option>';
    
    try {
        const response = await apiFetch('/doctors/volunteers');
        if (response.ok) {
            const volunteers = await response.json();
            volunteersCache = volunteers;
            renderVolunteerOptions(volunteers, select);
        } else {
             select.innerHTML = '<option value="">Failed to load volunteers</option>';
        }
    } catch (error) {
        console.error(error);
        select.innerHTML = '<option value="">Error loading data query</option>';
    }
}

function renderVolunteerOptions(volunteers, select) {
    if (volunteers.length === 0) {
        select.innerHTML = '<option value="">No volunteers found</option>';
        return;
    }
    
    select.innerHTML = '<option value="">Select a volunteer...</option>';
    volunteers.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.innerText = `${v.name} (ID: ${v.id})`;
        select.appendChild(option);
    });
}

function closeAssignModal() {
    const modal = document.getElementById('assignVolunteerModal');
    if (modal) modal.style.display = 'none';
}

async function handleAssignVolunteer(event) {
    event.preventDefault();
    
    const patientId = document.getElementById('assignPatientId').value;
    const volunteerId = document.getElementById('volunteerSelect').value;
    const btn = event.target.querySelector('button[type="submit"]');

    if (!patientId || !volunteerId) {
        alert("Please select a volunteer.");
        return;
    }

    // specific button loading
    const originalText = btn.innerText;
    btn.innerText = "Assigning...";
    btn.disabled = true;

    try {
        const response = await apiFetch(`/doctors/patients/${patientId}/assign/${volunteerId}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert("Volunteer assigned successfully!");
            closeAssignModal();
            initPatientList(); // Reload table
        } else {
            const data = await response.json();
            alert(`Failed: ${data.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(error);
        alert("Error connecting to server.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Global exposure
window.openAssignModal = openAssignModal;
window.closeAssignModal = closeAssignModal;
window.handleAssignVolunteer = handleAssignVolunteer;
