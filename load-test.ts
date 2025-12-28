const TARGET_ACCOUNT_ID = '';

const run = async () => {
    console.log('Firing 5 simultaneous deposit requests');

    const requests = [1, 2, 3, 4, 5].map(async (i) => {
        const start = Date.now();
        try {
            const res = await fetch('http://localhost:3000/transfer/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: TARGET_ACCOUNT_ID,
                    amount: 10000,
                }),
            });

            const duration = Date.now() - start;
            console.log(
                `Request ${i} finished in ${duration}ms (Status: ${res.status})`
            );
        } catch (err: any) {
            console.error(`Request ${i} failed:`, err.message);
        }
    });

    await Promise.all(requests);
    console.log('Load test complete.');
};

run();
