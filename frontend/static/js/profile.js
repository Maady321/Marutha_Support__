// Profile page logic

async function loadProfileView() {
  const user = await requireAuth();
  if (!user) return;

  // Set values
  document.getElementById('profile-name').innerText = `${user.firstName} ${user.lastName}`;
  document.getElementById('profile-role').innerText = user.role;
  document.getElementById('profile-email').innerText = user.email;
  document.getElementById('profile-phone').innerText = user.phone || 'Not provided';
  document.getElementById('profile-location').innerText = user.city ? `${user.city}, ${user.zipCode || ''}` : 'Not provided';

  // Verification status badge
  renderVerificationBadge(user.verificationStatus);

  // Load Extra Profile Stats based on role
  const extraContainer = document.getElementById('extra-profile-details');
  if (!extraContainer) return;

  try {
    if (user.role === 'PATIENT') {
      const res = await fetchApi('/api/v1/patients/me');
      const pp = res.data;
      extraContainer.innerHTML = `
        <div class="profile-detail-row">
          <div class="detail-label">Gender</div>
          <div class="detail-value">${pp.gender || 'Not provided'}</div>
        </div>
        <div class="profile-detail-row">
          <div class="detail-label">Date of Birth</div>
          <div class="detail-value">${pp.dateOfBirth || 'Not provided'}</div>
        </div>
        <div class="profile-detail-row">
          <div class="detail-label">Emergency Contact</div>
          <div class="detail-value">
            ${pp.emergencyContactName ? `${pp.emergencyContactName} (${pp.emergencyContactRelationship || 'Other'}) - ${pp.emergencyContactPhone || ''}` : 'Not provided'}
          </div>
        </div>
        <div class="profile-detail-row">
          <div class="detail-label">Medical Notes</div>
          <div class="detail-value">${pp.medicalNotes || 'No medical notes provided.'}</div>
        </div>
      `;
    } else if (user.role === 'DOCTOR') {
      const res = await fetchApi('/api/v1/doctors/me');
      const dp = res.data;
      extraContainer.innerHTML = `
        <div class="profile-detail-row">
          <div class="detail-label">Specialty</div>
          <div class="detail-value">${dp.specialty || 'Not provided'}</div>
        </div>
        <div class="profile-detail-row">
          <div class="detail-label">License Number</div>
          <div class="detail-value">${dp.licenseNumber || 'Not provided'}</div>
        </div>
        <div class="profile-detail-row">
          <div class="detail-label">Hospital</div>
          <div class="detail-value">${dp.hospital || 'Not provided'}</div>
        </div>
        <div class="profile-detail-row">
          <div class="detail-label">Experience</div>
          <div class="detail-value">${dp.yearsOfExperience !== null ? `${dp.yearsOfExperience} years` : 'Not provided'}</div>
        </div>
        <div class="profile-detail-row">
          <div class="detail-label">Status</div>
          <div class="detail-value">${dp.isAcceptingPatients ? 'Accepting Patients' : 'Not Accepting Patients'}</div>
        </div>
        <div class="profile-detail-row">
          <div class="detail-label">Qualifications</div>
          <div class="detail-value">${dp.qualifications || 'Not provided'}</div>
        </div>
        <div class="profile-detail-row">
          <div class="detail-label">Bio</div>
          <div class="detail-value">${dp.bio || 'No bio provided.'}</div>
        </div>
      `;
    } else if (user.role === 'VOLUNTEER') {
      const res = await fetchApi('/api/v1/volunteers/me');
      const vp = res.data;
      extraContainer.innerHTML = `
        <div class="profile-detail-row">
          <div class="detail-label">Skills</div>
          <div class="detail-value">${vp.skills && vp.skills.length > 0 ? vp.skills.join(', ') : 'No skills listed'}</div>
        </div>
        <div class="profile-detail-row">
          <div class="detail-label">Tasks Completed</div>
          <div class="detail-value">${vp.totalTasksCompleted}</div>
        </div>
        <div class="profile-detail-row">
          <div class="detail-label">Bio</div>
          <div class="detail-value">${vp.bio || 'No bio provided.'}</div>
        </div>
      `;
    }
  } catch (err) {
    console.error('Failed to load extra profile details:', err);
  }
}

async function loadProfileEdit() {
  const user = await requireAuth();
  if (!user) return;

  // Base profile bindings
  const form = document.getElementById('edit-profile-form');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const phoneInput = document.getElementById('phone');
  const cityInput = document.getElementById('city');
  const zipCodeInput = document.getElementById('zipCode');
  
  if (firstNameInput) firstNameInput.value = user.firstName || '';
  if (lastNameInput) lastNameInput.value = user.lastName || '';
  if (phoneInput) phoneInput.value = user.phone || '';
  if (cityInput) cityInput.value = user.city || '';
  if (zipCodeInput) zipCodeInput.value = user.zipCode || '';

  // Render role-specific inputs
  const roleExtraFields = document.getElementById('role-extra-edit-fields');
  if (roleExtraFields) {
    roleExtraFields.innerHTML = '';
    
    try {
      if (user.role === 'PATIENT') {
        const res = await fetchApi('/api/v1/patients/me');
        const pp = res.data;
        roleExtraFields.innerHTML = `
          <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: white;">Patient Medical Profile</h3>
          <div class="form-group">
            <label for="gender">Gender</label>
            <input type="text" id="gender" class="form-input" value="${pp.gender || ''}" placeholder="e.g. Female, Male">
          </div>
          <div class="form-group">
            <label for="dateOfBirth">Date of Birth</label>
            <input type="date" id="dateOfBirth" class="form-input" value="${pp.dateOfBirth || ''}">
          </div>
          <div class="form-group">
            <label for="emergencyContactName">Emergency Contact Name</label>
            <input type="text" id="emergencyContactName" class="form-input" value="${pp.emergencyContactName || ''}">
          </div>
          <div class="form-group">
            <label for="emergencyContactPhone">Emergency Contact Phone</label>
            <input type="text" id="emergencyContactPhone" class="form-input" value="${pp.emergencyContactPhone || ''}">
          </div>
          <div class="form-group">
            <label for="emergencyContactRelationship">Emergency Contact Relationship</label>
            <input type="text" id="emergencyContactRelationship" class="form-input" value="${pp.emergencyContactRelationship || ''}" placeholder="e.g. Spouse, Parent">
          </div>
          <div class="form-group">
            <label for="medicalNotes">Medical Notes</label>
            <textarea id="medicalNotes" class="form-input" rows="4" placeholder="Any medical history, drug allergies etc.">${pp.medicalNotes || ''}</textarea>
          </div>
        `;
      } else if (user.role === 'DOCTOR') {
        const res = await fetchApi('/api/v1/doctors/me');
        const dp = res.data;
        roleExtraFields.innerHTML = `
          <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: white;">Doctor Professional Profile</h3>
          <div class="form-group">
            <label for="specialty">Specialty</label>
            <input type="text" id="specialty" class="form-input" value="${dp.specialty || ''}">
          </div>
          <div class="form-group">
            <label for="licenseNumber">License Number</label>
            <input type="text" id="licenseNumber" class="form-input" value="${dp.licenseNumber || ''}">
          </div>
          <div class="form-group">
            <label for="hospital">Hospital / Clinic</label>
            <input type="text" id="hospital" class="form-input" value="${dp.hospital || ''}">
          </div>
          <div class="form-group">
            <label for="yearsOfExperience">Years of Experience</label>
            <input type="number" id="yearsOfExperience" class="form-input" value="${dp.yearsOfExperience !== null ? dp.yearsOfExperience : ''}" min="0">
          </div>
          <div class="form-group" style="display:flex; align-items:center; gap: 0.5rem;">
            <input type="checkbox" id="isAcceptingPatients" style="width: 1.25rem; height: 1.25rem; cursor:pointer;" ${dp.isAcceptingPatients ? 'checked' : ''}>
            <label for="isAcceptingPatients" style="margin-bottom:0; cursor:pointer;">Accepting Patients</label>
          </div>
          <div class="form-group">
            <label for="qualifications">Qualifications</label>
            <textarea id="qualifications" class="form-input" rows="3" placeholder="e.g. MBBS, MD">${dp.qualifications || ''}</textarea>
          </div>
          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea id="bio" class="form-input" rows="3" placeholder="Brief professional description...">${dp.bio || ''}</textarea>
          </div>
        `;
      } else if (user.role === 'VOLUNTEER') {
        const res = await fetchApi('/api/v1/volunteers/me');
        const vp = res.data;
        roleExtraFields.innerHTML = `
          <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: white;">Volunteer Profile</h3>
          <div class="form-group">
            <label for="skills">Skills (comma separated)</label>
            <input type="text" id="skills" class="form-input" value="${vp.skills ? vp.skills.join(', ') : ''}" placeholder="e.g. First Aid, Counseling, Logistics">
          </div>
          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea id="bio" class="form-input" rows="4" placeholder="Tell us about yourself...">${vp.bio || ''}</textarea>
          </div>
        `;
      }
    } catch (err) {
      console.error('Failed to load role extra fields for editing:', err);
    }
  }

  // Handle Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const submitError = document.getElementById('submit-error-alert');
      
      if (submitError) submitError.classList.add('hidden');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving...';
      }

      try {
        // 1. Save Base Profile
        const baseData = {
          firstName: firstNameInput.value.trim(),
          lastName: lastNameInput.value.trim(),
          phone: phoneInput.value.trim() || null,
          city: cityInput.value.trim() || null,
          zipCode: zipCodeInput.value.trim() || null
        };
        
        await fetchApi('/api/v1/users/me', {
          method: 'PATCH',
          body: JSON.stringify(baseData)
        });

        // 2. Save Role Specific Profile
        if (user.role === 'PATIENT') {
          const dobVal = document.getElementById('dateOfBirth').value;
          const patientData = {
            gender: document.getElementById('gender').value.trim() || null,
            dateOfBirth: dobVal ? dobVal : null,
            emergencyContactName: document.getElementById('emergencyContactName').value.trim() || null,
            emergencyContactPhone: document.getElementById('emergencyContactPhone').value.trim() || null,
            emergencyContactRelationship: document.getElementById('emergencyContactRelationship').value.trim() || null,
            medicalNotes: document.getElementById('medicalNotes').value.trim() || null
          };
          await fetchApi('/api/v1/patients/me', {
            method: 'PATCH',
            body: JSON.stringify(patientData)
          });
        } else if (user.role === 'DOCTOR') {
          const yoe = document.getElementById('yearsOfExperience').value;
          const doctorData = {
            specialty: document.getElementById('specialty').value.trim() || '',
            licenseNumber: document.getElementById('licenseNumber').value.trim() || '',
            hospital: document.getElementById('hospital').value.trim() || null,
            yearsOfExperience: yoe !== '' ? parseInt(yoe) : null,
            isAcceptingPatients: document.getElementById('isAcceptingPatients').checked,
            qualifications: document.getElementById('qualifications').value.trim() || null,
            bio: document.getElementById('bio').value.trim() || null
          };
          await fetchApi('/api/v1/doctors/me', {
            method: 'PATCH',
            body: JSON.stringify(doctorData)
          });
        } else if (user.role === 'VOLUNTEER') {
          const skillsStr = document.getElementById('skills').value.trim();
          const volunteerData = {
            skills: skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(s => s !== '') : [],
            bio: document.getElementById('bio').value.trim() || null
          };
          await fetchApi('/api/v1/volunteers/me', {
            method: 'PATCH',
            body: JSON.stringify(volunteerData)
          });
        }

        // Redirect back to profile page
        window.location.href = '/profile';

      } catch (err) {
        if (submitError) {
          submitError.innerText = err.message || 'Failed to save profile';
          submitError.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Save Profile';
        }
      }
    });
  }
}

// Bind load functions on page match
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path === '/profile') {
    loadProfileView();
  } else if (path === '/profile/edit') {
    loadProfileEdit();
  }
});
