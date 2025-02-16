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
    this.market = market.charAt(0).toUpperCase() + market.slice(1);
    this.entryPrice = parseFloat(entryPrice);
    this.exitPrice = parseFloat(exitPrice);
    this.quantity = parseFloat(quantity);
    
    // Handle date input - ensure it's a Date object set to midnight local time
    let tradeDate;
    if (date instanceof Date) {
      tradeDate = new Date(date);
    } else if (typeof date === 'string') {
      // Try parsing as ISO date first (YYYY-MM-DD)
      const dateParts = date.split(/[-/]/);
      if (dateParts.length === 3) {
        // Assume YYYY-MM-DD or MM/DD/YYYY format
        if (dateParts[0].length === 4) {
          // YYYY-MM-DD
          tradeDate = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2])
          );
        } else {
          // MM/DD/YYYY
          tradeDate = new Date(
            parseInt(dateParts[2]),
            parseInt(dateParts[0]) - 1,
            parseInt(dateParts[1])
          );
        }
      } else {
        tradeDate = new Date(date);
      }
    } else {
      tradeDate = new Date();
    }
    tradeDate.setHours(0, 0, 0, 0);
    this.date = tradeDate;
    
    this.notes = notes;
    this.direction = direction.toLowerCase(); // 'long' or 'short'
    this.investment = parseFloat(
      (this.entryPrice * Math.abs(this.quantity)).toFixed(2));
    this.profitLoss = parseFloat(this.calculateProfitLoss().toFixed(2));
    this.profitLossPercentage = parseFloat(((this.profitLoss / this.investment) * 100).toFixed(2));
        
    // Calculate MFE and MAE
    const excursion = this.calculateExcursion();
    this.maxRunup = excursion.maxRunup;
    this.maxDrawdown = excursion.maxDrawdown;
  }

  calculateProfitLoss() {
    let rawPL = 0;
    if (this.direction === "long") {
      rawPL = (this.exitPrice - this.entryPrice) * Math.abs(this.quantity);
    } else {
      rawPL = (this.entryPrice - this.exitPrice) * Math.abs(this.quantity);
    }
    return rawPL;
  }
  
  calculateExcursion() {
    let maxRunup = 0;
    let maxDrawdown = 0;
    const priceDiff = this.exitPrice - this.entryPrice;
    
    if (this.direction === "long") {
      if (priceDiff > 0) {
        maxRunup = priceDiff * Math.abs(this.quantity);
        maxDrawdown = 0;
      } else {
        maxRunup = 0;
        maxDrawdown = priceDiff * Math.abs(this.quantity);
      }
    } else { // short
      if (priceDiff < 0) {
        maxRunup = Math.abs(priceDiff) * Math.abs(this.quantity);
        maxDrawdown = 0;
      } else {
        maxRunup = 0;
        maxDrawdown = -priceDiff * Math.abs(this.quantity);
      }
    }

    return {
      maxRunup: parseFloat(maxRunup.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2))
    };
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
      date: this.date.toISOString().split('T')[0], // Store as YYYY-MM-DD
      notes: this.notes,
      direction: this.direction,
      profitLoss: this.profitLoss,
      investment: this.investment,
      profitLossPercentage: this.profitLossPercentage,
      maxRunup: this.maxRunup,
      maxDrawdown: this.maxDrawdown,
    };
  }

  static fromStorageObject(obj) {
    // Parse the date and set to midnight in local timezone
    const dateParts = obj.date.split('-');
    const localDate = new Date(
      parseInt(dateParts[0]), // year
      parseInt(dateParts[1]) - 1, // month (0-based)
      parseInt(dateParts[2]) // day
    );
    localDate.setHours(0, 0, 0, 0);

    const trade = new Trade(
      obj.symbol,
      obj.market,
      obj.entryPrice,
      obj.exitPrice,
      obj.quantity,
      localDate,
      obj.notes,
      obj.direction
    );
    trade.id = obj.id; // Preserve the original ID
    // Restore other properties
    trade.profitLoss = obj.profitLoss;
    trade.investment = obj.investment;
    trade.profitLossPercentage = obj.profitLossPercentage;
    trade.maxRunup = obj.maxRunup;
    trade.maxDrawdown = obj.maxDrawdown;
    return trade;
  }
}

// BatchTrade class to handle multiple entries and exits
class BatchTrade {
  constructor(symbol) {
    this.symbol = symbol;
    this.entries = []; // Array of {price, quantity, date}
    this.exits = [];   // Array of {price, quantity, date}
    this.direction = 'long'; // Default to long
  }

  addEntry(price, quantity, date) {
    this.entries.push({
      price: parseFloat(price),
      quantity: Math.abs(parseFloat(quantity)),
      date: new Date(date)
    });
    console.log(`Added entry to ${this.symbol}:`, {
      price,
      quantity,
      totalEntries: this.getTotalEntryQuantity(),
      totalExits: this.getTotalExitQuantity()
    });
  }

  addExit(price, quantity, date) {
    this.exits.push({
      price: parseFloat(price),
      quantity: Math.abs(parseFloat(quantity)),
      date: new Date(date)
    });
    console.log(`Added exit to ${this.symbol}:`, {
      price,
      quantity,
      totalEntries: this.getTotalEntryQuantity(),
      totalExits: this.getTotalExitQuantity()
    });
  }

  getTotalEntryQuantity() {
    return this.entries.reduce((sum, entry) => sum + entry.quantity, 0);
  }

  getTotalExitQuantity() {
    return this.exits.reduce((sum, exit) => sum + exit.quantity, 0);
  }

  // Check if this batch trade is complete (total exit quantity matches total entry quantity)

  isComplete() {
    const totalEntryQuantity = this.getTotalEntryQuantity();
    const totalExitQuantity = this.getTotalExitQuantity();
    
    console.log(`Checking if complete for ${this.symbol}:`, {
      totalEntryQuantity,
      totalExitQuantity,
      difference: Math.abs(totalExitQuantity - totalEntryQuantity)
    });
    
    return totalExitQuantity > 0 && totalEntryQuantity > 0 && 
           Math.abs(totalExitQuantity - totalEntryQuantity) < 0.0001;
  }

  // Get remaining quantity that hasn't been exited
getRemainingQuantity() {
  return this.getTotalEntryQuantity() - this.getTotalExitQuantity();
}

  // Calculate average entry price weighted by quantity
  getAverageEntryPrice() {
    const totalQuantity = this.getTotalEntryQuantity();
    const weightedSum = this.entries.reduce((sum, entry) => sum + (entry.price * entry.quantity), 0);
    return totalQuantity > 0 ? weightedSum / totalQuantity : 0;
  }

  // Calculate average exit price weighted by quantity
  getAverageExitPrice() {
    const totalQuantity = this.getTotalExitQuantity();
    const weightedSum = this.exits.reduce((sum, exit) => sum + (exit.price * exit.quantity), 0);
    return totalQuantity > 0 ? weightedSum / totalQuantity : 0;
  }

  // Convert batch trade to regular Trade object
  toTrade() {
    if (this.entries.length === 0 || this.exits.length === 0) {
      console.warn(`Attempting to create trade for ${this.symbol} with missing entries or exits`);
        return null;
    }

    const entryPrice = this.getAverageEntryPrice().toFixed(2);
    const exitPrice = this.getAverageExitPrice().toFixed(2);
    const quantity = this.getTotalEntryQuantity(); // Use entry quantity
    // Use the earliest date between entry and exit
    const firstEntryDate = this.entries[0].date;
    const firstExitDate = this.exits[0]?.date;
    const firstDate = firstExitDate && firstExitDate < firstEntryDate ? firstExitDate : firstEntryDate;
    
    // More detailed logging
    console.log(`Creating trade for ${this.symbol}:`, {
        entries: this.entries.length,
        exits: this.exits.length,
        entryPrice,
        exitPrice,
        quantity,
        date: firstDate,
        totalEntryQty: this.getTotalEntryQuantity(),
        totalExitQty: this.getTotalExitQuantity()
    });

    return new Trade(
        this.symbol,
        'Unknown', // market
        entryPrice,
        exitPrice,
        quantity,
        firstDate,
        `Batch trade: ${this.entries.length} entries, ${this.exits.length} exits`,
        exitPrice > entryPrice ? 'long' : 'short'
    );

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
              let parsedDate;
              if (typeof trade.date === "string") {
                // Parse string date and set to midnight in local timezone
                parsedDate = new Date(trade.date);
              } else {
                // Parse Excel date code
                parsedDate = new Date(XLSX.SSF.parse_date_code(trade.date));
              }
              // Set to midnight in local timezone to avoid date shifting
              parsedDate.setHours(0, 0, 0, 0);
              tradeDate = parsedDate;
            } else {
              tradeDate = new Date();
              tradeDate.setHours(0, 0, 0, 0);
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

          // Convert each trade to storage format
          trades.forEach((trade) => {
            // Convert to Trade instance if it's not already one
            const tradeInstance = trade instanceof Trade ? trade : Trade.fromStorageObject(trade);
            // Convert to storage format
            const storageObject = tradeInstance.toStorageObject();
            console.log("Saving trade:", storageObject);
            const addRequest = store.add(storageObject);

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
      const loadedTrades = await this.storageStrategy.loadTrades();
      // Convert plain objects back to Trade instances to ensure all properties are calculated
      this.trades = loadedTrades.map(trade => Trade.fromStorageObject(trade));
      this.displayTrades();
      return this.trades; // Return the trades array
    } catch (error) {
      console.error("Error loading trades:", error);
      // Handle error appropriately (show user notification, etc.)
      return [];
    }
  }

  async saveTrades(trades = null) {
    try {
      // If trades parameter is provided, update this.trades
      if (trades !== null) {
        this.trades = trades;
      }
      console.log("Saving trades:", this.trades);
      console.log(this.storageStrategy);
      await this.storageStrategy.saveTrades(this.trades);
    } catch (error) {
      console.error("Error saving trades:", error);
      // Handle error appropriately (show user notification, etc.)
    }
  }

  displayTrades(trades) {
    const tbody = document.querySelector('#tradesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Use provided trades or fall back to this.trades
    const tradesToDisplay = trades || this.trades;
    
    if (!tradesToDisplay || !Array.isArray(tradesToDisplay)) {
      console.log('No trades to display');
      return;
    }

    // Sort trades by date (newest first) and take only the 10 most recent
    const recentTrades = [...tradesToDisplay]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    recentTrades.forEach(tradeCopy => {
      const formattedDate = new Date(tradeCopy.date).toLocaleDateString();
      const tr = document.createElement('tr');

      tr.innerHTML = `
                <td>${formattedDate}</td>
        <td class="symbol">
          <a href="#" class="symbol-link" data-symbol="${tradeCopy.symbol}">${tradeCopy.symbol.toUpperCase()}</a>
        </td>
                <td>
          <span class="direction-badge ${tradeCopy.direction}">
            ${tradeCopy.direction === "long" ? "▲ LONG" : "▼ SHORT"}
                    </span>
                </td>
        <td>${tradeCopy.market}</td>
        <td>${tradeCopy.entryPrice.toFixed(2)}</td>
        <td>${tradeCopy.exitPrice.toFixed(2)}</td>
        <td>${tradeCopy.quantity}</td>
        <td>$${tradeCopy.investment.toFixed(2)}</td>
        <td class="${tradeCopy.profitLoss >= 0 ? "profit" : "loss"}">
          ${tradeCopy.profitLoss >= 0 ? "+" : ""}$${tradeCopy.profitLoss.toFixed(2)}
                    </td>
        <td class="${tradeCopy.profitLoss >= 0 ? "profit" : "loss"}">
          ${tradeCopy.profitLoss >= 0 ? "+" : ""}${tradeCopy.profitLossPercentage.toFixed(2)}%
                </td>
        <td class="notes">${tradeCopy.notes || "-"}</td>
        <td class="actions-cell">
          <button class="edit-trade-btn" data-trade-id="${tradeCopy.id}" title="Edit Trade">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-trade-btn" data-trade-id="${tradeCopy.id}" title="Delete Trade">
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

            // Add edit button event listener
            const editBtn = tr.querySelector(".edit-trade-btn");
            editBtn.addEventListener("click", (e) => {
              e.preventDefault();
              const tradeId = e.currentTarget.getAttribute("data-trade-id");
              const trade = this.trades.find(t => t.id === tradeId);
              if (trade) {
                const editModal = document.getElementById('editTradeModal');
                const editForm = document.getElementById('editTradeForm');
                
                // Populate form fields
                document.getElementById('editTradeId').value = trade.id;
                document.getElementById('editDate').value = new Date(trade.date).toISOString().split('T')[0];
                document.getElementById('editSymbol').value = trade.symbol;
                document.getElementById('editDirection').value = trade.direction.charAt(0).toUpperCase() + trade.direction.slice(1);
                document.getElementById('editMarket').value = trade.market;
                document.getElementById('editEntryPrice').value = trade.entryPrice;
                document.getElementById('editExitPrice').value = trade.exitPrice;
                document.getElementById('editQuantity').value = trade.quantity;
                document.getElementById('editNotes').value = trade.notes || '';
                
                // Show modal
                editModal.style.display = 'block';
              }
            });

      // Add symbol click handler
      const symbolLink = tr.querySelector('.symbol-link');
      symbolLink.addEventListener('click', (e) => {
        e.preventDefault();
        const symbol = e.target.dataset.symbol;
        if (window.tradeModal) {
          window.tradeModal.show(tradeCopy);
              }
            });

      tbody.appendChild(tr);
    });

    // Update cumulative P/L if element exists
    const cumPnlElement = document.querySelector(".cumulative-pnl .value");
    const cumRoiElement = document.querySelector(".cumulative-pnl .roi");
    const todayPnlElement = document.querySelector(".todays-pnl .value");
    const todayRoiElement = document.querySelector(".todays-pnl .roi");

    if (cumPnlElement && cumRoiElement) {
      // Calculate total PnL and investment
      const totalPnL = this.trades.reduce(
        (sum, trade) => sum + trade.profitLoss,
        0
      );

      // Calculate total investment (sum of all trade investments)
      const totalInvestment = this.trades.reduce((sum, trade) => {
        return sum + trade.investment;
      }, 0);

            // Calculate PnL percentage based on initial investment
            // let pnlPercentage;
            // if (totalInvestment === 0) {
              // For new accounts or when there's no investment
            //   pnlPercentage = totalPnL > 0 ? 100 : 0; // Show 100% profit for any gain
            // } else {
              // For existing accounts, calculate based on total investment
            //   pnlPercentage = (totalPnL / totalInvestment) * 100;
            // }

        // Calculate ROI as (Total P/L / Total Investment) * 100
        const roi = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

      // Calculate today's Metric
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayTrades = this.trades.filter(trade => new Date(trade.date) >= todayStart);
      const todayPnL = todayTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
      // const todayInvestment = todayTrades.reduce((sum, trade) => {
      //   const investment = trade.entryPrice * trade.quantity;
      //   return sum + Math.abs(investment);
      // }, 0);
      // const todayPnlPercentage = todayInvestment > 0 ? (todayPnL / todayInvestment) * 100 : 0;
      const todayInvestment = todayTrades.reduce((sum, trade) => sum + trade.investment, 0);
      const todayRoi = todayInvestment > 0 ? (todayPnL / todayInvestment) * 100 : 0;

     // Update cumulative P/L display
     cumPnlElement.textContent = `${totalPnL >= 0 ? "+" : ""}$${totalPnL.toFixed(2)}`;
      cumPnlElement.className = `value ${totalPnL >= 0 ? "profit" : "loss"}`;
      cumRoiElement.textContent = `ROI: ${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`;
      cumRoiElement.className = `roi ${roi >= 0 ? "profit" : "loss"}`;

      // Update today's P/L display
      if (todayPnlElement && todayRoiElement) {
        todayPnlElement.textContent = `${todayPnL >= 0 ? "+" : ""}$${todayPnL.toFixed(2)}`;
        todayPnlElement.className = `value ${todayPnL >= 0 ? "profit" : "loss"}`;
        todayRoiElement.textContent = `ROI: ${todayRoi >= 0 ? "+" : ""}${todayRoi.toFixed(2)}%`;
        todayRoiElement.className = `roi ${todayRoi >= 0 ? "profit" : "loss"}`;
      }
    }

    if (cumPnlElement && cumRoiElement) {
      const totalPnL = this.trades.reduce(
        (sum, trade) => sum + trade.profitLoss,
        0
      );
      const totalInvestment = this.trades.reduce(
        (sum, trade) => sum + trade.entryPrice * trade.quantity,
        0
      );
      const pnlPercentage = (totalPnL / totalInvestment) * 100 || 0;

      cumPnlElement.textContent = `${totalPnL >= 0 ? "+" : ""
        }$${totalPnL.toFixed(2)}`;
      cumPnlElement.className = `value ${totalPnL >= 0 ? "profit" : "loss"}`;
      cumRoiElement.textContent = `ROI: ${pnlPercentage >= 0 ? "+" : ""}${pnlPercentage.toFixed(2)}%`;
      cumRoiElement.className = `roi ${totalPnL >= 0 ? "profit" : "loss"}`;
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

// function createTodayPnlElement() {
//   const todayPnlContainer = document.createElement("div");
//   todayPnlContainer.className = "today-pnl";
//   todayPnlContainer.innerHTML = `
//     <h3>Today's PnL</h3>
//     <div class="value"></div>
//     <div class="percentage"></div>
//   `;
//   document.querySelector(".cumulative-pnl").appendChild(todayPnlContainer);
//   return todayPnlContainer;
// }
