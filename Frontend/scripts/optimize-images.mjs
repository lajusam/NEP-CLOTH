import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "public");
const outputDir = path.join(publicDir, "optimized");
const manifestFile = path.join(root, "src", "data", "optimized-images.json");
const widths = [480, 768, 1280, 1920];
const supported = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const manifest = {};

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "optimized") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (supported.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files;
}

const inputs = await walk(publicDir);
const stemCounts = new Map();
for (const input of inputs) {
  const stem = path.join(path.dirname(input), path.basename(input, path.extname(input))).toLowerCase();
  stemCounts.set(stem, (stemCounts.get(stem) || 0) + 1);
}

for (const input of inputs) {
  const relative = path.relative(publicDir, input);
  const url = `/${relative.split(path.sep).join("/")}`;
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height) continue;
  const variants = { webp: [], avif: [] };
  for (const width of widths.filter((size) => size < metadata.width).concat(metadata.width <= 480 ? [metadata.width] : [])) {
    const stem = path.join(path.dirname(input), path.basename(input, path.extname(input))).toLowerCase();
    const extensionSuffix = stemCounts.get(stem) > 1 ? `-${path.extname(input).slice(1).toLowerCase()}` : "";
    const base = `${path.basename(relative, path.extname(relative))}${extensionSuffix}-${width}`;
    const folder = path.join(outputDir, path.dirname(relative));
    await fs.mkdir(folder, { recursive: true });
    const webpPath = path.join(folder, `${base}.webp`);
    try {
      await fs.access(webpPath);
    } catch {
      await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(webpPath);
    }
    variants.webp.push({ src: `/optimized/${path.dirname(relative).split(path.sep).join("/")}/${base}.webp`.replace("//", "/"), width });

    const avifPath = path.join(folder, `${base}.avif`);
    try {
      await fs.access(avifPath);
      variants.avif.push({ src: `/optimized/${path.dirname(relative).split(path.sep).join("/")}/${base}.avif`.replace("//", "/"), width });
    } catch {
      const tempPath = `${avifPath}.tmp`;
      const result = await sharp(input).resize({ width, withoutEnlargement: true }).avif({ quality: 55, effort: 4 }).toFile(tempPath);
      if (result.size < (await fs.stat(webpPath)).size) {
        await fs.rename(tempPath, avifPath);
        variants.avif.push({ src: `/optimized/${path.dirname(relative).split(path.sep).join("/")}/${base}.avif`.replace("//", "/"), width });
      } else await fs.unlink(tempPath);
    }
  }
  manifest[url] = variants;
  console.log(`${url}: ${variants.webp.length} WebP variants, ${variants.avif.length} AVIF variants`);
}

await fs.writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${Object.keys(manifest).length} image entries to ${path.relative(root, manifestFile)}`);
