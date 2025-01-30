document.addEventListener('DOMContentLoaded', async () => {
    const symbolFilter = document.getElementById('symbolFilter');
    const marketFilter = document.getElementById('marketFilter');
    const directionFilter = document.getElementById('directionFilter');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const clearDateRangeBtn = document.getElementById('clearDateRange');
    
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
            // Set to the end of the day in local time
            end.setHours(23, 59, 59, 999);
            // Add an extra millisecond to ensure we capture all trades from the end date
            filteredTrades = filteredTrades.filter(trade => {
                const tradeDate = new Date(trade.date);
                return tradeDate.getTime() <= end.getTime();
            });
        }

        displayTrades(filteredTrades);
        updateStats(filteredTrades);
    };

    const displayTrades = (trades) => {
        const tradesListElement = document.getElementById('allTradesList');
        if (!tradesListElement) return;

        //clear existing trades
        tradesListElement.innerHTML = '';

        // Create table if it doesn't exist
        // if (!tableElement) {
        //     tableElement = document.createElement('table');
        //     tableElement.id = 'tradesTable';

        // Create new table
        let tableElement = document.createElement('table');
            tableElement.id = 'tradesTable';
            tableElement.className = 'trades-table';
            
            // Create table header with delete button
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
        headerRow.className = 'table-header-row';
        
        // Create delete all button
        const deleteAllCell = document.createElement('th');
        deleteAllCell.colSpan = 9; // Span all columns
        deleteAllCell.className = 'delete-all-header';
        
        const deleteAllButton = document.createElement('button');
        deleteAllButton.className = 'delete-all-btn';
        deleteAllButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete All Trades';
        deleteAllButton.onclick = async () => {
            if (confirm('Are you sure you want to delete all trades? This action cannot be undone.')) {
                try {
                    await tradeManager.clearAllTrades();
                    allTrades = [];
                    filterTrades();
                    alert('All trades have been deleted successfully.');
                } catch (error) {
                    console.error('Error deleting trades:', error);
                    alert('Failed to delete trades: ' + error.message);
                }
            }
        };
        
        deleteAllCell.appendChild(deleteAllButton);
        headerRow.appendChild(deleteAllCell);
        thead.appendChild(headerRow);

        // Add column headers row
        const headers = ['Date', 'Symbol', 'Market', 'Direction', 'Entry Price', 'Exit Price', 'Quantity', 'P/L', 'ROI', 'Notes', 'Delete'];
        const columnHeadersRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            columnHeadersRow.appendChild(th);
        });
            thead.appendChild(columnHeadersRow);
            tableElement.appendChild(thead);
            
            // Create table body
            const tbody = document.createElement('tbody');
            trades.forEach(trade => {
                const row = document.createElement('tr');

            // Date cell
            const dateCell = document.createElement('td');
            dateCell.textContent = new Date(trade.date).toLocaleDateString();
            row.appendChild(dateCell);

            // Symbol cell - make it clickable
            const symbolCell = document.createElement('td');
            const symbolLink = document.createElement('a');
            symbolLink.href = '#';
            symbolLink.textContent = trade.symbol.toUpperCase();
            symbolLink.className = 'clickable-symbol';
            symbolLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.tradeModal.show(trade);
            });
            symbolCell.appendChild(symbolLink);
            row.appendChild(symbolCell);

            // Market cell
            const marketCell = document.createElement('td');
            marketCell.textContent = trade.market;
            row.appendChild(marketCell);

            // Direction cell
            const directionCell = document.createElement('td');
            directionCell.textContent = trade.direction.toUpperCase();
            row.appendChild(directionCell);

            // Entry Price cell
            const entryPriceCell = document.createElement('td');
            entryPriceCell.textContent = `$${trade.entryPrice.toFixed(2)}`;
            row.appendChild(entryPriceCell);

            // Exit Price cell
            const exitPriceCell = document.createElement('td');
            exitPriceCell.textContent = `$${trade.exitPrice.toFixed(2)}`;
            row.appendChild(exitPriceCell);

            // Quantity cell
            const quantityCell = document.createElement('td');
            quantityCell.textContent = trade.quantity;
            row.appendChild(quantityCell);

            // P/L cell
            const pnlCell = document.createElement('td');
            pnlCell.textContent = `${trade.profitLoss >= 0 ? '+' : ''}$${trade.profitLoss.toFixed(2)}`;
            pnlCell.className = trade.profitLoss >= 0 ? 'profit' : 'loss';
            row.appendChild(pnlCell);

            // ROI cell
            const roiCell = document.createElement('td');
            roiCell.textContent = `${trade.profitLossPercentage >= 0 ? '+' : ''}${trade.profitLossPercentage.toFixed(2)}%`;
            roiCell.className = trade.profitLossPercentage >= 0 ? 'profit' : 'loss';
            row.appendChild(roiCell);

            // Notes cell
            const notesCell = document.createElement('td');
            notesCell.textContent = trade.notes || 'No notes available';
            row.appendChild(notesCell);

            // Delete button cell
            const deleteCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.style.color = 'red';
            deleteButton.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this trade?')) {
                    const tradeHandler = new TradeObjectHandler();
                    await tradeHandler.deleteTrade(trade.id);
                    allTrades = allTrades.filter(t => t.id !== trade.id);
                    filterTrades();
                }
            });
            deleteCell.appendChild(deleteButton);
            row.appendChild(deleteCell);

            tbody.appendChild(row);
        });

        tableElement.appendChild(tbody);
        tradesListElement.appendChild(tableElement);
    };

    const clearDateRange = () => {
        startDate.value = '';
        endDate.value = '';
        filterTrades();
    };

    // Event listeners for filters
    symbolFilter.addEventListener('input', filterTrades);
    marketFilter.addEventListener('change', filterTrades);
    directionFilter.addEventListener('change', filterTrades);
    startDate?.addEventListener('change', filterTrades);
    endDate?.addEventListener('change', filterTrades);
    clearDateRangeBtn.addEventListener('click', clearDateRange);

     // Initial load of trades
     try {
        allTrades = await tradeManager.loadTrades();
        const loadedTrades = await tradeManager.loadTrades();
        if (Array.isArray(loadedTrades)) {
            allTrades = loadedTrades;
        } else {
            allTrades = [];
            console.warn('Loaded trades is not an array:', loadedTrades);
        }
        filterTrades(); // This will display trades and update stats
    } catch (error) {
        console.error('Error loading trades:', error);
        allTrades = []; // Ensure allTrades is always an array
        // Show error message to user
        const tradesListElement = document.getElementById('allTradesList');
        if (tradesListElement) {
            tradesListElement.innerHTML = `<div class="error-message">Error loading trades: ${error.message}</div>`;
        }
    }
});