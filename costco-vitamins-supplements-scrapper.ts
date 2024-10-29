import puppeteer from "puppeteer";

// costco urls
const COSTCO_SAME_DAY_URL = `https://sameday.costco.com/store/costco/storefront?utm_source=nav&zipcode=11201`
const COSTCO_SAME_DAY_VITAMINS_SUPPLEMENTS_URL = `https://sameday.costco.com/store/costco/collections/rc-vitamins-supplements`

// graphql path
const GRAPHQL_PATH = `graphql?operationName=Items&variables`

// scraped url
const SCRAPPED_URL = `${COSTCO_SAME_DAY_VITAMINS_SUPPLEMENTS_URL}`

// main scrapper function
const runScrapper = async () => {
    // 1. launch browser and create a new blank page
    const browser = await puppeteer.launch({
        headless: false,
    })
    const page = await browser.newPage()

    // 2. configure context and geolocation permission
    const context = browser.defaultBrowserContext()
    await context.overridePermissions(SCRAPPED_URL, ["geolocation"])

    // 3. set up request interceptors to filter graphql requests
    await page.setRequestInterception(true)

    const productData: any[] = [] // array to store product data

    page.on('request', (request) => {
        // filter requests to capture only the graphql calss for products
        if (request.url().includes(GRAPHQL_PATH)) {
            request.continue() // let the request pass through
        } else {
            request.abort() // abort all other requests
        }
    })

    // 4. capture response for relevant graphql requests
    page.on('response', async (response) => {
        // check if response url matches target graphql endpoint
        if (response.url().includes(GRAPHQL_PATH)) {
            try {
                const json = await response.json()
                if (json && json.data) {
                    productData.push(json.data) // store the data
                }
            } catch (error) {
                console.error(`Error parsing response body:`, error)
            }
        }
    })

    // 5. navigate to the category page you want to scrape
    await page.goto(SCRAPPED_URL, {
        waitUntil: "networkidle2"
    })

    // 6. wait for page data to load and capture responses
    await new Promise(resolve => setTimeout(resolve, 5000))

    // 7. close the browser
    //await browser.close()
}

// run the scrapper
runScrapper()
    .then((data) => {
        console.log('Scrapping completed:', data)
    })
    .catch((error) => {
        console.error(`Error running scrapper:`, error)
    })