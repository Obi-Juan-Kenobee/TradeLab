// Trade class to handle trade data
class Trade {
    constructor(symbol, market, entryPrice, exitPrice, quantity, date, notes) {
        this.id = Date.now().toString();
        this.symbol = symbol;
        this.market = market;
        this.entryPrice = entryPrice;
        this.exitPrice = exitPrice;
        this.quantity = quantity;
        this.date = date;
        this.notes = notes;
        this.profitLoss = (exitPrice - entryPrice) * quantity;
    }
}

// Trade Manager class to manage trades
class TradeManager {
    constructor() {
        this.trades = [];
    }

    addTrade(trade) {
        this.trades.unshift(trade);
        // this.saveTrades();
        this.displayTrades();
    }

    loadTrades() {
        const trades = localStorage.getItem('trades');
        return trades ? JSON.parse(trades) : [];
    }

    saveTrades() {
        localStorage.setItem('trades', JSON.stringify(this.trades));
    }

    displayTrades() {
        const tradesListElement = document.getElementById('tradesList');
        tradesListElement.innerHTML = '';

        this.trades.forEach((trade) => {
            const tradeCard = document.createElement('div');
            tradeCard.className = `trade-card ${trade.profitLoss >= 0 ? 'profit' : 'loss'}`;

            const formattedDate = new Date(trade.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            const profitLossColor = trade.profitLoss >= 0 ? '#2ecc71' : '#e74c3c';

            tradeCard.innerHTML = `
                <div class="trade-header">
                    <span class="trade-symbol">${trade.symbol.toUpperCase()}</span>
                    <span class="trade-market">${trade.market}</span>
                </div>
                <div class"trade-details">
                    <div>Entry Price: ${trade.entryPrice}</div>
                    <div>Exit Price: ${trade.exitPrice}</div>
                    <div>Profit/Loss: <span style="color: ${profitLossColor};">${trade.profitLoss.toFixed(2)}</span></div>
                    <div>Quantity: ${trade.quantity}</div>
                    <div>Date: ${formattedDate}</div>
                </div>
                ${trade.notes ? `<div class="trade-notes">${trade.notes}</div>` : ''}
            `;

            tradesListElement.appendChild(tradeCard);
        });
    }
}

// Initialize TradeManager
const TradeManager = new TradeManager();

// Form submission handler
document.getElementById('tradeForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const trade = new Trade(
        document.getElementById('symbol').value,
        document.getElementById('market').value,
        parseFloat(document.getElementById('entryPrice').value),
        parseFloat(document.getElementById('exitPrice').value),
        parseFloat(document.getElementById('quantity').value),
        document.getElementById('date').value,
        document.getElementById('notes').value
    );

    TradeManager.addTrade(trade);
    event.target.reset();
})

// set default date to today
document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, 0);

    const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('date').value = currentDateTime;

    // display existing trades
    TradeManager.trades = TradeManager.loadTrades();
    TradeManager.displayTrades();
})