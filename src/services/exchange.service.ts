interface RateCache {
    rates: Record<string, number>;
    timestamp: number;
}

export class ExchangeService {
    private static cache: RateCache | null = null;
    private static CACHE_TTL_MS = 60 * 1000;
    private static fetchPromise: Promise<void> | null = null;

    static async getLiveRate(from: string, to: string): Promise<number> {
        // 1. Normalize Inputs (Fixes "USD " vs "USD" issues)
        const base = from.trim().toUpperCase();
        const target = to.trim().toUpperCase();

        console.log(`💱 Exchange Service called: ${base} -> ${target}`);

        // 2. Immediate Return if identical
        if (base === target) {
            console.log(`ℹ️ Currencies are identical. Returning 1.0`);
            return 1.0;
        }

        // 3. Check Cache
        const now = Date.now();
        const isCacheExpired =
            !this.cache || now - this.cache.timestamp > this.CACHE_TTL_MS;

        if (isCacheExpired) {
            console.log(`⏳ Cache expired or empty. Refreshing...`);
            if (!this.fetchPromise) {
                this.fetchPromise = this.refreshRates();
            }
            // Wait for the specific promise to resolve
            await this.fetchPromise;
        }

        // 4. Safety Check
        if (!this.cache) {
            throw new Error('Exchange rates could not be fetched.');
        }

        // 5. Calculate Rate
        const rates = this.cache.rates;

        // Frankfurter API is base USD by default in our refreshRates call
        const rateFrom = base === 'USD' ? 1.0 : rates[base];
        const rateTo = target === 'USD' ? 1.0 : rates[target];

        console.log(
            `📊 Lookup: [${base}: ${rateFrom}] -> [${target}: ${rateTo}]`
        );

        if (!rateFrom || !rateTo) {
            console.error(
                `❌ Missing rate data in cache for ${base} or ${target}`
            );
            console.log(
                'Available Keys:',
                Object.keys(rates).slice(0, 5),
                '...'
            );
            throw new Error(`Rate not available for pair ${base}-${target}`);
        }

        const finalRate = rateTo / rateFrom;
        console.log(`✅ Final Calculated Rate: ${finalRate}`);

        return finalRate;
    }

    private static async refreshRates() {
        try {
            console.log(
                '📡 API Call: https://api.frankfurter.app/latest?from=USD'
            );
            const response = await fetch(
                'https://api.frankfurter.app/latest?from=USD'
            );

            if (!response.ok) {
                throw new Error(`API returned status: ${response.status}`);
            }

            const data = (await response.json()) as any;

            this.cache = {
                rates: data.rates,
                timestamp: Date.now(),
            };
            console.log(
                `💾 Cache updated with ${
                    Object.keys(data.rates).length
                } currencies.`
            );
        } catch (error) {
            console.error('⚠️ Failed to refresh rates:', error);
            // We intentionally do not throw here to allow retries,
            // but the main method will throw if cache is still null.
        } finally {
            this.fetchPromise = null;
        }
    }
}
