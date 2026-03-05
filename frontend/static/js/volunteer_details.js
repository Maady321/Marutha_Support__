document.addEventListener('DOMContentLoaded', () => {
    loadVolunteerDirectory();
    populateProfile();
});

function populateProfile() {
    fetch(`${CONFIG.API_BASE_URL}/doctors/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    })
    .then(res => res.json())
    .then(data => {
        const nameEl = document.getElementById("docName");
        const initEl = document.getElementById("docInitial");
        if (nameEl) nameEl.textContent = "Dr. " + (data.name || "");
        if (initEl) initEl.textContent = (data.name || "D")[0].toUpperCase();
    })
    .catch(() => {});
}

async function loadVolunteerDirectory() {
    const tableBody = document.getElementById('volunteer-details-table-body');
    if (!tableBody) return;

    try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${CONFIG.API_BASE_URL}/doctors/volunteers-full-details`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load');
        
        const volunteers = await res.json();
        
        if (volunteers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-users-slash"></i><br>No Volunteers Found</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = '';
        volunteers.forEach(vol => {
            const tr = document.createElement('tr');
            
            // Format time accurately
            const totalSec = Math.floor(vol.total_hours * 3600);
            const hrs = Math.floor(totalSec / 3600);
            const mins = Math.floor((totalSec % 3600) / 60);
            const secs = totalSec % 60;
            const formattedTime = `<span style="font-weight: 700">${hrs}h ${mins}m ${secs}s</span>`;
            
            tr.innerHTML = `
                <td>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--lavender-soft); color: var(--medical-blue); font-weight:700; display:flex; align-items:center; justify-content:center;">
                            ${vol.name.substring(0,2).toUpperCase()}
                        </div>
                        <span style="font-weight: 600; color:var(--text-main); font-size:1.05rem;">${vol.name}</span>
                    </div>
                </td>
                <td style="color:var(--text-light)">${vol.email}</td>
                <td>
                    <span style="background: var(--lavender-soft); color: var(--medical-blue); padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.8rem;">
                        ${vol.patient_count} / 3 Assigned
                    </span>
                </td>
                <td>
                    <span style="display:inline-block; margin-right: 6px;"><i class="fas fa-check-circle" style="color:var(--hope-green)"></i></span>
                    <strong style="color:var(--text-main)">${vol.tasks_completed}</strong> <span style="font-size:0.85rem; color:var(--text-muted)">/ ${vol.tasks_total}</span>
                </td>
                <td style="color:var(--medical-blue)">${formattedTime}</td>
                <td>
                    <div style="font-weight: 600; font-size: 1.1rem; color:var(--text-main)">
                        ${vol.reports_total}
                    </div>
                </td>
                <td>
                    <button class="btn btn-outline-lavender btn-sm" onclick="chatWithVolunteer(${vol.user_id})" title="Message">
                        <i class="fas fa-comment"></i>
                    </button>
                    ${vol.recent_reports.length > 0 ? 
                        `<button class="btn btn-primary btn-sm" onclick="viewReports(${vol.id})" title="View Reports">
                            <i class="fas fa-file-alt"></i>
                        </button>` 
                    : ''}
                </td>
            `;
            tableBody.appendChild(tr);
            
            // Generate hidden modal containing their specific reports if they exist
            if (vol.recent_reports.length > 0) {
                generateReportsModal(vol);
            }
        });
        
    } catch (e) {
        console.error(e);
        tableBody.innerHTML = `<tr><td colspan="7" class="empty-state text-danger"><i class="fas fa-exclamation-triangle"></i><br>Error Loading Volunteer Details</td></tr>`;
    }
}

function generateReportsModal(vol) {
    if (document.getElementById(`modal-reports-${vol.id}`)) return;
    
    let htmlContent = '';
    vol.recent_reports.forEach(r => {
        const d = new Date(r.date).toLocaleDateString();
        htmlContent += `
        <div style="background:var(--bg-white); border: 1px solid var(--border-color); padding: 16px; border-radius: 12px; margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px">
                <strong style="color:var(--medical-blue);font-size:1.05rem;">${r.activity_type}</strong>
                <span style="color:var(--text-muted);font-size:0.85rem;">${d}</span>
            </div>
            <div style="color:var(--text-light);font-size:0.9rem;margin-bottom:8px">Patient: <strong>${r.patient_name}</strong></div>
            <p style="margin:0;font-size:0.9rem;color:var(--text-main)">${r.notes || 'No notes'}</p>
        </div>`;
    });
    
    const m = document.createElement('div');
    m.id = `modal-reports-${vol.id}`;
    m.style.cssText = `display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center; padding: 20px; backdrop-filter:blur(3px);`;
    m.innerHTML = `
        <div style="background:white; border-radius:24px; width:100%; max-width:600px; max-height:85vh; overflow-y:auto; box-shadow:0 12px 40px rgba(0,0,0,0.2)">
            <div style="padding: 24px 32px; border-bottom: 1px solid var(--border-color); position:sticky; top:0; background:white; z-index:10; display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; font-size:1.3rem; color:var(--text-main); font-weight:800"><i class="fas fa-file-alt" style="color:var(--medical-blue)"></i> Recent Reports: ${vol.name}</h3>
                <button onclick="document.getElementById('modal-reports-${vol.id}').style.display='none'" style="background:none; border:none; font-size:1.5rem; color:var(--text-light); cursor:pointer"><i class="fas fa-times"></i></button>
            </div>
            <div style="padding: 24px 32px; text-align: left;">
                ${htmlContent}
                <div style="text-align: center; margin-top: 16px;">
                    <button class="btn btn-outline-lavender" onclick="document.getElementById('modal-reports-${vol.id}').style.display='none'">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(m);
}

function viewReports(volId) {
    const el = document.getElementById(`modal-reports-${volId}`);
    if (el) el.style.display = 'flex';
}

function chatWithVolunteer(userId) {
    window.location.href = `chat_doctor.html?user_id=${userId}`;
}
