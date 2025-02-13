let allTrades = [];
let equityChart = null;
let drawdownChart = null;
let currentViewType = {
  equity: "trade",
  drawdown: "trade",
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const loadedTrades = await tradeManager.loadTrades();
    if (Array.isArray(loadedTrades)) {
      allTrades = loadedTrades;
      initializeAnalytics();
      initializeViewSwitches();
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
  const winningTrades = trades.filter((trade) => trade.profitLoss > 0).length;
  const winRate =
    trades.length > 0 ? ((winningTrades / trades.length) * 100).toFixed(1) : 0;
  document.getElementById("winRate").textContent = winRate + "%";

  // Calculate profit factor using the following formula: Profit Factor = Total Gross Profit / Total Gross Loss
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

  const profitFactor =
    grossLoss !== 0 ? (grossProfit / grossLoss).toFixed(2) : 0;
  document.getElementById("profitFactor").textContent = profitFactor;

  // Update total trades
  document.getElementById("totalTrades").textContent = trades.length;

  // Calculate average trade
  const totalPnL = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
  const avgTrade =
    trades.length > 0 ? (totalPnL / trades.length).toFixed(2) : 0;
  document.getElementById("avgTrade").textContent = "$" + avgTrade;
}

function loadCharts(trades) {
  createEquityChart(trades);
  createDrawdownChart(trades);
  createWinLossChart(trades);
  createTradeTypeChart(trades);
  createDayOfWeekChart(trades);
  createPricePerformanceChart(trades);
}

function initializeViewSwitches() {
  document.querySelectorAll(".switch-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const chartType = this.dataset.chart;
      const viewType = this.dataset.view;

      // Update active state
      this.parentElement
        .querySelectorAll(".switch-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      // Update current view type
      currentViewType[chartType] = viewType;

      // Update the chart
      updateCharts(
        filterTradesByDate(
          allTrades,
          document.getElementById("timeRange").value
        )
      );
    });
  });
}

function aggregateTradesByDate(trades) {
  const dailyData = {};

  trades.forEach((trade) => {
    const date = new Date(trade.date).toISOString().split("T")[0];
    if (!dailyData[date]) {
      dailyData[date] = {
        totalPnL: 0,
        equity: 0,
        drawdown: 0,
      };
    }
    dailyData[date].totalPnL += trade.profitLoss;
  });

  // Sort dates and calculate cumulative equity
  const sortedDates = Object.keys(dailyData).sort();
  let peak = 0;
  let currentEquity = 0;

  sortedDates.forEach((date) => {
    currentEquity += dailyData[date].totalPnL;
    dailyData[date].equity = currentEquity;
    peak = Math.max(peak, currentEquity);
    dailyData[date].drawdown =
      peak > 0 ? ((peak - currentEquity) / peak) * 100 : 0;
  });

  return {
    dates: sortedDates,
    data: dailyData,
  };
}

function createEquityChart(trades) {
  if (!trades || trades.length === 0) {
    console.warn("No trades available for equity chart");
    return;
  }

  const canvas = document.getElementById("equityChart");
  const ctx = canvas.getContext("2d");
  
  // Clear previous chart instance
  if (equityChart) {
    equityChart.destroy();
    canvas.style.height = '';
    canvas.style.width = '';
  }

  let chartData;

  // if (currentViewType.equity === "trade") {
  //   // Calculate trade-by-trade equity
  //   let equity = 0;
  //   chartData = {
  //     labels: trades.map((_, index) => `Trade ${index + 1}`),
  //     data: trades.map((trade) => {
  //       equity += trade.profitLoss;
  //       return equity;
  //     }),
  //   };
  // } else {
    // Calculate daily equity
    const dailyAgg = aggregateTradesByDate(trades);
    chartData = {
      labels: dailyAgg.dates,
      data: dailyAgg.dates.map((date) => dailyAgg.data[date].equity),
    };
    console.log(chartData.labels);
  // }

  const minEquity = Math.min(0, ...chartData.data);
  const maxEquity = Math.max(0, ...chartData.data);
  const padding = (maxEquity - minEquity) * 0.1;

  equityChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "Cumulative PnL",
          data: chartData.data,
          borderColor: "#2ecc71",
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return new Date(context[0].label).toLocaleDateString();
            },
            label: function(context) {
              return 'Cumulative PnL: $' + context.raw.toFixed(2);
            }
          }
        }
      },
      scales: {
        y: {
          min: minEquity - padding,
          max: maxEquity + padding,
          ticks: {
            callback: function (value) {
              return "$" + value.toFixed(2);
            },
          },
        },
        x: {
          ticks: {
            maxTicksLimit: 10,
            callback: function (value, index) {
              const date = new Date(chartData.labels[index]);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            },
          },
        },
      },
    },
  });
}

function createDrawdownChart(trades) {
  if (!trades || trades.length === 0) {
    console.warn("No trades available for drawdown chart");
    return;
  }

  const canvas = document.getElementById("drawdownChart");
  const ctx = canvas.getContext("2d");

  if (drawdownChart) {
    drawdownChart.destroy();
    canvas.style.height = '';
    canvas.style.width = '';
  }

  let chartData;
  const dailyAgg = aggregateTradesByDate(trades);
  chartData = {
    labels: dailyAgg.dates,
    data: dailyAgg.dates.map((date) => {
      const dayData = dailyAgg.data[date];
      return dayData.drawdown;
    }),
  };

  const maxDrawdown = Math.max(...chartData.data);
  const chartPadding = maxDrawdown * 0.1;

  drawdownChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "Drawdown %",
          data: chartData.data,
          borderColor: "#e74c3c",
          backgroundColor: "rgba(231, 76, 60, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return new Date(context[0].label).toLocaleDateString();
            },
            label: function(context) {
              return 'Drawdown: ' + context.raw.toFixed(2) + '%';
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: maxDrawdown + chartPadding,
          ticks: {
            callback: function (value) {
              return value.toFixed(2) + "%";
            },
          },
        },
        x: {
          ticks: {
            maxTicksLimit: 10,
            callback: function (value, index) {
              const date = new Date(chartData.labels[index]);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            },
          },
        },
      },
    },
  });
}

function createWinLossChart(trades) {
  if (!trades || trades.length === 0) {
    console.warn("No trades available for win/loss chart");
    return;
  }

  const canvas = document.getElementById("winLossChart");
  const ctx = canvas.getContext("2d");

  // Get win/loss counts
  const winCount = trades.filter((trade) => trade.profitLoss > 0).length;
  const lossCount = trades.filter((trade) => trade.profitLoss < 0).length;

  const chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Wins", "Losses"],
      datasets: [
        {
          data: [winCount, lossCount],
          backgroundColor: ["#2ecc71", "#e74c3c"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
          },
        },
      },
      layout: {
        padding: {
          top: 20,
          bottom: 20,
        },
      },
    },
  });
}

function createTradeTypeChart(trades) {
  if (!trades || trades.length === 0) {
    console.warn("No trades available for trade type chart");
    return;
  }

  const canvas = document.getElementById("tradeTypeChart");
  const ctx = canvas.getContext("2d");

  // Calculate performance by trade direction (long/short)
  const typePerformance = {};

  trades.forEach((trade) => {
    const direction = trade.direction ? trade.direction.toUpperCase() : 'UNKNOWN';
    if (!typePerformance[direction]) {
      typePerformance[direction] = 0;
    }
    typePerformance[direction] += trade.profitLoss;
  });

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(typePerformance),
      datasets: [
        {
          label: 'P&L by Trade Type',
          data: Object.values(typePerformance),
          backgroundColor: Object.values(typePerformance).map((value) =>
            value >= 0 ? "#2ecc71" : "#e74c3c"
          ),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'P&L: $' + context.raw.toFixed(2);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "$" + value.toFixed(2);
            },
          },
        },
        x: {
          title: {
            display: true,
            text: 'Trade Direction'
          }
        }
      },
      layout: {
        padding: {
          top: 20,
          bottom: 20,
        },
      },
    },
  });
}

function createDayOfWeekChart(trades) {
  if (!trades || trades.length === 0) {
    console.warn("No trades available for day of week chart");
    return;
  }

  const canvas = document.getElementById("dayOfWeekChart");
  const ctx = canvas.getContext("2d");

  // Initialize performance data for each day of the week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayPerformance = {
    'Sunday': { pnl: 0, totalTrades: 0, winningTrades: 0 },
    'Monday': { pnl: 0, totalTrades: 0, winningTrades: 0 },
    'Tuesday': { pnl: 0, totalTrades: 0, winningTrades: 0 },
    'Wednesday': { pnl: 0, totalTrades: 0, winningTrades: 0 },
    'Thursday': { pnl: 0, totalTrades: 0, winningTrades: 0 },
    'Friday': { pnl: 0, totalTrades: 0, winningTrades: 0 },
    'Saturday': { pnl: 0, totalTrades: 0, winningTrades: 0 }
  };

  // Calculate performance metrics for each day of the week
  trades.forEach((trade) => {
    const date = new Date(trade.date);
    const dayName = daysOfWeek[date.getDay()];
    dayPerformance[dayName].pnl += trade.profitLoss;
    dayPerformance[dayName].totalTrades++;
    if (trade.profitLoss > 0) {
      dayPerformance[dayName].winningTrades++;
    }
  });

  const totalTrades = trades.length;

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: daysOfWeek,
      datasets: [
        {
          label: 'P&L by Day of Week',
          data: daysOfWeek.map(day => dayPerformance[day].pnl),
          backgroundColor: daysOfWeek.map(day => 
            dayPerformance[day].pnl >= 0 ? "#2ecc71" : "#e74c3c"
          ),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const dayName = context.label;
              const dayData = dayPerformance[dayName];
              const pnl = dayData.pnl.toFixed(2);
              const winRate = dayData.totalTrades > 0 
                ? ((dayData.winningTrades / dayData.totalTrades) * 100).toFixed(1)
                : 0;
              const tradePercentage = ((dayData.totalTrades / totalTrades) * 100).toFixed(1);
              
              return [
                `P&L: $${pnl}`,
                `Win Rate: ${winRate}%`,
                `${dayData.totalTrades} trades (${tradePercentage}% of total)`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "$" + value.toFixed(2);
            },
          },
        },
        x: {
          title: {
            display: true,
            text: 'Day of Week'
          },
          ticks: {
            font: {
              size: 11
            }
          }
        }
      },
      layout: {
        padding: {
          top: 20,
          bottom: 20,
          left: 10,
          right: 10
        },
      },
    },
  });
}

function createPricePerformanceChart(trades) {
  if (!trades || trades.length === 0) {
    console.warn("No trades available for price performance chart");
    return;
  }

  const priceRanges = [
    { min: 0, max: 2, label: "< $2.00" },
    { min: 2, max: 5, label: "$2 - $4.99" },
    { min: 5, max: 10, label: "$5 - $9.99" },
    { min: 10, max: 20, label: "$10 - $19.99" },
    { min: 20, max: 50, label: "$20 - $49.99" },
    { min: 50, max: 100, label: "$50 - $99.99" },
    { min: 100, max: 200, label: "$100 - $199.99" },
    { min: 200, max: 500, label: "$200 - $499.99" },
    { min: 500, max: 1000, label: "$500 - $999.99" },
    { min: 1000, max: Infinity, label: "> $1000" }
  ];

  // Calculate performance for each price range
  const rangePerformance = priceRanges.map(range => {
    const tradesInRange = trades.filter(trade => {
      const price = trade.entryPrice;
      return price >= range.min && price < range.max;
    });

    if (tradesInRange.length === 0) {
      return {
        ...range,
        pnl: 0,
        totalTrades: 0,
        percentage: 0,
        hasData: false
      };
    }

    const pnl = tradesInRange.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const percentage = (tradesInRange.length / trades.length) * 100;

    return {
      ...range,
      pnl,
      totalTrades: tradesInRange.length,
      percentage,
      hasData: true
    };
  });

  // Filter out ranges with no trades
  const activeRanges = rangePerformance.filter(range => range.hasData);

  // Calculate maximum absolute PnL for scaling
  const maxAbsPnL = Math.max(...activeRanges.map(range => Math.abs(range.pnl)));

  // Split into pages of 8 ranges each
  const itemsPerPage = 8;
  const pages = [];
  for (let i = 0; i < activeRanges.length; i += itemsPerPage) {
    pages.push(activeRanges.slice(i, i + itemsPerPage));
  }

  let currentPage = 0;

  function updatePagination() {
    const prevButton = document.querySelector('.prev-page');
    const nextButton = document.querySelector('.next-page');
    const pageIndicator = document.querySelector('.page-indicator');

    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage === pages.length - 1;
    pageIndicator.textContent = `${currentPage + 1} / ${pages.length}`;
  }

  function renderPage() {
    const container = document.querySelector('.price-performance-container');
    container.innerHTML = '';

    if (pages.length === 0) {
      container.innerHTML = '<div class="no-data">No trade data available</div>';
      return;
    }

    pages[currentPage].forEach(range => {
      const row = document.createElement('div');
      row.className = 'price-row';

      const label = document.createElement('div');
      label.className = 'price-label';
      label.textContent = range.label;

      const bar = document.createElement('div');
      bar.className = 'performance-bar';

      const fill = document.createElement('div');
      fill.className = `bar-fill ${range.pnl >= 0 ? 'positive' : 'negative'}`;
      
      // Calculate width as percentage of max PnL
      const width = (Math.abs(range.pnl) / maxAbsPnL) * 100;
      fill.style.width = `${width}%`;

      const value = document.createElement('div');
      value.className = 'performance-value';
      value.innerHTML = `$${range.pnl.toFixed(2)} <span class="percentage">${range.percentage.toFixed(1)}%</span>`;

      bar.appendChild(fill);
      row.appendChild(label);
      row.appendChild(bar);
      row.appendChild(value);
      container.appendChild(row);
    });

    updatePagination();
  }

  // Set up pagination event listeners
  document.querySelector('.prev-page').addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      renderPage();
    }
  });

  document.querySelector('.next-page').addEventListener('click', () => {
    if (currentPage < pages.length - 1) {
      currentPage++;
      renderPage();
    }
  });

  // Initial render
  renderPage();
}

function updateDetailedStats(trades) {
  // Calculate total P&L
  const totalPnL = trades.reduce((sum, trade) => {
    return sum + trade.profitLoss;
  }, 0);

  // Calculate total initial investment (sum of entry prices)
  const totalInvestment = trades.reduce((sum, trade) => {
    return sum + (trade.entryPrice * trade.quantity);
  }, 0);

  // Calculate ROI
  const roi = totalInvestment > 0 ? ((totalPnL / totalInvestment) * 100).toFixed(2) : "0.00";

  // Update both P&L displays and ROI
  document.querySelector(".value").textContent = "$" + totalPnL.toFixed(2);
  document.getElementById("totalPnL").textContent = "$" + totalPnL.toFixed(2);
  document.querySelector(".percentage").textContent = "ROI: " + roi + "%";

  // Update P&L color
  if (totalPnL > 0) {
    document.querySelector(".value").style.color = "#2ecc71";
    document.querySelector(".percentage").style.color = "#2ecc71";
  } else if (totalPnL < 0) {
    document.querySelector(".value").style.color = "#e74c3c";
    document.querySelector(".percentage").style.color = "#e74c3c";
  }

  // Calculate largest win/loss
  const pnLs = trades.map((trade) => trade.profitLoss);
  const largestWin = Math.max(...pnLs, 0);
  const largestLoss = Math.min(...pnLs, 0);
  document.getElementById("largestWin").textContent =
    "$" + largestWin.toFixed(2);
  document.getElementById("largestLoss").textContent =
    "$" + Math.abs(largestLoss).toFixed(2);

  // Calculate average win/loss
  const winningTrades = trades.filter((trade) => trade.profitLoss > 0);
  const losingTrades = trades.filter((trade) => trade.profitLoss < 0);

  const avgWin =
    winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) /
        winningTrades.length
      : 0;

  const avgLoss =
    losingTrades.length > 0
      ? Math.abs(
          losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) /
            losingTrades.length
        )
      : 0;

  document.getElementById("avgWin").textContent = "$" + avgWin.toFixed(2);
  document.getElementById("avgLoss").textContent = "$" + avgLoss.toFixed(2);

  // Calculate win/loss streaks
  let currentStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;

  trades.forEach((trade) => {
    if (trade.profitLoss > 0) {
      currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
      maxWinStreak = Math.max(maxWinStreak, currentStreak);
    } else {
      currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
      maxLossStreak = Math.min(maxLossStreak, currentStreak);
    }
  });

  document.getElementById("winStreak").textContent = maxWinStreak;
  document.getElementById("lossStreak").textContent = Math.abs(maxLossStreak);

  // Calculate risk/reward ratio
  const riskReward = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : 0;
  document.getElementById("riskReward").textContent = `${riskReward}:1`;

  // Calculate excursion metrics
  const excursionMetrics = calculateExcursionMetrics(trades);
  updateExcursionDisplay(excursionMetrics);
}

function calculateExcursionMetrics(trades) {
  let metrics = {
    positionMFE: 0,
    positionMAE: 0,
    priceMFE: 0,
    priceMAE: 0
  };

  trades.forEach(trade => {
    // Position metrics (considering quantity)
    metrics.positionMFE = Math.max(metrics.positionMFE, trade.maxRunup || 0);
    metrics.positionMAE = Math.min(metrics.positionMAE, trade.maxDrawdown || 0);

    // Price metrics (independent of quantity)
    const priceRunup = trade.maxRunup ? trade.maxRunup / Math.abs(trade.quantity) : 0;
    const priceDrawdown = trade.maxDrawdown ? trade.maxDrawdown / Math.abs(trade.quantity) : 0;

    metrics.priceMFE = Math.max(metrics.priceMFE, priceRunup);
    metrics.priceMAE = Math.min(metrics.priceMAE, priceDrawdown);
  });
  
  // For debugging
  console.log('Excursion Metrics:', metrics);

  return metrics;
}

function updateExcursionDisplay(metrics) {
  // Get the maximum absolute value for scaling
  const maxValue = Math.max(
    Math.abs(metrics.positionMFE),
    Math.abs(metrics.positionMAE),
    Math.abs(metrics.priceMFE),
    Math.abs(metrics.priceMAE)
  );
  // For debugging
  console.log('Max Value for scaling:', maxValue);

  // Helper function to update bar and value
  const updateMetric = (id, value, isNegative = false) => {
    const bar = document.getElementById(id + 'Bar');
    const valueElement = document.getElementById(id);
    
    if (!bar || !valueElement) {
      console.error('Elements not found for:', id);
      return;
    }

    const absValue = Math.abs(value);
    const displayValue = isNegative ? `-$${absValue.toFixed(2)}` : `$${absValue.toFixed(2)}`;
    valueElement.textContent = displayValue;
    
    const width = maxValue > 0 ? ((absValue / maxValue) * 100) : 0;
    bar.style.width = width + '%';
    
    // For debugging
    console.log(`${id}:`, { value, width: width + '%' });
  };
  
  // Update all metrics
  updateMetric('positionMFE', metrics.positionMFE);
  updateMetric('positionMAE', metrics.positionMAE, true);
  updateMetric('priceMFE', metrics.priceMFE);
  updateMetric('priceMAE', metrics.priceMAE, true);
}

function updateBestWorstTrades(trades) {
  // Sort trades by P&L
  const sortedTrades = [...trades].sort((a, b) => {
    const pnlA = a.profitLoss;
    const pnlB = b.profitLoss;
    return pnlB - pnlA;
  });

  // Update best trades
  const bestTradesHtml = sortedTrades
    .slice(0, 5)
    .map((trade) => {
      const pnl = trade.profitLoss;
      return `
            <div class="trade-item">
                <span class="trade-symbol">${trade.symbol}</span>
                <span class="trade-pnl positive">+$${pnl.toFixed(2)}</span>
            </div>
        `;
    })
    .join("");
  document.getElementById("bestTrades").innerHTML = bestTradesHtml;

  // Update worst trades
  const worstTradesHtml = sortedTrades
    .slice(-5)
    .reverse()
    .map((trade) => {
      const pnl = trade.profitLoss;
      return `
            <div class="trade-item">
                <span class="trade-symbol">${trade.symbol}</span>
                <span class="trade-pnl negative">-$${Math.abs(pnl).toFixed(
                  2
                )}</span>
            </div>
        `;
    })
    .join("");
  document.getElementById("worstTrades").innerHTML = worstTradesHtml;
}

function updateCharts(trades) {
  // Remove old canvases and containers
  document.getElementById("equityChart").remove();
  document.getElementById("drawdownChart").remove();
  document.getElementById("winLossChart").remove();
  document.getElementById("tradeTypeChart").remove();
  document.getElementById("dayOfWeekChart").remove();
  document.querySelector(".price-performance-container").innerHTML = '';

  // Create new canvas elements
  const equityCanvas = document.createElement("canvas");
  equityCanvas.id = "equityChart";
  document
    .querySelector(".chart-card.wide.equity-chart")
    .appendChild(equityCanvas);

  const drawdownCanvas = document.createElement("canvas");
  drawdownCanvas.id = "drawdownChart";
  document
    .querySelector(".chart-card.wide.drawdown-chart")
    .appendChild(drawdownCanvas);

  const winLossCanvas = document.createElement("canvas");
  winLossCanvas.id = "winLossChart";
  document
    .querySelectorAll(".chart-card:not(.wide)")[0]
    .appendChild(winLossCanvas);

  const tradeTypeCanvas = document.createElement("canvas");
  tradeTypeCanvas.id = "tradeTypeChart";
  document
    .querySelectorAll(".chart-card:not(.wide)")[1]
    .appendChild(tradeTypeCanvas);

  const dayOfWeekCanvas = document.createElement("canvas");
  dayOfWeekCanvas.id = "dayOfWeekChart";
  document
    .querySelectorAll(".chart-card:not(.wide)")[2]
    .appendChild(dayOfWeekCanvas);

  // Recreate charts with new data
  createEquityChart(trades);
  createDrawdownChart(trades);
  createWinLossChart(trades);
  createTradeTypeChart(trades);
  createDayOfWeekChart(trades);
  createPricePerformanceChart(trades);
}
