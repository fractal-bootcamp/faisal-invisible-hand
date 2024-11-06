// Interface representing a Costco product based on the API response data
export interface CostcoProduct {
    id: string;                   // Unique identifier for the product (e.g., "items_283-20029311")
    name: string;                 // Product name/title (e.g., "Nature Made Extra Strength Magnesium 400 mg, 180 Softgels")
    size: string;                 // Product size/quantity (e.g., "each")
    productId: string;            // Product's internal ID (e.g., "20029311")
    brandName: string;            // Brand name (e.g., "nature made")
    brandId: string;              // Brand identifier (e.g., "42413")
    evergreenUrl: string;         // Product URL slug (e.g., "20029311-nature-made-magnesium-oxide-400-mg-softgels-180-ct")
    dietary: {
        mlDietaryAttributes: string[]; // Dietary attributes (e.g., ["glutenFree"])
    };
    itemMedicare: null;           // Medicare related info 
    availability: {
        available: boolean;       // Whether product is available 
    };
    viewSection: {
        itemImage: {
            altText: string | null; // Product image alt text 
            url: string;            // Product image URL (e.g., "https://d2lnr5mha7bycj.cloudfront.net/product-image/file/large_d4d8b6e1-fc6c-445c-89a9-bd9f8ffbc987.webp")
        };
        trackingProperties: {
            low_stock_label: boolean;           // Indicates if product has low stock warning 
            element_details: {
                element_type: string;           // Type of element (e.g., "item")
                retailer_location_id: string;   // Store location identifier (e.g., "283")
                item_tags: any[];              // Array of tags associated with item 
            };
            on_sale_ind: {
                on_sale: boolean;              // Whether item is on sale 
                retailer: boolean;             // If retailer is offering the sale 
                buy_one_get_one: boolean;      // BOGO sale indicator 
                cpg_coupon: boolean;           // Consumer packaged goods coupon available 
            };
            external_sku_id: string | null;    // External stock keeping unit ID
            item_id: string;                   // Internal item identifier (e.g., "668308214")
            stock_level: string;               // Current stock level status (e.g., "highly_in_stock")
            availability_score: number;         // Numerical score for availability (e.g., 0.9663658)
            low_stock_variant: string;         // Type of low stock warning 
            product_category_name: string;      // Product category classification (e.g., "Magnesium Supplements")
        };
        retailerReferenceCodeString: string;   // Retailer's reference code (e.g., "1308590")
        nameStringFormatted: {
            id: string;                        // Formatted name identifier (e.g., "2b9bcb3b")
            sections: [
                {
                    id: string;                // Section identifier (e.g., "d531c2d9")
                    name: string;              // Section name (e.g., "bodymedium2")
                }
            ],
        },
    };
    comboPromotions: string[];                // Array of combination promotions
    price: {
        viewSection: {
            badge: {
                genericSaleLabelString: string;  // Sale label (e.g., "Sale")
                trackingProperties: {
                    badge_type: string;         // Type of the badge (e.g., "retailer_promotion")
                    promotion_id: string;       // Promotion ID 
                    save_amount: string;        // Save amount (e.g., "$3.50 off; limit 15")
                };
            };
            itemCard: {
                priceString: string;            // Current price or Discounted price (e.g., "$15.20")
                plainFullPriceString: string;   // Original price (e.g., "$18.70")
            };
            itemDetails: {
                saleDisclaimerString: string;   // Sale disclaimer (e.g., "Ends Nov 17 - Add 1 to qualify for deal (max 15 per order)")
            };
        };
    };
}[]

export interface ScrollConfig {
    scrollStep: number
    maxNoNewItemsAttempts: number
    scrollDelay: number
}

export interface ScrollState {
    height: number;
    noNewItemsCount: number;
    previousItemCount: number;
    productCount: number;
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