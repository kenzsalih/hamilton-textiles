"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { uploadMaterialPhoto } from "@/app/admin/(console)/materials/actions";

const MAX_EDGE = 1600;

/** Shrinks a phone photo before upload and samples its centre colour. */
async function prepare(file: File): Promise<{ blob: Blob; hex: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const size = Math.round(Math.min(canvas.width, canvas.height) * 0.3);
  const data = ctx.getImageData((canvas.width - size) / 2, (canvas.height - size) / 2, size, size).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const n = data.length / 4;
  const hex = `#${[r, g, b].map((c) => Math.round(c / n).toString(16).padStart(2, "0")).join("")}`;

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.84),
  );
  return { blob, hex };
}

export function PhotoPicker({
  value,
  onChange,
  onColourSampled,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  onColourSampled?: (hex: string) => void;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const list = [...files].slice(0, 8 - value.length);
    setBusy((n) => n + list.length);
    let next = value;
    for (const file of list) {
      try {
        const { blob, hex } = await prepare(file);
        const form = new FormData();
        form.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const res = await uploadMaterialPhoto(form);
        if (res.ok) {
          if (next.length === 0) onColourSampled?.(hex);
          next = [...next, res.url];
          onChange(next);
        } else setError(res.error);
      } catch {
        setError("Couldn't read that photo. Try another one.");
      } finally {
        setBusy((n) => n - 1);
      }
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {value.map((url, i) => (
          <div key={url.slice(-40) + i} className="group relative aspect-square overflow-hidden rounded-xl bg-linen">
            <Image src={url} alt="" fill sizes="160px" className="object-cover" />
            {i === 0 && <span className="absolute start-1.5 top-1.5 rounded-full bg-pine-900/80 px-2 py-0.5 text-[0.6rem] font-bold text-ivory">Cover</span>}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-ink/70 text-white"
              aria-label="Remove photo"
            >
              <X className="size-3.5" />
            </button>
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
              {i > 0 ? (
                <button type="button" onClick={() => move(i, -1)} className="grid size-7 place-items-center rounded-full bg-ivory/90 text-ink" aria-label="Move earlier">
                  <ChevronLeft className="size-4" />
                </button>
              ) : <span />}
              {i < value.length - 1 && (
                <button type="button" onClick={() => move(i, 1)} className="grid size-7 place-items-center rounded-full bg-ivory/90 text-ink" aria-label="Move later">
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {Array.from({ length: busy }, (_, i) => (
          <div key={`busy-${i}`} className="grid aspect-square place-items-center rounded-xl bg-linen">
            <Loader2 className="size-5 animate-spin text-muted" />
          </div>
        ))}
      </div>

      {value.length + busy < 8 && (
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => camera.current?.click()} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-stone bg-white text-sm font-semibold text-ink-soft">
            <Camera className="size-4" />
            Take photo
          </button>
          <button type="button" onClick={() => gallery.current?.click()} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-stone bg-white text-sm font-semibold text-ink-soft">
            <ImagePlus className="size-4" />
            From gallery
          </button>
        </div>
      )}
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
      <input ref={gallery} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
      {error && <p className="mt-2 text-xs text-crimson">{error}</p>}
      <p className="mt-2 text-[0.7rem] text-muted">Up to 8 photos. The first one is shown in the shop. Without photos, a fabric texture is drawn from the colour.</p>
    </div>
  );
}
