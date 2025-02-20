// Global variables for trade data management
let allTrades = [];
let filteredTrades = [];
let equityChart = null;
let drawdownChart = null;
let currentViewType = {
  equity: "trade",
  drawdown: "trade",
};
let monthlyPerformanceChart = null;
let currentMonthPage = 0;
const MONTHS_PER_PAGE = 6;

// Time range constants
const TIME_RANGES = {
  'current': { type: 'year', label: 'Current Year' },
  '7': { days: 7, label: 'Last 7 Days' },
  '30': { days: 30, label: 'Last 30 Days' },
  '90': { days: 90, label: 'Last 90 Days' },
  'custom': { type: 'custom', label: 'Custom Range' }
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const loadedTrades = await tradeManager.loadTrades();
    if (Array.isArray(loadedTrades)) {
      // Store all trades and sort by date
      allTrades = loadedTrades.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Initialize date inputs with reasonable defaults
      const startDate = document.getElementById('startDate');
      const endDate = document.getElementById('endDate');
      if (startDate && endDate) {
        const today = new Date();
        endDate.value = today.toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
      }
      
      // Get initial time range and year
      const timeRange = document.getElementById("timeRange");
      const yearSelect = document.getElementById("yearSelect");
      const initialRange = timeRange ? timeRange.value : 'current';
      const initialYear = yearSelect ? yearSelect.value : new Date().getFullYear().toString();
      
      // Apply initial filtering
      if (allTrades.length > 0) {
        applyTimeRangeFilter(initialRange, initialYear);
      } else {
        console.log("No trades available");
        updateAnalytics([]);
      }
    }
  } catch (error) {
    console.error("Error loading trades:", error);
    updateAnalytics([]);
  }

  // Handle time range change
  document.getElementById("timeRange").addEventListener("change", (event) => {
    const selectedRange = event.target.value;
    const selectedYear = document.getElementById("yearSelect").value;
    const customDateRange = document.getElementById("customDateRange");
    
    // Show/hide custom date range inputs
    if (customDateRange) {
      customDateRange.style.display = selectedRange === 'custom' ? 'flex' : 'none';
    }
    
    if (selectedRange !== 'custom') {
      applyTimeRangeFilter(selectedRange, selectedYear);
    }
  });

  // Handle year selection change
  document.getElementById("yearSelect").addEventListener("change", (event) => {
    const selectedRange = document.getElementById("timeRange").value;
    const selectedYear = event.target.value;
    
    if (selectedRange !== 'custom') {
      applyTimeRangeFilter(selectedRange, selectedYear);
    }
  });

  // Handle custom range apply button
  document.getElementById("applyCustomRange").addEventListener("click", () => {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    
    if (startDate && endDate) {
      applyCustomDateFilter(startDate, endDate);
    }
  });
});

// Update the analytics function to work with the new time range system
function updateAnalytics(trades) {
  if (!trades || !Array.isArray(trades)) {
    console.warn("No trades provided to updateAnalytics");
    trades = [];
  }

  console.log(`Updating analytics with ${trades.length} trades`);
  
  // Update all UI components with the filtered trades
  updateMetrics(trades);
  updateCharts(trades);
  updateDetailedStats(trades);
  updateBestWorstTrades(trades);
}

function applyTimeRangeFilter(rangeKey, year) {
  if (!allTrades || !Array.isArray(allTrades)) {
    console.warn("No trades available to filter");
    return;
  }

  const range = TIME_RANGES[rangeKey];
  if (!range) {
    console.warn("Invalid time range:", rangeKey);
    return;
  }

  console.log(`Applying ${range.label} filter...`);
  
  let end = new Date();
  end.setHours(23, 59, 59, 999);
  
  let start = new Date();
  
  if (range.type === 'year') {
    // Filter by specific year
    start = new Date(year, 0, 1, 0, 0, 0, 0);
    end = new Date(year, 11, 31, 23, 59, 59, 999);
  } else if (range.days) {
    // Filter by last N days
    start.setDate(start.getDate() - range.days);
    start.setHours(0, 0, 0, 0);
  }
  
  console.log("Filtering date range:", {
    start: start.toLocaleString(),
    end: end.toLocaleString()
  });

  // Filter trades within the date range
  filteredTrades = allTrades.filter(trade => {
    const tradeDate = new Date(trade.date);
    return tradeDate >= start && tradeDate <= end;
  });

  console.log(`Filtered to ${filteredTrades.length} trades`);
  
  // Update all charts and statistics with filtered data
  updateAnalytics(filteredTrades);
}

function applyCustomDateFilter(startDate, endDate) {
  if (!allTrades || !Array.isArray(allTrades)) {
    console.warn("No trades available to filter");
    return;
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  console.log("Applying custom date filter:", {
    start: start.toLocaleString(),
    end: end.toLocaleString()
  });

  // Filter trades within the custom date range
  filteredTrades = allTrades.filter(trade => {
    const tradeDate = new Date(trade.date);
    return tradeDate >= start && tradeDate <= end;
  });

  console.log(`Filtered to ${filteredTrades.length} trades`);
  
  // Update all charts and statistics with filtered data
  updateAnalytics(filteredTrades);
}

function initializeAnalytics() {
  const timeRange = document.getElementById("timeRange");
  const initialValue = timeRange ? timeRange.value : "30"; // Default to 30 days if not specified
  updateMetrics(filteredTrades);
  loadCharts(filteredTrades);
  updateDetailedStats(filteredTrades);
  updateBestWorstTrades(filteredTrades);
}

function updateCharts(trades) {
  if (!trades) {
    console.warn("No trades provided to updateCharts");
    return;
  }

  if (!Array.isArray(trades)) {
    console.warn("Trades must be an array");
    return;
  }

  window.trades = trades; // Store trades for renderPage
  renderPage();
}

function loadCharts(trades) {
  window.currentTrades = trades; // Store trades for pagination
  createEquityChart(trades);
  createDrawdownChart(trades);
  createWinLossChart(trades);
  createTradeTypeChart(trades);
  createDayOfWeekChart(trades);
  createPricePerformanceChart(trades);
  createVolumeChart(trades);
  createAverageTradeChart(trades);
  createMonthlyPerformanceChart(trades);
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
        filteredTrades
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

  // Sort dates and calculate cumulative equity and drawdown
  const sortedDates = Object.keys(dailyData).sort();
  let peak = 0;
  let currentEquity = 0;
  let maxDrawdownPercent = 0;

  sortedDates.forEach((date) => {
    currentEquity += dailyData[date].totalPnL;
    dailyData[date].equity = currentEquity;
    
    // Update peak if we have a new high
    if (currentEquity > peak) {
      peak = currentEquity;
    }
    
    // Calculate current drawdown percentage
    // Formula: Drawdown % = ((Peak - Current) / Peak) * 100
    const currentDrawdownPercent = peak > 0 ? ((peak - currentEquity) / peak) * 100 : 0;
    dailyData[date].drawdown = currentDrawdownPercent;
    
    // Track maximum drawdown percentage seen so far
    maxDrawdownPercent = Math.max(maxDrawdownPercent, currentDrawdownPercent);
  });

  return {
    dates: sortedDates,
    data: dailyData,
    maxDrawdownPercent: maxDrawdownPercent
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
          borderColor: function(context) {
            const value = context.raw;
            return value >= 0 ? "#2ecc71" : "#e74c3c";
          },
          segment: {
            borderColor: function(context) {
              return context.p0.parsed.y >= 0 && context.p1.parsed.y >= 0 ? "#2ecc71" : 
                     context.p0.parsed.y < 0 && context.p1.parsed.y < 0 ? "#e74c3c" :
                     createGradient(context.p0.parsed.y, context.p1.parsed.y, "#2ecc71", "#e74c3c");
            },
            backgroundColor: function(context) {
              return context.p0.parsed.y >= 0 ? "rgba(46, 204, 113, 0.1)" : "rgba(231, 76, 60, 0.1)";
            }
          },
          fill: {
            target: 'origin',
            above: 'rgba(46, 204, 113, 0.1)',  // Area above origin (green)
            below: 'rgba(231, 76, 60, 0.1)'    // Area below origin (red)
          },
          tension: 0.4,
        }
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

  const dailyAgg = aggregateTradesByDate(trades);
  const chartData = {
    labels: dailyAgg.dates,
    data: dailyAgg.dates.map((date) => dailyAgg.data[date].drawdown),
    maxDrawdown: dailyAgg.maxDrawdownPercent
  };

  const maxDrawdown = chartData.maxDrawdown;
  const chartPadding = maxDrawdown * 0.1;

  drawdownChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "Current Drawdown %",
          data: chartData.data,
          borderColor: "#e74c3c",
          backgroundColor: "rgba(231, 76, 60, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Maximum Drawdown %",
          data: Array(chartData.labels.length).fill(maxDrawdown),
          borderColor: "#c0392b",
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return new Date(context[0].label).toLocaleDateString();
            },
            label: function(context) {
              const datasetLabel = context.dataset.label || '';
              return datasetLabel + ': ' + context.raw.toFixed(2) + '%';
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
          title: {
            display: true,
            text: 'Drawdown %'
          }
        },
        x: {
          ticks: {
            maxTicksLimit: 10,
            callback: function (value, index) {
              const date = new Date(chartData.labels[index]);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            },
          },
          title: {
            display: true,
            text: 'Date'
          }
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
    // Ensure we're working with a Date object and set to midnight
    const date = new Date(trade.date);
    date.setHours(0, 0, 0, 0);
    const dayName = daysOfWeek[date.getDay()];
    
    // Skip weekends for stock trades
    if ((dayName === 'Sunday' || dayName === 'Saturday') && trade.market === 'Stock') {
      console.warn(`Skipping ${trade.symbol} trade on ${dayName} as stock market is closed on weekends`);
      return;
    }
    
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
      const width = maxAbsPnL > 0 ? ((Math.abs(range.pnl) / maxAbsPnL) * 100) : 0;
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

function createVolumeChart(trades) {
  if (!trades || trades.length === 0) {
    console.warn("No trades available for volume chart");
    return;
  }

  const canvas = document.getElementById("volumeChart");
  const ctx = canvas.getContext("2d");

  // Calculate daily volumes
  const dailyVolumes = {};
  trades.forEach((trade) => {
    const date = new Date(trade.date).toISOString().split('T')[0];
    if (!dailyVolumes[date]) {
      dailyVolumes[date] = 0;
    }
    dailyVolumes[date] += Math.abs(trade.quantity);
  });

  // Sort dates and prepare chart data
  const sortedDates = Object.keys(dailyVolumes).sort();
  const chartData = {
    labels: sortedDates,
    data: sortedDates.map(date => dailyVolumes[date])
  };

  // Create gradient for bars
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, '#2ecc71');
  gradient.addColorStop(1, '#27ae60');

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: 'Daily Volume',
        data: chartData.data,
        backgroundColor: gradient,
        borderWidth: 0,
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
            title: function(context) {
              return new Date(context[0].label).toLocaleDateString();
            },
            label: function(context) {
              return `Volume: ${context.raw.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toLocaleString();
            }
          },
          title: {
            display: true,
            text: 'Volume'
          }
        },
        x: {
          ticks: {
            maxTicksLimit: 10,
            callback: function(value, index) {
              const date = new Date(chartData.labels[index]);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
          },
          title: {
            display: true,
            text: 'Date'
          }
        }
      }
    }
  });
}

function createAverageTradeChart(trades) {
  if (!trades || trades.length === 0) {
    console.warn("No trades available for average trade chart");
    return;
  }

  const canvas = document.getElementById("avgTradeChart");
  if (!canvas) {
    console.warn("Average trade chart canvas not found");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Could not get 2D context for average trade chart");
    return;
  }

  // Group trades by date and calculate average P&L
  const dailyAverages = {};
  trades.forEach((trade) => {
    const date = new Date(trade.date).toISOString().split('T')[0];
    if (!dailyAverages[date]) {
      dailyAverages[date] = {
        totalPnL: 0,
        count: 0
      };
    }
    dailyAverages[date].totalPnL += trade.profitLoss;
    dailyAverages[date].count++;
  });

  // Calculate average P&L for each day
  const sortedDates = Object.keys(dailyAverages).sort();
  const chartData = {
    labels: sortedDates,
    data: sortedDates.map(date => {
      const avg = dailyAverages[date].totalPnL / dailyAverages[date].count;
      return avg;
    })
  };

  // Create chart
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: 'Average P&L',
        data: chartData.data,
        backgroundColor: chartData.data.map(value => value >= 0 ? '#2ecc71' : '#e74c3c'),
        borderWidth: 0
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
            title: function(context) {
              return new Date(context[0].label).toLocaleDateString();
            },
            label: function(context) {
              return `Average P&L: ${formatCurrency(context.raw)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          },
          title: {
            display: true,
            text: 'Average P&L per Trade'
          }
        },
        x: {
          grid: {
            display: false
          }
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

  // Calculate daily volumes
  const dailyVolumes = {};
  trades.forEach((trade) => {
    const date = new Date(trade.date).toISOString().split('T')[0];
    if (!dailyVolumes[date]) {
      dailyVolumes[date] = 0;
    }
    dailyVolumes[date] += Math.abs(trade.quantity);
  });

  // Calculate average daily volume
  const totalVolume = Object.values(dailyVolumes).reduce((sum, volume) => sum + volume, 0);
  const avgDailyVolume = totalVolume / Object.keys(dailyVolumes).length;

  // Separate winning and losing trades
  const winningTrades = trades.filter((trade) => trade.profitLoss > 0);
  const losingTrades = trades.filter((trade) => trade.profitLoss < 0);

  // Calculate averages
  const avgWin =
    winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) /
        winningTrades.length
      : 0;

  const avgLoss =
    losingTrades.length > 0
      ? losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) /
        losingTrades.length
      : 0;

  // Find largest win and loss
  const largestWin = winningTrades.length > 0
    ? Math.max(...winningTrades.map((trade) => trade.profitLoss))
    : 0;

  const largestLoss = losingTrades.length > 0
    ? Math.min(...losingTrades.map((trade) => trade.profitLoss))
    : 0;

  // Calculate win/loss streaks
  let currentStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;

  trades.forEach((trade) => {
    if (trade.profitLoss > 0) {
      if (currentStreak > 0) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      maxWinStreak = Math.max(maxWinStreak, currentStreak);
    } else if (trade.profitLoss < 0) {
      if (currentStreak < 0) {
        currentStreak--;
      } else {
        currentStreak = -1;
      }
      maxLossStreak = Math.max(maxLossStreak, Math.abs(currentStreak));
    } else {
      currentStreak = 0;
    }
  });

  // Calculate risk/reward ratio
  let riskReward;
  if (avgLoss === 0 && avgWin > 0) {
    riskReward = "∞"; // Only winning trades
  } else if (avgLoss === 0 && avgWin === 0) {
    riskReward = "0"; // No trades or all trades are break-even
  } else {
    riskReward = (avgWin / avgLoss).toFixed(2);
  }

  // Update DOM
  document.getElementById("totalPnL").textContent = formatCurrency(totalPnL);
  document.getElementById("largestWin").textContent = formatCurrency(largestWin);
  document.getElementById("largestLoss").textContent = formatCurrency(largestLoss);
  document.getElementById("avgWin").textContent = formatCurrency(avgWin);
  document.getElementById("avgLoss").textContent = formatCurrency(avgLoss);
  document.getElementById("winStreak").textContent = maxWinStreak;
  document.getElementById("lossStreak").textContent = maxLossStreak;
  document.getElementById("riskReward").textContent = `${riskReward}:1`;
  document.getElementById("avgDailyVolume").textContent = Math.round(avgDailyVolume).toLocaleString();

  // Calculate and update excursion metrics
  const excursionMetrics = calculateExcursionMetrics(trades);
  updateExcursionDisplay(excursionMetrics);
}

function calculateExcursionMetrics(trades) {
  let metrics = {
    positionMFE: 0,
    positionMAE: 0,
    priceMFE: 0,
    priceMAE: 0,
    hasData: false
  };

  trades.forEach(trade => {
    // Skip trades without excursion data
    if (!trade.maxRunup && !trade.maxDrawdown) {
      return;
    }

    if (!metrics.hasData) {
      metrics.positionMAE = trade.maxDrawdown || 0;
      metrics.priceMAE = trade.maxDrawdown ? trade.maxDrawdown / Math.abs(trade.quantity) : 0;
      metrics.hasData = true;
    }

    // Position metrics (considering quantity)
    if (trade.maxRunup) {
      metrics.positionMFE = Math.max(metrics.positionMFE, trade.maxRunup);
    }
    if (trade.maxDrawdown) {
      metrics.positionMAE = Math.min(metrics.positionMAE, trade.maxDrawdown);
    }

    // Price metrics (per share/contract)
    if (trade.maxRunup) {
      const priceRunup = trade.maxRunup / Math.abs(trade.quantity);
      metrics.priceMFE = Math.max(metrics.priceMFE, priceRunup);
    }
    if (trade.maxDrawdown) {
      const priceDrawdown = trade.maxDrawdown / Math.abs(trade.quantity);
      metrics.priceMAE = Math.min(metrics.priceMAE, priceDrawdown);
    }
  });

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

  // Helper function to update bar and value
  const updateMetric = (id, value, isNegative = false) => {
    const bar = document.getElementById(id + 'Bar');
    const valueElement = document.getElementById(id);
    
    if (!bar || !valueElement) {
      console.error('Elements not found for:', id);
      return;
    }

    const absValue = Math.abs(value);
    const displayValue = formatCurrency(isNegative ? -absValue : absValue);
    valueElement.textContent = displayValue;
    
    // Calculate width as percentage of maxValue
    const width = maxValue > 0 ? ((absValue / maxValue) * 100) : 0;
    bar.style.width = width + '%';
    
    // Add appropriate class for coloring
    bar.className = `bar ${isNegative ? 'negative' : 'positive'}`;
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
  if (!trades) {
    console.warn("No trades provided to updateCharts");
    return;
  }

  if (!Array.isArray(trades)) {
    console.warn("Trades must be an array");
    return;
  }

  window.trades = trades; // Store trades for renderPage
  renderPage();
}

function renderPage() {
  if (!window.trades || !Array.isArray(window.trades)) {
    console.warn("No valid trades available for rendering");
    return;
  }

  // Safely remove existing canvases
  const safeRemove = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.remove();
    }
  };

  safeRemove("equityChart");
  safeRemove("drawdownChart");
  safeRemove("winLossChart");
  safeRemove("tradeTypeChart");
  safeRemove("dayOfWeekChart");
  safeRemove("volumeChart");
  safeRemove("avgTradeChart");
  safeRemove("monthlyPerformanceChart");
  safeRemove("pricePerformanceChart");

  document.querySelector(".price-performance-container")?.remove();

  // Create and append canvases
  const chartConfig = [
    { id: "equityChart", container: ".chart-card.equity-chart .chart-container" },
    { id: "drawdownChart", container: ".chart-card.drawdown-chart .chart-container" },
    { id: "avgTradeChart", container: ".chart-card.avg-trade-chart .chart-container" },
    { id: "volumeChart", container: ".chart-card.volume-chart .chart-container" },
    { id: "winLossChart", container: ".chart-card.win-loss-chart .chart-container" },
    { id: "tradeTypeChart", container: ".chart-card.trade-type-chart .chart-container" },
    { id: "dayOfWeekChart", container: ".chart-card.day-of-week-chart" },
    { id: "monthlyPerformanceChart", container: ".chart-card.monthly-performance-chart .chart-container" }
  ];

  // Create each canvas
  chartConfig.forEach(config => {
    const container = document.querySelector(config.container);
    if (!container) {
      console.warn(`Container not found: ${config.container}`);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.id = config.id;
    container.appendChild(canvas);
  });

  // Create price performance chart separately due to its unique structure
  const pricePerformanceCard = document.querySelector(".chart-card.price-performance-card");
  if (pricePerformanceCard) {
    const container = document.createElement("div");
    container.className = "price-performance-container";
    const canvas = document.createElement("canvas");
    canvas.id = "pricePerformanceChart";
    container.appendChild(canvas);
    pricePerformanceCard.appendChild(container);
  }

  // Create all charts with the current trades
  const trades = window.trades;
  if (trades && trades.length > 0) {
    try {
      // Create charts in a specific order to handle dependencies
      createEquityChart(trades);
      createDrawdownChart(trades);
      createWinLossChart(trades);
      createTradeTypeChart(trades);
      createDayOfWeekChart(trades);
      createPricePerformanceChart(trades);
      createVolumeChart(trades);
      createAverageTradeChart(trades);
      createMonthlyPerformanceChart(trades);
    } catch (error) {
      console.error("Error creating charts:", error);
    }
  } else {
    console.warn("No trades available for creating charts");
  }
}

function createGradient(start, end, colorStart, colorEnd) {
  const ctx = document.createElement('canvas').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 1);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
}

function createMonthlyPerformanceChart(trades) {
  if (!trades || trades.length === 0) {
    console.warn("No trades available for monthly performance chart");
    return;
  }

  // Group trades by month and calculate performance
  const monthlyPerformance = new Array(12).fill(0).map(() => ({
    totalPnL: 0,
    count: 0
  }));

  trades.forEach((trade) => {
    const date = new Date(trade.date);
    const month = date.getMonth();
    monthlyPerformance[month].totalPnL += trade.profitLoss;
    monthlyPerformance[month].count++;
  });

  // Calculate percentage of total profit for each month
  const totalProfit = monthlyPerformance.reduce((sum, month) => sum + Math.max(0, month.totalPnL), 0);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const chartData = monthlyPerformance.map((month, index) => ({
    month: monthNames[index],
    pnl: month.totalPnL,
    percentage: totalProfit > 0 ? (month.totalPnL / totalProfit * 100) : 0
  }));

  // Update pagination
  const totalPages = Math.ceil(12 / MONTHS_PER_PAGE);
  document.getElementById('monthlyPerfPageIndicator').textContent = `${currentMonthPage + 1} / ${totalPages}`;
  document.getElementById('monthlyPerfPrevBtn').disabled = currentMonthPage === 0;
  document.getElementById('monthlyPerfNextBtn').disabled = currentMonthPage === totalPages - 1;

  // Get data for current page
  const startIdx = currentMonthPage * MONTHS_PER_PAGE;
  const pageData = chartData.slice(startIdx, startIdx + MONTHS_PER_PAGE);

  // Create or update chart
  const ctx = document.getElementById('monthlyPerformanceChart').getContext('2d');
  
  if (monthlyPerformanceChart) {
    monthlyPerformanceChart.destroy();
  }

  monthlyPerformanceChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: pageData.map(d => d.month),
      datasets: [{
        data: pageData.map(d => d.pnl),
        backgroundColor: pageData.map(d => d.pnl >= 0 ? '#2ecc71' : '#e74c3c'),
        borderWidth: 0,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const data = pageData[context.dataIndex];
              return [
                `P&L: ${formatCurrency(data.pnl)}`,
                `${data.percentage.toFixed(2)}% of total profit`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Add event listeners for pagination
document.getElementById('monthlyPerfPrevBtn').addEventListener('click', () => {
  if (currentMonthPage > 0) {
    currentMonthPage--;
    createMonthlyPerformanceChart(window.trades);
  }
});

document.getElementById('monthlyPerfNextBtn').addEventListener('click', () => {
  const totalPages = Math.ceil(12 / MONTHS_PER_PAGE);
  if (currentMonthPage < totalPages - 1) {
    currentMonthPage++;
    createMonthlyPerformanceChart(window.trades);
  }
});

function updateMetrics(trades) {
  if (!trades || !Array.isArray(trades)) {
    console.warn("Invalid trades array provided to updateMetrics");
    return;
  }

  // Calculate winning trades
  const winningTrades = trades.filter(trade => trade.profitLoss > 0).length;
  const winRate = trades.length > 0 ? ((winningTrades / trades.length) * 100).toFixed(1) : 0;
  document.getElementById("winRate").textContent = winRate + "%";

  // Calculate profit factor
  const grossProfit = trades.reduce((sum, trade) => {
    if (trade.profitLoss > 0) {
      return sum + trade.profitLoss;
    }
    return sum;
  }, 0);

  const grossLoss = trades.reduce((sum, trade) => {
    if (trade.profitLoss < 0) {
      return sum + trade.profitLoss;
    }
    return sum;
  }, 0);

  const profitFactor = grossLoss !== 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? "∞" : "0";
  document.getElementById("profitFactor").textContent = profitFactor;

  // Update total trades
  document.getElementById("totalTrades").textContent = trades.length.toString();

  // Calculate average trade
  const totalPnL = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
  const avgTrade = trades.length > 0 ? (totalPnL / trades.length) : 0;
  document.getElementById("avgTrade").textContent = formatCurrency(avgTrade);

  // Find best and worst trades
  if (trades.length > 0) {
    const bestTrade = trades.reduce((best, trade) => trade.profitLoss > best.profitLoss ? trade : best, trades[0]);
    const worstTrade = trades.reduce((worst, trade) => trade.profitLoss < worst.profitLoss ? trade : worst, trades[0]);
    
    document.getElementById("bestTrade").textContent = formatCurrency(bestTrade.profitLoss);
    document.getElementById("worstTrade").textContent = formatCurrency(worstTrade.profitLoss);
    
    // Update classes for color coding
    document.getElementById("bestTrade").className = "metric-value positive";
    document.getElementById("worstTrade").className = "metric-value negative";
  } else {
    document.getElementById("bestTrade").textContent = "$0.00";
    document.getElementById("worstTrade").textContent = "$0.00";
  }

  // Update cumulative PnL and ROI
  const cumPnlElement = document.querySelector(".cumulative-pnl .value");
  const cumRoiElement = document.querySelector(".cumulative-pnl .roi");

  if (cumPnlElement && cumRoiElement) {
    // Calculate total investment
    const totalInvestment = trades.reduce((sum, trade) => sum + trade.investment, 0);
    const roi = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

    // Update PnL display
    cumPnlElement.textContent = formatCurrency(totalPnL);
    cumPnlElement.className = `value ${totalPnL >= 0 ? "positive" : "negative"}`;

    // Update ROI display
    cumRoiElement.textContent = `${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`;
    cumRoiElement.className = `roi ${roi >= 0 ? "positive" : "negative"}`;
  }
}

// Helper function to format currency values
function formatCurrency(value) {
  const numValue = parseFloat(value);
  const sign = numValue >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(numValue).toFixed(2)}`;
}

// Helper function to format dates consistently
function formatTradeDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d;
}
