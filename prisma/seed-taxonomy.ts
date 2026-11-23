/** Category structure and original editorial introductions for each section. */

export interface SeedCategory {
  slug: string;
  name: string;
  navLabel?: string;
  description: string;
  intro?: string;
  seoTitle?: string;
  metaDescription?: string;
  children?: { slug: string; name: string; description: string }[];
}

export const TAXONOMY: SeedCategory[] = [
  {
    slug: "fashion",
    name: "Fashion",
    description: "Trends worth knowing, the ones worth skipping, and how to build a wardrobe that outlasts both.",
    intro:
      "Fashion coverage at Gloss & Thread starts from a simple question: will this still feel right in your closet next year? We look at what's changing on runways and sidewalks, then translate it into choices you can actually make with the clothes you own.\n\nExpect seasonal trend analysis, capsule wardrobe planning and practical guides to fit, fabric and proportion.",
    seoTitle: "Fashion Trends, Street Style & Wardrobe Guides",
    metaDescription: "Seasonal fashion trends, street style notes, capsule wardrobe plans and practical guides to fit and fabric from the Gloss & Thread editors.",
    children: [
      { slug: "latest-trends", name: "Latest Trends", description: "What's new this season, and how to try it without overhauling your wardrobe." },
      { slug: "seasonal-trends", name: "Seasonal Trends", description: "Season-by-season analysis of the shapes, colors and fabrics shaping how we dress." },
      { slug: "street-style", name: "Street Style", description: "Ideas drawn from how people actually dress, translated into outfits you can recreate." },
      { slug: "capsule-wardrobes", name: "Capsule Wardrobes", description: "Small, hard-working wardrobes planned around your real week." },
      { slug: "fashion-guides", name: "Fashion Guides", description: "Fit, fabric and proportion explained clearly." },
    ],
  },
  {
    slug: "outfits",
    name: "Outfits",
    description: "Complete looks for work, weekends, weddings and everything in between.",
    intro:
      "Outfit guides are where style advice gets specific. Each one starts with the occasion — an office with a loose dress code, a cocktail-attire wedding, a long weekend away — and works through what to wear, what to skip and how to adjust for your climate and budget.\n\nWe favor repeatable formulas over one-off looks, so a single guide can carry you through many mornings.",
    seoTitle: "Outfit Ideas for Work, Weekends & Weddings",
    metaDescription: "Outfit ideas and repeatable formulas for the office, casual weekends, wedding guests, vacations and every season.",
    children: [
      { slug: "casual-outfits", name: "Casual Outfits", description: "Easy, put-together looks for days off." },
      { slug: "work-outfits", name: "Work Outfits", description: "Office looks for every kind of dress code." },
      { slug: "wedding-guest-outfits", name: "Wedding Guest Outfits", description: "What to wear for every wedding dress code." },
      { slug: "vacation-outfits", name: "Vacation Outfits", description: "Packable outfits for city breaks and beach trips." },
      { slug: "seasonal-outfits", name: "Seasonal Outfits", description: "Dressing for the weather without losing the outfit." },
      { slug: "outfit-inspiration", name: "Outfit Inspiration", description: "Ideas and color combinations to get you out of a rut." },
    ],
  },
  {
    slug: "nails",
    name: "Nails",
    description: "Nail shapes, designs, colors and care — with ideas for every length.",
    intro:
      "Our nail coverage is built for the appointment and the at-home manicure alike. Shape guides explain which looks suit shorter or longer nail beds, design galleries collect ideas you can show your technician, and color guides help you choose shades for the season and your skin tone.\n\nWe also cover the less glamorous part — care routines that keep nails healthy between manicures.",
    seoTitle: "Nail Ideas, Designs, Shapes & Nail Care",
    metaDescription: "Nail design ideas, shape guides for almond and short nails, French manicure inspiration, seasonal nail colors and practical nail care.",
    children: [
      { slug: "nail-designs", name: "Nail Designs", description: "Design ideas to bring to your next appointment." },
      { slug: "short-nails", name: "Short Nails", description: "Ideas that look polished on shorter lengths." },
      { slug: "almond-nails", name: "Almond Nails", description: "The tapered, rounded shape — and how to wear it." },
      { slug: "french-manicure", name: "French Manicures", description: "Classic, micro and color-tip French manicures." },
      { slug: "seasonal-nails", name: "Seasonal Nail Ideas", description: "Nail ideas for every season and holiday." },
      { slug: "nail-colors", name: "Nail Colors", description: "How to choose shades that work for you." },
      { slug: "nail-care", name: "Nail Care", description: "Routines for stronger, healthier nails." },
    ],
  },
  {
    slug: "shoes",
    name: "Shoes",
    description: "Sneakers, flats, heels, boots and loafers — how to choose them and how to wear them.",
    intro:
      "Shoes change an outfit more than almost anything else, so our shoe guides focus on two things: choosing a pair that fits your life, and styling it in more ways than you expected.\n\nYou'll find fit advice, care tips and outfit ideas for each silhouette, from everyday sneakers to knee-high boots.",
    seoTitle: "Shoe Guides: Sneakers, Flats, Boots, Heels & Loafers",
    metaDescription: "How to choose and style sneakers, ballet flats, heels, boots and loafers, with fit and care advice from the Gloss & Thread editors.",
    children: [
      { slug: "sneakers", name: "Sneakers", description: "Everyday sneakers and how to wear them." },
      { slug: "flats", name: "Flats", description: "Ballet flats, mules and other flat shoes." },
      { slug: "heels", name: "Heels", description: "Heels you can actually walk in." },
      { slug: "boots", name: "Boots", description: "Ankle, knee-high and everything between." },
      { slug: "loafers", name: "Loafers", description: "The loafer, styled every way." },
      { slug: "shoe-styling", name: "Shoe Styling", description: "Pairing shoes with hemlines, trousers and occasions." },
    ],
  },
  {
    slug: "beauty",
    name: "Beauty",
    description: "Makeup, skincare basics and beauty trends, explained without the hype.",
    intro:
      "Beauty coverage at Gloss & Thread aims to be clear rather than breathless. We explain techniques step by step, describe what product categories are designed to do, and are careful about claims — when something touches on skin health, we point you to a board-certified dermatologist.",
    children: [
      { slug: "makeup", name: "Makeup", description: "Techniques and looks, step by step." },
      { slug: "skincare-basics", name: "Skincare Basics", description: "Simple routines and what each step is for." },
      { slug: "beauty-trends", name: "Beauty Trends", description: "What's changing in beauty, in plain language." },
      { slug: "product-guides", name: "Product Guides", description: "How to choose within a product category." },
    ],
  },
  {
    slug: "hairstyles",
    name: "Hairstyles",
    description: "Haircuts and hairstyles for short, medium and long hair.",
    intro:
      "Hair guides that help you have a better conversation with your stylist: what a cut is called, how it behaves in different textures, and how much styling it really needs.",
    children: [
      { slug: "short-hairstyles", name: "Short Hairstyles", description: "Bobs, pixies and short cuts." },
      { slug: "medium-hairstyles", name: "Medium Hairstyles", description: "Shoulder-length cuts and styles." },
      { slug: "long-hairstyles", name: "Long Hairstyles", description: "Long cuts, layers and styling ideas." },
      { slug: "haircut-ideas", name: "Haircut Ideas", description: "Cuts to bring to your next appointment." },
      { slug: "hair-styling", name: "Hair Styling", description: "Styling techniques you can do at home." },
    ],
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Handbags, jewelry, sunglasses and watches that finish an outfit.",
    intro:
      "Accessories are where a wardrobe gets personal. Our guides cover how to choose pieces that last — construction, proportions and materials — and how to wear them with what you already own.",
    children: [
      { slug: "handbags", name: "Handbags", description: "Choosing and caring for bags that last." },
      { slug: "jewelry", name: "Jewelry", description: "Everyday jewelry and how to layer it." },
      { slug: "sunglasses", name: "Sunglasses", description: "Frames for your face shape and style." },
      { slug: "watches", name: "Watches", description: "Watches as an everyday accessory." },
      { slug: "styling-accessories", name: "Styling Accessories", description: "Belts, scarves and finishing touches." },
    ],
  },
];
