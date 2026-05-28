/**
 * Bloom n Creme - Shopify Headless Storefront Configuration
 * 
 * To connect to your live Shopify Store:
 * 1. Set `useMockMode` to `false`.
 * 2. Enter your real `shopDomain` (e.g. 'bloomncreme.myshopify.com').
 * 3. Enter your Storefront API Access Token.
 */
const SHOPIFY_CONFIG = {
  // Your Shopify store domain name
  shopDomain: 'bloomncreme.myshopify.com',

  // Your Shopify Storefront API Access Token (NOT the Admin API token)
  storefrontAccessToken: 'your_storefront_access_token_here',

  // When true, the site loads local menus & simulates checkout. Perfect for offline testing!
  useMockMode: true
};
