import optimizedImages from "../data/optimized-images.json";

function imageVariants(src, format) {
  const images = optimizedImages[src];
  return images?.[format] || [];
}

export default function ResponsiveImage({
  src,
  alt,
  width,
  height,
  sizes = "100vw",
  srcSet: fallbackSrcSet,
  loading = "lazy",
  fetchPriority,
  className,
  style,
  ...props
}) {
  if (!src || typeof alt !== "string") return null;
  const webp = imageVariants(src, "webp");
  const avif = imageVariants(src, "avif");
  const srcSet = (variants) => variants.map(({ src: path, width: size }) => `${encodeURI(path)} ${size}w`).join(", ");
  return (
    <picture className="responsive-image-picture">
      {avif.length > 0 && <source type="image/avif" srcSet={srcSet(avif)} sizes={sizes} />}
      <img
        src={src}
        srcSet={srcSet(webp) || fallbackSrcSet}
        sizes={webp.length || fallbackSrcSet ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        className={className}
        style={style}
        {...props}
      />
    </picture>
  );
}
