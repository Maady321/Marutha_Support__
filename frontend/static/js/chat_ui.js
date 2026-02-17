/**
 * Marutha Support - Chat UI JS
 * Handles Sidebar switching and UI updates for chat views
 */

document.addEventListener('DOMContentLoaded', () => {
    initChatSidebar();
});

/**
 * Initialize Chat Sidebar logic
 */
function initChatSidebar() {
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        item.addEventListener('click', function() {
            const name = this.querySelector('h4').innerText;
            selectChat(this, name);
        });
    });
}

/**
 * Handle chat selection from sidebar
 */
function selectChat(element, name) {
    // Remove active class from all items
    document.querySelectorAll(".chat-item").forEach((item) => item.classList.remove("active"));
    
    // Add active class to clicked item
    element.classList.add("active");
    
    // Update header name
    const headerTitle = document.querySelector(".chat-header h3");
    if (headerTitle) headerTitle.innerText = name;

    // Update initials in profile pic
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2);

    const profilePic = document.querySelector(".chat-header .profile-pic");
    if (profilePic) profilePic.innerText = initials;
}
