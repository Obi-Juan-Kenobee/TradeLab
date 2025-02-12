// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Function to switch tabs
    function switchTab(tabId) {
        // Remove active class from all tabs and contents
        tabButtons.forEach(button => button.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
        const selectedContent = document.getElementById(`${tabId}-tab`);
        
        if (selectedButton && selectedContent) {
            selectedButton.classList.add('active');
            selectedContent.classList.add('active');
        }
    }

    // Add click event listeners to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Handle form submission
    const tradeForm = document.getElementById('tradeForm');
    tradeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get the active tab
        const activeTab = document.querySelector('.tab-content.active');
        const tabId = activeTab.id.replace('-tab', '');
        
        // Get form data based on active tab
        const formData = new FormData();
        
        // Common fields
        formData.append('date', document.getElementById('date').value);
        formData.append('direction', document.getElementById('direction').value);
        formData.append('notes', document.getElementById('notes').value);
        
        // Tab-specific fields
        switch(tabId) {
            case 'stocks':
                formData.append('symbol', document.getElementById('symbol').value);
                formData.append('entryPrice', document.getElementById('entryPrice').value);
                formData.append('exitPrice', document.getElementById('exitPrice').value);
                formData.append('quantity', document.getElementById('quantity').value);
                formData.append('market', 'stock');
                break;
                
            case 'futures':
                formData.append('symbol', document.getElementById('futures-symbol').value);
                formData.append('expiry', document.getElementById('futures-expiry').value);
                formData.append('entryPrice', document.getElementById('futures-entry').value);
                formData.append('exitPrice', document.getElementById('futures-exit').value);
                formData.append('quantity', document.getElementById('futures-quantity').value);
                formData.append('market', 'futures');
                break;
                
            case 'options':
                formData.append('underlying', document.getElementById('options-underlying').value);
                formData.append('type', document.getElementById('options-type').value);
                formData.append('strike', document.getElementById('options-strike').value);
                formData.append('expiry', document.getElementById('options-expiry').value);
                formData.append('entryPrice', document.getElementById('options-entry').value);
                formData.append('exitPrice', document.getElementById('options-exit').value);
                formData.append('quantity', document.getElementById('options-quantity').value);
                formData.append('market', 'options');
                break;
                
            case 'crypto':
                formData.append('symbol', document.getElementById('crypto-symbol').value);
                formData.append('entryPrice', document.getElementById('crypto-entry').value);
                formData.append('exitPrice', document.getElementById('crypto-exit').value);
                formData.append('quantity', document.getElementById('crypto-quantity').value);
                formData.append('market', 'crypto');
                break;
        }
        
        // TODO: Send formData to server
        console.log('Form submitted:', Object.fromEntries(formData));
    });

    // Direction button functionality
    const directionButtons = document.querySelectorAll('.direction-btn');
    const directionInput = document.getElementById('direction');

    directionButtons.forEach(button => {
        button.addEventListener('click', () => {
            directionButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            directionInput.value = button.getAttribute('data-direction');
        });
    });
});
