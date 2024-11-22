import { main } from '../index';

export async function GET(_req: Request) {
    await main();
    return new Response(`scraping completed ${process.env.VERCEL_REGION}`);
}