// Load HTML into a target element
function loadHTML(targetId, file) {
    fetch(file)
        .then(res => res.text())
        .then(data => {
            document.getElementById(targetId).innerHTML = data;

            // If header loaded, initialize its JS
            if (targetId === 'header') {
                initHeader();
                setActiveNavLink();
            }
        });
}

// Initialize header interactions
function initHeader() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
}

// Highlight the current page link
function setActiveNavLink() {
    const links = document.querySelectorAll("header nav a");
    const currentPath = window.location.pathname; // e.g., "/home/menu.html"

    links.forEach(link => {
        const linkPath = link.getAttribute("href");

        // Compare filenames only to handle folders
        if (linkPath.split("/").pop() === currentPath.split("/").pop()) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}
