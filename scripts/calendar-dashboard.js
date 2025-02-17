document.addEventListener('DOMContentLoaded', async function() {
    const tradeManager = window.tradeManager;
    let currentYear = new Date().getFullYear();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    let selectedMonth = null;
    let selectedDay = null;

    // Initialize the calendar
    await initializeCalendar();

    // Event Listeners
    document.getElementById('prevYear').addEventListener('click', async () => {
        currentYear--;
        updateYearDisplay();
        if (selectedMonth !== null) {
            // If we're in monthly view, update the month view for the new year
            document.getElementById('monthTitle').textContent = `${monthNames[selectedMonth]} ${currentYear}`;
            renderMonthCalendar(selectedMonth);
        } else {
            // Otherwise, render year view
            await renderYearView();
        }
        updatePeriodPnL();
    });

    document.getElementById('nextYear').addEventListener('click', async () => {
        currentYear++;
        updateYearDisplay();
        if (selectedMonth !== null) {
            // If we're in monthly view, update the month view for the new year
            document.getElementById('monthTitle').textContent = `${monthNames[selectedMonth]} ${currentYear}`;
            renderMonthCalendar(selectedMonth);
        } else {
            // Otherwise, render year view
            await renderYearView();
        }
        updatePeriodPnL();
    });

    document.getElementById('backToYear').addEventListener('click', () => {
        document.getElementById('monthlyView').style.display = 'none';
        document.getElementById('yearlyView').style.display = 'block';
        selectedMonth = null;
        selectedDay = null;
        updatePeriodPnL();
    });

    // Add visibility change listener to update data when page becomes visible
    document.addEventListener('visibilitychange', async function() {
        if (document.visibilityState === 'visible') {
            await initializeCalendar();
        }
    });

    async function initializeCalendar() {
        // Load fresh trade data
        await tradeManager.loadTrades();
        updateYearDisplay();
        await renderYearView();
        updateCumulativePnL();
        updatePeriodPnL();
    }

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

    async function renderYearView() {
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
        
        monthlyView.style.display = 'block';
        yearlyView.style.display = 'none';
        
        selectedMonth = monthIndex;
        selectedDay = null;
        
        renderMonthCalendar(monthIndex);
        updatePeriodPnL();
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

            // Check if it's Saturday (6) to show weekly summary
            const isSaturday = currentDate.getDay() === 6;
            if (isSaturday) {
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

                weekNumber++;
                // Update for next week
                currentWeekStart.setDate(currentWeekStart.getDate() + 7);
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
            
            cell.addEventListener('click', () => handleDayClick(day, monthIndex));
            
            dailyGrid.appendChild(cell);
        }
    }

    function calculateWeeklyPnL(startDate, monthIndex) {
        const trades = tradeManager.trades;
        let totalPnL = 0;
        let tradeCount = 0;

        // Calculate end date (Saturday)
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (6 - startDate.getDay()));

        // Ensure we don't go beyond the current month
        const monthStart = new Date(currentYear, monthIndex, 1);
        const monthEnd = new Date(currentYear, monthIndex + 1, 0);

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

    function updateCumulativePnL() {
        const trades = tradeManager.trades;
        let totalPnL = 0;
        let totalInvestment = 0;

        trades.forEach(trade => {
            totalPnL += trade.profitLoss;
            totalInvestment += trade.investment;
        });

        const roi = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

        // Update cumulative P/L display
        const cumulativePnLElements = document.querySelectorAll('.cumulative-pnl');
        
        // Update first element (Cumulative P/L)
        if (cumulativePnLElements[0]) {
            cumulativePnLElements[0].querySelector('.value').textContent = formatPnL(totalPnL);
            cumulativePnLElements[0].querySelector('.roi').textContent = `${roi.toFixed(2)}%`;
            cumulativePnLElements[0].querySelector('.value').classList.toggle('positive', totalPnL >= 0);
            cumulativePnLElements[0].querySelector('.value').classList.toggle('negative', totalPnL < 0);
            cumulativePnLElements[0].querySelector('.roi').classList.toggle('positive', roi >= 0);
            cumulativePnLElements[0].querySelector('.roi').classList.toggle('negative', roi < 0);
        }

        // Update second element (Current Year P/L)
        if (cumulativePnLElements[1]) {
            let yearPnL = 0;
            let yearInvestment = 0;

            trades.forEach(trade => {
                const tradeDate = new Date(trade.date);
                if (tradeDate.getFullYear() === currentYear) {
                    yearPnL += trade.profitLoss;
                    yearInvestment += trade.investment;
                }
            });

            const yearRoi = yearInvestment > 0 ? (yearPnL / yearInvestment) * 100 : 0;

            cumulativePnLElements[1].querySelector('.value').textContent = formatPnL(yearPnL);
            cumulativePnLElements[1].querySelector('.roi').textContent = `${yearRoi.toFixed(2)}%`;
            cumulativePnLElements[1].querySelector('.value').classList.toggle('positive', yearPnL >= 0);
            cumulativePnLElements[1].querySelector('.value').classList.toggle('negative', yearPnL < 0);
            cumulativePnLElements[1].querySelector('.roi').classList.toggle('positive', yearRoi >= 0);
            cumulativePnLElements[1].querySelector('.roi').classList.toggle('negative', yearRoi < 0);
        }
    }

    // Add function to calculate period balance before trades
    function calculatePeriodStartBalance(startDate, endDate) {
        const trades = tradeManager.trades;
        let balance = 0;
        
        // Sort trades by date
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Find all trades before the start date and sum their P/L
        sortedTrades.forEach(trade => {
            const tradeDate = new Date(trade.date);
            if (tradeDate < startDate) {
                balance += trade.profitLoss;
            }
        });
        
        return balance;
    }

    // Add function to update period PnL
    function updatePeriodPnL() {
        const periodPnLElement = document.querySelector('.period-pnl');
        const titleElement = periodPnLElement.querySelector('#periodTitle');
        const valueElement = periodPnLElement.querySelector('.value');
        const roiElement = periodPnLElement.querySelector('.roi');
        const tradeInfoElement = periodPnLElement.querySelector('.trade-info');
        
        let periodPnL = 0;
        let tradeCount = 0;
        let startDate, endDate;
        let title = '';

        const trades = tradeManager.trades;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate period PnL based on selection
        if (selectedDay !== null && selectedMonth !== null) {
            // Day view
            startDate = new Date(currentYear, selectedMonth, selectedDay);
            endDate = new Date(currentYear, selectedMonth, selectedDay, 23, 59, 59);
            title = `${monthNames[selectedMonth]} ${selectedDay}, ${currentYear} P/L`;
        } else if (selectedMonth !== null) {
            // Month view
            startDate = new Date(currentYear, selectedMonth, 1);
            endDate = new Date(currentYear, selectedMonth + 1, 0, 23, 59, 59);
            title = `${monthNames[selectedMonth]} ${currentYear} P/L`;
        } else {
            // Year view
            startDate = new Date(currentYear, 0, 1);
            endDate = new Date(currentYear, 11, 31, 23, 59, 59);
            title = `${currentYear} P/L`;
        }

        // Calculate starting balance for ROI
        const startingBalance = calculatePeriodStartBalance(startDate, endDate);

        trades.forEach(trade => {
            const tradeDate = new Date(trade.date);
            if (tradeDate >= startDate && tradeDate <= endDate) {
                periodPnL += trade.profitLoss;
                tradeCount++;
            }
        });

        // Calculate ROI based on starting balance and make it negative if PnL is negative
        let roi = startingBalance !== 0 ? (periodPnL / Math.abs(startingBalance)) * 100 : periodPnL !== 0 ? 100 : 0;
        // Make ROI negative if PnL is negative
        roi = periodPnL < 0 ? -Math.abs(roi) : roi;

        // Update display
        titleElement.textContent = title;
        valueElement.textContent = formatPnL(periodPnL);
        roiElement.textContent = `${roi.toFixed(2)}%`;

        // Update classes for styling
        valueElement.classList.toggle('positive', periodPnL >= 0);
        valueElement.classList.toggle('negative', periodPnL < 0);
        roiElement.classList.toggle('positive', periodPnL >= 0);
        roiElement.classList.toggle('negative', periodPnL < 0);

        // Show trade count for day view only
        tradeInfoElement.style.display = selectedDay !== null ? 'block' : 'none';
        if (selectedDay !== null) {
            tradeInfoElement.textContent = `Trades: ${tradeCount}`;
        }
    }

    // Add click handler for days to update period PnL
    function handleDayClick(day, monthIndex) {
        selectedDay = day;
        updatePeriodPnL();
    }
});
