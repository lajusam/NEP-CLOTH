// Seed script — populates the database with products from the frontend
// Run with: npm run seed
// Safe to re-run: uses upsert to avoid duplicates

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// --- Helper: turn a product name into a URL-friendly slug ---
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // remove special chars (emojis, accents, etc.)
    .replace(/\s+/g, "-")     // spaces → hyphens
    .replace(/-+/g, "-")      // collapse multiple hyphens
    .replace(/^-|-$/g, "");   // trim leading/trailing hyphens
}

// --- Helper: parse "NPR 8,500" → 850000 (paisa) ---
function priceToPaisa(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9]/g, ""); // strip everything except digits
  return parseInt(cleaned, 10) * 100;               // rupees → paisa
}

// --- Helper: guess category from product name (same logic as frontend's ProductGrid) ---
function guessCategory(name: string): string {
  const upper = name.toUpperCase();
  if (["PUFFER", "JACKET", "COAT", "CLOAK", "BLAZER", "BOMBER", "OVERSHIRT"].some((t) => upper.includes(t))) return "outerwear";
  if (["TOP", "VEST", "TURTLENECK", "SWEATER", "KURTA", "KNIT", "TEE", "SHIRT", "HOODIE", "FLEECE", "CREW"].some((t) => upper.includes(t))) return "tops";
  if (["CARGO", "TROUSERS", "PANTS", "JEANS", "SHORTS", "SKIRT"].some((t) => upper.includes(t))) return "bottoms";
  if (["BOOT", "FOOTWEAR", "SHOES"].some((t) => upper.includes(t))) return "footwear";
  if (["SCARF", "CUFF", "BAG"].some((t) => upper.includes(t))) return "accessories";
  return "tops"; // default fallback (same as frontend)
}

// --- The hardcoded products from the frontend ---
// Images array convention:
// images[0] = main product image
// images[1] = model image (optional)
const products = [
  // ========== MEN ==========
  {
    name: "Blue Striped Shirt with Clean Summer Vibes",
    price: "NPR 8,500",
    image: "/images/Blue Striped Shirt with Clean Summer Vibes.jpg",
    modelImage: "/images/men1.jpg",
    description: "A crisp blue striped shirt that captures effortless summer style. Lightweight cotton fabric with vertical stripes, relaxed fit, and clean lines — perfect for casual outings and sun-drenched days.",
    section: "men",
  },
  {
    name: "Dark Punk Stehkragen Patchwork Jacket",
    price: "NPR 22,000",
    image: "/images/Dark Punk Stehkragen Patchwork Jacketjpg.jpg",
    modelImage: "/images/men2.jpg",
    description: "An edgy patchwork jacket featuring a bold stand-up collar and punk-inspired design. Mixed fabric panels create a unique textured look — a statement outerwear piece for those who dare to stand out.",
    section: "men",
  },
  {
    name: "Retro 80s Stripe Polo Long Sleeve Style",
    price: "NPR 9,800",
    image: "/images/Retro 80s Stripe PoloLong Sleeve Style.jpg",
    modelImage: "/images/men3.jpg",
    description: "A nostalgic long-sleeve polo with vibrant 80s-inspired stripe patterns. Ribbed collar and cuffs with a comfortable relaxed fit — bringing retro energy to modern streetwear.",
    section: "men",
  },
  {
    name: "Men's Short-Sleeve Cropped Workwear Graphic Button-Up Shirt",
    price: "NPR 7,500",
    image: "/images/Men's Short-Sleeve Cropped Workwear Graphic Button-Up Shirt.jpg",
    modelImage: null,
    description: "A cropped workwear-inspired button-up with bold graphic detailing. Short sleeves and a boxy cropped silhouette give it a contemporary edge — utility meets street style.",
    section: "men",
  },
  {
    name: "Ribbed Collar Cropped Bomber Flight Jacket (Subversive & Archive)",
    price: "NPR 28,000",
    image: "/images/Ribbed Collar Cropped Bomber Flight Jacket (Subversive & Archive).jpg",
    modelImage: null,
    description: "A subversive take on the classic flight jacket with a cropped cut and ribbed collar details. Archive-inspired design with premium construction — the ultimate layering piece for elevated streetwear.",
    section: "men",
  },
  {
    name: "Aelfric Eden Mens Wide Leg Sweatpants",
    price: "NPR 12,500",
    image: "/images/Aelfric Eden Mens Wide Leg Sweatpants.jpg",
    modelImage: null,
    description: "Relaxed wide-leg sweatpants with a comfortable elastic waist and roomy silhouette. Soft heavyweight fleece with a streetwear-forward cut — where comfort meets effortless style.",
    section: "men",
  },
  {
    name: "Ballon-Washed Jeans",
    price: "NPR 18,000",
    image: "/images/ballon-washed jenas.jpg",
    modelImage: null,
    description: "Statement balloon-washed jeans with a distinctive faded finish and relaxed wide-leg cut. The unique wash technique gives each pair its own character — bold denim for the fashion-forward.",
    section: "men",
  },

  // ========== WOMEN ==========
  {
    name: "Burgundy Crop Top",
    price: "NPR 6,800",
    image: "/images/Burgundy crop top.jpg",
    modelImage: "/images/women1.jpg",
    description: "A sleek burgundy crop top with a rich, deep tone that flatters every skin tone. Minimal design with a snug fit — the perfect pairing for high-waist bottoms and layered looks.",
    section: "women",
  },
  {
    name: "Cropped NIKE",
    price: "NPR 8,500",
    image: "/images/Cropped NIKE.jpg",
    modelImage: "/images/download.jpg",
    description: "A sporty cropped Nike top that blends athletic performance with streetwear style. Bold branding with a relaxed cropped fit — the go-to piece for athleisure enthusiasts.",
    section: "women",
  },
  {
    name: "Dames T-shirt met bloemenprint, raglan korte mouwen, halterhals en 2-in-1 ontwerp",
    price: "NPR 7,500",
    image: "/images/Dames T-shirt met bloemenprint, raglan korte mouwen, halterhals en 2-in-1 ontwerp.jpg",
    modelImage: "/images/0d98c51055dec2371249892908dc4061.jpg",
    description: "A floral print t-shirt featuring a unique 2-in-1 design with raglan short sleeves and a halter neck construction. Feminine and playful — a statement top for summer styling.",
    section: "women",
  },
  {
    name: "Leilani Washed Baggy Jeans",
    price: "NPR 16,000",
    image: "/images/Leilani Washed Baggy Jeansjpg.jpg",
    modelImage: null,
    description: "Effortlessly cool baggy jeans with a washed finish that gives them a perfectly lived-in look. Relaxed silhouette with a high waist — the denim staple for laid-back street style.",
    section: "women",
  },
  {
    name: "Mocha Butterfly Y2K Grunge Outfit 🦋🤎",
    price: "NPR 12,000",
    image: "/images/Mocha Butterfly Y2K Grunge Outfit 🦋🤎.jpg",
    modelImage: null,
    description: "A mocha-toned Y2K grunge outfit adorned with butterfly motifs that capture early 2000s nostalgia. Earthy tones meet rebellious styling — the complete look for vintage fashion lovers.",
    section: "women",
  },
  {
    name: "Vrouwen Grafische Print T-shirt Vintage Harajuku Y2k Tee Top Shoujo Meisje Esthetische Oversize",
    price: "NPR 7,800",
    image: "/images/Vrouwen Grafische Print T-shirt Vintage Harajuku Y2k Tee Top Shoujo Meisje Esthetische Oversize.jpg",
    modelImage: null,
    description: "An oversized graphic print t-shirt blending vintage Harajuku aesthetics with Y2K style. Shoujo-inspired artwork on a relaxed oversized silhouette — where Japanese street culture meets contemporary fashion.",
    section: "women",
  },
  {
    name: "Women Jeans",
    price: "NPR 14,500",
    image: "/images/womean jeans.jpg",
    modelImage: null,
    description: "Classic women's jeans with a timeless fit and versatile wash. Clean lines and a comfortable mid-rise cut — the essential denim for any wardrobe.",
    section: "women",
  },
];

// Sizes and colors to create as variants
// S, M, L, XL, XXL matching frontend ProductPage.
// XXL is created with stock = 0 to represent out-of-stock sizes.
const SIZES = ["S", "M", "L", "XL", "XXL"];
const COLORS = ["black", "white", "charcoal", "cream"];

async function main() {
  console.log("🌱 Seeding database...\n");

  for (const p of products) {
    const slug = slugify(p.name);
    const category = guessCategory(p.name);
    const priceInPaisa = priceToPaisa(p.price);

    // Documented order in images array:
    // images[0] = main product image
    // images[1] = model image (optional)
    const images = [p.image, p.modelImage].filter(Boolean) as string[];

    // Upsert product (safe to re-run — won't create duplicates)
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        description: p.description,
        section: p.section,
        category,
        price: priceInPaisa,
        images,
      },
      create: {
        slug,
        name: p.name,
        description: p.description,
        section: p.section,
        category,
        price: priceInPaisa,
        images,
      },
    });

    // Upsert variants for each size+color combo
    // XXL has stock = 0 (out of stock demo), others have stock = 10
    for (const size of SIZES) {
      for (const color of COLORS) {
        const stock = size === "XXL" ? 0 : 10;
        await prisma.variant.upsert({
          where: {
            productId_size_color: {
              productId: product.id,
              size,
              color,
            },
          },
          update: { stock },
          create: {
            productId: product.id,
            size,
            color,
            stock,
          },
        });
      }
    }

    console.log(`  ✅ ${p.name} → slug: "${slug}", category: "${category}", images: ${images.length}`);
  }

  const totalProducts = await prisma.product.count();
  const totalVariants = await prisma.variant.count();
  console.log(`\n🎉 Seeding complete! Database currently has ${totalProducts} products and ${totalVariants} variants.`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
