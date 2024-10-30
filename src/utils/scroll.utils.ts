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
        let previousItemCount = 0;

        while (true) {
            // Get current scroll height
            const currentHeight = await page.evaluate('document.documentElement.scrollHeight');

            // Check if we've reached the bottom and no new items
            if (currentHeight === lastHeight) {
                // Also check if we got new items
                if (previousItemCount === productData.length) {
                    noNewItemsCount++;
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

            // Scroll down
            await page.evaluate(`window.scrollBy(0, ${config.scrollStep})`);
            // Wait for content to load
            await new Promise(r => setTimeout(r, config.scrollDelay));

            // Update last height and log progress
            lastHeight = currentHeight as number;
            console.log(`Scrolling... Current items: ${productData.length}`);
        }

        // Final scroll to top to trigger any remaining requests
        await page.evaluate('window.scrollTo(0, 0)');
        await new Promise(r => setTimeout(r, 2000));

        console.log(`Scrolling complete. Total items captured: ${productData.length}`);
        return productData.length;
    }
} 