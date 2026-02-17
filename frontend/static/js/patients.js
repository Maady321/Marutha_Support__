/**
 * Marutha Support - Patient List JS (Doctor View)
 */

document.addEventListener('DOMContentLoaded', () => {
    initPatientList();
});

async function initPatientList() {
    const tableBody = document.querySelector('.custom-table tbody');
    if (!tableBody) return;

    // Show loading
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Loading patient registry...</td></tr>';

    try {
        const response = await apiFetch('/patients/');
        if (response.ok) {
            const patients = await response.json();
            renderPatients(patients, tableBody);
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--danger)">Failed to load patients.</td></tr>';
        }
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Error connecting to medical records server.</td></tr>';
    }
}

function renderPatients(patients, container) {
    if (patients.length === 0) {
        container.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No registered patients found.</td></tr>';
        return;
    }

    container.innerHTML = '';
    patients.forEach(p => {
        const initials = p.name ? p.name.split(' ').map(n => n[0]).join('') : 'P';
        const row = document.createElement('tr');
        
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
            <td style="color: var(--text-muted)">Active</td>
            <td>
                <span class="badge" style="background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;">Stable</span>
            </td>
            <td>
                <div style="display: flex; gap: 8px">
                    <a href="patient_details.html?id=${p.id}" class="btn btn-sm btn-outline-lavender" title="View History"><i class="fas fa-history"></i></a>
                    <a href="chat_doctor.html?userId=${p.user_id}" class="btn btn-sm btn-outline-lavender" title="Message"><i class="fas fa-comment-dots"></i></a>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
}
