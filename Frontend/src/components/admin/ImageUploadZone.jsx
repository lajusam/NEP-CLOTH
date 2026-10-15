import { useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

export default function ImageUploadZone({
  images = [],
  onUpload,
  onRemove,
  uploading = false,
  error = null,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    // reset input value so re-selecting same file triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`border-2 border-dashed border-obsidian/15 hover:border-obsidian/40 aspect-[16/10] flex flex-col items-center justify-center text-secondary cursor-pointer transition-colors duration-300 group p-4 text-center ${
          uploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {uploading ? (
          <>
            <Loader2 size={24} className="mb-2 animate-spin text-obsidian" />
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-obsidian">
              Uploading to Supabase Storage...
            </p>
          </>
        ) : (
          <>
            <Upload
              size={24}
              strokeWidth={1}
              className="mb-2 text-secondary group-hover:text-obsidian transition-colors duration-300"
            />
            <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-secondary group-hover:text-obsidian transition-colors duration-300">
              Upload Images
            </p>
            <p className="font-sans text-[11px] text-secondary mt-1">
              JPEG, PNG, WebP up to 5MB (Drag & drop or click)
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="font-sans text-[11px] text-altitude-orange mt-2">{error}</p>
      )}

      {images.length > 0 && (
        <div className="space-y-2 mt-3">
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square bg-surface-container border border-obsidian/10 group overflow-hidden"
              >
                <img
                  src={img}
                  alt={`Product view ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRemove) onRemove(i);
                  }}
                  className="absolute top-1 right-1 bg-obsidian text-stark-white w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-altitude-orange"
                  title="Remove image"
                >
                  <X size={12} strokeWidth={1.5} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-obsidian/80 text-[9px] font-mono text-stark-white px-1 py-0.5 uppercase truncate text-center">
                  {i === 0 ? 'Primary' : i === 1 ? 'Model' : `Img ${i + 1}`}
                </div>
              </div>
            ))}
          </div>
          <p className="font-sans text-[10px] text-secondary tracking-wider uppercase">
            Image 1: Primary cover • Image 2: Model preview
          </p>
        </div>
      )}
    </div>
  );
}
