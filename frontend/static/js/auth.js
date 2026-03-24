// auth.js - Login and Registration
// Handles user login, account creation, and role selection

document.addEventListener('DOMContentLoaded', function() {
    var loginForm = document.getElementById('loginForm');
    var registerForm = document.getElementById('registerForm');

    if (loginForm) {
        initLogin(loginForm);
    }

    if (registerForm) {
        initRegistration(registerForm);
    }

    // Handle role selection cards on register page
    setupRoleCards();
});


// ---- Role Selection ----
// When user clicks a role card (Patient/Doctor/Volunteer), save the role and redirect

function setupRoleCards() {
    var roleCards = document.querySelectorAll('.role-card');

    for (var i = 0; i < roleCards.length; i++) {
        roleCards[i].addEventListener('click', function(e) {
            e.preventDefault();
            var currentHref = this.getAttribute('href');
            var role = 'patient';

            if (currentHref.includes('role=doctor')) {
                role = 'doctor';
            }
            if (currentHref.includes('role=volunteer')) {
                role = 'volunteer';
            }

            localStorage.setItem('tempRole', role);
            window.location.href = 'create_account.html?role=' + role;
        });
    }
}


// ---- Login ----
function initLogin(form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        var email = document.getElementById('email').value;
        var password = document.getElementById('password').value;

        if (!email || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        var originalText = submitBtn.innerText;
        submitBtn.innerText = 'Signing In...';
        submitBtn.disabled = true;

        try {
            var response = await apiFetch('/login', {
                method: 'POST',
                body: JSON.stringify({ email: email, password: password })
            });

            var data = await response.json();

            if (response.ok) {
                // Save login info to localStorage
                localStorage.setItem('authToken', data.access_token);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('isLoggedIn', 'true');

                // Redirect to the right dashboard
                var target = 'dashboard_patient.html';
                if (data.role === 'doctor') {
                    target = 'dashboard_doctor.html';
                }
                if (data.role === 'volunteer') {
                    target = 'dashboard_volunteer.html';
                }

                window.location.href = target;
            } else {
                showNotification(data.detail || 'Login failed. Please check your credentials.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('An error occurred during login. Please ensure the backend is running.', 'error');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}


// ---- Registration ----
function initRegistration(form) {
    var urlParams = new URLSearchParams(window.location.search);
    var role = urlParams.get('role') || localStorage.getItem('tempRole') || 'patient';

    var roleInput = document.getElementById('role');
    var roleSubtitle = document.getElementById('role-subtitle');

    if (roleInput) {
        roleInput.value = role;
    }

    if (roleSubtitle) {
        var roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
        roleSubtitle.textContent = 'Join us as a ' + roleDisplay;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        var name = document.getElementById('fullname').value;
        var email = document.getElementById('email').value;
        var password = document.getElementById('password').value;
        var confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showNotification('Passwords do not match!', 'error');
            return;
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        var originalText = submitBtn.innerText;
        submitBtn.innerText = 'Creating Account...';
        submitBtn.disabled = true;

        try {
            var response = await apiFetch('/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: email,
                    password: password,
                    role: role,
                    name: name
                })
            });

            var data = await response.json();

            if (response.ok) {
                localStorage.setItem('pendingNotification', JSON.stringify({message: 'Account created successfully! Please sign in.', type: 'success'}));
                window.location.href = 'login.html';
            } else {
                showNotification(data.detail || 'Registration failed.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('An error occurred during registration.', 'error');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}


// ---- Forgot Password ----
var forgotForm = document.getElementById("forgotPasswordForm");
if (forgotForm) {
    forgotForm.addEventListener("submit", function(e) {
        e.preventDefault();
        var submitBtn = forgotForm.querySelector('button[type="submit"]');
        submitBtn.innerText = 'Sending...';
        submitBtn.disabled = true;

        setTimeout(function() {
            forgotForm.style.display = "none";
            var successMsg = document.getElementById("successMessage");
            if (successMsg) {
                successMsg.style.display = "block";
            }

            setTimeout(function() {
                window.location.href = "login.html";
            }, 5000);
        }, 1500);
    });
}
