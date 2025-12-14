document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact-form');
    const successMessage = document.getElementById('success-message');

    contactForm.addEventListener('submit', (e) => {
        // Prevent page reload
        e.preventDefault();

        // Get form fields
        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();

        // Validate all fields are filled
        if (!fullname || !email || !message) {
            alert('Please fill in all fields before sending.');
            return;
        }

        // Optional: Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        // All validation passed - show success message
        showSuccessMessage();

        // Clear form fields
        contactForm.reset();
    });

    function showSuccessMessage() {
        // Show message with fade-in
        successMessage.classList.remove('hidden');
        successMessage.classList.add('show');

        // Hide message after 3 seconds with fade-out
        setTimeout(() => {
            successMessage.classList.remove('show');
            successMessage.classList.add('fade-out');

            // Remove fade-out class and add hidden after animation completes
            setTimeout(() => {
                successMessage.classList.remove('fade-out');
                successMessage.classList.add('hidden');
            }, 500); // Match the CSS transition duration
        }, 3000);
    }
});
