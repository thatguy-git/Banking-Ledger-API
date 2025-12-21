// load-test.ts

// ⚠️ REPLACE THIS ID with your real Charlie (EUR) or Bob (USD) ID
const TARGET_ACCOUNT_ID = '28309cfa-cbe1-4afa-b1c2-e148cfff5a7e';

const run = async () => {
    console.log('🚀 Firing 5 simultaneous deposit requests...');

    const requests = [1, 2, 3, 4, 5].map(async (i) => {
        const start = Date.now();
        try {
            // In Node 18+, fetch is global, but in older versions/TS configs might need 'undici' or similar.
            // Since we are using 'tsx', this usually works out of the box.
            const res = await fetch('http://localhost:3000/transfer/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: TARGET_ACCOUNT_ID,
                    amount: 100, // 1.00 unit
                }),
            });

            const duration = Date.now() - start;
            console.log(
                `✅ Request ${i} finished in ${duration}ms (Status: ${res.status})`
            );
        } catch (err: any) {
            console.error(`❌ Request ${i} failed:`, err.message);
        }
    });

    await Promise.all(requests);
    console.log('🏁 Load test complete.');
};

run();
