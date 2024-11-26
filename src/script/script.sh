# Set shared auth headers
AUTH_HEADERS=(
  -H "Cookie: ahoy_visitor=f11c90c7-6de6-4b11-ab26-4e502858dc22; ajs_anonymous_id=176ca2c3-f5e4-4eaa-a311-3ec8ada78a83; _gcl_au=1.1.1065956715.1732309740; __Host-instacart_sid=v2.36e13b81fae9a8.m6IijgCwhWU8M7eyNdn_Jjduy8qVwGRdqal9m00b83c; X-IC-bcx=0; instacart_securitiai_test=test123; ajs_user_id=15447294442400168; __stripe_mid=95ed2dd1-9a18-4b05-9685-17fc6ce43352d572ea; ahoy_visit=1d6aa2e8-b4ce-46a2-81fe-b865892f5087; build_sha=5175bd8ff633fe6c435074bce2673d7f4932941a; _instacart_session_id=V2l3N1QzaU9OS1F6VzhUZUpqTVY3WjRpcjErUkFIM3RXejd1NlNQckVzVkprVVQwSkV5WW5GR0g3QVM2QWZCR3pQV2JPVHdocSt4aHI3cXAvQ0kxTzVBN1dZOFhzb1RaeXVZdmJzUG41YU95dkVFUEhiQ3hGUWR1YktEL3hSa05ITGpmOXBVbHlqcUhsMC9vaDlESUNnPT0tLS9vTGJLaW9GcjQyeXdET1VodzFzdGc9PQ%3D%3D--2983397fa9686ae4e1a8ac2d62c97333704fbcd1; __stripe_sid=0b572760-f76a-4168-b2b3-60f16007bb6b12681c; sessionId=eb597c86-eaea-4991-b19f-307111e9c15f; OptanonConsent=isGpcEnabled=0&datestamp=Tue+Nov+26+2024+09%3A33%3A54+GMT-0500+(Eastern+Standard+Time)&version=202401.2.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=61144940-f09e-4503-b607-8c3ce1589d77&interactionCount=1&landingPath=NotLandingPage&groups=BG117%3A1%2CC0001%3A1%2CC0003%3A1%2CC0002%3A1%2CSPD_BG%3A1%2CC0004%3A1&AwaitingReconsent=false; _dd_s=logs=0&expire=1732632535676; forterToken=1e89d13a11d54a50b863822e7eecf98f_1732631634523__UDF43-m4_21ck_"
)

# First request to get product IDs
PRODUCT_IDS=$(curl "${AUTH_HEADERS[@]}" \
  'https://sameday.costco.com/graphql?operationName=CollectionProductsWithFeaturedProducts&variables=%7B%22retailerInventorySessionToken%22%3A%22v1.8991035.15447294442400168-11222-04072x17394-1-5-284-1-0%22%2C%22shopId%22%3A%22198521%22%2C%22postalCode%22%3A%2211222%22%2C%22zoneId%22%3A%22973%22%2C%22slug%22%3A%22rc-vitamins-supplements%22%2C%22filters%22%3A%5B%5D%2C%22pageViewId%22%3A%22041df4eb-d829-51e2-8115-8131e0e420ab%22%2C%22itemsDisplayType%22%3A%22collections_items_grid%22%2C%22first%22%3A4%2C%22pageSource%22%3A%22browse%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22ab285a7d8f6cfdfc75f2e7315cee8bf4068f3b27096bc0bb2cbbea1f06e73fb3%22%7D%7D' | jq '.data.collectionProducts.itemIds')

echo $PRODUCT_IDS

# Format the product IDs into a comma-separated list with URL encoding
FORMATTED_IDS=$(echo $PRODUCT_IDS | tr -d '[]" ' | sed 's/\([^,]*\)/%22\1%22/g' | sed 's/ /%20/g' | sed 's/,/%2C/g')

# Second request with formatted IDs and auth headers
ENDPOINT="https://sameday.costco.com/graphql?operationName=Items&variables=%7B%22ids%22%3A%5B$FORMATTED_IDS%5D%2C%22shopId%22%3A%22198521%22%2C%22zoneId%22%3A%22973%22%2C%22postalCode%22%3A%2211222%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22cfae0717246fddaf0212c9d9cb9fba06d43ff153a7dbd72695f3721b0b578be2%22%7D%7D"
echo "Making request to: $ENDPOINT"
curl "${AUTH_HEADERS[@]}" "$ENDPOINT" >> test1.json