# User Flow Issues - Marutha Support

## Critical Issues Found:

### 1. **Login Page - No Role-Based Routing** ❌

**File:** `login.html` (Line 165)
**Issue:** Login form always redirects to `dashboard.html` (Patient Dashboard)
**Problem:** Doctors and Volunteers cannot access their respective dashboards after login
**Expected:** Should route based on user role:

- Patient → `dashboard.html`
- Doctor → `dashboard_doctor.html`
- Volunteer → `dashboard_volunteer.html`

**Fix Needed:** Add role selection or dynamic routing logic

---

### 2. **Registration Flow - Missing Role Persistence** ⚠️

**Files:** `register.html` → `setup_profile_*.html`
**Issue:** Role selection on registration page doesn't persist through the flow
**Problem:**

- User selects role (Patient/Doctor/Volunteer) on register page
- Gets redirected to profile setup
- After profile setup, no way to know which dashboard to show
  **Expected:** Role should be stored and used for proper dashboard routing

---

### 3. **Chat Page - Empty Form Action** ⚠️

**File:** `chat.html` (Line 88)
**Issue:** Message form has `action=""` (empty)
**Problem:** Submitting a message doesn't go anywhere
**Expected:** Should have proper message submission endpoint or stay on same page

---

## Navigation Flow Analysis:

### ✅ **Patient Flow (Working)**

```
login.html → dashboard.html → doctors.html
                            → logs.html → log_new.html
                            → chat.html
                            → setup_profile.html
```

### ⚠️ **Doctor Flow (Partially Working)**

```
login.html → ❌ (goes to patient dashboard instead)
Should be: login.html → dashboard_doctor.html → patients.html
                                               → requests.html
                                               → setup_profile_doctor.html
```

### ⚠️ **Volunteer Flow (Partially Working)**

```
login.html → ❌ (goes to patient dashboard instead)
Should be: login.html → dashboard_volunteer.html → assigned_patients.html
                                                  → volunteer_tasks.html
                                                  → volunteer_reports.html
                                                  → setup_profile_volunteer.html
```

---

## Recommendations:

### **Immediate Fixes:**

1. **Update Login Page**
   - Add role selector (dropdown or radio buttons)
   - Route to appropriate dashboard based on role

2. **Update Registration Flow**
   - Pass role parameter through profile setup
   - Redirect to correct dashboard after profile completion

3. **Fix Chat Form**
   - Add proper form action or use JavaScript to handle submission

### **Future Enhancements:**

1. **Add Role-Based Access Control**
   - Prevent patients from accessing doctor/volunteer pages
   - Add authentication checks on each page

2. **Add Breadcrumbs**
   - Help users understand their current location
   - Improve navigation clarity

3. **Add "Back" Buttons**
   - Especially on profile setup pages
   - Allow users to go back to registration if needed

---

## Page Inventory:

### Patient Pages (7):

- ✅ dashboard.html
- ✅ doctors.html
- ✅ logs.html
- ✅ log_new.html
- ✅ chat.html
- ✅ setup_profile.html
- ✅ login.html (shared)

### Doctor Pages (4):

- ✅ dashboard_doctor.html
- ✅ patients.html
- ✅ requests.html
- ✅ setup_profile_doctor.html

### Volunteer Pages (5):

- ✅ dashboard_volunteer.html
- ✅ assigned_patients.html
- ✅ volunteer_tasks.html
- ✅ volunteer_reports.html
- ✅ setup_profile_volunteer.html

### Shared Pages (2):

- ✅ login.html
- ✅ register.html

**Total: 18 HTML pages**
