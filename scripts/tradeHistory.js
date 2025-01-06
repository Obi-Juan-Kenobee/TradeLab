document.addEventListener('DOMContentLoaded', () => {
    const symbolFilter = document.getElementById('symbolFilter');
    const marketFilter = document.getElementById('marketFilter');
    const directionFilter = document.getElementById('directionFilter');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    let allTrades = [];
    
    const updateStats = (trades) => {
        const totalTrades = trades.length;
        const profitableTrades = trades.filter(trade => trade.profitLoss > 0).length;
        const winRate = totalTrades ? ((profitableTrades / totalTrades) * 100).toFixed(2) : 0;
        const totalPnL = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
        const avgPnL = totalTrades ? (totalPnL / totalTrades) : 0;

        document.getElementById('totalTrades').textContent = totalTrades;
        document.getElementById('winRate').textContent = `${winRate}%`;
        document.getElementById('totalPnL').textContent = `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`;
        document.getElementById('totalPnL').className = `stat-value ${totalPnL >= 0 ? 'profit' : 'loss'}`;
        document.getElementById('avgPnL').textContent = `${avgPnL >= 0 ? '+' : ''}$${avgPnL.toFixed(2)}`;
        document.getElementById('avgPnL').className = `stat-value ${avgPnL >= 0 ? 'profit' : 'loss'}`;
    };

    const filterTrades = () => {
        let filteredTrades = [...allTrades];

        // Apply symbol filter
        const symbolText = symbolFilter.value.toLowerCase();
        if (symbolText) {
            filteredTrades = filteredTrades.filter(trade => 
                trade.symbol.toLowerCase().includes(symbolText)
            );
        }

        // Apply market filter
        const marketText = marketFilter.value;
        if (marketText) {
            filteredTrades = filteredTrades.filter(trade => 
                trade.market === marketText
            );
        }

        // Apply direction filter
        const directionText = directionFilter.value;
        if (directionText) {
            filteredTrades = filteredTrades.filter(trade => 
                trade.direction === directionText
            );
        }

        // Apply date range filter
        if (startDate.value) {
            const start = new Date(startDate.value);
            filteredTrades = filteredTrades.filter(trade => 
                new Date(trade.date) >= start
            );
        }
        if (endDate.value) {
            const end = new Date(endDate.value);
            end.setHours(23, 59, 59, 999);
            filteredTrades = filteredTrades.filter(trade => 
                new Date(trade.date) <= end
            );
        }

        displayTrades(filteredTrades);
        updateStats(filteredTrades);
    };

    const displayTrades = (trades) => {
        const tradesListElement = document.getElementById('allTradesList');
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

        trades.forEach((trade) => {
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
    };

    // Event listeners for filters
    symbolFilter.addEventListener('input', filterTrades);
    marketFilter.addEventListener('change', filterTrades);
    directionFilter.addEventListener('change', filterTrades);
    startDate.addEventListener('change', filterTrades);
    endDate.addEventListener('change', filterTrades);

    // Initialize trades
    if (window.tradeManager) {
        allTrades = window.tradeManager.trades;
        displayTrades(allTrades);
        updateStats(allTrades);
    }
});