interface RateCache {
    rates: Record<string, number>;
    timestamp: number;
}

export class ExchangeService {
    private static cache: RateCache | null = null;
    private static CACHE_TTL_MS = 60 * 1000;

    // 👇 NEW: This holds the "In-Flight" request
    private static fetchPromise: Promise<void> | null = null;

    static async getLiveRate(from: string, to: string): Promise<number> {
        if (from === to) return 1.0;

        // 1. Check if cache is expired
        const now = Date.now();
        const isCacheExpired =
            !this.cache || now - this.cache.timestamp > this.CACHE_TTL_MS;

        if (isCacheExpired) {
            // 2. THE FIX: Check if someone is ALREADY fetching
            if (!this.fetchPromise) {
                // If not, WE start the fetch and save the promise so others can see it
                this.fetchPromise = this.refreshRates();
            }

            // 3. Everyone (including the first one) waits for the SAME promise
            try {
                await this.fetchPromise;
            } finally {
                // (Optional) We could clear the promise here, but refreshRates handles the cache update.
                // We generally leave this logic to the refresh method or clear it if needed.
            }
        }

        // 4. Calculate Rate (Same as before)
        // If the API failed, we might still be using old cache (circuit breaker)
        if (!this.cache) {
            throw new Error('Exchange rates unavailable.');
        }

        const rates = this.cache.rates;
        const rateFrom = from === 'USD' ? 1.0 : rates[from];
        const rateTo = to === 'USD' ? 1.0 : rates[to];

        if (!rateFrom || !rateTo) {
            throw new Error(`Rate not available for pair ${from}-${to}`);
        }

        return rateTo / rateFrom;
    }

    private static async refreshRates() {
        // Note: We don't log "Cache expired" here anymore to avoid spamming
        // if multiple people are waiting.

        try {
            console.log('📡 Fetching fresh rates from API...'); // This should run ONCE

            const response = await fetch(
                'https://api.frankfurter.app/latest?from=USD'
            );
            if (!response.ok) throw new Error('API Failed');

            const data = (await response.json()) as any;

            this.cache = {
                rates: data.rates,
                timestamp: Date.now(),
            };

            console.log('✅ Rates updated.');
        } catch (error) {
            console.error('⚠️ Failed to refresh rates:', error);
            // If we fail, we clear the promise so the next user can try again
        } finally {
            // ALWAYS clear the promise lock when done, so future expirations can trigger a new fetch
            this.fetchPromise = null;
        }
    }
}
