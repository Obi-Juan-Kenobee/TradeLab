document.addEventListener('DOMContentLoaded', () => {
    const storageOptions = document.querySelectorAll('input[name="storageType"]');
    const fileStorageOptions = document.getElementById('fileStorageOptions');
    const autoBackupCheckbox = document.getElementById('autoBackup');
    const backupIntervalSelect = document.getElementById('backupInterval');
    const saveSettingsBtn = document.getElementById('saveSettings');
    const resetSettingsBtn = document.getElementById('resetSettings');
    const exportDataBtn = document.getElementById('exportData');
    const importDataBtn = document.getElementById('importData');
    const clearDataBtn = document.getElementById('clearData');
    const filePathInput = document.getElementById('filePath');
    const selectPathBtn = document.getElementById('selectPath');
    

    // Load current settings
    const loadSettings = () => {
        const storageType = localStorage.getItem('storagePreference') || 'localStorage';
        const filePath = localStorage.getItem('storageFilePath');
        const defaultView = localStorage.getItem('defaultView') || 'list';
        const dateFormat = localStorage.getItem('dateFormat') || 'MM/DD/YYYY';
        const autoBackup = localStorage.getItem('autoBackup') === 'true';
        const backupInterval = localStorage.getItem('backupInterval') || 'daily';

        // Set storage type
        document.querySelector(`input[value="${storageType}"]`).checked = true;
        fileStorageOptions.style.display = storageType === 'fileStorage' ? 'block' : 'none';

        // Set file path
        if (filePath) {
            filePathInput.value = filePath;
        }

        // Set other options
        document.getElementById('defaultView').value = defaultView;
        document.getElementById('dateFormat').value = dateFormat;
        autoBackupCheckbox.checked = autoBackup;
        backupIntervalSelect.value = backupInterval;
        backupIntervalSelect.disabled = !autoBackup;
    };

    // Handle storage type change
    storageOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            fileStorageOptions.style.display = e.target.value === 'fileStorage' ? 'block' : 'none';
        });
    });

    // Handle auto backup toggle
    autoBackupCheckbox.addEventListener('change', (e) => {
        backupIntervalSelect.disabled = !e.target.checked;
    });

    // Handle file path selection
    selectPathBtn.addEventListener('click', async () => {
        try {
            // This would typically use a file dialog
            // For now, we'll just use a default path
            const defaultPath = `${process.env.USERPROFILE || process.env.HOME}/tradelab_trades.json`;
            filePathInput.value = defaultPath;
        } catch (error) {
            console.error('Error selecting file path:', error);
            alert('Error selecting file path. Please try again.');
        }
    });

    // Handle settings save
    saveSettingsBtn.addEventListener('click', async () => {
        const storageType = document.querySelector('input[name="storageType"]:checked').value;
        const filePath = filePathInput.value;
        const defaultView = document.getElementById('defaultView').value;
        const dateFormat = document.getElementById('dateFormat').value;
        const autoBackup = autoBackupCheckbox.checked;
        const backupInterval = backupIntervalSelect.value;

        try {
            // Save settings to localStorage
            localStorage.setItem('defaultView', defaultView);
            localStorage.setItem('dateFormat', dateFormat);
            localStorage.setItem('autoBackup', autoBackup);
            localStorage.setItem('backupInterval', backupInterval);

            // Update storage strategy
            await tradeManager.setStorageStrategy(storageType, filePath);

            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings. Please try again.');
        }
    });

    // Handle settings reset
    resetSettingsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            localStorage.removeItem('storagePreference');
            localStorage.removeItem('storageFilePath');
            localStorage.removeItem('defaultView');
            localStorage.removeItem('dateFormat');
            localStorage.removeItem('autoBackup');
            localStorage.removeItem('backupInterval');
            loadSettings();
            alert('Settings have been reset to default.');
        }
    });

    // Handle data export
    exportDataBtn.addEventListener('click', async () => {
        try {
            await tradeManager.exportTrades();
        } catch (error) {
            console.error('Error exporting trades:', error);
            alert('Error exporting trades. Please try again.');
        }
    });

    // Handle data import
    importDataBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = async (event) => {
                    try {
                        await tradeManager.importTrades(event.target.result);
                        alert('Trades imported successfully!');
                    } catch (error) {
                        console.error('Error importing trades:', error);
                        alert('Error importing trades. Please make sure the file format is correct.');
                    }
                };
                
                reader.readAsText(file);
            } catch (error) {
                console.error('Error reading file:', error);
                alert('Error reading file. Please try again.');
            }
        };
        
        input.click();
    });

    // Handle data clear
    clearDataBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all trade data? This action cannot be undone.')) {
            try {
                await tradeManager.clearAllTrades();
                alert('All trade data has been cleared.');
            } catch (error) {
                console.error('Error clearing trades:', error);
                alert('Error clearing trades. Please try again.');
            }
        }
    });

    // Initialize settings
    loadSettings();
});
