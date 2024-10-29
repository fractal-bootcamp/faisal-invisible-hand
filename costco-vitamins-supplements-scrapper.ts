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

        // Wait for network to be idle instead of navigation
        await page.waitForNetworkIdle({ timeout: 60000 })
        console.log('Network is idle after ZIP code submission')

        // Add a small delay before refresh
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Refresh the page and wait for network idle
        console.log('Refreshing page to capture fresh GraphQL responses...')
        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"], timeout: 60000 })
        console.log('Page refreshed successfully')

        // Add another small delay after refresh
        await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
        console.error(`Error during ZIP code handling:`, error)
        throw error
    }

    // 5. set up request interceptors for GraphQL
    const productData: any[] = [] // array to store product data
    await page.setRequestInterception(true)
    console.log('Request interception enabled')

    page.on('request', (request) => {
        // filter requests to capture only the graphql calls for products
        if (request.url().includes(GRAPHQL_PATH)) {
            request.continue() // let the request pass through
            console.log('GraphQL request detected and allowed')
        } else {
            request.abort() // abort non-GraphQL requests
            console.log('Non-GraphQL request aborted')
        }
    })

    page.on('response', async (response) => {
        // check if response url matches target graphql endpoint
        if (response.url().includes(GRAPHQL_PATH)) {
            try {
                const json = await response.json()
                if (json && json.data) {
                    productData.push(json.data) // store the data
                    console.log('Successfully captured GraphQL response data')
                }
            } catch (error) {
                console.error(`Error parsing response body:`, error)
            }
        }
    })

    // 6. wait for page data to load and capture responses
    console.log('Waiting for final data capture...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log('Data capture wait period completed')

    // 7. close the browser
    //await browser.close()
    console.log('Scraping process completed')

    return productData
}

// run the scrapper
runScrapper()
    .then((data) => {
        console.log('Scrapping completed:', data)
    })
    .catch((error) => {
        console.error(`Error running scrapper:`, error)
    })