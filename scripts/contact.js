document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    
    // Create success and error message elements
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.style.display = 'none';
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.display = 'none';
    
    // Insert messages before the form
    contactForm.parentNode.insertBefore(successMessage, contactForm);
    contactForm.parentNode.insertBefore(errorMessage, contactForm);
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide any existing messages
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        
        // Get form data
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value.trim()
        };
        
        // Basic validation
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            errorMessage.textContent = 'Please fill in all required fields.';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            errorMessage.textContent = 'Please enter a valid email address.';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Simulate form submission
        try {
            // Here you would typically send the data to your backend
            // For now, we'll just simulate a successful submission
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Show success message
            successMessage.textContent = 'Thank you for your message! We will get back to you soon.';
            successMessage.style.display = 'block';
            
            // Reset form
            contactForm.reset();
            
        } catch (error) {
            // Show error message
            errorMessage.textContent = 'An error occurred. Please try again later.';
            errorMessage.style.display = 'block';
        }
    });
    
    // Clear messages when user starts typing
    const formInputs = contactForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', () => {
            successMessage.style.display = 'none';
            errorMessage.style.display = 'none';
        });
    });
});
