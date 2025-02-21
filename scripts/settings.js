document.addEventListener("DOMContentLoaded", () => {
  const storageOptions = document.querySelectorAll('input[name="storageType"]');
  const autoBackupCheckbox = document.getElementById("autoBackup");
  const backupIntervalSelect = document.getElementById("backupInterval");
  const saveSettingsBtn = document.getElementById("saveSettings");
  const resetSettingsBtn = document.getElementById("resetSettings");
  const exportDataBtn = document.getElementById("exportData");
  const importDataBtn = document.getElementById("importData");
  const clearDataBtn = document.getElementById("clearData");
  const themeSelect = document.getElementById("theme");

  // User profile elements
  const updateUsernameBtn = document.getElementById("updateUsername");
  const updateEmailBtn = document.getElementById("updateEmail");
  const updatePasswordBtn = document.getElementById("updatePassword");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  // Storage info elements
  const availableStorageEl = document.getElementById("availableStorage");
  const usedStorageEl = document.getElementById("usedStorage");
  const remainingStorageEl = document.getElementById("remainingStorage");

  // Function to format bytes to human readable format
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Function to update storage information
  const updateStorageInfo = async () => {
    try {
      const storageType = localStorage.getItem("storagePreference") || "indexedDB";
      const progressBar = document.getElementById("storageProgressBar");

      if (storageType === "supabase") {
        // Mock data for Supabase storage (20MB limit)
        const quota = 20 * 1024 * 1024; // 20MB in bytes
        const usage = Math.floor(Math.random() * 15 * 1024 * 1024); // Random usage up to 15MB
        const remaining = quota - usage;

        // Update UI
        availableStorageEl.textContent = formatBytes(quota);
        usedStorageEl.textContent = formatBytes(usage);
        remainingStorageEl.textContent = formatBytes(remaining);

        // Update progress bar
        if (progressBar) {
          const percentage = (usage / quota) * 100;
          progressBar.style.width = `${percentage}%`;
          
          // Change color based on usage
          if (percentage > 90) {
            progressBar.style.backgroundColor = 'var(--error-color)';
          } else if (percentage > 70) {
            progressBar.style.backgroundColor = 'var(--warning-color)';
          } else {
            progressBar.style.backgroundColor = 'var(--accent-primary)';
          }
        }
      } else if (storageType === "indexedDB") {
        if (!navigator.storage || !navigator.storage.estimate) {
          throw new Error("Storage API not supported");
        }

        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        const remaining = quota - usage;

        // Update UI
        availableStorageEl.textContent = formatBytes(quota);
        usedStorageEl.textContent = formatBytes(usage);
        remainingStorageEl.textContent = formatBytes(remaining);

        // Update progress bar
        if (progressBar) {
          const percentage = (usage / quota) * 100;
          progressBar.style.width = `${percentage}%`;
          
          // Change color based on usage
          if (percentage > 90) {
            progressBar.style.backgroundColor = 'var(--error-color)';
          } else if (percentage > 70) {
            progressBar.style.backgroundColor = 'var(--warning-color)';
          } else {
            progressBar.style.backgroundColor = 'var(--accent-primary)';
          }
        }
      } else {
        // Excel storage - no limit
        availableStorageEl.textContent = "No limit";
        usedStorageEl.textContent = "N/A";
        remainingStorageEl.textContent = "N/A";
        
        if (progressBar) {
          progressBar.style.width = "0%";
        }
      }
    } catch (error) {
      console.error("Error getting storage info:", error);
      availableStorageEl.textContent = "Not available";
      usedStorageEl.textContent = "Not available";
      remainingStorageEl.textContent = "Not available";
      
      if (progressBar) {
        progressBar.style.width = "0%";
      }
    }
  };

  // Load current settings
  const loadSettings = () => {
    const storageType = localStorage.getItem("storagePreference") || "indexedDB";
    const autoBackup = localStorage.getItem("autoBackup") === "true";
    const backupInterval = localStorage.getItem("backupInterval") || "daily";
    const theme = localStorage.getItem("theme") || "light";

    // Load user profile info if it exists
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (currentUser.username && usernameInput) {
      usernameInput.value = currentUser.username;
    }
    if (currentUser.email && emailInput) {
      emailInput.value = currentUser.email;
    }

    // Set theme if it exists
    if (themeSelect) {
      themeSelect.value = theme;
      document.documentElement.setAttribute('data-theme', theme);
    }

    // Set other options if they exist
    if (autoBackupCheckbox) {
      autoBackupCheckbox.checked = autoBackup;
    }
    if (backupIntervalSelect) {
      backupIntervalSelect.value = backupInterval;
      backupIntervalSelect.disabled = !autoBackup;
    }
  };

  // Handle auto backup toggle
  autoBackupCheckbox.addEventListener("change", (e) => {
    backupIntervalSelect.disabled = !e.target.checked;
  });

  // Handle settings save
  saveSettingsBtn.addEventListener("click", async () => {
    try {
      // Get storage type if selected
      const storageTypeInput = document.querySelector('input[name="storageType"]:checked');
      const storageType = storageTypeInput ? storageTypeInput.value : localStorage.getItem("storagePreference") || "indexedDB";

      // Save auto backup settings if they exist
      if (autoBackupCheckbox) {
        localStorage.setItem("autoBackup", autoBackupCheckbox.checked);
      }
      if (backupIntervalSelect) {
        localStorage.setItem("backupInterval", backupIntervalSelect.value);
      }

      // Save theme settings if they exist
      if (themeSelect) {
        const selectedTheme = themeSelect.value;
        localStorage.setItem("theme", selectedTheme);
        document.documentElement.setAttribute('data-theme', selectedTheme);
      }

      // Save storage preference
      localStorage.setItem("storagePreference", storageType);

      // Get the tradeManager instance
      if (window.tradeManager) {
        // Update storage strategy
        await window.tradeManager.setStorageStrategy(storageType);
        // Update storage info after changing storage strategy
        await updateStorageInfo();
        alert("Settings saved successfully!");
      } else {
        throw new Error("Trade manager not initialized");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings. Please try again.");
    }
  });

  // Handle settings reset
  resetSettingsBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      localStorage.removeItem("storagePreference");
      localStorage.removeItem("defaultView");
      localStorage.removeItem("dateFormat");
      localStorage.removeItem("autoBackup");
      localStorage.removeItem("backupInterval");
      localStorage.removeItem("theme");
      loadSettings();
      alert("Settings have been reset to default.");
    }
  });

  // Handle data export
  exportDataBtn.addEventListener("click", async () => {
    try {
      if (window.tradeManager) {
        // Use the excel strategy to export trades
        const excelStrategy = new ExcelStorageStrategy();
        await excelStrategy.saveTrades(window.tradeManager.trades);
        alert("Trades exported successfully!");
      } else {
        throw new Error("Trade manager not initialized");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Error exporting data. Please try again.");
    }
  });

  // Handle data import
  importDataBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json, .xlsx, .xls, .csv";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        if (window.tradeManager) {
          await window.tradeManager.importFromExcel(file);
          alert("Data imported successfully!");
        } else {
          throw new Error("Trade manager not initialized");
        }
      } catch (error) {
        console.error("Error importing data:", error);
        alert(
          "Error importing data. Please ensure you are using a valid Excel file."
        );
      }
    };

    input.click();
  });

  // Handle data clear
  clearDataBtn.addEventListener("click", async () => {
    if (
      confirm(
        "Are you sure you want to delete all trade data? This action cannot be undone."
      )
    ) {
      try {
        if (window.tradeManager) {
          await window.tradeManager.clearAllTrades();
          alert("All trade data has been cleared.");
        } else {
          throw new Error("Trade manager not initialized");
        }
      } catch (error) {
        console.error("Error clearing trades:", error);
        alert("Error clearing trades. Please try again.");
      }
    }
  });

  // Handle username update
  updateUsernameBtn.addEventListener("click", () => {
    const newUsername = usernameInput.value.trim();
    if (!newUsername) {
      alert("Please enter a valid username");
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      currentUser.username = newUsername;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      alert("Username updated successfully!");
    } catch (error) {
      console.error("Error updating username:", error);
      alert("Error updating username. Please try again.");
    }
  });

  // Handle email update
  updateEmailBtn.addEventListener("click", () => {
    const newEmail = emailInput.value.trim();
    if (!newEmail || !newEmail.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      currentUser.email = newEmail;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      alert("Email updated successfully!");
    } catch (error) {
      console.error("Error updating email:", error);
      alert("Error updating email. Please try again.");
    }
  });

  // Handle password update
  updatePasswordBtn.addEventListener("click", () => {
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match");
      return;
    }

    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters long");
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      // In a real application, you would verify the current password with the backend
      // and hash the new password before storing it
      currentUser.password = newPassword;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      
      // Clear password fields
      currentPasswordInput.value = "";
      newPasswordInput.value = "";
      confirmPasswordInput.value = "";
      
      alert("Password updated successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Error updating password. Please try again.");
    }
  });

  // Handle theme changes
  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      const selectedTheme = e.target.value;
      document.documentElement.setAttribute('data-theme', selectedTheme);
    });
  }

  // Handle storage type change
  storageOptions.forEach((option) => {
    option.addEventListener("change", async (e) => {
      const newStorageType = e.target.value;
      
      if (newStorageType === "supabase") {
        // Show warning about cloud storage limit
        const proceed = confirm(
          "Cloud storage has a 20MB limit per user. Your data will be stored securely in the cloud and accessible from any device. Continue?"
        );
        if (!proceed) {
          // Revert to previous storage type
          const previousType = localStorage.getItem("storagePreference") || "indexedDB";
          document.querySelector(`input[name="storageType"][value="${previousType}"]`).checked = true;
          return;
        }
      }
      
      // Update storage info immediately
      await updateStorageInfo();
    });
  });

  // Initial load
  loadSettings();
  updateStorageInfo();
});
