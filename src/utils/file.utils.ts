import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { CostcoProduct, CategoryConfig } from '../types/costco.types';

export class FileUtils {
    // Base directory for storing data files
    private static readonly BASE_DIR = 'data';
    // Directory for Costco product data
    private static readonly COSTCO_DIR = 'costco';

    // Helper function to sanitize strings for filenames
    private static sanitizeForFilename(str: string): string {
        return str.toLowerCase().replace(/[&\s]+/g, '-');
    }

    static async saveDataToFile(data: CostcoProduct[], category: CategoryConfig): Promise<void> {
        try {
            // Ensure directories exist
            const dataDir = join(process.cwd(), this.BASE_DIR, this.COSTCO_DIR);
            await mkdir(dataDir, { recursive: true });

            // Get current date in ET
            const date = new Date();
            const etDate = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/New_York',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(date);

            // Format timestamp
            const [month, day, year, time] = etDate.split(/[/, ]/);
            const [hours, minutes] = time.split(':');
            const timestamp = `${year}${month}${day}-${hours}:${minutes}-ET`;

            // Create filename
            const filename = `costco-${this.sanitizeForFilename(category.main)}-${category.sub}-${timestamp}.json`;
            const filepath = join(dataDir, filename);

            // Save file
            await writeFile(
                filepath,
                JSON.stringify(data, null, 2)
            );
            console.log(`Product data saved to file: ${filename}. Total items: ${data.length}`);
        } catch (error) {
            console.error('Error saving data to file:', error);
            throw error;
        }
    }
} 