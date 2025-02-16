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

    function getMonthStats(monthIndex) {
        const trades = tradeManager.trades;
        let winCount = 0;
        let lossCount = 0;
        let totalPnL = 0;

        trades.forEach(trade => {
            const tradeDate = new Date(trade.date);
            if (tradeDate.getFullYear() === currentYear && tradeDate.getMonth() === monthIndex) {
                const pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
                totalPnL += pnl;
                if (pnl > 0) winCount++;
                else if (pnl < 0) lossCount++;
            }
        });

        return { winCount, lossCount, totalPnL };
    }

    function renderYearView() {
        const monthsGrid = document.querySelector('.months-grid');
        monthsGrid.innerHTML = '';

        monthNames.forEach((month, index) => {
            const stats = getMonthStats(index);
            const card = createMonthCard(month, stats, index);
            monthsGrid.appendChild(card);
        });
    }

    function createMonthCard(month, stats, monthIndex) {
        const card = document.createElement('div');
        card.className = `month-card ${stats.totalPnL >= 0 ? 'profit' : 'loss'}`;
        card.innerHTML = `
            <h3>${month}</h3>
            <div class="month-pnl ${stats.totalPnL >= 0 ? 'positive' : 'negative'}">
                ${formatPnL(stats.totalPnL)}
            </div>
            <div class="month-stats">
                <span>Wins: ${stats.winCount}</span>
                <span>Losses: ${stats.lossCount}</span>
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

    function getDayTrades(day, monthIndex) {
        const trades = tradeManager.trades;
        return trades.filter(trade => {
            const tradeDate = new Date(trade.date);
            return tradeDate.getFullYear() === currentYear && 
                   tradeDate.getMonth() === monthIndex && 
                   tradeDate.getDate() === day;
        });
    }

    function renderMonthCalendar(monthIndex) {
        const dailyGrid = document.getElementById('dailyGrid');
        dailyGrid.innerHTML = '';

        const firstDay = new Date(currentYear, monthIndex, 1);
        const lastDay = new Date(currentYear, monthIndex + 1, 0);
        const startingDay = firstDay.getDay();

        // Calculate the start of the first week
        const firstWeekStart = new Date(firstDay);
        firstWeekStart.setDate(firstWeekStart.getDate() - startingDay);

        // Add empty cells for days before the first of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell inactive';
            dailyGrid.appendChild(emptyCell);
        }

        let currentWeekStart = new Date(firstWeekStart);
        let weekNumber = 1;

        // Add cells for each day of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const cell = document.createElement('div');
            const currentDate = new Date(currentYear, monthIndex, day);
            const dayTrades = getDayTrades(day, monthIndex);
            const pnl = calculateDayPnL(day, monthIndex);
            
            cell.className = `day-cell ${pnl > 0 ? 'win' : pnl < 0 ? 'loss' : ''}`;
            
            const isToday = isCurrentDay(currentYear, monthIndex, day);
            if (isToday) cell.classList.add('today');

            const isSaturday = currentDate.getDay() === 6;
            const isLastDayOfMonth = day === lastDay.getDate();
            
            // Show weekly summary on Saturdays or the last day of the month
            if (isSaturday || isLastDayOfMonth) {
                const weekStats = calculateWeeklyPnL(currentWeekStart, monthIndex);
                
                // Only show week summary if there are trades
                if (weekStats.trades > 0) {
                    cell.classList.add('week-summary');
                    cell.innerHTML = `
                        <span class="day-number">${day}</span>
                        ${dayTrades.length > 0 ? `
                            <span class="day-pnl ${pnl >= 0 ? 'positive' : 'negative'}">
                                ${formatPnL(pnl)}
                            </span>
                        ` : ''}
                        <div class="week-total ${weekStats.pnl >= 0 ? 'positive' : 'negative'}">
                            Week ${weekNumber}
                            <span>${formatPnL(weekStats.pnl)}</span>
                            <small>${weekStats.trades} trades</small>
                        </div>
                    `;
                } else {
                    cell.innerHTML = `
                        <span class="day-number">${day}</span>
                        ${dayTrades.length > 0 ? `
                            <span class="day-pnl ${pnl >= 0 ? 'positive' : 'negative'}">
                                ${formatPnL(pnl)}
                            </span>
                        ` : ''}
                    `;
                }

                if (isSaturday) {
                    weekNumber++;
                    // Update for next week
                    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
                }
            } else {
                cell.innerHTML = `
                    <span class="day-number">${day}</span>
                    ${dayTrades.length > 0 ? `
                        <span class="day-pnl ${pnl >= 0 ? 'positive' : 'negative'}">
                            ${formatPnL(pnl)}
                        </span>
                    ` : ''}
                `;
            }
            
            if (dayTrades.length > 0) {
                cell.title = `${dayTrades.length} trade${dayTrades.length > 1 ? 's' : ''}\nP/L: ${formatPnL(pnl)}`;
            }
            
            dailyGrid.appendChild(cell);
        }
    }

    function calculateWeeklyPnL(startDate, monthIndex) {
        const trades = tradeManager.trades;
        let totalPnL = 0;
        let tradeCount = 0;

        // Calculate end date (Saturday or end of month)
        const endDate = new Date(startDate);
        const monthEnd = new Date(currentYear, monthIndex + 1, 0);
        
        // If we're in the last week, use month end as the end date
        if (startDate > new Date(currentYear, monthIndex, monthEnd.getDate() - 6)) {
            endDate.setTime(monthEnd.getTime());
        } else {
            endDate.setDate(startDate.getDate() + (6 - startDate.getDay()));
        }

        // Ensure we don't go beyond the current month
        const monthStart = new Date(currentYear, monthIndex, 1);

        // Adjust start and end dates to stay within the month
        const effectiveStartDate = new Date(Math.max(startDate, monthStart));
        const effectiveEndDate = new Date(Math.min(endDate, monthEnd));

        trades.forEach(trade => {
            const tradeDate = new Date(trade.date);
            // Only count trades within the current month's week portion
            if (tradeDate >= effectiveStartDate && tradeDate <= effectiveEndDate) {
                totalPnL += (trade.exitPrice - trade.entryPrice) * trade.quantity;
                tradeCount++;
            }
        });

        return { pnl: totalPnL, trades: tradeCount };
    }

    function calculateMonthPnL(monthIndex) {
        const trades = tradeManager.trades;
        return trades.reduce((total, trade) => {
            const tradeDate = new Date(trade.date);
            if (tradeDate.getFullYear() === currentYear && tradeDate.getMonth() === monthIndex) {
                return total + ((trade.exitPrice - trade.entryPrice) * trade.quantity);
            }
            return total;
        }, 0);
    }

    function calculateDayPnL(day, monthIndex) {
        const trades = tradeManager.trades;
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
