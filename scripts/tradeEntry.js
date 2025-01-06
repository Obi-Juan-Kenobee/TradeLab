// Trade class to handle trade data
class Trade {
    constructor(
      symbol,
      market,
      entryPrice,
      exitPrice,
      quantity,
      date,
      notes,
      direction
    ) {
      this.id = Date.now().toString();
      this.symbol = symbol;
      this.market = market;
      this.entryPrice = entryPrice;
      this.exitPrice = exitPrice;
      this.quantity = quantity;
      this.date = date;
      this.notes = notes;
      this.direction = direction; // 'long' or 'short'
      this.profitLoss = this.calculateProfitLoss();
    }
  
    calculateProfitLoss() {
      const rawPL = (this.exitPrice - this.entryPrice) * this.quantity;
      return this.direction === "long" ? rawPL : -rawPL;
    }
  }
  