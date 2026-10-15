import crypto from "crypto";
import { supabase } from "./supabase.js";

/**
 * Ensures that the public-read bucket "product-images" exists.
 */
export async function ensureProductImagesBucket(): Promise<boolean> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      // Secret key may still be able to access even if listBuckets has quirks
      return false;
    }
    const exists = buckets?.some((b) => b.name === "product-images");
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket("product-images", {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      });
      if (createError) {
        console.warn("Could not create bucket 'product-images':", createError.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn("Error ensuring product-images bucket:", err);
    return false;
  }
}

/**
 * Detect real image format using magic bytes header inspection.
 * Supports JPEG, PNG, WebP.
 */
export function detectImageMagicBytes(buffer: Buffer): { ext: string; mime: string } | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" };
  }

  return null;
}

/**
 * Uploads an image buffer to Supabase Storage "product-images" bucket
 * with a cryptographically random filename.
 */
export async function uploadProductImage(
  buffer: Buffer,
  mime: string,
  ext: string
): Promise<string> {
  // Try ensuring bucket exists
  await ensureProductImagesBucket();

  const randomName = `${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(randomName, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(randomName);

  if (!urlData?.publicUrl) {
    throw new Error("Failed to obtain public URL from Supabase Storage");
  }

  return urlData.publicUrl;
}
