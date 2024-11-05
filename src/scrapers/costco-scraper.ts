import puppeteer, { Page } from 'puppeteer';
import type { CostcoProduct, ScraperConfig } from '../types/costco.types';
import { FileUtils } from '../utils/file.utils';
import { ScrollUtils } from '../utils/scroll.utils';

export class CostcoScraper {
    private readonly config: ScraperConfig;
    private readonly GRAPHQL_PATH = 'graphql?operationName=Items&variables';

    constructor(config: Partial<ScraperConfig> = {}) {
        this.config = {
            zipcode: config.zipcode || '11201',
            scroll: config.scroll || {},
            category: config.category || {
                main: 'Health & Personal Care',
                sub: 'vitamins-supplements',
                url: 'https://sameday.costco.com/store/costco/collections/rc-vitamins-supplements'
            }
        };
    }

    async runScrapper(): Promise<CostcoProduct[]> {
        console.log('Starting scraper...');
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        const productData: CostcoProduct[] = [];

        try {
            // 1. Configure browser permissions and navigate to URL 
            const context = browser.defaultBrowserContext();
            await context.overridePermissions(this.config.category.url, ['geolocation']);
            console.log('Geolocation permissions configured');

            // 2. Navigate to page first
            console.log('Navigating to target URL:', this.config.category.url);
            await page.goto(this.config.category.url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            console.log('Successfully navigated to target URL');

            // 3. Handle ZIP code entry
            await this.handleZipCode(page);

            // 4. Set up request interceptors after ZIP code
            await this.setupInterceptors(page, productData);

            // 5. Refresh page and wait
            console.log('Refreshing page to capture fresh GraphQL responses...');
            try {
                await page.goto(this.config.category.url, {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });
                console.log('Page refreshed successfully');
            } catch (error) {
                console.warn('Page refresh timeout, continuing with current state');
            }

            // Wait for content to load
            await page.waitForSelector('.ItemCard', { timeout: 30000 })
                .catch(() => console.warn('Timeout waiting for ItemCards'));

            // 6. Pre-scroll checks
            console.log('=== Pre-Scroll Checks ===');
            console.log('Current URL:', await page.url());
            console.log('Product data array length:', productData.length);

            // 7. Start scrolling
            const scrollConfig = {
                scrollStep: 300,
                maxNoNewItemsAttempts: 3,
                scrollDelay: 1500,
                ...this.config.scroll
            };

            console.log('Starting automatic scroll to capture all items...');
            await ScrollUtils.scrollAndCapture(page, productData, scrollConfig);
            console.log(`Scrolling complete. Total items captured: ${productData.length}`);

            // Save data using existing FileUtils
            await FileUtils.saveDataToFile(productData, this.config.category);
            console.log('Data saved successfully');

            return productData;

        } catch (error) {
            console.error('Error during scraping:', error);
            throw error;
        } finally {
            await browser.close();
            console.log('Browser closed successfully');
        }
    }

    private async handleZipCode(page: Page): Promise<void> {
        console.log('Attempting to enter ZIP code:', this.config.zipcode);
        try {
            await page.waitForSelector('input[placeholder="Enter ZIP code"]', {
                timeout: 5000,
                visible: true
            });

            await page.type('input[placeholder="Enter ZIP code"]', this.config.zipcode);
            console.log('ZIP code entered successfully');

            await page.click('button[type="submit"]');
            console.log('Submit button clicked');

            // Simple wait instead of complex navigation promises
            await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
            console.error('Error handling ZIP code entry:', error);
            throw error;
        }
    }

    private async setupInterceptors(page: Page, productData: CostcoProduct[]): Promise<void> {
        await page.setRequestInterception(true);
        console.log('Request interception enabled');

        page.on('request', (request) => {
            if (request.url().includes(this.GRAPHQL_PATH)) {
                request.continue();
                console.log('GraphQL request detected and allowed');
            } else {
                request.continue();
            }
        });

        page.on('response', async (response) => {
            if (response.url().includes(this.GRAPHQL_PATH)) {
                try {
                    const json = await response.json();
                    if (json?.data?.items) {
                        // Log first item structure for debugging
                        if (productData.length === 0) {
                            //console.log('First item structure captured:', JSON.stringify(json.data.items[0], null, 2));
                        }

                        productData.push(...json.data.items);
                        console.log(`Captured ${json.data.items.length} items. Progress: ${productData.length}`);
                    }
                } catch (error) {
                    console.error('Error parsing response body:', error);
                }
            }
        });
    }
} 