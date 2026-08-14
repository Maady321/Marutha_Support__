let currentTab = 'doctors';

document.addEventListener('DOMContentLoaded', () => {
  // Update navbar based on auth
  const token = localStorage.getItem('token');
  if (token) {
    document.getElementById('nav-login').classList.add('hidden');
    document.getElementById('nav-register').classList.add('hidden');
    document.getElementById('nav-dashboard').classList.remove('hidden');
  }

  // Load initial data
  performSearch();
});

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('btn-doctors').classList.toggle('active', tab === 'doctors');
  document.getElementById('btn-hospitals').classList.toggle('active', tab === 'hospitals');
  document.getElementById('search-input').value = '';
  performSearch();
}

async function performSearch() {
  const query = document.getElementById('search-input').value.trim();
  const grid = document.getElementById('directory-grid');
  grid.innerHTML = '<p class="text-secondary">Loading...</p>';
  
  try {
    if (currentTab === 'doctors') {
      let url = '/api/v1/directory/doctors';
      if (query) {
        url += `?specialty=${encodeURIComponent(query)}`;
      }
      const data = await fetchApi(url);
      renderDoctors(data);
    } else {
      let url = '/api/v1/directory/hospitals';
      // For simplicity, we just fetch all and filter client side if needed, or backend can be updated to accept query.
      const data = await fetchApi(url);
      renderHospitals(data, query);
    }
  } catch (err) {
    grid.innerHTML = `<p class="text-secondary" style="color: red;">Error: ${err.message}</p>`;
  }
}

function renderDoctors(doctors) {
  const grid = document.getElementById('directory-grid');
  grid.innerHTML = '';
  
  if (!doctors || doctors.length === 0) {
    grid.innerHTML = '<p class="text-secondary">No doctors found matching your criteria.</p>';
    return;
  }
  
  doctors.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>Dr. ${doc.firstName} ${doc.lastName}</h3>
      <p style="font-weight: 500; color: var(--text-color);">${doc.specialty || 'General Practitioner'}</p>
      <p>Hospital: ${doc.hospital || 'Independent Clinic'}</p>
      <p>Experience: ${doc.yearsOfExperience ? doc.yearsOfExperience + ' years' : 'N/A'}</p>
      <p style="margin-top: 0.5rem; font-size: 0.85rem;">${doc.bio || ''}</p>
      <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-color);">
        <p style="margin-bottom: 0.5rem;"><strong>Status:</strong> ${doc.isAcceptingPatients ? '<span style="color: green;">Accepting Patients</span>' : '<span style="color: red;">Not Accepting Patients</span>'}</p>
        <button class="btn-secondary w-full" onclick="alert('Login required to book an appointment.')">Request Consultation</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderHospitals(hospitals, query) {
  const grid = document.getElementById('directory-grid');
  grid.innerHTML = '';
  
  // Client side filtering for hospital name if query exists
  if (query) {
    hospitals = hospitals.filter(h => h.hospitalName.toLowerCase().includes(query.toLowerCase()));
  }
  
  if (!hospitals || hospitals.length === 0) {
    grid.innerHTML = '<p class="text-secondary">No hospitals found matching your criteria.</p>';
    return;
  }
  
  hospitals.forEach(hosp => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${hosp.hospitalName}</h3>
      ${hosp.palliativeCareUnit ? '<span class="badge">Palliative Care Unit</span>' : ''}
      <div style="margin-top: 1rem;">
        <p><strong>Contact Person:</strong> ${hosp.contactPerson || 'N/A'}</p>
        <p><strong>Phone:</strong> ${hosp.contactPhone || 'N/A'}</p>
      </div>
      <div style="margin-top: auto; padding-top: 1rem;">
        <button class="btn-secondary w-full" onclick="alert('Login required to contact hospital.')">Contact Hospital</button>
      </div>
    `;
    grid.appendChild(card);
  });
}
