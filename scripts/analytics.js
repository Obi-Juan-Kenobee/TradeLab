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

  if (currentViewType.equity === "trade") {
    // Calculate trade-by-trade equity
    let equity = 0;
    chartData = {
      labels: trades.map((_, index) => `Trade ${index + 1}`),
      data: trades.map((trade) => {
        equity += trade.profitLoss;
        return equity;
      }),
    };
  } else {
    // Calculate daily equity
    const dailyAgg = aggregateTradesByDate(trades);
    chartData = {
      labels: dailyAgg.dates,
      data: dailyAgg.dates.map((date) => dailyAgg.data[date].equity),
    };
  }

  const minEquity = Math.min(0, ...chartData.data);
  const maxEquity = Math.max(0, ...chartData.data);
  const padding = (maxEquity - minEquity) * 0.1;

  // if (equityChart) {
  //   equityChart.destroy();
  // }

  equityChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "Equity Curve",
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
              if (currentViewType.equity === "trade") {
                if (trades.length <= 10) return `Trade ${index + 1}`;
                if (index === 0) return "Start";
                if (index === trades.length - 1) return "End";
                if (index % Math.ceil(trades.length / 10) === 0) {
                  return `Trade ${index + 1}`;
                }
              } else {
                // For date view, show fewer dates
                const dates = chartData.labels;
                if (dates.length <= 10) return dates[index];
                if (index === 0) return dates[0];
                if (index === dates.length - 1) return dates[dates.length - 1];
                if (index % Math.ceil(dates.length / 10) === 0) {
                  return dates[index];
                }
              }
              return "";
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
  
  // Clear previous chart instance
  if (drawdownChart) {
    drawdownChart.destroy();
    canvas.style.height = '';
    canvas.style.width = '';
  }

  let chartData;

  if (currentViewType.drawdown === "trade") {
    // Calculate trade-by-trade drawdown
    let equity = 0;
    let peak = 0;
    chartData = {
      labels: trades.map((_, index) => `Trade ${index + 1}`),
      data: trades.map((trade) => {
        const pnl = trade.profitLoss;
        equity += pnl;
        peak = Math.max(peak, equity);
        return peak > 0 ? ((peak - equity) / peak) * 100 : 0;
      }),
    };
  } else {
    // Calculate daily drawdown
    const dailyAgg = aggregateTradesByDate(trades);
    chartData = {
      labels: dailyAgg.dates,
      data: dailyAgg.dates.map((date) => dailyAgg.data[date].drawdown),
    };
  }

  const maxDrawdown = Math.max(...chartData.data);
  const chartPadding = maxDrawdown * 0.1;

//   if (drawdownChart) {
//     drawdownChart.destroy();
// }

drawdownChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: chartData.labels,
      datasets: [
        {
          label: "Drawdown %",
          data: chartData.data,
          borderColor: "#e74c3c",
          tension: 0.4,
          fill: true,
          backgroundColor: "rgba(231, 76, 60, 0.1)",
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
      },
      scales: {
        y: {
          min: 0,
          max: maxDrawdown + chartPadding,
          ticks: {
            callback: function (value) {
              return value.toFixed(1) + "%";
            },
          },
        },
        x: {
          ticks: {
            maxTicksLimit: 10,
            callback: function (value, index) {
                if (currentViewType.drawdown === 'trade') {
              if (trades.length <= 10) return `Trade ${index + 1}`;
              if (index === 0) return "Start";
              if (index === trades.length - 1) return "End";
              if (index % Math.ceil(trades.length / 10) === 0) {
                return `Trade ${index + 1}`;
            }
        } else {
            // For date view, show fewer dates
            const dates = chartData.labels;
            if (dates.length <= 10) return dates[index];
            if (index === 0) return dates[0];
            if (index === dates.length - 1) return dates[dates.length - 1];
            if (index % Math.ceil(dates.length / 10) === 0) {
                return dates[index];
            }
              }
              return "";
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

  // Calculate performance by trade type
  const typePerformance = {};

  trades.forEach((trade) => {
    if (!typePerformance[trade.type]) {
      typePerformance[trade.type] = 0;
    }
    typePerformance[trade.type] += trade.profitLoss;
  });

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(typePerformance),
      datasets: [
        {
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
      },
      scales: {
        y: {
          ticks: {
            callback: function (value) {
              return "$" + value.toFixed(2);
            },
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

function updateDetailedStats(trades) {
  // Calculate total P&L
  const totalPnL = trades.reduce((sum, trade) => {
    return sum + trade.profitLoss;
  }, 0);
  document.querySelector(".value").textContent = "$" + totalPnL.toFixed(2);
  document.getElementById("totalPnL").textContent = "$" + totalPnL.toFixed(2);

  if (totalPnL > 0) {
    document.querySelector(".value").style.color = "#2ecc71";
  } else if (totalPnL < 0) {
    document.querySelector(".value").style.color = "#e74c3c";
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
  // Remove existing charts
  document.getElementById("equityChart").remove();
  document.getElementById("drawdownChart").remove();
  document.getElementById("winLossChart").remove();
  document.getElementById("tradeTypeChart").remove();

  // Create new canvas elements
  const equityCanvas = document.createElement("canvas");
  equityCanvas.id = "equityChart";
  document.querySelector(".chart-card.wide").appendChild(equityCanvas);

  const drawdownCanvas = document.createElement("canvas");
  drawdownCanvas.id = "drawdownChart";
  document.querySelector(".chart-card.wide").appendChild(drawdownCanvas);

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

  // Recreate charts with new data
  createEquityChart(trades);
  createDrawdownChart(trades);
  createWinLossChart(trades);
  createTradeTypeChart(trades);
}
