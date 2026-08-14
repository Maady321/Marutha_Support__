// Dashboard scripts

async function loadDashboard() {
  const user = await requireAuth();
  if (!user) return;

  // Render basic details
  const welcomeTitle = document.getElementById('welcome-title');
  if (welcomeTitle) welcomeTitle.innerText = `Welcome back, ${user.firstName}!`;

  const userRoleText = document.getElementById('user-role-text');
  if (userRoleText) userRoleText.innerText = `Logged in as ${user.role}.`;

  // Render Verification Badge
  renderVerificationBadge(user.verificationStatus);

  // Render Profile Completion Widget
  await renderProfileCompletion(user);

  // Render Role-specific panels
  renderRolePanels(user);

  // Render Doctors Directory
  await loadDoctorsDirectory();
}

function renderVerificationBadge(status) {
  const container = document.getElementById('badge-container');
  if (!container) return;
  
  container.innerHTML = '';
  const span = document.createElement('span');
  span.className = 'badge';
  
  if (status === 'APPROVED') {
    span.classList.add('badge-approved');
    span.innerText = 'Verified';
    container.appendChild(span);
  } else if (status === 'PENDING') {
    span.classList.add('badge-pending');
    span.innerText = 'Pending Review';
    container.appendChild(span);
  } else if (status === 'REJECTED') {
    span.classList.add('badge-rejected');
    span.innerText = 'Verification Rejected';
    container.appendChild(span);
  }
}

async function renderProfileCompletion(user) {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const completionLink = document.getElementById('completion-link');
  if (!progressBar || !progressText) return;

  let totalFields = 5;
  let completedFields = 0;

  if (user.firstName) completedFields++;
  if (user.lastName) completedFields++;
  if (user.phone) completedFields++;
  if (user.city) completedFields++;
  if (user.zipCode) completedFields++;

  // Fetch extra fields depending on role
  try {
    if (user.role === 'DOCTOR') {
      totalFields += 3;
      const res = await fetchApi('/api/v1/doctors/me');
      const dp = res.data;
      if (dp.specialty) completedFields++;
      if (dp.licenseNumber) completedFields++;
      if (dp.hospital) completedFields++;
    } else if (user.role === 'PATIENT') {
      totalFields += 3;
      const res = await fetchApi('/api/v1/patients/me');
      const pp = res.data;
      if (pp.dateOfBirth) completedFields++;
      if (pp.gender) completedFields++;
      if (pp.medicalNotes) completedFields++;
    } else if (user.role === 'VOLUNTEER') {
      totalFields += 2;
      const res = await fetchApi('/api/v1/volunteers/me');
      const vp = res.data;
      if (vp.skills && vp.skills.length > 0) completedFields++;
      if (vp.bio) completedFields++;
    }
  } catch (e) {
    console.error('Failed to load profile details for completion widget:', e);
  }

  const percentage = Math.round((completedFields / totalFields) * 100);
  progressBar.style.width = `${percentage}%`;
  progressText.innerText = `${percentage}% Complete`;

  if (percentage === 100) {
    if (completionLink) completionLink.classList.add('hidden');
  } else {
    if (completionLink) completionLink.classList.remove('hidden');
  }
}

function renderRolePanels(user) {
  const panels = {
    'PATIENT': document.getElementById('patient-panel'),
    'FAMILY_MEMBER': document.getElementById('family-panel'),
    'DOCTOR': document.getElementById('doctor-panel'),
    'VOLUNTEER': document.getElementById('volunteer-panel'),
    'CAREGIVER': document.getElementById('caregiver-panel'),
    'NURSE': document.getElementById('nurse-panel'),
    'ORGANIZATION': document.getElementById('organization-panel'),
    'HOSPITAL': document.getElementById('hospital-panel')
  };

  // Hide all panels
  Object.values(panels).forEach(panel => {
    if (panel) panel.classList.add('hidden');
  });

  // Show the user's role panel
  const userPanel = panels[user.role];
  if (userPanel) {
    userPanel.classList.remove('hidden');
  }

  // Execute role-specific load logic if needed
  if (user.role === 'PATIENT') {
    loadPatientPanel();
  } else if (user.role === 'FAMILY_MEMBER') {
    loadFamilyPanel();
  } else if (user.role === 'CAREGIVER') {
    loadCaregiverPanel();
  } else if (user.role === 'DOCTOR') {
    loadDoctorPanel();
  } else if (user.role === 'NURSE') {
    loadNursePanel();
  }
}

// Patient Specific Dashboard Logic
async function loadPatientPanel() {
  const generateBtn = document.getElementById('generate-invite-btn');
  const inviteCodeResult = document.getElementById('invite-code-result');
  const inviteCodeSpan = document.getElementById('invite-code-span');
  
  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      try {
        generateBtn.disabled = true;
        generateBtn.innerText = 'Generating...';
        const res = await fetchApi('/api/v1/family/generate-invite', { method: 'POST' });
        inviteCodeSpan.innerText = res.inviteCode;
        inviteCodeResult.classList.remove('hidden');
      } catch (e) {
        alert(e.message || 'Failed to generate invite');
      } finally {
        generateBtn.disabled = false;
        generateBtn.innerText = 'Generate Invite Code';
      }
    });
  }

  await loadRelationshipsList('PATIENT');
}

// Family Specific Dashboard Logic
async function loadFamilyPanel() {
  const form = document.getElementById('accept-invite-form');
  const input = document.getElementById('invite-code-input');
  const errorAlert = document.getElementById('family-error-alert');
  const successAlert = document.getElementById('family-success-alert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorAlert.classList.add('hidden');
      successAlert.classList.add('hidden');

      try {
        const inviteCode = input.value.trim();
        if (!inviteCode) throw new Error('Please enter an invite code');

        await fetchApi('/api/v1/family/accept-invite', {
          method: 'POST',
          body: JSON.stringify({ inviteCode })
        });

        successAlert.innerText = 'Successfully linked to patient!';
        successAlert.classList.remove('hidden');
        input.value = '';
        await loadRelationshipsList('FAMILY_MEMBER');
      } catch (err) {
        errorAlert.innerText = err.message;
        errorAlert.classList.remove('hidden');
      }
    });
  }

  await loadRelationshipsList('FAMILY_MEMBER');
}

// Load Linked Relationships List
async function loadRelationshipsList(role) {
  const container = document.getElementById('relationships-list');
  if (!container) return;

  container.innerHTML = '<div class="loader"></div>';

  try {
    const res = await fetchApi('/api/v1/family/relationships');
    const rels = res.data;
    container.innerHTML = '';

    if (!rels || rels.length === 0) {
      container.innerHTML = '<p class="text-secondary">No family connections linked yet.</p>';
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'profile-details-list';
    
    rels.forEach(r => {
      const li = document.createElement('li');
      li.className = 'profile-detail-row flex-between';
      
      const infoSpan = document.createElement('span');
      if (role === 'PATIENT') {
        const fm = r.familyMember;
        infoSpan.innerText = `${fm.firstName} ${fm.lastName} (Family Member)`;
      } else {
        const p = r.patient;
        infoSpan.innerText = `${p.firstName} ${p.lastName} (Patient)`;
      }
      
      li.appendChild(infoSpan);

      // Only patient can revoke access
      if (role === 'PATIENT') {
        const revokeBtn = document.createElement('button');
        revokeBtn.innerText = 'Revoke';
        revokeBtn.className = 'btn-primary';
        revokeBtn.style.padding = '0.35rem 0.85rem';
        revokeBtn.style.fontSize = '0.8rem';
        revokeBtn.style.backgroundColor = '#ef4444';
        revokeBtn.style.color = 'white';
        revokeBtn.style.boxShadow = 'none';
        
        revokeBtn.addEventListener('click', async () => {
          if (confirm('Are you sure you want to revoke family access?')) {
            try {
              await fetchApi(`/api/v1/family/relationships/${r.id}/revoke`, { method: 'PATCH' });
              await loadRelationshipsList(role);
            } catch (err) {
              alert(err.message || 'Failed to revoke access');
            }
          }
        });
        li.appendChild(revokeBtn);
      }
      
      ul.appendChild(li);
    });

    container.appendChild(ul);
  } catch (e) {
    container.innerHTML = `<p class="error-text">Failed to load family connections: ${e.message}</p>`;
  }
}

// Volunteer Task Stats logic
async function loadVolunteerPanel() {
  const container = document.getElementById('volunteer-skills-list');
  if (!container) return;

  try {
    const res = await fetchApi('/api/v1/volunteers/me');
    const vp = res.data;
    container.innerHTML = '';
    
    const tasksCount = document.getElementById('tasks-completed-count');
    if (tasksCount) tasksCount.innerText = vp.totalTasksCompleted;

    if (!vp.skills || vp.skills.length === 0) {
      container.innerHTML = '<p class="text-secondary">No skills listed yet.</p>';
      return;
    }

    const flex = document.createElement('div');
    flex.className = 'flex-gap-2';
    flex.style.flexWrap = 'wrap';

    vp.skills.forEach(skill => {
      const span = document.createElement('span');
      span.className = 'badge';
      span.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
      span.style.color = '#c084fc';
      span.style.border = '1px solid rgba(168, 85, 247, 0.3)';
      span.innerText = skill;
      flex.appendChild(span);
    });

    container.appendChild(flex);
  } catch (e) {
    container.innerHTML = `<p class="error-text">Failed to load volunteer profile: ${e.message}</p>`;
  }
}

// Public Doctors Directory
async function loadDoctorsDirectory() {
  const container = document.getElementById('doctors-list');
  if (!container) return;

  container.innerHTML = '<div class="loader"></div>';

  try {
    const res = await fetchApi('/api/v1/doctors');
    const docs = res.data;
    container.innerHTML = '';

    if (!docs || docs.length === 0) {
      container.innerHTML = '<p class="text-secondary text-center">No verified doctors available in the directory yet.</p>';
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'public-doctors-grid';

    docs.forEach(d => {
      const card = document.createElement('div');
      card.className = 'doctor-item-card';

      const dp = d.doctorProfile;
      const experience = dp.yearsOfExperience !== null ? `${dp.yearsOfExperience} years exp` : 'Exp not provided';
      const hospital = dp.hospital ? dp.hospital : 'Hospital not listed';
      const accepts = dp.isAcceptingPatients ? 'Accepting Patients' : 'Not Accepting Patients';

      card.innerHTML = `
        <div class="doc-name">Dr. ${d.firstName} ${d.lastName}</div>
        <div class="doc-specialty">${dp.specialty || 'General Practitioner'}</div>
        <div class="doc-hospital">${hospital}</div>
        <div class="doc-exp">${experience} • <span class="badge ${dp.isAcceptingPatients ? 'badge-approved' : 'badge-rejected'}" style="font-size:0.65rem; padding: 0.15rem 0.5rem;">${accepts}</span></div>
      `;
      
      grid.appendChild(card);
    });

    container.appendChild(grid);
  } catch (e) {
    container.innerHTML = `<p class="error-text text-center">Failed to load doctor directory: ${e.message}</p>`;
  }
}

// Execute on dashboard load
if (window.location.pathname === '/dashboard') {
  document.addEventListener('DOMContentLoaded', loadDashboard);
}

async function loadCaregiverPanel() {
  const listContainer = document.getElementById('caregiver-patients-list');
  try {
    const data = await fetchApi('/api/v1/caregivers/patients');
    if (data && data.data && data.data.length > 0) {
      listContainer.innerHTML = '';
      data.data.forEach(p => {
        const div = document.createElement('div');
        div.className = 'connection-card';
        div.style = 'padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;';
        div.innerHTML = 
          <div>
            <h4 style="margin:0; font-size:1rem;"> </h4>
            <p style="margin:0; font-size:0.8rem; color:var(--text-secondary);">Patient ID: </p>
          </div>
          <span class="badge badge-approved" style="font-size:0.75rem;">Active</span>
        ;
        listContainer.appendChild(div);
      });
    }
  } catch (err) {
    console.error('Failed to load caregiver patients', err);
  }

  const form = document.getElementById('caregiver-link-form');
  const errorAlert = document.getElementById('caregiver-error-alert');
  const successAlert = document.getElementById('caregiver-success-alert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorAlert.classList.add('hidden');
      successAlert.classList.add('hidden');
      const inviteCode = document.getElementById('caregiver-invite-input').value;
      
      try {
        await fetchApi('/api/v1/caregivers/link-patient', {
          method: 'POST',
          body: JSON.stringify({ inviteCode })
        });
        successAlert.innerText = 'Patient successfully linked!';
        successAlert.classList.remove('hidden');
        document.getElementById('caregiver-invite-input').value = '';
        loadCaregiverPanel(); // reload list
      } catch (err) {
        errorAlert.innerText = err.message || 'Failed to link patient.';
        errorAlert.classList.remove('hidden');
      }
    });
  }
}

async function loadClinicalPanel(role) {
  const isDoctor = role === 'DOCTOR';
  const listContainer = document.getElementById(isDoctor ? 'doctor-patients-list' : 'nurse-patients-list');
  const roleContext = isDoctor ? 'PRIMARY_PHYSICIAN' : 'VISITING_NURSE';
  
  try {
    const data = await fetchApi('/api/v1/clinical/tools/assignments/my-patients');
    if (data && data.length > 0) {
      listContainer.innerHTML = '';
      data.forEach(a => {
        const div = document.createElement('div');
        div.className = 'connection-card';
        div.style = 'padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;';
        div.innerHTML = 
          <div>
            <h4 style="margin:0; font-size:1rem;">Patient ID: ...</h4>
            <p style="margin:0; font-size:0.8rem; color:var(--text-secondary);">Context: </p>
          </div>
          <button class="btn-primary" style="font-size:0.75rem; padding: 0.25rem 0.5rem;" onclick="alert('Timeline UI not yet built')">Timeline</button>
        ;
        listContainer.appendChild(div);
      });
    }
  } catch (err) {
    console.error('Failed to load clinical patients', err);
  }

  const form = document.getElementById(isDoctor ? 'doctor-assign-form' : 'nurse-assign-form');
  const errorAlert = document.getElementById(isDoctor ? 'doctor-error-alert' : 'nurse-error-alert');
  const successAlert = document.getElementById(isDoctor ? 'doctor-success-alert' : 'nurse-success-alert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorAlert.classList.add('hidden');
      successAlert.classList.add('hidden');
      const patientId = document.getElementById(isDoctor ? 'doctor-patient-input' : 'nurse-patient-input').value;
      
      try {
        await fetchApi('/api/v1/clinical/tools/assignments', {
          method: 'POST',
          body: JSON.stringify({ patientId, roleContext })
        });
        successAlert.innerText = 'Patient successfully assigned!';
        successAlert.classList.remove('hidden');
        document.getElementById(isDoctor ? 'doctor-patient-input' : 'nurse-patient-input').value = '';
        if (isDoctor) loadDoctorPanel(); else loadNursePanel();
      } catch (err) {
        errorAlert.innerText = err.message || 'Failed to assign patient.';
        errorAlert.classList.remove('hidden');
      }
    });
  }
}

function loadDoctorPanel() {
  loadClinicalPanel('DOCTOR');
}

function loadNursePanel() {
  loadClinicalPanel('NURSE');
}

async function loadVolunteerPanel() {
  const availableList = document.getElementById('volunteer-available-tasks-list');
  const claimedList = document.getElementById('volunteer-claimed-tasks-list');
  
  try {
    const data = await fetchApi('/api/v1/services/requests');
    if (data && data.length > 0) {
      const available = data.filter(r => r.status === 'PENDING');
      const claimed = data.filter(r => r.status !== 'PENDING');
      
      if (available.length > 0) {
        availableList.innerHTML = '';
        available.forEach(r => {
          const div = document.createElement('div');
          div.className = 'connection-card';
          div.style = 'padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.5rem;';
          div.innerHTML = 
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
              <h4 style="margin:0; font-size:1rem;"></h4>
              <span class="badge badge-pending"></span>
            </div>
            <p style="margin:0 0 1rem 0; font-size:0.85rem; color:var(--text-secondary);"></p>
            <button class="btn-primary w-full" onclick="claimServiceRequest('')">Claim Task</button>
          ;
          availableList.appendChild(div);
        });
      }
      
      if (claimed.length > 0) {
        claimedList.innerHTML = '';
        claimed.forEach(r => {
          const div = document.createElement('div');
          div.className = 'connection-card';
          div.style = 'padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.5rem; display:flex; justify-content:space-between; align-items:center;';
          div.innerHTML = 
            <div>
              <h4 style="margin:0; font-size:1rem;"></h4>
              <p style="margin:0; font-size:0.8rem; color:var(--text-secondary);">Status: </p>
            </div>
            <button class="btn-secondary" style="font-size:0.75rem;" onclick="alert('Update status UI not built yet')">Update Status</button>
          ;
          claimedList.appendChild(div);
        });
      }
    }
  } catch (err) {
    console.error('Failed to load volunteer tasks', err);
  }
}

async function loadOrganizationPanel() {
  const list = document.getElementById('org-requests-list');
  try {
    const data = await fetchApi('/api/v1/services/requests');
    if (data && data.length > 0) {
      list.innerHTML = '';
      data.forEach(r => {
        const div = document.createElement('div');
        div.className = 'connection-card';
        div.style = 'padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.5rem; display:flex; justify-content:space-between; align-items:center;';
        div.innerHTML = 
          <div>
            <h4 style="margin:0; font-size:1rem;"></h4>
            <p style="margin:0; font-size:0.8rem; color:var(--text-secondary);">Type:  | Status: </p>
          </div>
          <button class="btn-primary" style="font-size:0.75rem;" onclick="claimServiceRequest('')">Manage</button>
        ;
        list.appendChild(div);
      });
    }
  } catch (err) {
    console.error('Failed to load org requests', err);
  }
}

async function loadPatientServices() {
  const list = document.getElementById('patient-services-list');
  try {
    const data = await fetchApi('/api/v1/services/requests');
    if (data && data.length > 0) {
      list.innerHTML = '';
      data.forEach(r => {
        const div = document.createElement('div');
        div.className = 'connection-card';
        div.style = 'padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.5rem; display:flex; justify-content:space-between; align-items:center;';
        let statusBadge = 'badge-pending';
        if (r.status === 'COMPLETED') statusBadge = 'badge-approved';
        if (r.status === 'CANCELLED') statusBadge = 'badge-rejected';
        
        div.innerHTML = 
          <div>
            <h4 style="margin:0; font-size:1rem;"></h4>
            <p style="margin:0; font-size:0.8rem; color:var(--text-secondary);"></p>
          </div>
          <span class="badge "></span>
        ;
        list.appendChild(div);
      });
    }
  } catch (err) {
    console.error('Failed to load patient services', err);
  }
}

async function claimServiceRequest(id) {
  try {
    await fetchApi(/api/v1/services/requests//claim, {
      method: 'PATCH',
      body: JSON.stringify({})
    });
    alert('Task claimed successfully!');
    if (document.getElementById('volunteer-panel') && !document.getElementById('volunteer-panel').classList.contains('hidden')) {
      loadVolunteerPanel();
    } else {
      loadOrganizationPanel();
    }
  } catch (err) {
    alert(err.message || 'Failed to claim task');
  }
}

async function loadAdminPanel() {
  const list = document.getElementById('admin-pending-users-list');
  try {
    const data = await fetchApi('/api/v1/admin/users/pending');
    if (data && data.length > 0) {
      list.innerHTML = '';
      data.forEach(u => {
        const div = document.createElement('div');
        div.className = 'connection-card';
        div.style = 'padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.5rem; display:flex; justify-content:space-between; align-items:center;';
        div.innerHTML = 
          <div>
            <h4 style="margin:0; font-size:1rem;"> </h4>
            <p style="margin:0; font-size:0.8rem; color:var(--text-secondary);"> | </p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn-primary" style="font-size:0.75rem;" onclick="verifyUser('', 'VERIFIED')">Approve</button>
            <button class="btn-secondary" style="font-size:0.75rem; border-color: red; color: red;" onclick="verifyUser('', 'REJECTED')">Reject</button>
          </div>
        ;
        list.appendChild(div);
      });
    } else {
        list.innerHTML = '<p class="text-secondary" style="font-size:0.85rem;">No pending verifications.</p>';
    }
  } catch (err) {
    console.error('Failed to load pending users', err);
  }
}

async function verifyUser(userId, status) {
  try {
    await fetchApi(/api/v1/admin/users//verify, {
      method: 'PATCH',
      body: JSON.stringify({ verificationStatus: status })
    });
    alert(User has been );
    loadAdminPanel();
  } catch (err) {
    alert(err.message || 'Failed to verify user');
  }
}
