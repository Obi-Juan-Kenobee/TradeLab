class TradeModal {
    constructor() {
        this.modal = document.getElementById('tradeDetailsModal');
        this.closeBtn = this.modal.querySelector('.close');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close button click
        this.closeBtn.addEventListener('click', () => this.hide());

        // Click outside modal
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Escape key press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.hide();
            }
        });
    }

    show(trade) {
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
        this.loadChartWidget(trade.symbol);
        this.loadTechnicalAnalysisWidget(trade.symbol);
    }

    hide() {
        this.modal.style.display = 'none';
        // Clean up widgets if needed
        const technicalAnalysis = document.getElementById('technicalAnalysis');
        if (technicalAnalysis) {
            technicalAnalysis.innerHTML = '';
        }
    }

    loadChartWidget(symbol) {
        // Placeholder for chart widget initialization
        const chartContainer = document.getElementById('priceChart');
        chartContainer.innerHTML = ''; // Clear previous content

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
        new TradingView.widget({
            "container_id": widget.id,
            "autosize": true,
            "symbol": `${this.getExchange(symbol)}:${symbol}`,
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
            "popup_width": "1000",
            "popup_height": "650",
            "withdateranges": true
        });
    }

    loadTechnicalAnalysisWidget(symbol) {
        const container = document.getElementById('technicalAnalysis');
        container.innerHTML = ''; // Clear previous content

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
            "symbol": `${this.getExchange(symbol)}:${symbol}`,
            "showIntervalTabs": true,
            "displayMode": "multiple",
            "locale": "en",
            "colorTheme": "light"
        });

        widgetContainer.appendChild(script);
    }

    getExchange(symbol) {
        // Basic exchange detection - expand this based on your needs
        if (symbol.includes('-USD')) return 'COINBASE';
        if (symbol.includes('/USD')) return 'FX';
        return 'NASDAQ'; // Default to NASDAQ for stocks
}
}

// Initialize modal when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tradeModal = new TradeModal();
});
