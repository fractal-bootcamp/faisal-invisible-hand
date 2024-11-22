import * as cron from 'node-cron';
import { main } from '.';

const startTime = new Date().toLocaleTimeString();
console.log(`–––––––––––––––––––[${startTime}] Cron service started`);

// For testing purposes, you can use different intervals:
// '*/1 * * * *'  -> every 1 minute
// '*/5 * * * *'  -> every 5 minutes
// '* * * * * *'  -> every second (use this for quick testing)

cron.schedule('*/5 * * * *', async () => {
    const executionTime = new Date().toLocaleTimeString();
    console.log(`[${executionTime}] Running cron job...`);

    try {
        await main();
        console.log(`–––––––––––––––––––[${new Date().toLocaleTimeString()}] Cron job completed successfully`);
    } catch (error) {
        console.error(`–––––––––––––––––––[${new Date().toLocaleTimeString()}] Cron job failed:`, error);
    }
});