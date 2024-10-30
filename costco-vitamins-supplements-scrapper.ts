import puppeteer from "puppeteer";

// costco urls
//const COSTCO_SAME_DAY_URL = `https://sameday.costco.com/store/costco/storefront?utm_source=nav&zipcode=11201`
const COSTCO_SAME_DAY_VITAMINS_SUPPLEMENTS_URL = `https://sameday.costco.com/store/costco/collections/rc-vitamins-supplements`

// graphql path
const GRAPHQL_PATH = `graphql?operationName=Items&variables`

// scraped url
const SCRAPPED_URL = COSTCO_SAME_DAY_VITAMINS_SUPPLEMENTS_URL

// main scrapper function
const runScrapper = async () => {
    console.log('Starting scraper...')

    // 1. launch browser and create a new blank page
    const browser = await puppeteer.launch({
        headless: false,
    })
    console.log('Browser launched successfully')

    const page = await browser.newPage()
    console.log('New page created')

    // 2. configure context and geolocation permission
    const context = browser.defaultBrowserContext()
    await context.overridePermissions(SCRAPPED_URL, ["geolocation"])
    console.log('Geolocation permissions configured')

    // 3. navigate to the page without interception
    console.log('Navigating to target URL:', SCRAPPED_URL)
    await page.goto(SCRAPPED_URL, {
        waitUntil: "networkidle2"
    })
    console.log('Successfully navigated to target URL')

    // 4. handle ZIP code entry before setting up interceptors
    const ZIP_CODE = "11201"
    try {
        console.log('Attempting to enter ZIP code...')
        await page.waitForSelector('input[placeholder="Enter ZIP code"]', {
            timeout: 5000
        })
        await page.type('input[placeholder="Enter ZIP code"]', ZIP_CODE)
        console.log('ZIP code entered successfully')

        await page.click('button[type="submit"]')
        console.log('Submit button clicked')

        // Wait for initial navigation
        await new Promise(resolve => setTimeout(resolve, 3000))

        // 5. Set up request interceptors BEFORE refreshing the page
        const productData: any[] = []
        await page.setRequestInterception(true)
        console.log('Request interception enabled')

        page.on('request', (request) => {
            if (request.url().includes(GRAPHQL_PATH)) {
                request.continue()
                console.log('GraphQL request detected and allowed')
            } else {
                request.continue()
            }
        })

        // 6. handle response
        page.on('response', async (response) => {
            if (response.url().includes(GRAPHQL_PATH)) {
                try {
                    const json = await response.json()
                    if (json?.data?.items) {
                        if (productData.length === 0) {
                            console.log('First item structure:', JSON.stringify(json.data.items[0], null, 2))
                        }

                        productData.push(...json.data.items)
                        console.log(`Captured ${json.data.items.length} items. Progress: ${productData.length}`)
                    }
                } catch (error) {
                    console.error(`Error parsing response body:`, error)
                }
            }
        })

        // 7. scroll and capture all items
        const scrollAndCapture = async () => {
            const scrollStep = 800 // pixels to scroll each time
            let lastHeight = 0
            let noNewItemsCount = 0
            const maxNoNewItemsAttempts = 3
            let previousItemCount = 0

            while (true) {
                // Get current scroll height
                const currentHeight = await page.evaluate('document.documentElement.scrollHeight')

                // Check if we've reached the bottom and no new items
                if (currentHeight === lastHeight) {
                    noNewItemsCount++
                    // Also check if we got new items
                    if (previousItemCount === productData.length) {
                        noNewItemsCount++
                    } else {
                        noNewItemsCount = 0
                    }

                    if (noNewItemsCount >= maxNoNewItemsAttempts) {
                        console.log('Reached end of page - no new items detected')
                        break
                    }
                } else {
                    noNewItemsCount = 0
                }

                previousItemCount = productData.length

                // Scroll down
                await page.evaluate(`window.scrollBy(0, ${scrollStep})`)
                // Wait for 1.5 seconds after scrolling to allow content to load
                await new Promise(r => setTimeout(r, 1500))

                // Update last height and log progress
                lastHeight = currentHeight as number // Type assertion to fix type error
                console.log(`Scrolling... Current items: ${productData.length}`)
            }

            // Final scroll to top to trigger any remaining requests
            await page.evaluate('window.scrollTo(0, 0)')
            await new Promise(r => setTimeout(r, 2000))

            console.log(`Scrolling complete. Total items captured: ${productData.length}`)
            return productData.length
        }

        // 8. save data to file
        const saveDataToFile = async (data: any[]) => {
            try {
                const fs = require('fs')

                // Get current date in ET (Eastern Time)
                const date = new Date()
                const etDate = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'America/New_York',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).format(date)

                // Format: YYYY-MM-DD-THH-MM-ET
                const [month, day, year, time] = etDate.split(/[/, ]/)
                const [hours, minutes] = time.split(':')
                const timestamp = `${year}-${month}-${day}-T${hours}-${minutes}-ET`

                // Create filename with category identifier
                const filename = `costco-vitamins-supplements-${timestamp}.json`

                await fs.promises.writeFile(
                    filename,
                    JSON.stringify(data, null, 2)
                )
                console.log(`Product data saved to file: ${filename}. Total items: ${data.length}`)
            } catch (error) {
                console.error('Error saving data to file:', error)
            }
        }

        // 9. refresh the page and start scrolling
        console.log('Refreshing page to capture fresh GraphQL responses...')
        await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 })
        console.log('Page refreshed successfully')

        console.log('Starting automatic scroll to capture all items...')
        await scrollAndCapture()

        // 10. save data after scrolling is complete
        await saveDataToFile(productData)

        // Close browser before returning data
        await browser.close()
        console.log('Browser closed successfully')

        return productData

    } catch (error) {
        console.error(`Error during scraping:`, error)
        throw error
    }
}

// run the scrapper
runScrapper()
    .then((data) => {
        console.log('Scrapping completed:', data)
    })
    .catch((error) => {
        console.error(`Error running scrapper:`, error)
    })