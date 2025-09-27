// This script is optional but adds a professional smooth-scrolling effect.

document.addEventListener('DOMContentLoaded', function() {
    // Select all navigation links
    const navLinks = document.querySelectorAll('.nav-link, .nav-logo, .hero-section .btn-connect');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Prevent the default jump-to-anchor behavior
            e.preventDefault();

            // Get the target section's ID from the href attribute
            const targetId = this.getAttribute('href');
            
            // Find the target element on the page
            const targetSection = document.querySelector(targetId);

            // Scroll smoothly to the target section
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});