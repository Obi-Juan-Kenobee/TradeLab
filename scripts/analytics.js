document.addEventListener("DOMContentLoaded", async () => {
    try {
        const loadedTrades = await tradeManager.loadTrades();
        if (Array.isArray(loadedTrades)) {
            allTrades = loadedTrades;
            initializeAnalytics();
        } else {
            console.warn("Loaded trades is not an array:", loadedTrades);
        }
    } catch (error) {
        console.error("Error loading trades:", error);
        const tradesListElement = document.getElementById("allTradesList");
        if (tradesListElement) {
            tradesListElement.innerHTML = `<div class="error-message">Error loading trades: ${error.message}</div>`;
        }
    }

    // Handle time range change
    document.getElementById("timeRange").addEventListener("change", (event) => {
        updateAnalytics(allTrades, event.target.value);
    });
});

function initializeAnalytics() {
  updateMetrics(allTrades);
  loadCharts(allTrades);
  updateDetailedStats(allTrades);
  updateBestWorstTrades(allTrades);
}

function updateAnalytics(allTrades, days) {
  const filteredTrades = filterTradesByDate(allTrades, days);

  updateMetrics(filteredTrades);
  updateCharts(filteredTrades);
  updateDetailedStats(filteredTrades);
  updateBestWorstTrades(filteredTrades);
}

function filterTradesByDate(trades, days) {
  if (days === "all") return trades;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return trades.filter((trade) => new Date(trade.date) >= cutoffDate);
}

function updateMetrics(trades) {
    // Calculate win rate
    const winningTrades = trades.filter(trade => trade.profitLoss > 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length * 100).toFixed(1) : 0;
    document.getElementById('winRate').textContent = winRate + '%';

    // Calculate profit factor
    const grossProfit = trades.reduce((sum, trade) => {
        if (trade.profitLoss > 0) {
            return sum + trade.profitLoss;
        }
        return sum;
    }, 0);

    const grossLoss = trades.reduce((sum, trade) => {
        if (trade.profitLoss < 0) {
            return sum + Math.abs(trade.profitLoss);
        }
        return sum;
    }, 0);

    const profitFactor = grossLoss !== 0 ? (grossProfit / grossLoss).toFixed(2) : 0;
    document.getElementById('profitFactor').textContent = profitFactor;

    // Update total trades
    document.getElementById('totalTrades').textContent = trades.length;

    // Calculate average trade
    const totalPnL = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const avgTrade = trades.length > 0 ? (totalPnL / trades.length).toFixed(2) : 0;
    document.getElementById('avgTrade').textContent = '$' + avgTrade;
}

function loadCharts(trades) {
    createEquityChart(trades);
    createDrawdownChart(trades);
    createWinLossChart(trades);
    createTradeTypeChart(trades);
}

function createEquityChart(trades) {
    if (!trades || trades.length === 0) {
        console.warn('No trades available for equity chart');
        return;
    }
    const ctx = document.getElementById('equityChart').getContext('2d');
    let equity = 0;
    const equityData = trades.map(trade => {
        const pnl = trade.profitLoss;
        equity += pnl;
        return equity;
    });

    const minEquity = Math.min(0, ...equityData);
    const maxEquity = Math.max(0, ...equityData);
    const padding = (maxEquity - minEquity) * 0.1;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: trades.map((_, index) => `Trade ${index + 1}`),
            datasets: [{
                label: 'Equity Curve',
                data: equityData,
                borderColor: '#3498db',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(52, 152, 219, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: minEquity - padding,
                    max: maxEquity + padding,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 10,
                        callback: function(value, index) {
                            // Show fewer x-axis labels
                            if (trades.length <= 10) return `Trade ${index + 1}`;
                            if (index === 0) return 'Start';
                            if (index === trades.length - 1) return 'End';
                            if (index % Math.ceil(trades.length / 10) === 0) {
                                return `Trade ${index + 1}`;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

function createDrawdownChart(trades) {
    const ctx = document.getElementById('drawdownChart').getContext('2d');
    let equity = 0;
    let peak = 0;
    let drawdownData = [];

    // Calculate drawdown for each trade
    trades.forEach(trade => {
        const pnl = trade.profitLoss;
        equity += pnl;
        peak = Math.max(peak, equity);
        const drawdown = ((peak - equity) / peak) * 100;
        drawdownData.push(drawdown);
    });

    // Find max drawdown for scaling
    const maxDrawdown = Math.max(...drawdownData);
    const chartPadding = maxDrawdown * 0.1;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: trades.map((_, index) => `Trade ${index + 1}`),
            datasets: [{
                label: 'Drawdown %',
                data: drawdownData,
                borderColor: '#e74c3c',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(231, 76, 60, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Drawdown: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: maxDrawdown + chartPadding,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 10,
                        callback: function(value, index) {
                            if (trades.length <= 10) return `Trade ${index + 1}`;
                            if (index === 0) return 'Start';
                            if (index === trades.length - 1) return 'End';
                            if (index % Math.ceil(trades.length / 10) === 0) {
                                return `Trade ${index + 1}`;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

function createWinLossChart(trades) {
    const ctx = document.getElementById('winLossChart').getContext('2d');
    const winningTrades = trades.filter(trade => trade.profitLoss > 0).length;
    const losingTrades = trades.length - winningTrades;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Winning Trades', 'Losing Trades'],
            datasets: [{
                data: [winningTrades, losingTrades],
                backgroundColor: ['#27ae60', '#e74c3c'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20
                }
            }
        }
    });
}

function createTradeTypeChart(trades) {
    const ctx = document.getElementById('tradeTypeChart').getContext('2d');
    const tradeTypes = {};
    
    trades.forEach(trade => {
        tradeTypes[trade.tradeType] = (tradeTypes[trade.tradeType] || 0) + 1;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(tradeTypes),
            datasets: [{
                data: Object.values(tradeTypes),
                backgroundColor: '#3498db',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20
                }
            }
        }
    });
}

function updateDetailedStats(trades) {
    // Calculate total P&L
    const totalPnL = trades.reduce((sum, trade) => {
        return sum + trade.profitLoss;
    }, 0);
    document.querySelector('.value').textContent = '$' + totalPnL.toFixed(2);

    if (totalPnL > 0) {
        document.querySelector('.value').style.color = '#2ecc71';
    } else if (totalPnL < 0) {
        document.querySelector('.value').style.color = '#e74c3c';
    }

    // Calculate largest win/loss
    const pnLs = trades.map(trade => trade.profitLoss);
    const largestWin = Math.max(...pnLs, 0);
    const largestLoss = Math.min(...pnLs, 0);
    document.getElementById('largestWin').textContent = '$' + largestWin.toFixed(2);
    document.getElementById('largestLoss').textContent = '$' + Math.abs(largestLoss).toFixed(2);

    // Calculate average win/loss
    const winningTrades = trades.filter(trade => trade.profitLoss > 0);
    const losingTrades = trades.filter(trade => trade.profitLoss < 0);
    
    const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) / winningTrades.length 
        : 0;
    
    const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) / losingTrades.length)
        : 0;

    document.getElementById('avgWin').textContent = '$' + avgWin.toFixed(2);
    document.getElementById('avgLoss').textContent = '$' + avgLoss.toFixed(2);

    // Calculate win/loss streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    trades.forEach(trade => {
        if (trade.profitLoss > 0) {
            currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
            maxWinStreak = Math.max(maxWinStreak, currentStreak);
        } else {
            currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
            maxLossStreak = Math.min(maxLossStreak, currentStreak);
        }
    });

    document.getElementById('winStreak').textContent = maxWinStreak;
    document.getElementById('lossStreak').textContent = Math.abs(maxLossStreak);

    // Calculate risk/reward ratio
    const riskReward = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : 0;
    document.getElementById('riskReward').textContent = `${riskReward}:1`;
}

function updateBestWorstTrades(trades) {
    // Sort trades by P&L
    const sortedTrades = [...trades].sort((a, b) => {
        const pnlA = a.profitLoss;
        const pnlB = b.profitLoss;
        return pnlB - pnlA;
    });

    // Update best trades
    const bestTradesHtml = sortedTrades.slice(0, 5).map(trade => {
        const pnl = trade.profitLoss;
        return `
            <div class="trade-item">
                <span class="trade-symbol">${trade.symbol}</span>
                <span class="trade-pnl positive">+$${pnl.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    document.getElementById('bestTrades').innerHTML = bestTradesHtml;

    // Update worst trades
    const worstTradesHtml = sortedTrades.slice(-5).reverse().map(trade => {
        const pnl = trade.profitLoss;
        return `
            <div class="trade-item">
                <span class="trade-symbol">${trade.symbol}</span>
                <span class="trade-pnl negative">-$${Math.abs(pnl).toFixed(2)}</span>
            </div>
        `;
    }).join('');
    document.getElementById('worstTrades').innerHTML = worstTradesHtml;
}

function updateCharts(trades) {
    // Remove existing charts
    document.getElementById('equityChart').remove();
    document.getElementById('drawdownChart').remove();
    document.getElementById('winLossChart').remove();
    document.getElementById('tradeTypeChart').remove();

    // Create new canvas elements
    const equityCanvas = document.createElement('canvas');
    equityCanvas.id = 'equityChart';
    document.querySelector('.chart-card.wide').appendChild(equityCanvas);

    const drawdownCanvas = document.createElement('canvas');
    drawdownCanvas.id = 'drawdownChart';
    document.querySelector('.chart-card.wide').appendChild(drawdownCanvas);

    const winLossCanvas = document.createElement('canvas');
    winLossCanvas.id = 'winLossChart';
    document.querySelectorAll('.chart-card:not(.wide)')[0].appendChild(winLossCanvas);

    const tradeTypeCanvas = document.createElement('canvas');
    tradeTypeCanvas.id = 'tradeTypeChart';
    document.querySelectorAll('.chart-card:not(.wide)')[1].appendChild(tradeTypeCanvas);

    // Recreate charts with new data
    createEquityChart(trades);
    createDrawdownChart(trades);
    createWinLossChart(trades);
    createTradeTypeChart(trades);
}