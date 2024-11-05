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

            // Check if we've reached the bottom
            if (currentHeight === lastHeight) {
                if (previousItemCount === productData.length) {
                    noNewItemsCount++;
                    console.log(`No new items detected (attempt ${noNewItemsCount}/${config.maxNoNewItemsAttempts})`);
                } else {
                    // Reset counter if we got new items
                    noNewItemsCount = 0;
                }

                if (noNewItemsCount >= config.maxNoNewItemsAttempts) {
                    // Additional check for lazy-loaded content
                    const visibleItems = await page.evaluate(() =>
                        document.querySelectorAll('.ItemCard').length
                    );

                    if (visibleItems > productData.length) {
                        console.log(`Mismatch detected: Visible items (${visibleItems}) > Captured items (${productData.length})`);
                        noNewItemsCount = 0;
                        continue;
                    }

                    console.log('Reached end of page - no new items detected');
                    break;
                }
            } else {
                noNewItemsCount = 0;
            }

            previousItemCount = productData.length;

            // Implement smooth scrolling with intermediate steps
            const scrollStep = config.scrollStep;
            const currentScroll = await page.evaluate(() => window.pageYOffset);

            // Scroll in smaller increments
            for (let i = 0; i < scrollStep; i += 100) {
                await page.evaluate((step) => {
                    window.scrollBy({
                        top: step,
                        behavior: 'smooth'
                    });
                }, 100);

                // Small delay between each micro-scroll
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Wait for network idle and potential data loading
            await new Promise(resolve => setTimeout(resolve, config.scrollDelay));

            // Wait for potential GraphQL responses
            await new Promise(resolve => setTimeout(resolve, 500));

            lastHeight = currentHeight;
        }

        // Scroll back to top
        await page.evaluate(() => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        return productData.length;
    }
} 