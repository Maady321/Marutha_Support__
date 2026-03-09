// assigned_patients.js - Volunteer's Assigned Patients Search
// Handles searching/filtering the patient list on the volunteer dashboard

document.addEventListener('DOMContentLoaded', function() {
    initSearch();
});


function initSearch() {
    var searchInput = document.getElementById('patient-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        var query = e.target.value.toLowerCase();
        var patientItems = document.querySelectorAll('.patient-item, .patient-card');

        for (var i = 0; i < patientItems.length; i++) {
            var item = patientItems[i];
            var text = item.innerText.toLowerCase();

            if (text.indexOf(query) >= 0) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        }
    });
}
