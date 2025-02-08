document.addEventListener('DOMContentLoaded', function() {
    const tradeManager = window.tradeManager;
    let currentYear = new Date().getFullYear();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Initialize the calendar
    updateYearDisplay();
    renderYearView();

    // Event Listeners
    document.getElementById('prevYear').addEventListener('click', () => {
        currentYear--;
        updateYearDisplay();
        renderYearView();
    });

    document.getElementById('nextYear').addEventListener('click', () => {
        currentYear++;
        updateYearDisplay();
        renderYearView();
    });

    document.getElementById('backToYear').addEventListener('click', () => {
        document.getElementById('monthlyView').style.display = 'none';
        document.getElementById('yearlyView').style.display = 'block';
    });

    function updateYearDisplay() {
        document.getElementById('currentYear').textContent = currentYear;
    }

    function renderYearView() {
        const monthsGrid = document.querySelector('.months-grid');
        monthsGrid.innerHTML = '';

        monthNames.forEach((month, index) => {
            const monthPnL = calculateMonthPnL(index);
            const card = createMonthCard(month, monthPnL, index);
            monthsGrid.appendChild(card);
        });
    }

    function createMonthCard(month, pnl, monthIndex) {
        const card = document.createElement('div');
        card.className = 'month-card';
        card.innerHTML = `
            <h3>${month}</h3>
            <div class="month-pnl ${pnl >= 0 ? 'positive' : 'negative'}">
                ${formatPnL(pnl)}
            </div>
        `;

        card.addEventListener('click', () => showMonthView(monthIndex));
        return card;
    }

    function showMonthView(monthIndex) {
        const monthlyView = document.getElementById('monthlyView');
        const yearlyView = document.getElementById('yearlyView');
        
        document.getElementById('monthTitle').textContent = `${monthNames[monthIndex]} ${currentYear}`;
        
        renderMonthCalendar(monthIndex);
        
        monthlyView.style.display = 'block';
        yearlyView.style.display = 'none';
    }

    function renderMonthCalendar(monthIndex) {
        const dailyGrid = document.getElementById('dailyGrid');
        dailyGrid.innerHTML = '';

        const firstDay = new Date(currentYear, monthIndex, 1);
        const lastDay = new Date(currentYear, monthIndex + 1, 0);
        const startingDay = firstDay.getDay();

        // Add empty cells for days before the first of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell inactive';
            dailyGrid.appendChild(emptyCell);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            
            const isToday = isCurrentDay(currentYear, monthIndex, day);
            if (isToday) cell.classList.add('today');

            const pnl = calculateDayPnL(day, monthIndex);
            
            cell.innerHTML = `
                <span class="day-number">${day}</span>
                <span class="day-pnl ${pnl >= 0 ? 'positive' : 'negative'}">
                    ${formatPnL(pnl)}
                </span>
            `;
            
            dailyGrid.appendChild(cell);
        }
    }

    function calculateMonthPnL(monthIndex) {
        const trades = tradeManager.trades;
        const currentYear = new Date().getFullYear(); // Get current year dynamically
    
        return trades.reduce((total, trade) => {
            // 1. Robust Date Parsing: Use a consistent date format and parse explicitly
            try {
                const tradeDate = new Date(trade.date); // Try direct parsing first
    
                if (isNaN(tradeDate) && typeof trade.date === 'string'){ //Check if the date is invalid and a string, then split and parse
                    const dateParts = trade.date.split('-'); // Assuming YYYY-MM-DD format
                    if(dateParts.length === 3){
                        const year = parseInt(dateParts[0]);
                        const month = parseInt(dateParts[1]) - 1; // Adjust for zero-based month
                        const day = parseInt(dateParts[2]);
                        tradeDate = new Date(year, month, day);
                    } else {
                        console.error("Invalid date format:", trade.date);
                        return total; // Skip this trade if date is invalid
                    }
    
                }
    
                if (isNaN(tradeDate)) {
                    console.error("Invalid date:", trade.date);
                    return total; // Skip this trade if date is invalid
                }
    
    
                // 2. Correct Month Comparison: Use zero-based index directly
                if (tradeDate.getFullYear() === currentYear && tradeDate.getMonth() === monthIndex) {
                    // 3. Ensure numeric values: Parse to float if necessary
                    const profit = parseFloat(trade.exitPrice) - parseFloat(trade.entryPrice);
                    const quantity = parseFloat(trade.quantity);
    
                    if (isNaN(profit) || isNaN(quantity)) {
                        console.error("Invalid price or quantity for trade:", trade);
                        return total; // Skip if prices or quantity are not numbers
                    }
                    return total + (profit * quantity);
                }
            } catch (error) {
                console.error("Error processing trade:", trade, error);
            }
    
            return total;
        }, 0);
    }

    function calculateDayPnL(day, monthIndex) {
        const trades = JSON.parse(localStorage.getItem('trades') || '[]');
        return trades.reduce((total, trade) => {
            const tradeDate = new Date(trade.date);
            if (tradeDate.getFullYear() === currentYear && 
                tradeDate.getMonth() === monthIndex && 
                tradeDate.getDate() === day) {
                return total + ((trade.exitPrice - trade.entryPrice) * trade.quantity);
            }
            return total;
        }, 0);
    }

    function formatPnL(pnl) {
        const formatted = Math.abs(pnl).toFixed(2);
        return pnl >= 0 ? `$${formatted}` : `-$${formatted}`;
    }

    function isCurrentDay(year, month, day) {
        const today = new Date();
        return today.getFullYear() === year && 
               today.getMonth() === month && 
               today.getDate() === day;
    }
});
