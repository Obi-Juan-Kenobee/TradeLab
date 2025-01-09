// Trade class to handle trade data
class Trade {
  constructor(
    symbol,
    market,
    entryPrice,
    exitPrice,
    quantity,
    date,
    notes,
    direction
  ) {
    this.id = Date.now().toString() + Math.random().toString(36).substr(2, 9); // More unique ID
    this.symbol = symbol;
    this.market = market;
    this.entryPrice = parseFloat(entryPrice);
    this.exitPrice = parseFloat(exitPrice);
    this.quantity = parseFloat(quantity);
    this.date = new Date(date);
    this.notes = notes;
    this.direction = direction; // 'long' or 'short'
    this.profitLoss = this.calculateProfitLoss();
  }

  calculateProfitLoss() {
    let rawPL = 0;
    if (this.direction === "long") {
      rawPL = (this.exitPrice - this.entryPrice) * this.quantity;
    } else {
      rawPL = (this.entryPrice - this.exitPrice) * this.quantity;
    }
    return rawPL;
  }

  // Add a method to convert to a plain object for storage
  toStorageObject() {
    return {
      id: this.id,
      symbol: this.symbol,
      market: this.market,
      entryPrice: this.entryPrice,
      exitPrice: this.exitPrice,
      quantity: this.quantity,
      date: this.date.toISOString(),
      notes: this.notes,
      direction: this.direction,
      profitLoss: this.profitLoss,
    };
  }
}

// Storage Strategy Interface
class StorageStrategy {
  async loadTrades() {
    throw new Error("Method not implemented");
  }
  async saveTrades(trades) {
    throw new Error("Method not implemented");
  }
}

// Excel Storage Strategy
class ExcelStorageStrategy extends StorageStrategy {
  async loadTrades() {
    // This is a placeholder since actual loading will happen through file input
    return [];
  }

  async saveTrades(trades) {
    // Generate filename with date
    const worksheet = XLSX.utils.json_to_sheet(trades);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trades");

    // Generate file name with current date
    const date = new Date();
    const filename = `trades_${date}.xlsx`;

    // Trigger download
    XLSX.writeFile(workbook, filename);
  }

  static validateExcelData(trades) {
    const requiredColumns = [
      "symbol",
      "market",
      "entryPrice",
      "exitPrice",
      "quantity",
      "date",
      "notes",
      "direction",
    ];

    // Check if we have any data
    if (!trades || trades.length === 0) {
      throw new Error("No data found in Excel file");
    }

    // Get the columns present in the Excel file
    const presentColumns = Object.keys(trades[0]);
    console.log("Columns found in Excel:", presentColumns);

    // Check for missing columns
    const missingColumns = requiredColumns.filter(
      (col) => !presentColumns.includes(col)
    );

    if (missingColumns.length > 5) {
      throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
    }

    return true;
  }

  static importFromExcel(file) {
    // Console logs in this method are for debugging purposes only/follow the flow of data
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      console.log(reader);
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          console.log(data);
          const workbook = XLSX.read(data, { type: "array" });
          console.log(workbook);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          console.log(worksheet);
          const trades = XLSX.utils.sheet_to_json(worksheet);
          console.log(trades);

          // Validate the Excel data structure
          this.validateExcelData(trades);

          console.log("Raw trades from Excel:", trades);

          const convertedTrades = trades.map((trade) => {
            // Log each raw trade object
            console.log("Processing trade:", trade);

            // Handle date conversion
            let tradeDate;
            if (trade.date) {
              tradeDate =
                typeof trade.date === "string"
                  ? new Date(trade.date)
                  : new Date(XLSX.SSF.parse_date_code(trade.date));
            } else {
              tradeDate = new Date();
            }

            // Ensure all numeric values are properly parsed
            const entryPrice = parseFloat(trade.entryPrice);
            const exitPrice = parseFloat(trade.exitPrice);
            const quantity = parseFloat(trade.quantity);

            // Create new Trade object with explicit type conversion
            const newTrade = new Trade(
              String(trade.symbol || ""),
              String(trade.market || ""),
              isNaN(entryPrice) ? 0 : entryPrice,
              isNaN(exitPrice) ? 0 : exitPrice,
              isNaN(quantity) ? 0 : quantity,
              tradeDate,
              String(trade.notes || ""),
              String(trade.direction || "long")
            );

            console.log("Created Trade object:", newTrade);
            return newTrade;
          });
          console.log(convertedTrades);

          if (!Array.isArray(convertedTrades)) {
            throw new Error("Failed to convert Excel data to Trade objects");
          }
          resolve(convertedTrades);
        } catch (error) {
          reject(new Error("Failed to parse Excel file: " + error.message));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  }
}

// IndexedDB Storage Strategy
class IndexedDBStrategy extends StorageStrategy {
  constructor() {
    super();
    this.dbName = "TradeLabDB";
    this.version = 1;
    this.storeName = "trades";
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  async loadTrades() {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onerror = () => {
          console.error("Error loading trades:", request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log("Successfully loaded trades:", request.result);
          resolve(request.result);
        };
      });
    } catch (error) {
      console.error("Error in loadTrades:", error);
      throw error;
    }
  }

  async saveTrades(trades) {
    try {
      console.log("Attempting to save trades:", trades);

      if (!Array.isArray(trades)) {
        throw new Error("Trades must be an array");
      }

      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        // Clear existing data
        const clearRequest = store.clear();

        clearRequest.onsuccess = () => {
          console.log("Cleared existing trades");

          // Ensure each trade has an ID and proper date format
          trades.forEach((trade) => {
            // Make sure each trade is properly structured
            const processedTrade = {
              ...trade,
              id: trade.id || Date.now().toString(),
              date: new Date(trade.date).toISOString(),
            };

            console.log("Saving trade:", processedTrade);
            const addRequest = store.add(processedTrade);

            addRequest.onerror = (event) => {
              console.error("Error adding trade:", addRequest.error);
              reject(addRequest.error);
            };
          });
        };

        clearRequest.onerror = (event) => {
          console.error("Error clearing trades:", clearRequest.error);
          reject(clearRequest.error);
        };

        transaction.oncomplete = () => {
          console.log("All trades saved successfully");
          resolve();
        };

        transaction.onerror = (event) => {
          console.error("Transaction error:", transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error("Error in saveTrades:", error);
      throw error;
    }
  }
}

// Trade Manager class to manage trades
class TradeManager {
  constructor() {
    this.trades = [];
    this.loadStoragePreference();
  }

  loadStoragePreference() {
    const storageType =
      localStorage.getItem("storagePreference") || "indexedDB";

    if (storageType === "indexedDB") {
      this.storageStrategy = new IndexedDBStrategy();
    } else if (storageType === "excel") {
      this.storageStrategy = new ExcelStorageStrategy();
    }
  }

  async setStorageStrategy(type) {
    if (type === "indexedDB") {
      this.storageStrategy = new IndexedDBStrategy();
    } else if (type === "excel") {
      this.storageStrategy = new ExcelStorageStrategy();
    }

    localStorage.setItem("storagePreference", type);

    // Migrate existing data to new storage
    const currentTrades = await this.loadTrades();
    await this.saveTrades(currentTrades);
  }

  async addTrade(trade) {
    this.trades.unshift(trade);
    await this.saveTrades();
    this.displayTrades();
  }

  async loadTrades() {
    try {
      this.trades = await this.storageStrategy.loadTrades();
      this.displayTrades();
      return this.trades || [];
    } catch (error) {
      console.error("Error loading trades:", error);
      // Handle error appropriately (show user notification, etc.)
      return [];
    }
  }

  async saveTrades() {
    try {
      console.log("Saving trades:", this.trades);
      console.log(this.storageStrategy);
      await this.storageStrategy.saveTrades(this.trades);
    } catch (error) {
      console.error("Error saving trades:", error);
      // Handle error appropriately (show user notification, etc.)
    }
  }

  displayTrades() {
    const tradesListElement = document.getElementById("tradesList");
    if (!tradesListElement) return;

    // Create header with link to all trades
    const headerDiv = document.createElement("div");
    headerDiv.className = "trades-header";
    headerDiv.innerHTML = `
             <h2>Recent Trades</h2>
                <a href="trade-history.html" class="view-all-link">
                  View All <i class="fas fa-arrow-right"></i>
                </a>
         `;

    // Create table if it doesn't exist
    let tableElement = document.getElementById("tradesTable");
    if (!tableElement) {
      tableElement = document.createElement("table");
      tableElement.id = "tradesTable";
      tableElement.className = "trades-table";

      // Create table header
      const thead = document.createElement("thead");
      thead.innerHTML = `
                <tr>
                    <th class="date-header">Date</th>
                    <th>Symbol</th>
                    <th>Direction</th>
                    <th>Market</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>Quantity</th>
                    <th>P/L</th>
                    <th>Notes</th>
                    <th></th>
                </tr>
            `;
      tableElement.appendChild(thead);

      // Create table body
      const tbody = document.createElement("tbody");
      tableElement.appendChild(tbody);

      tradesListElement.innerHTML = "";
      tradesListElement.appendChild(headerDiv);
      tradesListElement.appendChild(tableElement);
    }

    // Update table body with only the 10 most recent trades
    const tbody = tableElement.querySelector("tbody");
    tbody.innerHTML = "";

    const recentTrades = [...this.trades].reverse().slice(0, 10);
    recentTrades.forEach((trade) => {
      const tr = document.createElement("tr");
      tr.className = `trade-row ${trade.profitLoss >= 0 ? "profit" : "loss"}`;

      const formattedDate = new Date(trade.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      tr.innerHTML = `
                <td>${formattedDate}</td>
                <td class="symbol">${trade.symbol.toUpperCase()}</td>
                <td>
                    <span class="direction-badge ${trade.direction}">
                        ${trade.direction === "long" ? "▲ LONG" : "▼ SHORT"}
                    </span>
                </td>
                <td>${trade.market}</td>
                <td>${trade.entryPrice.toFixed(2)}</td>
                <td>${trade.exitPrice.toFixed(2)}</td>
                <td>${trade.quantity}</td>
                <td class="${trade.profitLoss >= 0 ? "profit" : "loss"}">
                    ${
                      trade.profitLoss >= 0 ? "+" : ""
                    }${trade.profitLoss.toFixed(2)}
                </td>
                <td class="notes">${trade.notes || "-"}</td>
                <td>
                    <button class="delete-trade-btn" data-trade-id="${
                      trade.id
                    }">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

      const deleteBtn = tr.querySelector(".delete-trade-btn");
      deleteBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to delete this trade?")) {
          const tradeId = e.currentTarget.getAttribute("data-trade-id");
          await this.deleteTrade(tradeId);
        }
      });

      tbody.appendChild(tr);
    });

    // Update cumulative P/L if element exists
    const cumPnlElement = document.querySelector(".cumulative-pnl .value");
    const cumPnlPercentElement = document.querySelector(
      ".cumulative-pnl .percentage"
    );

    if (cumPnlElement && cumPnlPercentElement) {
      const totalPnL = this.trades.reduce(
        (sum, trade) => sum + trade.profitLoss,
        0
      );
      const totalInvestment = this.trades.reduce(
        (sum, trade) => sum + trade.entryPrice * trade.quantity,
        0
      );
      const pnlPercentage = (totalPnL / totalInvestment) * 100 || 0;

      cumPnlElement.textContent = `${
        totalPnL >= 0 ? "+" : ""
      }$${totalPnL.toFixed(2)}`;
      cumPnlElement.className = `value ${totalPnL >= 0 ? "profit" : "loss"}`;
      cumPnlPercentElement.textContent = `${
        pnlPercentage >= 0 ? "+" : ""
      }${pnlPercentage.toFixed(2)}%`;
      cumPnlPercentElement.className = `percentage ${
        totalPnL >= 0 ? "profit" : "loss"
      }`;
    }
  }

  // Data management methods
  async exportTrades(format = "json") {
    const data = JSON.stringify(this.trades, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `trades_export_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importTrades(jsonData) {
    try {
      const newTrades = JSON.parse(jsonData);
      this.trades = [...newTrades, ...this.trades];
      await this.saveTrades();
      this.displayTrades();
    } catch (error) {
      console.error("Error importing trades:", error);
      throw new Error("Invalid trade data format");
    }
  }

  async importFromExcel(file) {
    try {
      console.log("Starting Excel import...");
      const importedTrades = await ExcelStorageStrategy.importFromExcel(file);
      console.log("Imported trades:", importedTrades);

      if (!importedTrades || !Array.isArray(importedTrades)) {
        throw new Error("No valid trades were imported");
      }

      // Add the new trades to the existing trades
      this.trades = [...importedTrades, ...this.trades];
      console.log("Updated trades array:", this.trades);

      // Save the updated trades
      await this.saveTrades();

      // Update the display
      this.displayTrades();

      return importedTrades.length; // Return the number of imported trades
    } catch (error) {
      console.error("Error importing trades:", error);
      throw new Error(`Failed to import trades: ${error.message}`);
    }
  }

  async clearAllTrades() {
    this.trades = [];
    await this.saveTrades();
    this.displayTrades();
  }

  async deleteTrade(tradeId) {
    this.trades = this.trades.filter((trade) => trade.id !== tradeId);
    await this.saveTrades();
    this.displayTrades();
  }
}

// Initialize TradeManager
const tradeManager = new TradeManager();
window.tradeManager = tradeManager; // Expose to window object

// Initialize trades on page load
document.addEventListener("DOMContentLoaded", () => {
  tradeManager.loadTrades();

  // Set default date to today in trade form if it exists
  const dateInput = document.getElementById("date");
  if (dateInput) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Add form submission handler if form exists
  const tradeForm = document.getElementById("tradeForm");
  if (tradeForm) {
    tradeForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const trade = new Trade(
        document.getElementById("symbol").value,
        document.getElementById("market").value,
        parseFloat(document.getElementById("entryPrice").value),
        parseFloat(document.getElementById("exitPrice").value),
        parseFloat(document.getElementById("quantity").value),
        document.getElementById("date").value,
        document.getElementById("notes").value,
        document.getElementById("direction").value
      );

      await tradeManager.addTrade(trade);
      event.target.reset();

      // Set the date input back to current time
      if (dateInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");

        dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    });
  }

  // Add file input handler for Excel import
  const excelInput = document.getElementById("excelInput");
  if (excelInput) {
    excelInput.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      await tradeManager.importFromExcel(file);
    });
  }
});

// export { Trade, TradeManager, ExcelStorageStrategy };
