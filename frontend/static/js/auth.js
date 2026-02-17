/**
 * Marutha Support - Authentication JS
 * Handles Login, Registration, and Role Management.
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-box form');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        initLogin(loginForm);
    }

    if (registerForm) {
        initRegistration(registerForm);
    }

    // Handle role selection in register.html if applicable
    setupRoleCards();
});

/**
 * Role Selection logic for register.html
 */
function setupRoleCards() {
    const roleCards = document.querySelectorAll('.role-card');
    if (roleCards.length > 0) {
        roleCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const currentHref = card.getAttribute('href');
                let role = 'patient';
                if (currentHref.includes('role=doctor')) role = 'doctor';
                if (currentHref.includes('role=volunteer')) role = 'volunteer';
                
                localStorage.setItem('tempRole', role);
                window.location.href = `create_account.html?role=${role}`;
            });
        });
    }
}

/**
 * Login Logic
 */
function initLogin(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Signing In...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and role from server
                localStorage.setItem('authToken', data.access_token);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('isLoggedIn', 'true');

                // Redirect based on server role
                let target = 'dashboard_patient.html';
                if (data.role === 'doctor') target = 'dashboard_doctor.html';
                if (data.role === 'volunteer') target = 'dashboard_volunteer.html';

                window.location.href = target;
            } else {
                alert(data.detail || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please ensure the backend is running.');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

/**
 * Registration Logic
 */
function initRegistration(form) {
    const urlParams = new URLSearchParams(window.location.search);
    let role = urlParams.get('role') || localStorage.getItem('tempRole') || 'patient';
    
    const roleInput = document.getElementById('role');
    const roleSubtitle = document.getElementById('role-subtitle');
    
    if (roleInput) roleInput.value = role;
    if (roleSubtitle) {
        const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
        roleSubtitle.textContent = `Join us as a ${roleDisplay}`;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (password !== confirm) {
            alert('Passwords do not match!');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Creating Account...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role, name })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Account created successfully! Please sign in.');
                window.location.href = 'login.html';
            } else {
                alert(data.detail || 'Registration failed.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration.');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

/**
 * Handle Forgot Password
 */
const forgotForm = document.getElementById("forgotPasswordForm");
if (forgotForm) {
    forgotForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const submitBtn = forgotForm.querySelector('button[type="submit"]');
        submitBtn.innerText = 'Sending...';
        submitBtn.disabled = true;

        setTimeout(() => {
            forgotForm.style.display = "none";
            const successMsg = document.getElementById("successMessage");
            if (successMsg) successMsg.style.display = "block";

            setTimeout(() => {
                window.location.href = "login.html";
            }, 5000);
        }, 1500);
    });
}
