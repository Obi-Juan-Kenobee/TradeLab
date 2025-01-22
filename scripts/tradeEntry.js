// Event listeners for trade direction buttons
document.addEventListener('DOMContentLoaded', () => {
    const longButton = document.querySelector('.direction-btn.long');
    const shortButton = document.querySelector('.direction-btn.short');
    const directionInput = document.getElementById('direction');

    function setDirection(direction) {
        // Update the hidden input value
        directionInput.value = direction;
        
        // Update button styles
        if (direction === 'long') {
            longButton.classList.add('active');
            shortButton.classList.remove('active');
        } else {
            shortButton.classList.add('active');
            longButton.classList.remove('active');
        }
    }

    // Add click event listeners
    longButton.addEventListener('click', () => setDirection('long'));
    shortButton.addEventListener('click', () => setDirection('short'));

    // Set initial state
    setDirection('long');
});

// Set up edit modal handlers
document.addEventListener('DOMContentLoaded', () => {
    const editModal = document.getElementById('editTradeModal');
    const editForm = document.getElementById('editTradeForm');
    const closeBtn = editModal.querySelector('.close');
    const cancelBtn = document.getElementById('cancelEdit');
  
    // Close modal when clicking close button
    closeBtn.addEventListener('click', () => {
      editModal.style.display = 'none';
    });
  
    // Close modal when clicking cancel button
    cancelBtn.addEventListener('click', () => {
      editModal.style.display = 'none';
    });
  
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === editModal) {
        editModal.style.display = 'none';
      }
    });
  
    // Handle form submission
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const tradeId = document.getElementById('editTradeId').value;
      const trade = tradeManager.trades.find(t => t.id === tradeId);
      
      if (trade) {
        // Update trade object
        trade.date = new Date(document.getElementById('editDate').value);
        trade.symbol = document.getElementById('editSymbol').value;
        trade.direction = document.getElementById('editDirection').value.toLowerCase();
        trade.market = document.getElementById('editMarket').value;
        trade.entryPrice = parseFloat(document.getElementById('editEntryPrice').value);
        trade.exitPrice = parseFloat(document.getElementById('editExitPrice').value);
        trade.quantity = parseFloat(document.getElementById('editQuantity').value);
        trade.notes = document.getElementById('editNotes').value;
        
        // Recalculate derived values
        trade.investment = parseFloat((trade.entryPrice * Math.abs(trade.quantity)).toFixed(2));
        trade.profitLoss = parseFloat(trade.calculateProfitLoss().toFixed(2));
        trade.profitLossPercentage = parseFloat(((trade.profitLoss / trade.investment) * 100).toFixed(2));
  
        // Save changes
        await tradeManager.saveTrades();
        tradeManager.displayTrades();
  
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = 'Trade updated successfully';
        document.body.appendChild(notification);
  
        // Remove notification after 3 seconds
        setTimeout(() => {
          notification.remove();
        }, 3000);
  
        // Close modal
        editModal.style.display = 'none';
      }
    });
  });