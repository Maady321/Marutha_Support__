// Authentication & Form Handlers

async function checkAuthStatus() {
  try {
    const data = await fetchApi('/api/v1/auth/me');
    return data && data.data ? data.data : null;
  } catch (e) {
    return null;
  }
}

// Redirect helpers
async function requireAuth() {
  const user = await checkAuthStatus();
  if (!user) {
    window.location.href = '/login';
  }
  return user;
}

async function requireGuest() {
  const user = await checkAuthStatus();
  if (user) {
    window.location.href = '/dashboard';
  }
}

// Logout handler
async function handleLogout() {
  try {
    await fetchApi('/api/v1/auth/logout', { method: 'POST' });
  } catch (e) {
    console.error('Logout failed:', e);
  }
  window.location.href = '/login';
}

// Setup common page behaviors on load
document.addEventListener('DOMContentLoaded', () => {
  // Bind logout button if present
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
});
