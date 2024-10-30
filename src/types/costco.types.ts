// types for costco data
export interface CostcoProduct {
    id: string
    name: string
    size: string
    productId: string
    brandName: string
    price: {
        priceString: string
        fullPriceString: string
    }
}

export interface ScrollConfig {
    scrollStep: number
    maxNoNewItemsAttempts: number
    scrollDelay: number
}

// Main categories
export type CostcoMainCategory = 'Health & Personal Care' // add other main categories as needed

// Sub-categories for Health & Personal Care
export type HealthAndPersonalCareSubCategory =
    | 'vitamins-supplements' // add other sub categories as needed

// Category configuration type
export interface CategoryConfig {
    main: CostcoMainCategory;
    sub: HealthAndPersonalCareSubCategory;
    url: string;
}

// Update ScraperConfig to use the new category structure
export interface ScraperConfig {
    zipcode: string;
    scroll?: Partial<ScrollConfig>;
    category: CategoryConfig;
}