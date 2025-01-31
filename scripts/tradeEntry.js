document.addEventListener('DOMContentLoaded', async function() {
    // Get modal elements
    const editModal = document.getElementById('editTradeModal');
    const closeBtn = editModal.querySelector('.close');
    const cancelBtn = document.getElementById('cancelEdit');
    const editForm = document.getElementById('editTradeForm');
    const tradesTableBody = document.querySelector('#tradesTable tbody');

    // Form fields
    const editTradeId = document.getElementById('editTradeId');
    const editDate = document.getElementById('editDate');
    const editSymbol = document.getElementById('editSymbol');
    const editDirection = document.getElementById('editDirection');
    const editMarket = document.getElementById('editMarket');
    const editEntryPrice = document.getElementById('editEntryPrice');
    const editExitPrice = document.getElementById('editExitPrice');
    const editQuantity = document.getElementById('editQuantity');
    const editNotes = document.getElementById('editNotes');

    // Helper functions
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    function calculatePL(trade) {
        const direction = trade.direction || 'Long';
        const multiplier = direction === 'Long' ? 1 : -1;
        return (trade.exitPrice - trade.entryPrice) * trade.quantity * multiplier;
    }

    function calculateROI(trade) {
        const pl = calculatePL(trade);
        const investment = trade.entryPrice * trade.quantity;
        return (pl / investment) * 100;
    }

    // Function to open modal and populate with trade data
    function openEditModal(trade) {
        editTradeId.value = trade.id;
        editDate.value = trade.date.split('T')[0];
        editSymbol.value = trade.symbol;
        editDirection.value = trade.direction;
        editMarket.value = trade.market;
        editEntryPrice.value = trade.entryPrice;
        editExitPrice.value = trade.exitPrice;
        editQuantity.value = trade.quantity;
        editNotes.value = trade.notes || '';
        editModal.style.display = 'block';
    }

    // Function to close modal
    function closeModal() {
        editModal.style.display = 'none';
        editForm.reset();
    }

    // Close modal when clicking close button or cancel
    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === editModal) {
            closeModal();
        }
    }

    // Handle form submission
    editForm.onsubmit = async function(e) {
        e.preventDefault();
        
        const updatedTrade = new Trade(
            editSymbol.value,
            editMarket.value,
            editEntryPrice.value,
            editExitPrice.value,
            editQuantity.value,
            editDate.value,
            editNotes.value,
            editDirection.value
        );
        updatedTrade.id = editTradeId.value;

        try {
            const index = window.tradeManager.trades.findIndex(t => t.id === updatedTrade.id);
            
            if (index !== -1) {
                window.tradeManager.trades[index] = updatedTrade;
                await window.tradeManager.saveTrades();
                window.tradeManager.displayTrades(window.tradeManager.trades);
                closeModal();
                showNotification('Trade updated successfully!', 'success');
            }
        } catch (error) {
            console.error('Error updating trade:', error);
            showNotification('Error updating trade. Please try again.', 'error');
        }
    };

    // Add edit button to trades table
    function addEditButton(trade) {
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-trade-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Edit Trade';
        editBtn.onclick = () => openEditModal(trade);
        return editBtn;
    }

    // Function to show notification
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Function to create table row for a trade
    function createTradeRow(trade) {
        const row = document.createElement('tr');
        const investment = trade.entryPrice * Math.abs(trade.quantity);
        const pl = calculatePL(trade);
        const roi = calculateROI(trade);
        
        row.innerHTML = `
            <td>${formatDate(trade.date)}</td>
            <td>${trade.symbol.toUpperCase()}</td>
            <td>
                <span class="direction-badge ${trade.direction.toLowerCase()}">
                    ${trade.direction === "long" ? "▲ LONG" : "▼ SHORT"}
                </span>
            </td>
            <td>${trade.market}</td>
            <td>$${trade.entryPrice.toFixed(2)}</td>
            <td>$${trade.exitPrice.toFixed(2)}</td>
            <td>${trade.quantity}</td>
            <td>$${investment.toFixed(2)}</td>
            <td class="${pl >= 0 ? 'profit' : 'loss'}">
                ${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}
            </td>
            <td class="${pl >= 0 ? 'profit' : 'loss'}">
                ${pl >= 0 ? '+' : ''}${roi.toFixed(2)}%
            </td>
            <td>${trade.notes || '-'}</td>
            <td class="actions-cell">
                <button class="edit-trade-btn" onclick="openEditModal(${JSON.stringify(trade)})" title="Edit Trade">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-trade-btn" onclick="deleteTrade('${trade.id}')" title="Delete Trade">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        return row;
    }

    // Function to update trades table
    function updateTradesTable() {
        if (!tradesTableBody) return;
        
        const trades = JSON.parse(localStorage.getItem('trades') || '[]');
        tradesTableBody.innerHTML = '';
        
        window.tradeManager.trades.forEach(trade => {
            tradesTableBody.appendChild(createTradeRow(trade));
        });

        // Update cumulative P/L
        updateCumulativePL(window.tradeManager.trades);
    }

    // Function to update cumulative P/L
    function updateCumulativePL(trades) {
        const cumulativePL = trades.reduce((total, trade) => total + calculatePL(trade), 0);
        const totalInvestment = trades.reduce((total, trade) => total + (trade.entryPrice * trade.quantity), 0);
        const cumulativeROI = totalInvestment > 0 ? (cumulativePL / totalInvestment) * 100 : 0;

        const cumulativePLElement = document.querySelector('.cumulative-pnl .value');
        const cumulativeROIElement = document.querySelector('.cumulative-pnl .roi');

        if (cumulativePLElement) {
            cumulativePLElement.textContent = `$${cumulativePL.toFixed(2)}`;
            cumulativePLElement.classList.toggle('positive', cumulativePL > 0);
            cumulativePLElement.classList.toggle('negative', cumulativePL < 0);
        }

        if (cumulativeROIElement) {
            cumulativeROIElement.textContent = `ROI: ${cumulativeROI.toFixed(2)}%`;
            cumulativeROIElement.classList.toggle('positive', cumulativeROI > 0);
            cumulativeROIElement.classList.toggle('negative', cumulativeROI < 0);
        }
    }

    // Initial load of trades
    await window.tradeManager.loadTrades();
    updateTradesTable();
});
