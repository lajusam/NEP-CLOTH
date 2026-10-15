import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

type AccessoryEntry = {
  key: string;
  name: string;
  category: string;
  section: string;
  priceNPR: number | null;
  images: string[];
  description: string;
  variants: Array<{ size: string; color: string; stock: number | null }>;
};

const prisma = new PrismaClient();
const templateUrl = new URL("./accessories.template.json", import.meta.url);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getSkipReasons(value: unknown): string[] {
  if (!value || typeof value !== "object") return ["entry is not an object"];

  const entry = value as Partial<AccessoryEntry>;
  const reasons: string[] = [];

  if (typeof entry.key !== "string" || !entry.key.trim()) reasons.push("key is missing");
  if (typeof entry.name !== "string" || !entry.name.trim()) reasons.push("name is missing");
  if (entry.section !== "men" && entry.section !== "women") reasons.push("section must be men or women");
  if (!Number.isFinite(entry.priceNPR) || (entry.priceNPR ?? 0) <= 0) reasons.push("priceNPR must be greater than 0");
  if (entry.category !== "caps" && entry.category !== "bags") reasons.push("category must be caps or bags");
  if (!Array.isArray(entry.images) || entry.images.length === 0 || entry.images.some((image) => typeof image !== "string" || !image.trim())) {
    reasons.push("at least one image path is required");
  }
  if (!Array.isArray(entry.variants) || entry.variants.length === 0) {
    reasons.push("at least one variant is required");
  } else if (entry.variants.some((variant) => !variant || typeof variant.size !== "string" || !variant.size.trim() || !Number.isInteger(variant.stock) || (variant.stock ?? -1) < 0)) {
    reasons.push("every variant needs a size and a non-negative integer stock value");
  }

  return reasons;
}

async function getSafeSlug(entry: AccessoryEntry): Promise<string> {
  const base = `${slugify(entry.name) || "accessory"}-${slugify(entry.key) || "item"}`;

  for (let suffix = 1; ; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { category: true, images: true },
    });

    if (!existing) return candidate;
    if (existing.category === entry.category && existing.images[0] === entry.images[0]) return candidate;
  }
}

async function main(): Promise<void> {
  const template = JSON.parse(await readFile(templateUrl, "utf8")) as unknown;
  if (!Array.isArray(template)) throw new Error("Accessory template must be a JSON array.");

  const ready: AccessoryEntry[] = [];
  for (const value of template) {
    const reasons = getSkipReasons(value);
    if (reasons.length) {
      const key = value && typeof value === "object" && "key" in value ? String(value.key) : "(unknown key)";
      console.log(`Skipped ${key}: ${reasons.join("; ")}`);
    } else {
      ready.push(value as AccessoryEntry);
    }
  }

  let imported = 0;
  for (const entry of ready) {
    const slug = await getSafeSlug(entry);
    const productData = {
      name: entry.name.trim(),
      description: entry.description ?? "",
      section: entry.section,
      category: entry.category,
      price: Math.round((entry.priceNPR as number) * 100),
      images: entry.images,
      active: true,
    };
    const variants = entry.variants.map(({ size, color, stock }) => ({ size, color, stock: stock as number }));

    await prisma.product.upsert({
      where: { slug },
      create: { ...productData, slug, variants: { create: variants } },
      update: { ...productData, variants: { deleteMany: {}, create: variants } },
    });
    imported += 1;
    console.log(`Imported ${entry.key} as ${slug}`);
  }

  console.log(`Accessories seed complete: ${imported} imported, ${template.length - imported} skipped.`);
}

main()
  .catch(() => {
    console.error("Accessories seed failed. Check the database connection and template format.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
