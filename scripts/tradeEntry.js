// Event listeners for trade direction buttons
document.addEventListener('DOMContentLoaded', () => {
    const longButton = document.querySelector('.direction-btn.long');
    const shortButton = document.querySelector('.direction-btn.short');
    const directionInput = document.getElementById('direction');

    function setDirection(direction) {
        // Update the hidden input value
        directionInput.value = direction;
        
        // Update button styles
        if (direction === 'long') {
            longButton.classList.add('active');
            shortButton.classList.remove('active');
        } else {
            shortButton.classList.add('active');
            longButton.classList.remove('active');
        }
    }

    // Add click event listeners
    longButton.addEventListener('click', () => setDirection('long'));
    shortButton.addEventListener('click', () => setDirection('short'));

    // Set initial state
    setDirection('long');
});