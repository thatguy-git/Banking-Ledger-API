interface RateCache {
    rates: Record<string, number>;
    timestamp: number;
}

export class ExchangeService {
    private static cache: RateCache | null = null;

    private static CACHE_TTL_MS = 60 * 1000;

    static async getLiveRate(from: string, to: string): Promise<number> {
        if (from === to) return 1.0;

        const now = Date.now();
        const isCacheExpired =
            !this.cache || now - this.cache.timestamp > this.CACHE_TTL_MS;

        if (isCacheExpired) {
            await this.refreshRates();
        }

        const rates = this.cache!.rates;

        const rateFrom = from === 'USD' ? 1.0 : rates[from];
        const rateTo = to === 'USD' ? 1.0 : rates[to];

        if (!rateFrom || !rateTo) {
            throw new Error(`Rate not available for pair ${from}-${to}`);
        }

        return rateTo / rateFrom;
    }

    private static async refreshRates() {
        console.log('🔄 Cache expired. Fetching fresh rates from API...');

        try {
            const response = await fetch(
                'https://api.frankfurter.app/latest?from=USD'
            );

            if (!response.ok) throw new Error('API Failed');

            const data = (await response.json()) as any;

            this.cache = {
                rates: data.rates,
                timestamp: Date.now(),
            };

            console.log('Rates updated successfully.');
        } catch (error) {
            console.error(
                'Failed to refresh rates. Using old cache if available.'
            );
            if (!this.cache) throw error;
        }
    }
}
