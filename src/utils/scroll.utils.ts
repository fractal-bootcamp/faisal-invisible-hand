import { Page } from 'puppeteer';
import type { ScrollConfig, ScrollState } from '../types/costco.types';

export class ScrollUtils {
    /**
     * Pure function to check if scrolling should continue
     */
    private static shouldContinueScrolling(
        state: ScrollState,
        config: ScrollConfig,
        visibleItems: number
    ): boolean {
        if (state.noNewItemsCount < config.maxNoNewItemsAttempts) return true;
        return visibleItems > state.productCount;
    }

    /**
     * Pure function to calculate new scroll state
     */
    private static getNextScrollState(
        currentState: ScrollState,
        newHeight: number,
        productCount: number
    ): ScrollState {
        const isHeightUnchanged = newHeight === currentState.height;
        const isProductCountUnchanged = productCount === currentState.previousItemCount;

        return {
            height: newHeight,
            noNewItemsCount: isHeightUnchanged && isProductCountUnchanged
                ? currentState.noNewItemsCount + 1
                : 0,
            previousItemCount: productCount,
            productCount
        };
    }

    /**
     * Pure function to get page metrics
     */
    private static async getPageMetrics(page: Page): Promise<{ height: number; visibleItems: number }> {
        const height = await page.evaluate(() => Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.clientHeight
        ));

        const visibleItems = await page.evaluate(() =>
            document.querySelectorAll('.ItemCard').length
        );

        return { height, visibleItems };
    }

    /**
     * Performs a single scroll operation
     */
    private static async performScroll(
        page: Page,
        scrollStep: number,
        scrollDelay: number
    ): Promise<void> {
        const microScrollStep = 100;
        const steps = Math.ceil(scrollStep / microScrollStep);

        for (let i = 0; i < steps; i++) {
            await page.evaluate((step) => {
                window.scrollBy({
                    top: step,
                    behavior: 'smooth'
                });
            }, microScrollStep);
            // Wait for 100ms between scroll steps
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Wait for configured delay between scroll operations
        await new Promise(resolve => setTimeout(resolve, scrollDelay));
    }

    /**
     * Main scroll capture function with reduced side effects
     */
    static async scrollAndCapture(
        page: Page,
        productData: readonly any[],
        config: Readonly<ScrollConfig>
    ): Promise<number> {
        console.log('Starting scroll capture process...');

        let state: ScrollState = {
            height: 0,
            noNewItemsCount: 0,
            previousItemCount: productData.length,
            productCount: productData.length
        };

        while (true) {
            // Get current metrics
            const { height, visibleItems } = await this.getPageMetrics(page);

            // Log progress (side effect isolated to logging)
            console.log(`Scroll progress - Height: ${height}px, Items: ${state.productCount}`);

            // Calculate new state
            state = this.getNextScrollState(state, height, productData.length);

            // Check if should continue
            if (!this.shouldContinueScrolling(state, config, visibleItems)) {
                console.log('Reached end of page - no new items detected');
                break;
            }

            // Perform scroll operation
            await this.performScroll(page, config.scrollStep, config.scrollDelay);
        }

        // Return to top (necessary side effect)
        await page.evaluate(() => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        return productData.length;
    }
} 