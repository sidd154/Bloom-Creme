/**
 * Bloom n Creme - Core Storefront Controller & Shopify Headless Logic
 * Integrated with Shopify Storefront API / JS Buy SDK & Local Mock Fallback
 */

// Global State
let shopifyClient = null;
let liveProducts = [];
let cart = [];
let activeCategory = 'all';
let showFullCatalog = false; // By default only show featured signature items
let currentCustomizingProduct = null;
let currentCustomImage = null; // Stored as Base64 for mock display, or passed to Shopify
let mockOrderIdCounter = 1000 + Math.floor(Math.random() * 9000);

// Raw Cake database extracted from the WhatsApp menu images
const MOCK_PRODUCTS = [
  // --- NEW AUTUMN SIGNATURE ARRIVALS --- (Featured + isNew)
  {
    id: "new-rose-gold",
    title: "Rose Gold Floral Bento Cake",
    category: "bento",
    description: "Elegant personal-sized bento featuring hand-painted edible gold leaf borders and organic rosewater-infused buttercream layers.",
    basePrice: 349,
    variants: [{ id: "v-new-rose-gold-300g", title: "300 Grams", price: 349, weight: 0.3 }],
    image: "Cake pics/bento_rose_gold.png",
    bgColor: "linear-gradient(135deg, #FFF0F0, #FFE0E0)",
    isNew: true,
    isFeatured: true
  },
  {
    id: "new-belgian-biscoff",
    title: "Belgian Biscoff Luxury",
    category: "premium",
    description: "Premium dark sponge filled with genuine Lotus Biscoff spread, topped with crunchy cookie crumbles and luxury chocolate curls.",
    basePrice: 549,
    variants: [
      { id: "v-new-belgian-biscoff-half", title: "Half KG", price: 549, weight: 0.5 },
      { id: "v-new-belgian-biscoff-one", title: "1 KG", price: 1099, weight: 1.0 }
    ],
    image: "Cake pics/belgian_biscoff.png",
    bgColor: "linear-gradient(135deg, #FAF0E6, #F5DEB3)",
    isNew: true,
    isFeatured: true
  },
  {
    id: "new-saffron-cardamom",
    title: "Saffron Cardamom Delicacy",
    category: "premium",
    description: "A royal fusion masterpiece: Cardamom-infused golden sponge layers, rich saffron whipped custard, topped with real pistachios and delicate silver leaf.",
    basePrice: 599,
    variants: [
      { id: "v-new-saffron-cardamom-half", title: "Half KG", price: 599, weight: 0.5 },
      { id: "v-new-saffron-cardamom-one", title: "1 KG", price: 1199, weight: 1.0 }
    ],
    image: "Cake pics/saffron_delicacy.png",
    bgColor: "linear-gradient(135deg, #FFF8DC, #FFFAF0)",
    isNew: true,
    isFeatured: true
  },
  {
    id: "new-lavender-pistachio",
    title: "Lavender Dream & Pistachio",
    category: "premium",
    description: "Enchanting lavender-scented sponge paired with thick, slow-roasted pistachio filling, draped in a gorgeous watercolor vanilla bean glaze.",
    basePrice: 599,
    variants: [
      { id: "v-new-lavender-pistachio-half", title: "Half KG", price: 599, weight: 0.5 },
      { id: "v-new-lavender-pistachio-one", title: "1 KG", price: 1199, weight: 1.0 }
    ],
    image: "Cake pics/lavender_pistachio.png",
    bgColor: "linear-gradient(135deg, #E6E6FA, #F3E5F5)",
    isNew: true,
    isFeatured: true
  },

  // --- BENTO CAKES --- (All 300 Grams, ₹349)
  {
    id: "bento-choco-truffle",
    title: "Choco Truffle Bento Cake",
    category: "bento",
    description: "Rich, dense chocolate truffle layers in a charming personal portion.",
    basePrice: 349,
    variants: [{ id: "v-bento-choco-truffle-300g", title: "300 Grams", price: 349, weight: 0.3 }],
    bgColor: "linear-gradient(135deg, #2D1A10, #3E2718)",
    isFeatured: true
  },
  {
    id: "bento-kitkat",
    title: "Kitkat Bento Cake",
    category: "bento",
    description: "Creamy chocolate frosting laced with crunchy KitKat chunks inside a cute lunchbox size.",
    basePrice: 349,
    variants: [{ id: "v-bento-kitkat-300g", title: "300 Grams", price: 349, weight: 0.3 }],
    bgColor: "linear-gradient(135deg, #4A2711, #5D371E)"
  },
  {
    id: "bento-vanilla",
    title: "Vanilla Bento Cake",
    category: "bento",
    description: "Classic, moist vanilla cake decorated with premium whipped cream.",
    basePrice: 349,
    variants: [{ id: "v-bento-vanilla-300g", title: "300 Grams", price: 349, weight: 0.3 }],
    bgColor: "linear-gradient(135deg, #FFFDF8, #F9F3E8)",
    isFeatured: true
  },
  {
    id: "bento-blackcurrant",
    title: "Blackcurrant Bento Cake",
    category: "bento",
    description: "Tangy blackcurrant preserve folded into smooth, airy cream layers.",
    basePrice: 349,
    variants: [{ id: "v-bento-blackcurrant-300g", title: "300 Grams", price: 349, weight: 0.3 }]
  },
  {
    id: "bento-blueberry",
    title: "Blueberry Bento Cake",
    category: "bento",
    description: "Fragrant blueberry puree layered with a light vanilla sponge base.",
    basePrice: 349,
    variants: [{ id: "v-bento-blueberry-300g", title: "300 Grams", price: 349, weight: 0.3 }]
  },
  {
    id: "bento-butterscotch",
    title: "Butterscotch Bento Cake",
    category: "bento",
    description: "Rich butterscotch praline crunch combined with smooth caramel drip.",
    basePrice: 349,
    variants: [{ id: "v-bento-butterscotch-300g", title: "300 Grams", price: 349, weight: 0.3 }]
  },
  {
    id: "bento-red-velvet",
    title: "Red Velvet Bento Cake",
    category: "bento",
    description: "Velvety crimson sponge layered with light cream cheese frosting.",
    basePrice: 349,
    variants: [{ id: "v-bento-red-velvet-300g", title: "300 Grams", price: 349, weight: 0.3 }]
  },
  {
    id: "bento-pineapple",
    title: "Pineapple Bento Cake",
    category: "bento",
    description: "Tropical crushed pineapples and sweet whipped cream layers.",
    basePrice: 349,
    variants: [{ id: "v-bento-pineapple-300g", title: "300 Grams", price: 349, weight: 0.3 }]
  },
  {
    id: "bento-oreo",
    title: "Oreo Bento Cake",
    category: "bento",
    description: "Crushed Oreo biscuits blended into smooth cookies & cream frosting.",
    basePrice: 349,
    variants: [{ id: "v-bento-oreo-300g", title: "300 Grams", price: 349, weight: 0.3 }]
  },
  {
    id: "bento-rasamalai",
    title: "Rasamalai Bento Cake",
    category: "bento",
    description: "Royal fusion of cardamom-spiced sponge soaked in rich saffron milk.",
    basePrice: 349,
    variants: [{ id: "v-bento-rasamalai-300g", title: "300 Grams", price: 349, weight: 0.3 }]
  },
  {
    id: "bento-blackforest",
    title: "Blackforest Bento Cake",
    category: "bento",
    description: "Decadent dark chocolate flakes, sour cherries, and vanilla cream layers.",
    basePrice: 349,
    variants: [{ id: "v-bento-blackforest-300g", title: "300 Grams", price: 349, weight: 0.3 }]
  },
  {
    id: "bento-whiteforest",
    title: "Whiteforest Bento Cake",
    category: "bento",
    description: "Elegant white chocolate shavings, red cherry layers, and vanilla cake.",
    basePrice: 349,
    variants: [{ id: "v-bento-whiteforest-300g", title: "300 Grams", price: 349, weight: 0.3 }]
  },
  {
    id: "bento-chocochip",
    title: "Choco Chip Bento Cake",
    category: "bento",
    description: "Chocolate chips sprinkled over high-grade chocolate fudge layers.",
    basePrice: 349,
    variants: [{ id: "v-bento-chocochip-300g", title: "300 Grams", price: 349, weight: 0.3 }]
  },
  {
    id: "bento-mango",
    title: "Mango Bento Cake",
    category: "bento",
    description: "Rich mango pulp layered in premium fluffy sponge cake.",
    basePrice: 349,
    variants: [{ id: "v-bento-mango-300g", title: "300 Grams", price: 349, weight: 0.3 }]
  },

  // --- CLASSIC VEGETARIAN CAKES --- (0.5 KG @ ₹449 / 1.0 KG @ ₹899)
  {
    id: "classic-vanilla",
    title: "Vanilla Cake",
    category: "classic",
    description: "The ultimate standard vanilla cake, extremely fluffy and light.",
    basePrice: 449,
    variants: [
      { id: "v-classic-vanilla-half", title: "Half KG", price: 449, weight: 0.5 },
      { id: "v-classic-vanilla-one", title: "1 KG", price: 899, weight: 1.0 }
    ]
  },
  {
    id: "classic-white-forest",
    title: "White Forest Cake",
    category: "classic",
    description: "Premium white chocolate curls, cherry layers, and cloud-like whipped cream.",
    basePrice: 449,
    variants: [
      { id: "v-classic-white-forest-half", title: "Half KG", price: 449, weight: 0.5 },
      { id: "v-classic-white-forest-one", title: "1 KG", price: 899, weight: 1.0 }
    ],
    bgColor: "linear-gradient(135deg, #FFF, #ECEFF1)",
    isFeatured: true
  },
  {
    id: "classic-butterscotch",
    title: "Butterscotch Cake",
    category: "classic",
    description: "Rich butterscotch praline chunks layered between soft vanilla sponges.",
    basePrice: 449,
    variants: [
      { id: "v-classic-butterscotch-half", title: "Half KG", price: 449, weight: 0.5 },
      { id: "v-classic-butterscotch-one", title: "1 KG", price: 899, weight: 1.0 }
    ]
  },
  {
    id: "classic-pineapple",
    title: "Pineapple Cake",
    category: "classic",
    description: "Made with authentic chopped pineapple slices and light sugar syrup.",
    basePrice: 449,
    variants: [
      { id: "v-classic-pineapple-half", title: "Half KG", price: 449, weight: 0.5 },
      { id: "v-classic-pineapple-one", title: "1 KG", price: 899, weight: 1.0 }
    ]
  },
  {
    id: "classic-mango",
    title: "Mango Cake",
    category: "classic",
    description: "Rich tropical mango pulp base layered inside elegant cake folds.",
    basePrice: 449,
    variants: [
      { id: "v-classic-mango-half", title: "Half KG", price: 449, weight: 0.5 },
      { id: "v-classic-mango-one", title: "1 KG", price: 899, weight: 1.0 }
    ]
  },
  {
    id: "classic-strawberry",
    title: "Strawberry Cake",
    category: "classic",
    description: "Delightful pink strawberry sponge with premium strawberry jam layers.",
    basePrice: 449,
    variants: [
      { id: "v-classic-strawberry-half", title: "Half KG", price: 449, weight: 0.5 },
      { id: "v-classic-strawberry-one", title: "1 KG", price: 899, weight: 1.0 }
    ]
  },
  {
    id: "classic-blueberry",
    title: "Blueberry Cake",
    category: "classic",
    description: "Soft vanilla sponge layered with rich, aromatic blueberry preserve.",
    basePrice: 449,
    variants: [
      { id: "v-classic-blueberry-half", title: "Half KG", price: 449, weight: 0.5 },
      { id: "v-classic-blueberry-one", title: "1 KG", price: 899, weight: 1.0 }
    ]
  },
  {
    id: "classic-blackcurrent",
    title: "Blackcurrent Cake",
    category: "classic",
    description: "A gorgeous, deep purple sponge with tart blackcurrant cream.",
    basePrice: 449,
    variants: [
      { id: "v-classic-blackcurrent-half", title: "Half KG", price: 449, weight: 0.5 },
      { id: "v-classic-blackcurrent-one", title: "1 KG", price: 899, weight: 1.0 }
    ]
  },

  // --- PREMIUM & CHOCOLATE CAKES --- (Custom Priced)
  {
    id: "premium-chocolate-truffle",
    title: "Chocolate Truffle Cake",
    category: "premium",
    description: "Luxurious, silky smooth Belgian dark chocolate ganache draped over sponge layers.",
    basePrice: 549,
    variants: [
      { id: "v-premium-chocolate-truffle-half", title: "Half KG", price: 549, weight: 0.5 },
      { id: "v-premium-chocolate-truffle-one", title: "1 KG", price: 1099, weight: 1.0 }
    ],
    bgColor: "linear-gradient(135deg, #2C180E, #4E2E1B)",
    isFeatured: true
  },
  {
    id: "premium-dead-by-chocolate",
    title: "Dead By Chocolate Cake",
    category: "premium",
    description: "Ultimate chocolate overload featuring three types of chocolate chips and hot fudge glaze.",
    basePrice: 529,
    variants: [
      { id: "v-premium-dead-by-chocolate-half", title: "Half KG", price: 529, weight: 0.5 },
      { id: "v-premium-dead-by-chocolate-one", title: "1 KG", price: 1049, weight: 1.0 }
    ]
  },
  {
    id: "premium-choco-chip",
    title: "Choco Chip Cake",
    category: "premium",
    description: "Crunchy semi-sweet chocolate chips folded into premium dark fudge frosting.",
    basePrice: 529,
    variants: [
      { id: "v-premium-choco-chip-half", title: "Half KG", price: 529, weight: 0.5 },
      { id: "v-premium-choco-chip-one", title: "1 KG", price: 1049, weight: 1.0 }
    ]
  },
  {
    id: "premium-black-forest",
    title: "Black Forest Cake (Premium)",
    category: "premium",
    description: "Extra loaded cherry layers, fine chocolate shavings, and dark cherry syrup soak.",
    basePrice: 529,
    variants: [
      { id: "v-premium-black-forest-half", title: "Half KG", price: 529, weight: 0.5 },
      { id: "v-premium-black-forest-one", title: "1 KG", price: 1049, weight: 1.0 }
    ]
  },
  {
    id: "premium-molten-affair",
    title: "Molten Affair Cake",
    category: "premium",
    description: "Lava-style molten chocolate core enclosed within delicate, fluffy chocolate sheets.",
    basePrice: 529,
    variants: [
      { id: "v-premium-molten-affair-half", title: "Half KG", price: 529, weight: 0.5 },
      { id: "v-premium-molten-affair-one", title: "1 KG", price: 1049, weight: 1.0 }
    ]
  },
  {
    id: "premium-oreo",
    title: "Oreo Cake (Premium)",
    category: "premium",
    description: "Double loaded Oreo chunks whipped in vanilla buttercream and topped with whole cookies.",
    basePrice: 529,
    variants: [
      { id: "v-premium-oreo-half", title: "Half KG", price: 529, weight: 0.5 },
      { id: "v-premium-oreo-one", title: "1 KG", price: 1049, weight: 1.0 }
    ]
  },
  {
    id: "premium-kitkat",
    title: "Kitkat Cake (Premium)",
    category: "premium",
    description: "Surrounded by a majestic fence of whole crispy KitKat bars, tied with an elegant ribbon.",
    basePrice: 529,
    variants: [
      { id: "v-premium-kitkat-half", title: "Half KG", price: 529, weight: 0.5 },
      { id: "v-premium-kitkat-one", title: "1 KG", price: 1049, weight: 1.0 }
    ]
  },
  {
    id: "premium-ferrero-rocher",
    title: "Ferrero Rocher Cake",
    category: "premium",
    description: "Rich hazelnut spread, crunchy wafer pieces, topped with whole Ferrero Rocher truffles.",
    basePrice: 599,
    variants: [
      { id: "v-premium-ferrero-rocher-half", title: "Half KG", price: 599, weight: 0.5 },
      { id: "v-premium-ferrero-rocher-one", title: "1 KG", price: 1199, weight: 1.0 }
    ],
    bgColor: "linear-gradient(135deg, #3D2712, #5D3E21)",
    isFeatured: true
  },
  {
    id: "premium-choco-almond",
    title: "Choco Almond Crunch Cake",
    category: "premium",
    description: "Slow-roasted almond slivers folded inside premium caramelized chocolate layers.",
    basePrice: 599,
    variants: [
      { id: "v-premium-choco-almond-half", title: "Half KG", price: 599, weight: 0.5 },
      { id: "v-premium-choco-almond-one", title: "1 KG", price: 1199, weight: 1.0 }
    ]
  },
  {
    id: "premium-photo",
    title: "Custom Photo Cake",
    category: "premium",
    description: "Personalize your celebration with an edible photograph printed cleanly onto the frosting.",
    basePrice: 599,
    variants: [
      { id: "v-premium-photo-half", title: "Half KG", price: 599, weight: 0.5 },
      { id: "v-premium-photo-one", title: "1 KG", price: 1199, weight: 1.0 }
    ]
  },
  {
    id: "premium-rasamalai",
    title: "Rasamalai Cake",
    category: "premium",
    description: "Mouth-watering saffron sponge, rich condensed milk base, topped with real pistachios and rasamalai balls.",
    basePrice: 599,
    variants: [
      { id: "v-premium-rasamalai-half", title: "Half KG", price: 599, weight: 0.5 },
      { id: "v-premium-rasamalai-one", title: "1 KG", price: 1199, weight: 1.0 }
    ],
    bgColor: "linear-gradient(135deg, #FFFDF0, #FFF9C4)",
    isFeatured: true
  },
  {
    id: "premium-gulab-jamun",
    title: "Gulab Jamun Cake",
    category: "premium",
    description: "Delectable fusion cake topped with miniature sweet gulab jamuns and a sprinkle of rose petals.",
    basePrice: 599,
    variants: [
      { id: "v-premium-gulab-jamun-half", title: "Half KG", price: 599, weight: 0.5 },
      { id: "v-premium-gulab-jamun-one", title: "1 KG", price: 1199, weight: 1.0 }
    ]
  },
  {
    id: "premium-fruits-red-velvet",
    title: "Fruits Red Velvet Cake",
    category: "premium",
    description: "Crimson velvet cake layered with premium mixed tropical fruits and dairy frosting.",
    basePrice: 599,
    variants: [
      { id: "v-premium-fruits-red-velvet-half", title: "Half KG", price: 599, weight: 0.5 },
      { id: "v-premium-fruits-red-velvet-one", title: "1 KG", price: 1199, weight: 1.0 }
    ]
  },
  {
    id: "premium-red-velvet",
    title: "Red Velvet Cake",
    category: "premium",
    description: "Classic premium Red Velvet with thick frosting and dynamic crimson cocoa dust overlays.",
    basePrice: 549,
    variants: [
      { id: "v-premium-red-velvet-half", title: "Half KG", price: 549, weight: 0.5 },
      { id: "v-premium-red-velvet-one", title: "1 KG", price: 1099, weight: 1.0 }
    ]
  }
];

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  initShopifySDK();
  loadCartFromStorage();
  renderProducts();
  renderNewCollections();
  initPersonalizer();
  setupRealtimeIcing();
  setupHamburgerMenu();
  setupIntersectionObserver();
  setupEventListeners();
  updateCartBadge();
  initDeliveryDateLimits();
});

// --- Connect Shopify Storefront API ---
function initShopifySDK() {
  if (typeof SHOPIFY_CONFIG !== 'undefined' && !SHOPIFY_CONFIG.useMockMode) {
    try {
      shopifyClient = ShopifyBuy.buildClient({
        domain: SHOPIFY_CONFIG.shopDomain,
        storefrontAccessToken: SHOPIFY_CONFIG.storefrontAccessToken
      });
      console.log("Shopify Storefront Client Initialized successfully.");
      fetchShopifyProducts();
    } catch (e) {
      console.error("Error initializing Shopify SDK, falling back to Mock Mode.", e);
      SHOPIFY_CONFIG.useMockMode = true;
    }
  } else {
    console.log("Mock Mode Active: Loading Bloom n Creme local cake catalogue.");
  }
}

// --- Fetch Products from live Shopify Storefront ---
function fetchShopifyProducts() {
  shopifyClient.product.fetchAll().then((products) => {
    if (products && products.length > 0) {
      // Map Shopify products to match our frontend schema
      liveProducts = products.map(prod => {
        // Classify category based on Shopify tags
        let category = 'classic'; 
        if (prod.tags.some(tag => tag.toLowerCase().includes('bento'))) category = 'bento';
        else if (prod.tags.some(tag => tag.toLowerCase().includes('premium') || tag.toLowerCase().includes('chocolate'))) category = 'premium';
        
        return {
          id: prod.id,
          title: prod.title,
          category: category,
          description: prod.description || "Freshly baked cake prepared with premium ingredients in Chennai.",
          basePrice: parseFloat(prod.variants[0].price.amount),
          variants: prod.variants.map(v => ({
            id: v.id,
            title: v.title,
            price: parseFloat(v.price.amount),
            weight: v.weight || 0.5
          })),
          shopifyRaw: prod
        };
      });
      renderProducts(liveProducts);
    } else {
      console.warn("Shopify store returned 0 products. Reverting to Mock Catalog.");
      renderProducts(MOCK_PRODUCTS);
    }
  }).catch(err => {
    console.error("Error loading Shopify products, falling back to Mock Catalog:", err);
    renderProducts(MOCK_PRODUCTS);
  });
}

// --- Render Product Grid ---
function renderProducts(productsToRender = null) {
  const grid = document.getElementById("products-grid");
  if (!grid) return;
  
  const source = productsToRender || (SHOPIFY_CONFIG.useMockMode ? MOCK_PRODUCTS : liveProducts);
  grid.innerHTML = "";
  
  // Search input element
  const searchInput = document.getElementById("catalog-search-input");
  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : "";
  
  // Filter by category
  let filtered = source.filter(p => activeCategory === 'all' || p.category === activeCategory);
  
  // Filter by Featured Highlights unless showFullCatalog is true
  if (!showFullCatalog) {
    filtered = filtered.filter(p => p.isFeatured === true);
  }
  
  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(searchQuery) || 
      p.description.toLowerCase().includes(searchQuery)
    );
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="checkout-grid-full text-center" style="padding: 40px; color: var(--color-text-muted);">
        <i class="fas fa-birthday-cake" style="font-size: 40px; margin-bottom: 12px; color: var(--color-sage-medium);"></i>
        <p>No cakes found matching your search.</p>
      </div>
    `;
    return;
  }
  
  filtered.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card reveal-on-scroll";
    
    // Check if it's Bento (Single size) or classic (variants list)
    const isBento = product.category === 'bento';
    const priceDisplay = isBento 
      ? `₹${product.basePrice}` 
      : `₹${product.variants[0].price}<small> / Half KG</small>`;
      
    // Custom media styling or real image
    let mediaHTML = '';
    if (product.image) {
      mediaHTML = `<img src="${product.image}" alt="${product.title}" class="product-image">`;
    } else {
      const gradient = product.bgColor || 'linear-gradient(135deg, var(--color-rose-light), var(--color-white))';
      mediaHTML = `
        <div class="product-image-placeholder" style="background: ${gradient}; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <i class="fas fa-birthday-cake" style="font-size: 38px; margin-bottom: 6px; color: var(--color-soft-rose);"></i>
          <span style="font-family: var(--font-serif); font-size: 11px; font-style: italic; font-weight: 700; color: var(--color-forest-green);">Bloom n Creme</span>
        </div>
      `;
    }
      
    card.innerHTML = `
      <div class="product-badge-row">
        <div class="card-badge-veg"><div class="veg-badge"></div></div>
        ${product.category === 'premium' ? '<div class="card-badge"><i class="fas fa-award"></i> Premium</div>' : ''}
        ${isBento ? '<div class="card-badge"><i class="fas fa-box"></i> Bento</div>' : ''}
      </div>
      <div class="product-card-media">
        ${mediaHTML}
      </div>
      <div class="product-details">
        <h3 class="product-title">${product.title}</h3>
        <p class="product-desc">${product.description}</p>
        <div class="product-purchase-row">
          <div class="product-price-box">
            <span class="product-price-label">Price Starts At</span>
            <span class="product-price">${priceDisplay}</span>
          </div>
          <button class="product-add-btn" onclick="openCustomization('${product.id}')" aria-label="Add to cart">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  // Re-observe scroll reveals for newly rendered elements
  if (window.observeScrollTriggers) {
    window.observeScrollTriggers();
  }
}

// --- Category Filter Actions ---
window.filterCategory = function(category, buttonElement) {
  activeCategory = category;
  
  // Set active class on buttons
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach(btn => btn.classList.remove("active"));
  buttonElement.classList.add("active");
  
  // If they filter by category, automatically unlock full catalog view!
  if (category !== 'all') {
    showFullCatalog = true;
    const expandBtn = document.getElementById("catalog-expand-btn");
    if (expandBtn) {
      expandBtn.innerHTML = `Show Curated Highlights <i class="fas fa-chevron-up"></i>`;
    }
    const filterSection = document.getElementById("catalog-advanced-controls");
    if (filterSection) filterSection.classList.add("active");
  }
  
  renderProducts();
};

// --- Chennai Pincode Area Checker ---
window.checkDeliveryPincode = function() {
  const pincode = document.getElementById("pincode-input").value.trim();
  const resultDiv = document.getElementById("pincode-result");
  
  if (!resultDiv) return;
  
  resultDiv.className = "checker-result";
  resultDiv.style.display = "inline-flex";
  
  // Chennai pincodes start with 600
  if (/^600\d{3}$/.test(pincode)) {
    resultDiv.classList.add("success");
    resultDiv.innerHTML = `<i class="fas fa-check-circle"></i> We deliver to Chennai area ${pincode}! Same-day & Midnight delivery active.`;
  } else if (pincode === "") {
    resultDiv.style.display = "none";
  } else {
    resultDiv.classList.add("error");
    resultDiv.innerHTML = `<i class="fas fa-times-circle"></i> Sorry, we only deliver to Chennai (pincodes starting with 600).`;
  }
};

// --- Customization Drawer Actions ---
window.openCustomization = function(productId) {
  const source = SHOPIFY_CONFIG.useMockMode ? MOCK_PRODUCTS : liveProducts;
  const product = source.find(p => p.id === productId);
  if (!product) return;
  
  currentCustomizingProduct = product;
  currentCustomImage = null;
  
  // Elements
  const modal = document.getElementById("customization-modal");
  const media = document.getElementById("custom-modal-media");
  const title = document.getElementById("custom-modal-title");
  const desc = document.getElementById("custom-modal-desc");
  const variantsContainer = document.getElementById("custom-variants-row");
  const uploadPreview = document.getElementById("photo-upload-preview");
  const submitPrice = document.getElementById("custom-submit-price");
  
  // Set Text
  title.innerText = product.title;
  desc.innerText = product.description;
  
  // Set Media: Canvas for writing icing, or camera preview for photo upload
  const isPhotoCake = product.title.toLowerCase().includes("photo cake") || product.id.includes("photo");
  if (isPhotoCake) {
    media.innerHTML = `
      <div class="product-image-placeholder" style="background: linear-gradient(135deg, #FAF0E6, #FFF); width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <i class="fas fa-camera" style="font-size:36px; margin-bottom:8px; color:var(--color-soft-rose);"></i>
        <span style="font-family:var(--font-serif); font-size:12px; font-weight:700; color:var(--color-forest-green);">Photo Cake Canvas</span>
      </div>`;
  } else {
    media.innerHTML = `<canvas id="icing-canvas" width="240" height="240" style="background: transparent; width:100%; height:100%; display:block; aspect-ratio: 1/1;"></canvas>`;
  }
  
  // Clear file upload previews
  if (uploadPreview) uploadPreview.style.display = "none";
  const fileInput = document.getElementById("cake-photo-file");
  if (fileInput) fileInput.value = "";
  
  // Generate dynamic size variants
  variantsContainer.innerHTML = "";
  product.variants.forEach((v, index) => {
    const isChecked = index === 0 ? "checked" : "";
    const option = document.createElement("div");
    option.className = "segment-option";
    option.innerHTML = `
      <input type="radio" id="var-${v.id}" name="cake-variant-size" value="${v.id}" data-price="${v.price}" ${isChecked} onchange="updateCustomizationPrice()">
      <label for="var-${v.id}" class="segment-label">
        ${v.title}
        <span>₹${v.price}</span>
      </label>
    `;
    variantsContainer.appendChild(option);
  });
  
  // Hide image upload widget if not a custom photo cake
  const uploadGroup = document.getElementById("photo-upload-group");
  if (uploadGroup) {
    uploadGroup.style.style = isPhotoCake ? "block" : "none";
    if (isPhotoCake) {
      uploadGroup.removeAttribute("style");
    } else {
      uploadGroup.style.display = "none";
    }
  }
  
  // Custom inputs resets
  document.getElementById("cake-custom-message").value = "";
  document.getElementById("card-custom-message").value = "";
  document.getElementById("cake-eggless-toggle").checked = true; // Veg by default
  
  // Draw Cake Icing Canvas if applicable
  if (!isPhotoCake) {
    setTimeout(() => {
      drawCakeIcing("");
    }, 50);
  }
  
  // Update pricing and launch modal
  updateCustomizationPrice();
  modal.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent backpage scrolling
};

window.closeCustomization = function() {
  const modal = document.getElementById("customization-modal");
  if (modal) modal.classList.remove("active");
  document.body.style.style = "";
  document.body.removeAttribute("style");
};

// Calculate modal pricing based on variant select
window.updateCustomizationPrice = function() {
  const selectedRadio = document.querySelector('input[name="cake-variant-size"]:checked');
  const priceLabel = document.getElementById("custom-submit-price");
  if (selectedRadio && priceLabel) {
    const price = parseFloat(selectedRadio.getAttribute("data-price"));
    priceLabel.innerText = `₹${price}`;
  }
};

// --- Custom Image Upload Handler (Photo Cakes) ---
window.handleImageUpload = function(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("photo-upload-preview");
  const previewImg = document.getElementById("upload-preview-img");
  const previewName = document.getElementById("upload-preview-name");
  
  if (!file || !preview) return;
  
  previewName.innerText = file.name;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    currentCustomImage = e.target.result; // Base64 url
    if (previewImg) previewImg.src = currentCustomImage;
    preview.style.display = "flex";
  };
  reader.readAsDataURL(file);
};

window.removeUploadedImage = function() {
  currentCustomImage = null;
  const preview = document.getElementById("photo-upload-preview");
  const fileInput = document.getElementById("cake-photo-file");
  if (preview) preview.style.display = "none";
  if (fileInput) fileInput.value = "";
};

// --- Cart Logic System ---
window.submitToCart = function() {
  if (!currentCustomizingProduct) return;
  
  // Get selected variant
  const selectedRadio = document.querySelector('input[name="cake-variant-size"]:checked');
  if (!selectedRadio) return;
  
  const variantId = selectedRadio.value;
  const variantObj = currentCustomizingProduct.variants.find(v => v.id === variantId);
  
  // Get custom configurations
  const cakeMessage = document.getElementById("cake-custom-message").value.trim();
  const cardMessage = document.getElementById("card-custom-message").value.trim();
  const isEggless = document.getElementById("cake-eggless-toggle").checked;
  
  // Assemble Cart Item details
  const cartItem = {
    cartId: `cart-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId: currentCustomizingProduct.id,
    variantId: variantId,
    title: currentCustomizingProduct.title,
    variantTitle: variantObj.title,
    price: variantObj.price,
    quantity: 1,
    customization: {
      messageOnCake: cakeMessage || "None",
      cardMessage: cardMessage || "None",
      eggless: isEggless,
      photoBase64: currentCustomImage
    }
  };
  
  // Add to cart state and synchronize
  cart.push(cartItem);
  saveCartToStorage();
  updateCartBadge();
  closeCustomization();
  openCartDrawer();
  renderCartItems();
};

window.removeFromCart = function(cartId) {
  cart = cart.filter(item => item.cartId !== cartId);
  saveCartToStorage();
  updateCartBadge();
  renderCartItems();
};

window.changeCartQty = function(cartId, delta) {
  const item = cart.find(item => item.cartId === cartId);
  if (!item) return;
  
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(cartId);
  } else {
    saveCartToStorage();
    updateCartBadge();
    renderCartItems();
  }
};

function renderCartItems() {
  const container = document.getElementById("cart-items");
  const subtotalVal = document.getElementById("cart-subtotal-val");
  const totalVal = document.getElementById("cart-total-val");
  const checkoutBtn = document.getElementById("cart-checkout-action");
  
  if (!container) return;
  
  container.innerHTML = "";
  let subtotal = 0;
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-view">
        <i class="fas fa-shopping-basket"></i>
        <h3>Your Cart is Empty</h3>
        <p>Browse our beautiful cakes and customize your perfect party centerpiece!</p>
        <button class="btn btn-outline" onclick="closeCartDrawer()" style="margin-top: 10px;">Start Shopping</button>
      </div>
    `;
    if (subtotalVal) subtotalVal.innerText = "₹0";
    if (totalVal) totalVal.innerText = "₹0";
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }
  
  if (checkoutBtn) checkoutBtn.disabled = false;
  
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    
    const row = document.createElement("div");
    row.className = "cart-item animate-card";
    
    // Photo preview icon
    const isPhotoItem = item.customization.photoBase64 !== null;
    const mediaHTML = isPhotoItem 
      ? `<img src="${item.customization.photoBase64}" alt="${item.title}">`
      : `<i class="fas fa-birthday-cake"></i>`;
      
    row.innerHTML = `
      <button class="cart-item-remove" onclick="removeFromCart('${item.cartId}')" aria-label="Remove item">
        <i class="fas fa-trash-alt"></i>
      </button>
      <div class="cart-item-media">
        ${mediaHTML}
      </div>
      <div class="cart-item-details">
        <h4 class="cart-item-title">${item.title}</h4>
        <div class="cart-item-meta">
          <span class="cart-item-meta-item">${item.variantTitle}</span>
          <span class="cart-item-meta-item">${item.customization.eggless ? 'Eggless' : 'Regular'}</span>
        </div>
        
        <!-- Customize summary bubble -->
        ${(item.customization.messageOnCake !== 'None' || item.customization.cardMessage !== 'None') ? `
          <div class="cart-item-customize-summary">
            ${item.customization.messageOnCake !== 'None' ? `<div>Message: "${item.customization.messageOnCake}"</div>` : ''}
            ${item.customization.cardMessage !== 'None' ? `<div>Card Note: "${item.customization.cardMessage}"</div>` : ''}
          </div>
        ` : ''}
        
        <div class="cart-item-bottom">
          <div class="quantity-controls">
            <button class="qty-btn" onclick="changeCartQty('${item.cartId}', -1)"><i class="fas fa-minus"></i></button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" onclick="changeCartQty('${item.cartId}', 1)"><i class="fas fa-plus"></i></button>
          </div>
          <span class="cart-item-price">₹${item.price * item.quantity}</span>
        </div>
      </div>
    `;
    container.appendChild(row);
  });
  
  if (subtotalVal) subtotalVal.innerText = `₹${subtotal}`;
  if (totalVal) totalVal.innerText = `₹${subtotal}`;
}

function updateCartBadge() {
  const counts = document.querySelectorAll(".cart-count");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  counts.forEach(badge => {
    badge.innerText = totalItems;
    badge.style.display = totalItems === 0 ? "none" : "flex";
  });
}

function saveCartToStorage() {
  localStorage.setItem("bloomncreme_cart", JSON.stringify(cart));
}

function loadCartFromStorage() {
  const stored = localStorage.getItem("bloomncreme_cart");
  if (stored) {
    try {
      cart = JSON.parse(stored);
    } catch (e) {
      cart = [];
    }
  }
}

// --- Cart Drawer Triggering ---
window.openCartDrawer = function() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-drawer-overlay");
  if (drawer && overlay) {
    drawer.classList.add("active");
    overlay.classList.add("active");
    renderCartItems();
  }
};

window.closeCartDrawer = function() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-drawer-overlay");
  if (drawer && overlay) {
    drawer.classList.remove("active");
    overlay.classList.remove("active");
  }
};

// --- Checkout Modal Procedures ---
window.openCheckoutModal = function() {
  if (cart.length === 0) return;
  closeCartDrawer();
  
  const modal = document.getElementById("checkout-modal");
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

window.closeCheckoutModal = function() {
  const modal = document.getElementById("checkout-modal");
  if (modal) modal.classList.remove("active");
  document.body.style.style = "";
  document.body.removeAttribute("style");
};

// Limit date picker choices (blocks past dates, defaults delivery dates to today onwards)
function initDeliveryDateLimits() {
  const dateInput = document.getElementById("checkout-date");
  if (dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${year}-${month}-${day}`;
    dateInput.value = `${year}-${month}-${day}`;
  }
}

// --- Finalize Purchase & Connect Shopify Checkout ---
window.submitCheckoutForm = function(event) {
  event.preventDefault();
  
  // Validate Form Inputs
  const name = document.getElementById("checkout-name").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const address = document.getElementById("checkout-address").value.trim();
  const pincode = document.getElementById("checkout-pincode").value.trim();
  const date = document.getElementById("checkout-date").value;
  const timeSlot = document.querySelector('input[name="checkout-slot"]:checked')?.value || "Standard Delivery";
  const payment = document.getElementById("checkout-payment").value;
  
  if (!name || !phone || !address || !pincode || !date) {
    alert("Please fill in all the required delivery details.");
    return;
  }
  
  // Validate Pincode is in Chennai
  if (!/^600\d{3}$/.test(pincode)) {
    alert("Pincode Error: Bloom n Creme currently only delivers to Chennai city limits (6-digit pincode starting with 600).");
    return;
  }
  
  const orderMetadata = {
    orderId: mockOrderIdCounter++,
    name,
    phone,
    address: `${address}, Chennai - ${pincode}`,
    pincode,
    date,
    timeSlot,
    payment,
    cartTotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  };
  
  // Branch: Live Shopify integration vs Mock Mode
  if (typeof SHOPIFY_CONFIG !== 'undefined' && !SHOPIFY_CONFIG.useMockMode && shopifyClient) {
    triggerShopifyCheckout(orderMetadata);
  } else {
    triggerMockSuccessCheckout(orderMetadata);
  }
};

// A. Standard Shopify Redirect
function triggerShopifyCheckout(metadata) {
  console.log("Creating secure Shopify Checkout session...");
  
  // Convert cart to Shopify variant format
  const lineItemsToAdd = cart.map(item => {
    const lineItem = {
      variantId: item.variantId,
      quantity: item.quantity,
      customAttributes: [
        { key: "Cake Message", value: item.customization.messageOnCake },
        { key: "Gift Card Message", value: item.customization.cardMessage },
        { key: "Eggless (100% Veg)", value: item.customization.eggless ? "Yes" : "No" }
      ]
    };
    return lineItem;
  });
  
  // Create Checkout Session
  shopifyClient.checkout.create().then((checkout) => {
    const checkoutId = checkout.id;
    
    // Add Cart details
    shopifyClient.checkout.addLineItems(checkoutId, lineItemsToAdd).then((updatedCheckout) => {
      // Add custom slot and delivery info as attributes
      const attributes = {
        customAttributes: [
          { key: "Delivery Date", value: metadata.date },
          { key: "Delivery Slot", value: metadata.timeSlot },
          { key: "Delivery Customer Name", value: metadata.name },
          { key: "Delivery Customer Phone", value: metadata.phone },
          { key: "Chennai Delivery Address", value: metadata.address }
        ]
      };
      
      shopifyClient.checkout.updateAttributes(checkoutId, attributes).then((finalCheckout) => {
        // SUCCESS: Redirect customer securely to Shopify Checkout payment screen!
        console.log("Shopify Session created. Redirecting to payment screen:", finalCheckout.webUrl);
        
        // Empty local storage cart
        cart = [];
        saveCartToStorage();
        updateCartBadge();
        closeCheckoutModal();
        
        window.location.href = finalCheckout.webUrl;
      });
    });
  }).catch(err => {
    console.error("Error creating Shopify session, falling back to instant WhatsApp Checkout simulation.", err);
    triggerMockSuccessCheckout(metadata);
  });
}

// B. Mock success flow (Simulated success + UPI invoice)
let pendingWhatsAppMessage = "";

function triggerMockSuccessCheckout(metadata) {
  closeCheckoutModal();
  
  // Elements
  const modal = document.getElementById("success-modal");
  const textInfo = document.getElementById("success-order-info");
  const upiBox = document.getElementById("success-upi-box");
  
  if (!modal || !textInfo) return;
  
  // Toggle UPI instructions display
  if (metadata.payment === "UPI") {
    if (upiBox) upiBox.style.style = "block";
    if (upiBox) upiBox.removeAttribute("style");
  } else {
    if (upiBox) upiBox.style.display = "none";
  }
  
  // Compile summary of items
  let itemsSummaryList = "";
  cart.forEach(item => {
    itemsSummaryList += `<li><strong>${item.quantity}x ${item.title}</strong> (${item.variantTitle}) - ₹${item.price * item.quantity}</li>`;
  });
  
  // Compile modal body text
  textInfo.innerHTML = `
    <div style="text-align: left; background-color: var(--color-white); border-radius: var(--border-radius-sm); padding: 20px; border: 1px dashed var(--color-sage-medium); margin-bottom: 20px;">
      <p style="margin-bottom: 8px;"><strong>Order ID:</strong> #BC-${metadata.orderId}</p>
      <p style="margin-bottom: 8px;"><strong>Customer Name:</strong> ${metadata.name}</p>
      <p style="margin-bottom: 8px;"><strong>Delivery Date & Time Slot:</strong> ${metadata.date} (${metadata.timeSlot})</p>
      <p style="margin-bottom: 12px;"><strong>Delivery Address:</strong> ${metadata.address}</p>
      <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.08); margin-bottom: 12px;">
      <ul style="padding-left: 20px; font-size: 13px; line-height: 1.6;">
        ${itemsSummaryList}
      </ul>
      <hr style="border: 0; border-top: 1px dashed rgba(0,0,0,0.08); margin: 12px 0;">
      <p style="font-size: 18px; color: var(--color-forest-green); font-weight: 800; text-align: right;">Total Paid: ₹${metadata.cartTotal}</p>
    </div>
  `;
  
  // Compile structured WhatsApp text block
  let textTemplate = `*Bloom n Creme - Cake Order*\n`;
  textTemplate += `-----------------------------------------\n`;
  textTemplate += `*Order ID:* #BC-${metadata.orderId}\n`;
  textTemplate += `*Customer Name:* ${metadata.name}\n`;
  textTemplate += `*Contact Number:* ${metadata.phone}\n`;
  textTemplate += `*Delivery Address:* ${metadata.address}\n`;
  textTemplate += `*Delivery Date:* ${metadata.date}\n`;
  textTemplate += `*Time Slot:* ${metadata.timeSlot}\n`;
  textTemplate += `-----------------------------------------\n`;
  textTemplate += `*Cake Selections:*\n`;
  
  cart.forEach(item => {
    textTemplate += `• *${item.quantity}x ${item.title}*\n`;
    textTemplate += `  - Size/Weight: ${item.variantTitle}\n`;
    textTemplate += `  - Veg/Eggless: ${item.customization.eggless ? '100% Vegetarian (Eggless)' : 'Regular'}\n`;
    if (item.customization.messageOnCake !== 'None') {
      textTemplate += `  - Message on Cake: "${item.customization.messageOnCake}"\n`;
    }
    if (item.customization.cardMessage !== 'None') {
      textTemplate += `  - Card Note: "${item.customization.cardMessage}"\n`;
    }
    textTemplate += `  - Amount: ₹${item.price * item.quantity}\n`;
  });
  
  textTemplate += `-----------------------------------------\n`;
  textTemplate += `*Payment Option:* ${metadata.payment}\n`;
  textTemplate += `*Grand Total:* ₹${metadata.cartTotal}\n`;
  textTemplate += `-----------------------------------------\n`;
  textTemplate += `_Receipt generated dynamically from Bloom n Creme Storefront._`;
  
  pendingWhatsAppMessage = encodeURIComponent(textTemplate);
  
  // Empty local cart
  cart = [];
  saveCartToStorage();
  updateCartBadge();
  
  // Open modal
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// Redirect Customer to WhatsApp chat with owner numbers
window.redirectOrderToWhatsApp = function() {
  const number = "7010316035"; // Primary number
  const waUrl = `https://wa.me/91${number}?text=${pendingWhatsAppMessage}`;
  window.open(waUrl, "_blank");
  
  // Close success screen
  const successModal = document.getElementById("success-modal");
  if (successModal) successModal.classList.remove("active");
  document.body.style.style = "";
  document.body.removeAttribute("style");
};

// --- Core Helper Listeners ---
function setupEventListeners() {
  // Sticky scroll navbar animation
  window.addEventListener("scroll", () => {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
  
  // Close Modals on Outer Overlay Click
  const modals = document.querySelectorAll(".modal-overlay");
  modals.forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
        document.body.style.style = "";
        document.body.removeAttribute("style");
      }
    });
  });
  
  const drawerOverlay = document.getElementById("cart-drawer-overlay");
  if (drawerOverlay) {
    drawerOverlay.addEventListener("click", () => {
      closeCartDrawer();
    });
  }

  // 3D Hover Tilt Animation on Hero Image Wrapper
  const heroMedia = document.querySelector('.hero-image-wrapper');
  const heroImg = document.querySelector('.hero-banner-image');
  if (heroMedia && heroImg) {
    heroMedia.addEventListener('mousemove', (e) => {
      const rect = heroMedia.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      
      const dx = x - xc;
      const dy = y - yc;
      
      // Calculate rotation angles (max 10 degrees)
      const rotateX = -(dy / yc) * 10;
      const rotateY = (dx / xc) * 10;
      
      heroImg.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
    });
    
    heroMedia.addEventListener('mouseleave', () => {
      heroImg.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  }
}

// --- Toggle Full Catalog View Expander ---
window.toggleCatalogView = function() {
  showFullCatalog = !showFullCatalog;
  const expandBtn = document.getElementById("catalog-expand-btn");
  const filterSection = document.getElementById("catalog-advanced-controls");
  
  if (showFullCatalog) {
    if (expandBtn) expandBtn.innerHTML = `Show Curated Highlights <i class="fas fa-chevron-up"></i>`;
    if (filterSection) filterSection.classList.add("active");
  } else {
    if (expandBtn) expandBtn.innerHTML = `Explore Whole Collection (30+ Cakes) <i class="fas fa-chevron-down"></i>`;
    if (filterSection) filterSection.classList.remove("active");
    activeCategory = 'all';
    const firstFilterBtn = document.querySelector(".filter-btn");
    if (firstFilterBtn) {
      document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
      firstFilterBtn.classList.add("active");
    }
  }
  
  renderProducts();
  
  // Smooth scroll down to grid if opening
  if (showFullCatalog) {
    const grid = document.getElementById("catalog");
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

// --- Live search search field controller ---
window.triggerCatalogSearch = function() {
  renderProducts();
};

// --- Render New Collection Snap Carousel ---
function renderNewCollections() {
  const container = document.getElementById("new-collections-carousel");
  if (!container) return;
  
  container.innerHTML = "";
  const newCakes = MOCK_PRODUCTS.filter(p => p.isNew === true);
  
  newCakes.forEach(product => {
    const card = document.createElement("div");
    card.className = "carousel-card";
    
    // Check if it's Bento (Single size) or classic (variants list)
    const isBento = product.category === 'bento';
    const priceDisplay = isBento 
      ? `₹${product.basePrice}` 
      : `₹${product.variants[0].price}`;
      
    card.innerHTML = `
      <div class="carousel-card-badge"><i class="fas fa-sparkles"></i> New Arrival</div>
      <div class="carousel-card-media" style="background: ${product.bgColor || 'var(--color-rose-light)'};">
        ${product.image ? `<img src="${product.image}" alt="${product.title}" class="carousel-img">` : `<i class="fas fa-seedling"></i>`}
      </div>
      <div class="carousel-card-body">
        <h3>${product.title}</h3>
        <p>${product.description}</p>
        <div class="carousel-card-footer">
          <span class="carousel-card-price">${priceDisplay}</span>
          <button class="btn btn-primary carousel-card-btn" onclick="openCustomization('${product.id}')">
            Quick Add <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- Interactive Cake Matcher Personalizer ---
function initPersonalizer() {
  // Bind match trigger button
  const form = document.getElementById("matcher-quiz-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      runFlavorMatcher();
    });
  }
}

function runFlavorMatcher() {
  const occasion = document.getElementById("matcher-occasion")?.value || "any";
  const vibe = document.getElementById("matcher-vibe")?.value || "any";
  const audience = document.getElementById("matcher-audience")?.value || "any";
  
  const resultsContainer = document.getElementById("matcher-results-box");
  const grid = document.getElementById("matcher-results-grid");
  
  if (!resultsContainer || !grid) return;
  
  // Scoring algorithm based on matching attributes
  const scored = MOCK_PRODUCTS.map(product => {
    let score = 50; // base score
    const desc = product.description.toLowerCase();
    const title = product.title.toLowerCase();
    const category = product.category.toLowerCase();
    
    // VIBE SCORE
    if (vibe === "chocolatey") {
      if (title.includes("choco") || title.includes("truffle") || title.includes("kitkat") || title.includes("oreo")) {
        score += 30;
      }
    } else if (vibe === "fruity") {
      if (title.includes("blueberry") || title.includes("strawberry") || title.includes("mango") || title.includes("pineapple") || title.includes("blackcurrant")) {
        score += 30;
      }
    } else if (vibe === "traditional") {
      if (title.includes("rasamalai") || title.includes("gulab jamun") || title.includes("saffron")) {
        score += 35;
      }
    } else if (vibe === "creamy") {
      if (title.includes("vanilla") || title.includes("butterscotch") || title.includes("white forest")) {
        score += 25;
      }
    }
    
    // OCCASION SCORE
    if (occasion === "birthday") {
      if (category === "bento") score += 10; // Bento cakes are great for modern birthdays
      if (title.includes("truffle") || title.includes("photo")) score += 15;
    } else if (occasion === "anniversary") {
      if (title.includes("rose") || title.includes("velvet") || title.includes("floral")) {
        score += 25;
      }
    } else if (occasion === "midnight") {
      if (category === "bento") score += 20; // Bento cakes fit tiny midnight celebrations perfectly!
      if (title.includes("truffle") || title.includes("biscoff")) score += 15;
    }
    
    // AUDIENCE SCORE
    if (audience === "partner") {
      if (title.includes("rose") || title.includes("velvet") || title.includes("strawberry")) {
        score += 20;
      }
    } else if (audience === "kids") {
      if (title.includes("oreo") || title.includes("kitkat") || title.includes("gems")) {
        score += 25;
      }
    } else if (audience === "parents") {
      if (title.includes("rasamalai") || title.includes("vanilla") || title.includes("saffron") || title.includes("almond")) {
        score += 20;
      }
    }
    
    // Add a tiny random factor to make results feel fresh and dynamic!
    score += Math.floor(Math.random() * 8);
    
    // Cap at 99% for professional aesthetics
    if (score > 99) score = 99;
    
    return { product, score };
  });
  
  // Sort descending and slice Top 3
  scored.sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);
  
  grid.innerHTML = "";
  top3.forEach(item => {
    const prod = item.product;
    const card = document.createElement("div");
    card.className = "matched-card reveal-on-scroll";
    
    const isBento = prod.category === 'bento';
    const price = isBento ? prod.basePrice : prod.variants[0].price;
    
    let mediaHTML = '';
    if (prod.image) {
      mediaHTML = `<img src="${prod.image}" alt="${prod.title}" class="matched-img">`;
    } else {
      const gradient = prod.bgColor || 'linear-gradient(135deg, var(--color-rose-light), var(--color-white))';
      mediaHTML = `
        <div class="matched-image-placeholder" style="background: ${gradient};">
          <i class="fas fa-cookie-bite" style="color: var(--color-soft-rose); font-size:24px;"></i>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="matched-score-badge"><i class="fas fa-heart"></i> ${item.score}% Match</div>
      <div class="matched-card-media">
        ${mediaHTML}
      </div>
      <div class="matched-card-details">
        <h4>${prod.title}</h4>
        <p>${prod.description}</p>
        <div class="matched-card-footer">
          <span class="matched-card-price">₹${price}</span>
          <button class="btn btn-primary matched-card-btn" onclick="openCustomization('${prod.id}')">
            Customize Match <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  // Display container and scroll down gently
  resultsContainer.style.display = "block";
  resultsContainer.classList.add("active");
  
  // Trigger animations
  if (window.observeScrollTriggers) {
    window.observeScrollTriggers();
  }
  
  resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Virtual Cake Icing Canvas Renderer ---
function drawCakeIcing(text = "") {
  const canvas = document.getElementById("icing-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  
  // Clear
  ctx.clearRect(0, 0, w, h);
  
  // Base Cake Color & Styling depending on flavor theme
  let frostingColor = "#FFFDF5"; // soft cream
  let textColor = "#D48C8C"; // soft rose text
  let rimDecorColor = "#C8DCD0"; // sage rim
  
  if (currentCustomizingProduct) {
    const title = currentCustomizingProduct.title.toLowerCase();
    if (title.includes("choco") || title.includes("truffle") || title.includes("kitkat") || title.includes("oreo") || title.includes("biscoff")) {
      frostingColor = "#3d2314"; // chocolate cake
      textColor = "#FFFBF0"; // cream white lettering
      rimDecorColor = "#5C3E21";
    } else if (title.includes("red velvet")) {
      frostingColor = "#FFFDF9"; // cream cheese frosting
      textColor = "#9C1B2F"; // red script writing
      rimDecorColor = "#E57373";
    } else if (title.includes("blue") || title.includes("blackcurrant") || title.includes("lavender")) {
      frostingColor = "#F9F5FF"; // lavender pastel
      textColor = "#4A148C"; // royal violet lettering
      rimDecorColor = "#C39BD3";
    } else if (title.includes("mango") || title.includes("pineapple") || title.includes("saffron") || title.includes("butterscotch")) {
      frostingColor = "#FFFDF0"; // butter-yellow frosting
      textColor = "#D84315"; // golden-red script
      rimDecorColor = "#F4D03F";
    } else if (title.includes("rose")) {
      frostingColor = "#FFF2F2"; // rose pink frosting
      textColor = "#C2185B"; // deep rose text
      rimDecorColor = "#F8BBD0";
    }
  }
  
  // Draw Base Shadow
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 + 10, w / 2 - 20, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(30, 63, 48, 0.06)";
  ctx.fill();
  
  // Draw Frosting Top Face
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 22, 0, Math.PI * 2);
  ctx.fillStyle = frostingColor;
  ctx.fill();
  
  // Highlight glow on cake edge
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 22, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Draw Piped Cream Rim Decor border
  ctx.lineWidth = 5;
  ctx.strokeStyle = rimDecorColor;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 25, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw small piped cream drops
  ctx.fillStyle = rimDecorColor;
  for (let i = 0; i < 18; i++) {
    const angle = (i * Math.PI * 2) / 18;
    const r = w / 2 - 25;
    const dx = w / 2 + Math.cos(angle) * r;
    const dy = h / 2 + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.arc(dx, dy, 5, 0, Math.PI * 2);
    ctx.fill();
    // Inner white highlight
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(dx - 1, dy - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rimDecorColor;
  }
  
  // Write Icing Custom Text
  ctx.fillStyle = textColor;
  // Use a gorgeous cursive font style if available, falls back to italic serif Georgia
  ctx.font = "italic bold 17px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  if (text.length > 0) {
    // Letter drop shadow to simulate thick icing cream depth
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;
    
    // Wrap to two lines if needed
    if (text.length > 15) {
      const mid = text.lastIndexOf(" ", 15) || 15;
      const line1 = text.substring(0, mid).trim();
      const line2 = text.substring(mid).trim();
      ctx.fillText(line1, w / 2, h / 2 - 12);
      ctx.fillText(line2, w / 2, h / 2 + 12);
    } else {
      ctx.fillText(text, w / 2, h / 2);
    }
    
    // Reset shadow values
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } else {
    // Default placeholder
    ctx.fillStyle = "rgba(30, 63, 48, 0.2)";
    ctx.font = "bold 9px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("TYPE MESSAGE BELOW", w / 2, h / 2);
  }
}

// --- Link message inputs to live canvas updates ---
function setupRealtimeIcing() {
  const input = document.getElementById("cake-custom-message");
  if (input) {
    input.addEventListener("input", (e) => {
      drawCakeIcing(e.target.value.trim().toUpperCase());
    });
  }
}

// --- Professional SVG Hamburger morphing Menu Drawer controls ---
function setupHamburgerMenu() {
  const toggleBtn = document.getElementById("menu-drawer-toggle");
  const closeBtn = document.getElementById("menu-drawer-close");
  const drawer = document.getElementById("menu-drawer");
  const overlay = document.getElementById("menu-drawer-overlay");
  
  if (!toggleBtn || !drawer || !overlay) return;
  
  const openMenu = () => {
    drawer.classList.add("active");
    overlay.classList.add("active");
    toggleBtn.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  
  const closeMenu = () => {
    drawer.classList.remove("active");
    overlay.classList.remove("active");
    toggleBtn.classList.remove("open");
    document.body.style.style = "";
    document.body.removeAttribute("style");
  };
  
  toggleBtn.addEventListener("click", () => {
    if (drawer.classList.contains("active")) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);
  
  // Close menu drawer if any links are clicked
  const drawerLinks = drawer.querySelectorAll(".drawer-nav-link");
  drawerLinks.forEach(link => {
    link.addEventListener("click", closeMenu);
  });
}

// --- Scroll reveals IntersectionObserver system ---
function setupIntersectionObserver() {
  // Define observing reveal elements
  window.observeScrollTriggers = function() {
    const elements = document.querySelectorAll(".reveal-on-scroll");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target); // trigger animation only once
        }
      });
    }, {
      root: null,
      threshold: 0.1, // trigger when 10% visible
      rootMargin: "0px 0px -40px 0px"
    });
    
    elements.forEach(el => observer.observe(el));
  };
  
  // Run
  window.observeScrollTriggers();
  
  // Elegant trailing cursor micro-interaction on desktop
  if (window.innerWidth > 992) {
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor-trail";
    document.body.appendChild(cursor);
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    
    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    
    // Inertia animation ticks
    const tick = () => {
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      
      cursorX += dx * 0.15;
      cursorY += dy * 0.15;
      
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      
      requestAnimationFrame(tick);
    };
    
    tick();
    
    // Expand cursor when hovering over interactive elements
    const links = document.querySelectorAll("a, button, .filter-btn, .segment-label, .product-add-btn");
    links.forEach(el => {
      el.addEventListener("mouseenter", () => cursor.classList.add("expand"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("expand"));
    });
  }
}

