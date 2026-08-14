function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

async function fetchApi(url, options = {}) {
  // Set headers
  options.headers = options.headers || {};
  
  // Content Type default to JSON if body present and not FormData
  if (options.body && !(options.body instanceof FormData) && !options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }
  
  // CSRF Protection: include X-CSRF-Token header if cookie csrf_token exists
  const csrfToken = getCookie('csrf_token');
  if (csrfToken && ['POST', 'PATCH', 'DELETE', 'PUT'].includes(options.method?.toUpperCase())) {
    options.headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Credentials include for sameSite cookies
  options.credentials = 'include';

  try {
    const res = await fetch(url, options);
    
    if (res.status === 401) {
      // Session expired or unauthorized: redirect to login
      // Prevent redirect loop if already on public pages
      const path = window.location.pathname;
      const publicPaths = ['/', '/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
      if (!publicPaths.includes(path)) {
        window.location.href = '/login';
        return;
      }
    }
    
    if (!res.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // failed to parse JSON, use statusText
        errorMessage = res.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // Parse JSON response if content exists
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.error('API Error:', err.message);
    throw err;
  }
}
