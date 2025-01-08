document.addEventListener("DOMContentLoaded", () => {
  const storageOptions = document.querySelectorAll('input[name="storageType"]');
  const autoBackupCheckbox = document.getElementById("autoBackup");
  const backupIntervalSelect = document.getElementById("backupInterval");
  const saveSettingsBtn = document.getElementById("saveSettings");
  const resetSettingsBtn = document.getElementById("resetSettings");
  const exportDataBtn = document.getElementById("exportData");
  const importDataBtn = document.getElementById("importData");
  const clearDataBtn = document.getElementById("clearData");

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
      if (!navigator.storage || !navigator.storage.estimate) {
        throw new Error("Storage API not supported");
      }

      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const remaining = quota - usage;

      availableStorageEl.textContent = formatBytes(quota);
      usedStorageEl.textContent = formatBytes(usage);
      remainingStorageEl.textContent = formatBytes(remaining);
    } catch (error) {
      console.error("Error getting storage info:", error);
      availableStorageEl.textContent = "Not available";
      usedStorageEl.textContent = "Not available";
      remainingStorageEl.textContent = "Not available";
    }
  };

  // Load current settings
  const loadSettings = () => {
    const storageType =
      localStorage.getItem("storagePreference") || "localStorage";
    const defaultView = localStorage.getItem("defaultView") || "list";
    const dateFormat = localStorage.getItem("dateFormat") || "MM/DD/YYYY";
    const autoBackup = localStorage.getItem("autoBackup") === "true";
    const backupInterval = localStorage.getItem("backupInterval") || "daily";

    // Set storage type
    // document.querySelector(`input[value="${storageType}"]`).checked = true;

    // Set other options
    document.getElementById("defaultView").value = defaultView;
    document.getElementById("dateFormat").value = dateFormat;
    autoBackupCheckbox.checked = autoBackup;
    backupIntervalSelect.value = backupInterval;
    backupIntervalSelect.disabled = !autoBackup;
  };

  // Handle auto backup toggle
  autoBackupCheckbox.addEventListener("change", (e) => {
    backupIntervalSelect.disabled = !e.target.checked;
  });

  // Handle settings save
  saveSettingsBtn.addEventListener("click", async () => {
    const storageType = document.querySelector(
      'input[name="storageType"]:checked'
    ).value;
    const defaultView = document.getElementById("defaultView").value;
    const dateFormat = document.getElementById("dateFormat").value;
    const autoBackup = autoBackupCheckbox.checked;
    const backupInterval = backupIntervalSelect.value;

    try {
      // Save settings to localStorage
      localStorage.setItem("defaultView", defaultView);
      localStorage.setItem("dateFormat", dateFormat);
      localStorage.setItem("autoBackup", autoBackup);
      localStorage.setItem("backupInterval", backupInterval);

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

  // Initial load
  loadSettings();
  updateStorageInfo();
});
