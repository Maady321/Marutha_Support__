document.addEventListener('DOMContentLoaded', () => {
    const doctorsContainer = document.getElementById('doctors-container');

    const doctors = [
        {
            name: "Dr. Emily Smith",
            specialty: "Palliative Care Specialist",
            experience: "15 years",
            availability: "Available Today",
            image: "ES",
            color: "var(--lavender-soft)",
            textColor: "var(--medical-blue)",
            rating: 5
        },
        {
            name: "Dr. James Wilson",
            specialty: "Pain Management",
            experience: "12 years",
            availability: "Next Available: Tomorrow",
            image: "JW",
            color: "#fffbeb", // amber-soft
            textColor: "#92400e", // amber-dark
            rating: 4.8
        },
        {
            name: "Dr. Sarah Chen",
            specialty: "Holistic Therapist",
            experience: "8 years",
            availability: "Available Today",
            image: "SC",
            color: "#ecfdf5", // emerald-soft
            textColor: "#065f46", // emerald-dark
            rating: 4.9
        },
        {
            name: "Dr. Michael Ross",
            specialty: "Psychiatrist",
            experience: "20 years",
            availability: "Next Available: Mon",
            image: "MR",
            color: "#eff6ff", // blue-soft
            textColor: "#1e40af", // blue-dark
            rating: 4.7
        }
    ];

    // Clear loading state
    doctorsContainer.innerHTML = '';

    doctors.forEach((doctor, index) => {
        const card = document.createElement('div');
        card.className = 'card fade-in';
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.padding = '32px';
        card.style.borderTop = `4px solid ${index % 2 === 0 ? 'var(--sunshine-yellow)' : 'var(--medical-blue)'}`;
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';

        // Hover effect logic handled via CSS generally, but we can rely on .card:hover from components.css

        const ratingStars = Array(5).fill('<i class="fas fa-star" style="color: #fbbf24; font-size: 0.8rem"></i>').join('');

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                <div class="profile-pic" style="width: 80px; height: 80px; font-size: 2rem; background: ${doctor.color}; color: ${doctor.textColor}; border: 1px solid rgba(0,0,0,0.05);">
                    ${doctor.image}
                </div>
                <span class="badge" style="background: ${doctor.availability.includes('Today') ? '#ecfdf5' : '#fffbeb'}; color: ${doctor.availability.includes('Today') ? '#065f46' : '#92400e'}; border: 1px solid ${doctor.availability.includes('Today') ? '#a7f3d0' : '#fcd34d'}">
                    ${doctor.availability}
                </span>
            </div>
            
            <h3 style="margin-bottom: 8px; color: var(--medical-blue);">${doctor.name}</h3>
            <p style="color: var(--text-muted); font-weight: 500; margin-bottom: 4px;">${doctor.specialty}</p>
            <p style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 20px;">${doctor.experience} experience</p>
            
            <div style="margin-bottom: 24px; display: flex; gap: 4px;">
                ${ratingStars}
                <span style="font-size: 0.85rem; color: var(--text-muted); margin-left: 8px;">(${doctor.rating})</span>
            </div>

            <div style="margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <a href="doctor_profile.html" class="btn btn-outline-lavender" style="justify-content: center;">Profile</a>
                <a href="book_appointment.html" class="btn btn-primary" style="justify-content: center;">Book</a>
            </div>
        `;

        doctorsContainer.appendChild(card);
    });
});
