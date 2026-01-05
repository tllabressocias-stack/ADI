// =====================================================
// UNIVERSAL PRICE & UPSIDE UPDATER
// Funciona con cualquier tesis - Solo cambiar IDs y constantes
// =====================================================

class PriceUpdater {
    constructor(config) {
        this.symbol = config.symbol;           // Ej: 'TIC', 'PUUILO.HE'
        this.fairValue = config.fairValue;     // Ej: 20.63
        this.fallbackPrice = config.fallbackPrice || null;
        this.priceElementId = config.priceElementId;  // ID del elemento de precio
        this.upsideElementId = config.upsideElementId; // ID del elemento upside
        this.currency = config.currency || '$';
        this.updateInterval = config.updateInterval || 300000; // 5 minutos
        
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
        
        // Actualizar precio
        const priceEl = document.getElementById(this.priceElementId);
        if (priceEl) {
            priceEl.textContent = `${this.currency}${currentPrice.toFixed(2)}`;
            priceEl.classList.add('updating');
            setTimeout(() => priceEl.classList.remove('updating'), 600);
        }
        
        // Actualizar upside
        const upsideEl = document.getElementById(this.upsideElementId);
        if (upsideEl) {
            upsideEl.textContent = `${upside > 0 ? '+' : ''}${upside.toFixed(1)}%`;
            upsideEl.classList.add('updating');
            setTimeout(() => upsideEl.classList.remove('updating'), 600);
        }
        
        // Guardar en localStorage para sincronización con index
        localStorage.setItem(`price_${this.symbol}`, JSON.stringify({
            current: currentPrice,
            upside: upside,
            fairValue: this.fairValue,
            timestamp: new Date().toISOString()
        }));
        
        console.log(`✅ ${this.symbol}: ${this.currency}${currentPrice.toFixed(2)} | Upside: ${upside.toFixed(1)}%`);
    }

async updatePrice() {
    // 1️⃣ PRIMERO: Obtener de Finnhub (precio más actual)
    const price = await this.getPriceFromFinnhub();
    
    if (price && price > 0) {
        console.log(`🌐 Precio de Finnhub: ${price}`);
        this.updateDisplay(price);
        return;
    }
    
    // 2️⃣ SEGUNDO: Si Finnhub falla, leer del manualPrices del index
    const manualPrices = this.getManualPriceFromIndex();
    if (manualPrices && manualPrices > 0) {
        console.log(`📋 Precio manual del index: ${manualPrices}`);
        this.updateDisplay(manualPrices);
        return;
    }
    
    // 3️⃣ TERCERO: Si todo falla, leer del localStorage (actualizado por index)
    const storedPrice = localStorage.getItem(`price_${this.symbol}`);
    if (storedPrice) {
        try {
            const data = JSON.parse(storedPrice);
            if (data.current && data.current > 0) {
                console.log(`📱 Precio del localStorage: ${data.current}`);
                this.updateDisplay(data.current);
                return;
            }
        } catch (e) {
            console.warn('⚠️ Error leyendo localStorage');
        }
    }

    // 4️⃣ CUARTO: Si todo falla, usar fallback
    const currentPrice = this.fallbackPrice;
    if (currentPrice) {
        console.log(`📌 Usando fallback: ${currentPrice}`);
        this.updateDisplay(currentPrice);
    }
}
    getManualPriceFromIndex() {
    const manualPrices = {
        'PUUILO.HE': 12.48,
        'TOA.WA': 9.75,
        'NWL.MI': 19.78,
        'TIC': 9.89,
        'EDU.ASX': 0.82
    };
    
    return manualPrices[this.symbol] || null;
}
    start() {
        console.log(`🚀 Iniciando actualización para ${this.symbol}...`);
        
        // Primera actualización inmediata
        this.updatePrice();
        
        // Actualización periódica
        this.intervalId = setInterval(() => {
            console.log(`🔄 Actualizando ${this.symbol}...`);
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
