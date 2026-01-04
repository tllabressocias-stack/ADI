/**
 * Universal Price Updater Script
 * Actualiza precios dinámicamente desde API
 * Soporta múltiples símbolos simultáneamente
 * 
 * ACTUALIZADO: Incluye id="fairValue" y función mejorada updateUpside
 */

class PriceUpdater {
    constructor(config) {
        this.symbol = config.symbol;
        this.fairValue = config.fairValue;
        this.fallbackPrice = config.fallbackPrice;
        this.priceElementId = config.priceElementId;
        this.upsideElementId = config.upsideElementId;
        this.fairValueElementId = config.fairValueElementId || null;
        this.currency = config.currency || '€';
        this.updateInterval = config.updateInterval || 300000; // 5 minutos por defecto
        this.apiTimeout = config.apiTimeout || 5000; // 5 segundos timeout
    }

    /**
     * Inicia la actualización automática de precios
     */
    start() {
        // Actualizar inmediatamente al cargar
        this.updatePrice();
        
        // Configurar actualización periódica
        setInterval(() => this.updatePrice(), this.updateInterval);
    }

    /**
     * Obtiene el precio actual desde la API
     */
    async fetchPrice() {
        try {
            // Intentar con API de Finnhub (requiere key gratuita)
            const finnhubKey = 'YOUR_FINNHUB_KEY'; // Opcional
            
            // API 1: Finnhub (mejor para stocks europeos)
            if (finnhubKey && finnhubKey !== 'YOUR_FINNHUB_KEY') {
                return await this.fetchFromFinnhub(finnhubKey);
            }

            // API 2: Alpha Vantage (forex + stocks)
            const alphaVantageKey = 'YOUR_ALPHA_VANTAGE_KEY'; // Opcional
            if (alphaVantageKey && alphaVantageKey !== 'YOUR_ALPHA_VANTAGE_KEY') {
                return await this.fetchFromAlphaVantage(alphaVantageKey);
            }

            // API 3: Yahoo Finance (gratuita, sin key)
            return await this.fetchFromYahoo();

        } catch (error) {
            console.warn(`Error fetching price for ${this.symbol}:`, error.message);
            return null;
        }
    }

    /**
     * Fetch desde Yahoo Finance (gratuito, sin autenticación)
     */
    async fetchFromYahoo() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.apiTimeout);

        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${this.symbol}?interval=1d&range=1d`;
            const response = await fetch(url, { signal: controller.signal });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const result = data.chart?.result?.[0];
            
            if (!result || !result.meta) return null;
            
            const price = result.meta.regularMarketPrice;
            return price ? parseFloat(price) : null;

        } catch (error) {
            console.warn(`Yahoo Finance fetch failed: ${error.message}`);
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Fetch desde Finnhub (requiere API key)
     */
    async fetchFromFinnhub(apiKey) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.apiTimeout);

        try {
            const url = `https://finnhub.io/api/v1/quote?symbol=${this.symbol}&token=${apiKey}`;
            const response = await fetch(url, { signal: controller.signal });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data.c ? parseFloat(data.c) : null;

        } catch (error) {
            console.warn(`Finnhub fetch failed: ${error.message}`);
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Fetch desde Alpha Vantage (requiere API key)
     */
    async fetchFromAlphaVantage(apiKey) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.apiTimeout);

        try {
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${this.symbol}&apikey=${apiKey}`;
            const response = await fetch(url, { signal: controller.signal });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const price = data['Global Quote']?.['05. price'];
            return price ? parseFloat(price) : null;

        } catch (error) {
            console.warn(`Alpha Vantage fetch failed: ${error.message}`);
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Actualiza el precio en el DOM
     */
    async updatePrice() {
        const price = await this.fetchPrice() || this.fallbackPrice;
        
        // Actualizar elemento de precio
        if (this.priceElementId) {
            const priceElement = document.getElementById(this.priceElementId);
            if (priceElement) {
                priceElement.textContent = `${this.currency}${price.toFixed(2)}`;
                priceElement.classList.add('updating');
                setTimeout(() => priceElement.classList.remove('updating'), 600);
            }
        }

        // Actualizar elemento de fair value (si existe) - NUEVO
        if (this.fairValueElementId) {
            const fairValueElement = document.getElementById(this.fairValueElementId);
            if (fairValueElement) {
                fairValueElement.textContent = this.fairValue.toString();
            }
        }

        // Calcular y actualizar upside
        if (this.upsideElementId) {
            this.updateUpside(price);
        }
    }

    /**
     * Calcula y actualiza el upside potencial
     * REFORMULADO: Maneja correctamente los valores y clases CSS
     */
    updateUpside(currentPrice) {
        const upside = ((this.fairValue - currentPrice) / currentPrice * 100).toFixed(1);
        const upsideElement = document.getElementById(this.upsideElementId);
        
        if (upsideElement) {
            const sign = upside >= 0 ? '+' : '';
            upsideElement.textContent = `${sign}${upside}%`;
            
            // Cambiar color basado en upside
            // Eliminar todas las clases de color existentes
            upsideElement.classList.remove('metric-value', 'success', 'warning', 'danger');
            
            // Aplicar nueva clase según upside
            if (upside >= 50) {
                upsideElement.classList.add('metric-value', 'success');
            } else if (upside >= 0) {
                upsideElement.classList.add('metric-value', 'warning');
            } else {
                upsideElement.classList.add('metric-value', 'danger');
            }
            
            // Animación de actualización
            upsideElement.classList.add('updating');
            setTimeout(() => upsideElement.classList.remove('updating'), 600);
        }
    }

    /**
     * Obtiene información formateada del stock
     */
    getInfo() {
        return {
            symbol: this.symbol,
            fairValue: this.fairValue,
            fallbackPrice: this.fallbackPrice,
            currency: this.currency,
            updateInterval: this.updateInterval
        };
    }
}

/**
 * MODO DE USO - Ejemplos
 * 
 * ============================================
 * 1. PARA TESIS INDIVIDUAL (newprices/index.html)
 * ============================================
 * 
 * HTML:
 * <div id="currentPrice">€19.00</div>
 * <div id="fairValue" style="display: none;">71.51</div>
 * <div id="upsidePercent">+276%</div>
 * 
 * SCRIPT:
 * document.addEventListener('DOMContentLoaded', function() {
 *     const updater = new PriceUpdater({
 *         symbol: 'NWL.MI',
 *         fairValue: 71.51,
 *         fallbackPrice: 19.00,
 *         priceElementId: 'currentPrice',
 *         upsideElementId: 'upsidePercent',
 *         fairValueElementId: 'fairValue',
 *         currency: '€'
 *     });
 *     updater.start();
 * });
 * 
 * ============================================
 * 2. PARA PORTFOLIO PRINCIPAL (index.html)
 * ============================================
 * 
 * HTML - NewPrices:
 * <div id="newprices-currentPrice">€19.00</div>
 * <span id="newprices-fairValue" style="display: none;">71.51</span>
 * <div id="newprices-upsidePercent">+276%</div>
 * 
 * HTML - Puuilo:
 * <div id="puuilo-currentPrice">€1.85</div>
 * <span id="puuilo-fairValue" style="display: none;">4.50</span>
 * <div id="puuilo-upsidePercent">+143%</div>
 * 
 * SCRIPT:
 * document.addEventListener('DOMContentLoaded', function() {
 *     // NewPrices
 *     new PriceUpdater({
 *         symbol: 'NWL.MI',
 *         fairValue: 71.51,
 *         fallbackPrice: 19.00,
 *         priceElementId: 'newprices-currentPrice',
 *         upsideElementId: 'newprices-upsidePercent',
 *         fairValueElementId: 'newprices-fairValue',
 *         currency: '€'
 *     }).start();
 *     
 *     // Puuilo
 *     new PriceUpdater({
 *         symbol: 'PUT.MI',
 *         fairValue: 4.50,
 *         fallbackPrice: 1.85,
 *         priceElementId: 'puuilo-currentPrice',
 *         upsideElementId: 'puuilo-upsidePercent',
 *         fairValueElementId: 'puuilo-fairValue',
 *         currency: '€'
 *     }).start();
 * });
 * 
 * ============================================
 * CAMBIOS PRINCIPALES EN ESTA VERSIÓN:
 * ============================================
 * 
 * 1. ✅ Soporte para id="fairValue" (opcional)
 *    - Útil si necesitas actualizaciones dinámicas del fair value
 *    - Si no lo especificas, no hace nada (compatible hacia atrás)
 * 
 * 2. ✅ Función updateUpside REFORMULADA
 *    - Maneja correctamente clases CSS (metric-value, success, warning, danger)
 *    - Colores dinámicos basados en upside:
 *      * Verde (success): upside >= 50%
 *      * Naranja (warning): 0% <= upside < 50%
 *      * Rojo (danger): upside < 0%
 * 
 * 3. ✅ Compatible con múltiples símbols simultáneamente
 *    - Usa diferentes IDs para cada stock (ej: newprices-*, puuilo-*)
 *    - Cada PriceUpdater funciona independientemente
 * 
 * 4. ✅ Mejor manejo de errores
 *    - Fallback a Yahoo Finance sin API keys
 *    - Timeout de 5 segundos por API
 *    - Logs de debug en consola
 * 
 */

// Exportar para uso en módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PriceUpdater;
}
