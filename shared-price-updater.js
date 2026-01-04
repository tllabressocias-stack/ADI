// shared-price-updater.js
class PriceUpdater {
    constructor(config) {
        this.symbol = config.symbol;
        this.fairValue = config.fairValue;
        this.fallbackPrice = config.fallbackPrice || null;
        this.priceElementId = config.priceElementId;
        this.upsideElementId = config.upsideElementId;
        this.currency = config.currency || '$';
        this.updateInterval = config.updateInterval || 300000;
        
        this.FINNHUB_API_KEY = 'd5bvi7pr01qsbmghj0sgd5bvi7pr01qsbmghj0t0';
        this.FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
    }

    async getPriceFromFinnhub() {
        try {
            const response = await fetch(
                `${this.FINNHUB_BASE_URL}/quote?symbol=${this.symbol}&token=${this.FINNHUB_API_KEY}`
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return (data.c && typeof data.c === 'number') ? data.c : null;
        } catch (error) {
            console.error(`❌ Error fetching ${this.symbol}:`, error);
            return null;
        }
    }

    calculateUpside(currentPrice) {
        if (!currentPrice || currentPrice <= 0) return 0;
        return ((this.fairValue - currentPrice) / currentPrice) * 100;
    }

    updateDisplay(currentPrice) {
        const upside = this.calculateUpside(currentPrice);
        
        const priceEl = document.getElementById(this.priceElementId);
        if (priceEl) {
            priceEl.textContent = `${this.currency}${currentPrice.toFixed(2)}`;
        }
        
        const upsideEl = document.getElementById(this.upsideElementId);
        if (upsideEl) {
            upsideEl.textContent = `${upside > 0 ? '+' : ''}${upside.toFixed(0)}%`;
            upsideEl.style.color = upside > 0 ? 'var(--color-success)' : 'var(--color-danger)';
        }
        
        localStorage.setItem(`price_${this.symbol}`, JSON.stringify({
            current: currentPrice,
            upside: upside,
            fairValue: this.fairValue,
            timestamp: new Date().toISOString()
        }));
        
        console.log(`✅ ${this.symbol}: ${this.currency}${currentPrice.toFixed(2)} | Upside: ${upside.toFixed(0)}%`);
    }

    async updatePrice() {
        const price = await this.getPriceFromFinnhub();
        const currentPrice = price || this.fallbackPrice;
        
        if (currentPrice) {
            this.updateDisplay(currentPrice);
        } else {
            console.warn(`⚠️ No price available for ${this.symbol}`);
        }
    }

    start() {
        console.log(`🚀 Iniciando actualización para ${this.symbol}...`);
        this.updatePrice();
        this.intervalId = setInterval(() => {
            this.updatePrice();
        }, this.updateInterval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            console.log(`⏹️ Detenida actualización para ${this.symbol}`);
        }
    }
}
