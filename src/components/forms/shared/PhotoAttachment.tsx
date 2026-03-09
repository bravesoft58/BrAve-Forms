"use client";

import { useRef, useState } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { inputClass, labelClass } from "@/components/forms/formStyles";
import type { FormPhoto } from "@/lib/schemas/ndot-stormwater";

interface PhotoAttachmentProps {
  photos: FormPhoto[];
  onPhotosChange: (photos: FormPhoto[]) => void;
  storagePath: string; // e.g. "projects/{id}/ndot-stormwater"
  maxPhotos?: number;
}

const BUCKET = "form-attachments";
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export default function PhotoAttachment({
  photos,
  onPhotosChange,
  storagePath,
  maxPhotos = 10,
}: PhotoAttachmentProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxPhotos} photos allowed.`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const supabase = createClient();
      const newPhotos: FormPhoto[] = [];

      for (const file of toUpload) {
        const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = `${storagePath}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, compressed, {
            contentType: compressed.type,
            upsert: false,
          });

        if (uploadError) {
          setError(`Upload failed: ${uploadError.message}`);
          break;
        }

        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(filePath);

        newPhotos.push({
          url: urlData.publicUrl,
          caption: "",
          file_name: fileName,
          uploaded_at: new Date().toISOString(),
        });
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function updateCaption(index: number, caption: string) {
    const updated = photos.map((p, i) => (i === index ? { ...p, caption } : p));
    onPhotosChange(updated);
  }

  async function removePhoto(index: number) {
    const photo = photos[index];
    // Try to delete from storage (best-effort — don't block UI on failure)
    try {
      const supabase = createClient();
      const filePath = `${storagePath}/${photo.file_name}`;
      await supabase.storage.from(BUCKET).remove([filePath]);
    } catch {
      // Storage cleanup is best-effort
    }
    onPhotosChange(photos.filter((_, i) => i !== index));
  }

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
        Photo Attachments
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Attach digital photographs of deficiencies or other noted issues of concern.
      </p>

      {/* Upload button */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading || photos.length >= maxPhotos}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || photos.length >= maxPhotos}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Add Photos"}
        </button>
        <span className="ml-3 text-xs text-zinc-400">
          {photos.length}/{maxPhotos} photos
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, i) => (
            <div
              key={photo.file_name}
              className="relative rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
              <img
                src={photo.url}
                alt={photo.caption || `Photo ${i + 1}`}
                className="h-40 w-full rounded object-cover"
              />
              <div className="mt-2">
                <label className={labelClass}>Caption</label>
                <input
                  type="text"
                  value={photo.caption}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder="Describe the photo..."
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
