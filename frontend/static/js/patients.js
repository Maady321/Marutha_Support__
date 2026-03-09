// patients.js - Patient List (Doctor View)
// Shows all patients with volunteer assignment

var volunteersCache = [];

document.addEventListener('DOMContentLoaded', function() {
    initPatientList();
});


async function initPatientList() {
    var tableBody = document.getElementById('patients-table-body');
    if (!tableBody) return;

    // Show loading
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Loading patient registry...</td></tr>';

    try {
        // Fetch volunteers first (for name lookup)
        var volResponse = await apiFetch('/doctors/volunteers');
        var volMap = {};
        if (volResponse.ok) {
            var vols = await volResponse.json();
            volunteersCache = vols;
            for (var i = 0; i < vols.length; i++) {
                volMap[vols[i].id] = vols[i].name;
            }
        }

        // Fetch patients
        var response = await apiFetch('/patients/');
        if (response.ok) {
            var patients = await response.json();
            renderPatients(patients, tableBody, volMap);
        } else {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--danger)">Failed to load patients.</td></tr>';
        }
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Error connecting to medical records server.</td></tr>';
    }
}


function renderPatients(patients, container, volMap) {
    if (patients.length === 0) {
        container.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No registered patients found.</td></tr>';
        return;
    }

    container.innerHTML = '';

    for (var i = 0; i < patients.length; i++) {
        var p = patients[i];

        // Get initials
        var initials = 'P';
        if (p.name) {
            var parts = p.name.split(' ');
            initials = '';
            for (var j = 0; j < parts.length; j++) {
                initials = initials + parts[j][0];
            }
        }

        // Determine volunteer display
        var volunteerDisplay = '';
        if (p.volunteer_id) {
            var volName = volMap[p.volunteer_id] || ('Unknown #' + p.volunteer_id);
            volunteerDisplay = '<span class="badge" style="background: #e0e7ff; color: #4338ca;"><i class="fas fa-hands-helping" style="margin-right:4px"></i> ' + volName + '</span>';
        } else {
            volunteerDisplay = '<button onclick="openAssignModal(' + p.id + ')" class="btn btn-sm btn-outline-lavender" style="font-size: 0.75rem; padding: 4px 8px;">+ Assign</button>';
        }

        var row = document.createElement('tr');
        row.innerHTML =
            '<td>' +
                '<div style="display: flex; align-items: center; gap: 12px">' +
                    '<div class="profile-pic" style="width: 40px; height: 40px; font-size: 1rem; background: #eff6ff; color: #1e40af;">' + initials + '</div>' +
                    '<div>' +
                        '<div style="font-weight: 600; color: var(--medical-blue)">' + (p.name || 'Anonymous') + '</div>' +
                        '<div style="font-size: 0.8rem; color: var(--text-light)">ID: #' + p.id + '</div>' +
                    '</div>' +
                '</div>' +
            '</td>' +
            '<td style="color: var(--text-muted)">' + p.age + '</td>' +
            '<td><div style="color: var(--text-main); font-weight: 500">' + (p.stage || 'N/A') + '</div></td>' +
            '<td>' + volunteerDisplay + '</td>' +
            '<td><span class="badge" style="background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;">Active</span></td>' +
            '<td>' +
                '<div style="display: flex; gap: 8px">' +
                    '<a href="patient_details.html?id=' + p.id + '" class="btn btn-sm btn-outline-lavender" title="View History"><i class="fas fa-history"></i></a>' +
                    '<a href="chat_doctor.html?userId=' + p.user_id + '" class="btn btn-sm btn-outline-lavender" title="Message"><i class="fas fa-comment-dots"></i></a>' +
                    '<button onclick="openAssignModal(' + p.id + ')" class="btn btn-sm btn-outline-lavender" title="Re-assign Volunteer"><i class="fas fa-user-plus"></i></button>' +
                '</div>' +
            '</td>';

        container.appendChild(row);
    }
}


// ---- Volunteer Assignment Modal ----
async function openAssignModal(patientId) {
    var modal = document.getElementById('assignVolunteerModal');
    var input = document.getElementById('assignPatientId');
    var select = document.getElementById('volunteerSelect');

    if (!modal || !input || !select) return;

    input.value = patientId;
    modal.style.display = 'flex';

    // Load volunteers
    select.innerHTML = '<option value="">Loading volunteers...</option>';

    try {
        var response = await apiFetch('/doctors/volunteers');
        if (response.ok) {
            var volunteers = await response.json();
            volunteersCache = volunteers;
            renderVolunteerOptions(volunteers, select);
        } else {
            select.innerHTML = '<option value="">Failed to load volunteers</option>';
        }
    } catch (error) {
        console.error(error);
        select.innerHTML = '<option value="">Error loading data</option>';
    }
}


function renderVolunteerOptions(volunteers, select) {
    if (volunteers.length === 0) {
        select.innerHTML = '<option value="">No volunteers found</option>';
        return;
    }

    select.innerHTML = '<option value="">Select a volunteer...</option>';
    for (var i = 0; i < volunteers.length; i++) {
        var v = volunteers[i];
        var option = document.createElement('option');
        option.value = v.id;
        option.innerText = v.name + ' (ID: ' + v.id + ')';
        select.appendChild(option);
    }
}


function closeAssignModal() {
    var modal = document.getElementById('assignVolunteerModal');
    if (modal) modal.style.display = 'none';
}


async function handleAssignVolunteer(event) {
    event.preventDefault();

    var patientId = document.getElementById('assignPatientId').value;
    var volunteerId = document.getElementById('volunteerSelect').value;
    var btn = event.target.querySelector('button[type="submit"]');

    if (!patientId || !volunteerId) {
        alert("Please select a volunteer.");
        return;
    }

    var originalText = btn.innerText;
    btn.innerText = "Assigning...";
    btn.disabled = true;

    try {
        var response = await apiFetch('/doctors/patients/' + patientId + '/assign/' + volunteerId, {
            method: 'POST'
        });

        if (response.ok) {
            alert("Volunteer assigned successfully!");
            closeAssignModal();
            initPatientList(); // Reload table
        } else {
            var data = await response.json();
            alert('Failed: ' + (data.detail || 'Unknown error'));
        }
    } catch (error) {
        console.error(error);
        alert("Error connecting to server.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}


// Make functions available globally
window.openAssignModal = openAssignModal;
window.closeAssignModal = closeAssignModal;
window.handleAssignVolunteer = handleAssignVolunteer;
