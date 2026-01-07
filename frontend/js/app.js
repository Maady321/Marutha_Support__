// ---------------------------------------------------------
// MEANING: Define the base URL for the backend API.
// WORDS: 'const' = constant variable; 'API_BASE_URL' = name; 'http://...' = where backend runs.
// EXPLAIN: "We save the address of our backend so we don't have to type it every time we make a request."
// ---------------------------------------------------------
const API_BASE_URL = "http://127.0.0.1:8000";






async function apiFetch(endpoint, options = {}) {
    
    
    
    
    
    options.credentials = "include";

    
    
    
    
    
    if (!options.headers) {
        options.headers = {};
    }
    
    if (!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }

    
    
    
    
    
    const res = await fetch(API_BASE_URL + endpoint, options);

    
    
    
    
    
    if (res.status === 401 && !endpoint.includes("/login")) {
        window.location.href = "/frontend/login.html";
    }

    
    
    
    
    
    return res;
}






async function checkAuth() {
    try {
        
        
        
        
        
        const res = await apiFetch("/auth/me");

        
        
        
        
        
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        
        
        
        
        
        console.log("Not logged in");
    }
    return null;
}






async function logout() {
    
    
    
    
    
    await apiFetch("/auth/logout", { method: "POST" });

    
    
    
    
    
    window.location.href = "/frontend/login.html";
}






function redirectToDashboard(role) {
    if (role === "admin") window.location.href = "admin/dashboard.html";
    else if (role === "doctor") window.location.href = "doctor/dashboard.html";
    else if (role === "volunteer") window.location.href = "volunteer/dashboard.html";
    else window.location.href = "patient/dashboard.html";
}
