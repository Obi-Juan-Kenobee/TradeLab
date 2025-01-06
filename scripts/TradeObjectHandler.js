// Trade class to handle trade data
class Trade {
    constructor(symbol, market, entryPrice, exitPrice, quantity, date, notes, direction) {
        this.id = Date.now().toString();
        this.symbol = symbol;
        this.market = market;
        this.entryPrice = entryPrice;
        this.exitPrice = exitPrice;
        this.quantity = quantity;
        this.date = date;
        this.notes = notes;
        this.direction = direction; // 'long' or 'short'
        this.profitLoss = this.calculateProfitLoss();
    }

    calculateProfitLoss() {
        const rawPL = (this.exitPrice - this.entryPrice) * this.quantity;
        return this.direction === 'long' ? rawPL : -rawPL;
    }
}

// Storage Strategy Interface
class StorageStrategy {
    async loadTrades() { throw new Error('Method not implemented'); }
    async saveTrades(trades) { throw new Error('Method not implemented'); }
}

// Local Storage Strategy
class LocalStorageStrategy extends StorageStrategy {
    async loadTrades() {
        const trades = localStorage.getItem('trades');
        return trades ? JSON.parse(trades) : [];
    }

    async saveTrades(trades) {
        localStorage.setItem('trades', JSON.stringify(trades));
    }
}

// File Storage Strategy
class FileStorageStrategy extends StorageStrategy {
    constructor(filePath) {
        super();
        this.filePath = filePath || this.getDefaultFilePath();
    }

    getDefaultFilePath() {
        const userHome = process.env.USERPROFILE || process.env.HOME;
        return `${userHome}/tradelab_trades.json`;
    }

    async loadTrades() {
        try {
            const fs = require('fs').promises;
            const data = await fs.readFile(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    async saveTrades(trades) {
        const fs = require('fs').promises;
        const data = JSON.stringify(trades, null, 2);
        await fs.writeFile(this.filePath, data, 'utf8');
    }
}

// Trade Manager class to manage trades
class TradeManager {
    constructor() {
        this.trades = [];
        this.loadStoragePreference();
    }

    loadStoragePreference() {
        const storageType = localStorage.getItem('storagePreference') || 'localStorage';
        const filePath = localStorage.getItem('storageFilePath');
        
        if (storageType === 'localStorage') {
            this.storageStrategy = new LocalStorageStrategy();
        } else {
            this.storageStrategy = new FileStorageStrategy(filePath);
        }
    }

    async setStorageStrategy(type, filePath = null) {
        if (type === 'localStorage') {
            this.storageStrategy = new LocalStorageStrategy();
        } else if (type === 'fileStorage') {
            this.storageStrategy = new FileStorageStrategy(filePath);
        }

        localStorage.setItem('storagePreference', type);
        if (filePath) {
            localStorage.setItem('storageFilePath', filePath);
        }

        // Migrate existing data to new storage
        await this.storageStrategy.saveTrades(this.trades);
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
        } catch (error) {
            console.error('Error loading trades:', error);
            // Handle error appropriately (show user notification, etc.)
        }
    }

    async saveTrades() {
        try {
            await this.storageStrategy.saveTrades(this.trades);
        } catch (error) {
            console.error('Error saving trades:', error);
            // Handle error appropriately (show user notification, etc.)
        }
    }

    displayTrades() {
        const tradesListElement = document.getElementById('tradesList');
        if (!tradesListElement) return;
        
        // Create table if it doesn't exist
        let tableElement = document.getElementById('tradesTable');
        if (!tableElement) {
            tableElement = document.createElement('table');
            tableElement.id = 'tradesTable';
            tableElement.className = 'trades-table';
            
            // Create table header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Date</th>
                    <th>Symbol</th>
                    <th>Direction</th>
                    <th>Market</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>Quantity</th>
                    <th>P/L</th>
                    <th>Notes</th>
                </tr>
            `;
            tableElement.appendChild(thead);
            
            // Create table body
            const tbody = document.createElement('tbody');
            tableElement.appendChild(tbody);
            
            tradesListElement.innerHTML = '';
            tradesListElement.appendChild(tableElement);
        }

        // Update table body
        const tbody = tableElement.querySelector('tbody');
        tbody.innerHTML = '';

        this.trades.forEach((trade) => {
            const tr = document.createElement('tr');
            tr.className = `trade-row ${trade.profitLoss >= 0 ? 'profit' : 'loss'}`;

            const formattedDate = new Date(trade.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            tr.innerHTML = `
                <td>${formattedDate}</td>
                <td class="symbol">${trade.symbol.toUpperCase()}</td>
                <td>
                    <span class="direction-badge ${trade.direction}">
                        ${trade.direction === 'long' ? '▲ LONG' : '▼ SHORT'}
                    </span>
                </td>
                <td>${trade.market}</td>
                <td>${trade.entryPrice.toFixed(2)}</td>
                <td>${trade.exitPrice.toFixed(2)}</td>
                <td>${trade.quantity}</td>
                <td class="${trade.profitLoss >= 0 ? 'profit' : 'loss'}">
                    ${trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}
                </td>
                <td class="notes">${trade.notes || '-'}</td>
            `;

            tbody.appendChild(tr);
        });

        // Update cumulative P/L if element exists
        const cumPnlElement = document.querySelector('.cumulative-pnl .value');
        const cumPnlPercentElement = document.querySelector('.cumulative-pnl .percentage');
        
        if (cumPnlElement && cumPnlPercentElement) {
            const totalPnL = this.trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
            const totalInvestment = this.trades.reduce((sum, trade) => sum + (trade.entryPrice * trade.quantity), 0);
            const pnlPercentage = (totalPnL / totalInvestment) * 100 || 0;
            
            cumPnlElement.textContent = `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`;
            cumPnlElement.className = `value ${totalPnL >= 0 ? 'profit' : 'loss'}`;
            cumPnlPercentElement.textContent = `${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage.toFixed(2)}%`;
            cumPnlPercentElement.className = `percentage ${totalPnL >= 0 ? 'profit' : 'loss'}`;
        }
    }

    // Data management methods
    async exportTrades(format = 'json') {
        const data = JSON.stringify(this.trades, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `trades_export_${new Date().toISOString().split('T')[0]}.json`;
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
            console.error('Error importing trades:', error);
            throw new Error('Invalid trade data format');
        }
    }

    async clearAllTrades() {
        this.trades = [];
        await this.saveTrades();
        this.displayTrades();
    }
}

// Initialize TradeManager
const tradeManager = new TradeManager();
window.tradeManager = tradeManager; // Expose to window object

// Initialize trades on page load
document.addEventListener('DOMContentLoaded', () => {
    tradeManager.loadTrades();

    // Set default date to today in trade form if it exists
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Add form submission handler if form exists
    const tradeForm = document.getElementById('tradeForm');
    if (tradeForm) {
        tradeForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const trade = new Trade(
                document.getElementById('symbol').value,
                document.getElementById('market').value,
                parseFloat(document.getElementById('entryPrice').value),
                parseFloat(document.getElementById('exitPrice').value),
                parseFloat(document.getElementById('quantity').value),
                document.getElementById('date').value,
                document.getElementById('notes').value,
                document.getElementById('direction').value
            );

            await tradeManager.addTrade(trade);
            event.target.reset();
            
            // Set the date input back to current time
            if (dateInput) {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                
                dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
        });
    }
});