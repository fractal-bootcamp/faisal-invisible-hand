import { CostcoScraper } from './scrapers/costco-scraper';


async function main() {
    // Create scraper with specific category and URL
    const scraper = new CostcoScraper({
        zipcode: '07002',
        category: {
            main: 'Health & Personal Care',
            sub: 'vitamins-supplements',
            url: 'https://sameday.costco.com/store/costco/collections/rc-vitamins-supplements'
        }
    });

    try {
        await scraper.runScrapper();
        console.log('Scraping completed successfully');
    } catch (error) {
        console.error('Error running scraper:', error);
        process.exit(1);
    }
}

main(); 