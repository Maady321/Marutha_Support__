/**
 * doctors.js — Load and display list of doctors from the API
 * When patient clicks "View Profile", goes to doctor_profile.html?id=X
 */

document.addEventListener('DOMContentLoaded', async () => {
    const doctorsContainer = document.getElementById('doctors-container');
    if (!doctorsContainer) return;

    try {
        // Fetch all doctors from backend
        const response = await apiFetch('/doctors/');
        if (!response.ok) {
            throw new Error('Failed to fetch doctors');
        }

        const doctors = await response.json();

        doctorsContainer.innerHTML = '';

        if (doctors.length === 0) {
            doctorsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted)">
                    <i class="fas fa-user-md" style="font-size: 3rem; color: var(--medical-blue-light); margin-bottom: 16px; display: block"></i>
                    <p style="font-size: 1.1rem">No doctors available at the moment.</p>
                    <p style="font-size: 0.9rem; margin-top: 8px">Please check back later.</p>
                </div>`;
            return;
        }

        doctors.forEach((doctor, index) => {
            const initials = (doctor.name || 'Dr').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const isAvailable = doctor.is_online;
            const colors = [
                { bg: 'var(--lavender-soft)', text: 'var(--medical-blue)', border: 'var(--medical-blue)' },
                { bg: '#fffbeb', text: '#92400e', border: '#f59e0b' },
                { bg: '#ecfdf5', text: '#065f46', border: '#10b981' },
                { bg: '#eff6ff', text: '#1e40af', border: '#3b82f6' }
            ];
            const color = colors[index % colors.length];

            const card = document.createElement('div');
            card.className = 'card fade-in';
            card.style.cssText = `
                animation-delay: ${index * 0.1}s;
                display: flex;
                flex-direction: column;
                padding: 32px;
                border-top: 4px solid ${color.border};
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            `;

            const expText = doctor.experience ? `${doctor.experience} years experience` : 'Experience not listed';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                    <div class="profile-pic" style="width: 80px; height: 80px; font-size: 2rem; background: ${color.bg}; color: ${color.text}; border: 1px solid rgba(0,0,0,0.05);">
                        ${initials}
                    </div>
                    <span class="badge" style="background: ${isAvailable ? '#ecfdf5' : '#fef3c7'}; color: ${isAvailable ? '#065f46' : '#92400e'}; border: 1px solid ${isAvailable ? '#a7f3d0' : '#fcd34d'}">
                        ${isAvailable ? 'Available Now' : 'Offline'}
                    </span>
                </div>
                
                <h3 style="margin-bottom: 8px; color: var(--medical-blue);">${doctor.name || 'Doctor'}</h3>
                <p style="color: var(--text-muted); font-weight: 500; margin-bottom: 4px;">${doctor.specialty || 'General Medicine'}</p>
                <p style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 12px;">${expText}</p>
                
                ${doctor.qualification ? `
                    <div style="margin-bottom: 20px;">
                        <span class="badge" style="background: #dbeafe; color: #1e40af; font-size: 0.78rem">
                            <i class="fas fa-graduation-cap" style="margin-right: 4px"></i> ${doctor.qualification}
                        </span>
                    </div>` : '<div style="margin-bottom: 20px;"></div>'}

                <div style="margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <a href="doctor_profile.html?id=${doctor.id}" class="btn btn-outline-lavender" style="justify-content: center;">
                        <i class="fas fa-user" style="margin-right: 6px"></i> Profile
                    </a>
                    <a href="doctor_profile.html?id=${doctor.id}" class="btn btn-primary" style="justify-content: center;">
                        <i class="fas fa-calendar-plus" style="margin-right: 6px"></i> Consult
                    </a>
                </div>
            `;

            doctorsContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading doctors:', error);
        doctorsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted)">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--danger); margin-bottom: 16px; display: block"></i>
                <p>Failed to load doctors list</p>
            </div>`;
    }
});
