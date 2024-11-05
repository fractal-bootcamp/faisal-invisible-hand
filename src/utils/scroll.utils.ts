import { Page } from 'puppeteer';
import type { ScrollConfig } from '../types/costco.types';

export class ScrollUtils {
    /**
     * Scrolls through a page and captures product data
     * @param page - Puppeteer Page object to scroll
     * @param productData - Array to store captured product data
     * @param config - Configuration for scroll behavior
     * @returns Number of products captured
     */
    static async scrollAndCapture(
        page: Page,
        productData: any[],
        config: ScrollConfig
    ): Promise<number> {
        let lastHeight = 0;
        let noNewItemsCount = 0;
        let previousItemCount = productData.length;

        console.log('Starting scroll capture process...');

        while (true) {
            // Get current scroll height with more reliable method
            const currentHeight = await page.evaluate(() => {
                return Math.max(
                    document.documentElement.scrollHeight,
                    document.body.scrollHeight,
                    document.documentElement.clientHeight
                );
            });

            // Log scroll progress with more detail
            console.log(`Scroll progress - Height: ${currentHeight}px, Items: ${productData.length}`);

            if (currentHeight === lastHeight) {
                if (previousItemCount === productData.length) {
                    noNewItemsCount++;
                    console.log(`No new items detected (attempt ${noNewItemsCount}/${config.maxNoNewItemsAttempts})`);
                } else {
                    noNewItemsCount = 0;
                }

                if (noNewItemsCount >= config.maxNoNewItemsAttempts) {
                    console.log('Reached end of page - no new items detected');
                    break;
                }
            } else {
                noNewItemsCount = 0;
            }

            previousItemCount = productData.length;

            await page.evaluate(`window.scrollBy(0, ${config.scrollStep})`);
            await new Promise(r => setTimeout(r, config.scrollDelay));

            lastHeight = currentHeight as number;
            console.log(`Scrolling... Current items: ${productData.length}`);
        }

        await page.evaluate('window.scrollTo(0, 0)');
        await new Promise(r => setTimeout(r, 2000));

        return productData.length;
    }
} 