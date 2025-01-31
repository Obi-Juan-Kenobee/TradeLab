class TradeModal {
    constructor() {
        this.modal = document.getElementById('tradeDetailsModal');
        this.closeBtn = this.modal.querySelector('.close');
        this.setupEventListeners();
        this.currentSymbol = null;
        this.chartWidget = null;
        this.technicalWidget = null;
    }

    setupEventListeners() {
        this.closeBtn.onclick = () => this.hide();
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.hide();
            }
        };

        // Escape key press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.hide();
            }
        });
    }

    async show(trade) {
        // Update modal content with trade details
        document.getElementById('modalSymbol').textContent = trade.symbol.toUpperCase();
        document.getElementById('modalDate').textContent = new Date(trade.date).toLocaleDateString();
        document.getElementById('modalMarket').textContent = trade.market;
        document.getElementById('modalDirection').textContent = trade.direction.toUpperCase();
        document.getElementById('modalEntryPrice').textContent = `$${trade.entryPrice.toFixed(2)}`;
        document.getElementById('modalExitPrice').textContent = `$${trade.exitPrice.toFixed(2)}`;
        document.getElementById('modalQuantity').textContent = trade.quantity;
        document.getElementById('modalInvestment').textContent = `$${trade.investment.toFixed(2)}`;

        const pnlElement = document.getElementById('modalPnL');
        pnlElement.textContent = `${trade.profitLoss >= 0 ? '+' : ''}$${trade.profitLoss.toFixed(2)}`;
        pnlElement.className = trade.profitLoss >= 0 ? 'profit' : 'loss';

        const roiElement = document.getElementById('modalROI');
        roiElement.textContent = `${trade.profitLossPercentage >= 0 ? '+' : ''}${trade.profitLossPercentage.toFixed(2)}%`;
        roiElement.className = trade.profitLossPercentage >= 0 ? 'profit' : 'loss';

        document.getElementById('modalNotes').textContent = trade.notes || 'No notes available';

        // Show the modal
        this.modal.style.display = 'block';

        // Load chart and technical analysis widgets
        // If symbol has changed, reload widgets
        if (this.currentSymbol !== trade.symbol) {
            this.currentSymbol = trade.symbol;
            
            try {
                // Get the exchange for the symbol
                const exchange = await this.getExchange(trade.symbol);
                const fullSymbol = exchange ? `${exchange}:${trade.symbol}` : trade.symbol;

                // Load both widgets
                await Promise.all([
                    this.loadChartWidget(fullSymbol),
                    this.loadTechnicalAnalysisWidget(fullSymbol)
                ]);
            } catch (error) {
                console.error('Error loading widgets:', error);
                // Handle error gracefully - maybe show a message to the user
            }
        }
    }

    hide() {
        this.modal.style.display = 'none';
        // Clean up widgets
        const chartContainer = document.getElementById('priceChart');
        const technicalAnalysis = document.getElementById('technicalAnalysis');
        if (chartContainer) chartContainer.innerHTML = '';
        if (technicalAnalysis) technicalAnalysis.innerHTML = '';
        this.currentSymbol = null;
    }

    async loadChartWidget(symbol) {
        // Placeholder for chart widget initialization
        const chartContainer = document.getElementById('priceChart');
        chartContainer.innerHTML = '';

        // Create widget container
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container';
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';

        // Create widget div
        const widget = document.createElement('div');
        widget.id = `tradingview_${Math.random().toString(36).substring(7)}`;
        widget.style.height = 'calc(100% - 32px)';
        widget.style.width = '100%';
        widgetContainer.appendChild(widget);

        // Create copyright div
        const copyright = document.createElement('div');
        copyright.className = 'tradingview-widget-copyright';
        copyright.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';
        widgetContainer.appendChild(copyright);

        // Add container to chart container
        chartContainer.appendChild(widgetContainer);

        // Create and configure TradingView widget
        this.chartWidget = new TradingView.widget({
            "container_id": widget.id,
            "autosize": true,
            "symbol": symbol,
            "interval": "D",
            "timezone": "exchange",
            "theme": "light",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_side_toolbar": false,
            "allow_symbol_change": true,
            "details": true,
            "hotlist": true,
            "calendar": false,
            "show_popup_button": true,
            "popup_width": "1200",
            "popup_height": "650",
            "withdateranges": true
        });
    }

    async loadTechnicalAnalysisWidget(symbol) {
        const container = document.getElementById('technicalAnalysis');
        container.innerHTML = '';

        // Create widget container
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container';
        widgetContainer.style.height = '400px'; // Fixed height for technical analysis
        widgetContainer.style.width = '100%';

        // Create widget div
        const widget = document.createElement('div');
        widget.className = 'tradingview-widget-container__widget';
        widgetContainer.appendChild(widget);

        // Create copyright div
        const copyright = document.createElement('div');
        copyright.className = 'tradingview-widget-copyright';
        copyright.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';
        widgetContainer.appendChild(copyright);

        // Add container to analysis container
        container.appendChild(widgetContainer);

        // Load TradingView Technical Analysis widget
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "interval": "1m",
            "width": "100%",
            "isTransparent": false,
            "height": "100%",
            "symbol": symbol,
            "showIntervalTabs": true,
            "displayMode": "multiple",
            "locale": "en",
            "colorTheme": "light"
        });

        widgetContainer.appendChild(script);
    }

    async getExchange(symbol) {
        // Handle crypto and forex first
        if (symbol.includes('-USD')) return 'COINBASE';
        if (symbol.includes('/USD')) return 'FX';
        // List of common exchanges to try
        // Common US exchanges to try
        const exchanges = ['NASDAQ', 'NYSE', 'AMEX'];
        
        // Try to find the correct exchange
        for (const exchange of exchanges) {
            try {
                const response = await fetch(`https://symbol-search.tradingview.com/symbol_search/?text=${symbol}`);
                const data = await response.json();
                
                // Find exact match for the symbol
                const match = data.find(item => 
                    item.symbol === symbol && 
                    item.exchange === exchange &&
                    item.type === 'stock'
                );
                
                if (match) {
                    console.log(`Found ${symbol} on ${exchange}`);
                    return exchange;
                }
            } catch (error) {
                console.warn(`Error checking ${exchange} for ${symbol}:`, error);
            }
        }

        // Fallback to searching without specific exchange
        try {
            const response = await fetch(`https://symbol-search.tradingview.com/symbol_search/?text=${symbol}`);
            const data = await response.json();
            
            // Find first stock match for the symbol
            const match = data.find(item => 
                item.symbol === symbol && 
                item.type === 'stock'
            );
            
            if (match) {
                console.log(`Found ${symbol} on ${match.exchange}`);
                return match.exchange;
            }
        } catch (error) {
            console.warn(`Error in fallback search for ${symbol}:`, error);
        }

        // If no match found, try common exchanges directly
        console.log(`No exchange found for ${symbol}, trying common exchanges`);
        return this.tryCommonExchanges(symbol);
    }

    tryCommonExchanges(symbol) {
        // Map of common stock prefixes to their exchanges
        const prefixToExchange = {
            'A': 'NYSE', // A. O. Smith, Agilent, etc.
            'AA': 'NYSE', // Alcoa
            'BAC': 'NYSE', // Bank of America
            'C': 'NYSE', // Citigroup
            'F': 'NYSE', // Ford
            'FB': 'NASDAQ', // Meta (Facebook)
            'GOOG': 'NASDAQ', // Google
            'IBM': 'NYSE', // IBM
            'JPM': 'NYSE', // JPMorgan
            'KO': 'NYSE', // Coca-Cola
            'META': 'NASDAQ', // Meta Platforms
            'MSFT': 'NASDAQ', // Microsoft
            'NFLX': 'NASDAQ', // Netflix
            'PFE': 'NYSE', // Pfizer
            'T': 'NYSE', // AT&T
            'TSLA': 'NASDAQ', // Tesla
            'WMT': 'NYSE', // Walmart
            'XOM': 'NYSE', // Exxon Mobil
        };

        // Check if the symbol starts with any known prefix
        // for (const [prefix, exchange] of Object.entries(prefixToExchange)) {
        //     if (symbol.startsWith(prefix)) {
        //         console.log(`Matched ${symbol} to ${exchange} based on prefix ${prefix}`);
        //         return exchange;
        //     }
        // }

        // If no specific match, use only stock name
        console.log(`No match found for ${symbol}, using only stock name`);
        return '';
    }
}

// Initialize modal when document is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.tradeModal = new TradeModal();
});
