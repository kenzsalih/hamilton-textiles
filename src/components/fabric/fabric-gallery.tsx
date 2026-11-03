"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ZoomIn } from "lucide-react";
import type { FabricPattern } from "@/lib/catalog/types";
import { FabricSwatch } from "./fabric-swatch";

type View = { kind: "photo"; url: string; alt: string } | { kind: "swatch"; closeUp: boolean };

/**
 * Main fabric view with a hover/touch magnifier so shoppers can inspect the
 * weave. Falls back to the procedural swatch (draped + close-up) without photos.
 */
export function FabricGallery({
  name,
  images,
  hex,
  pattern,
}: {
  name: string;
  images: { url: string; alt: string }[];
  hex: string;
  pattern: FabricPattern;
}) {
  const t = useTranslations("fabric");
  const views: View[] = images.length
    ? images.map((img) => ({ kind: "photo", url: img.url, alt: img.alt || name }))
    : [{ kind: "swatch", closeUp: false }, { kind: "swatch", closeUp: true }];

  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);

  const track = (clientX: number, clientY: number) => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return;
    setZoom({
      x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    });
  };

  const render = (view: View, large: boolean) =>
    view.kind === "photo" ? (
      <Image src={view.url} alt={view.alt} fill sizes={large ? "(min-width: 1024px) 50vw, 100vw" : "96px"} className="object-cover" priority={large} />
    ) : (
      <FabricSwatch
        hex={hex}
        pattern={pattern}
        drape={!view.closeUp}
        className={`size-full ${view.closeUp ? "scale-[2.4]" : ""}`}
      />
    );

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {views.length > 1 && (
        <div className="flex gap-3 sm:flex-col">
          {views.map((view, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t("viewImage", { n: i + 1 })}
              aria-current={i === active}
              className={`relative h-24 w-20 overflow-hidden rounded-xl transition-all duration-300 ${
                i === active ? "ring-2 ring-pine-800 ring-offset-2 ring-offset-ivory" : "opacity-70 hover:opacity-100"
              }`}
            >
              {render(view, false)}
            </button>
          ))}
        </div>
      )}

      <div
        ref={frame}
        className="relative aspect-[4/5] flex-1 cursor-zoom-in touch-none overflow-hidden rounded-[1.5rem] bg-linen select-none"
        onPointerMove={(e) => track(e.clientX, e.clientY)}
        onPointerLeave={() => setZoom(null)}
        onPointerDown={(e) => track(e.clientX, e.clientY)}
        onPointerUp={(e) => e.pointerType !== "mouse" && setZoom(null)}
      >
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={
            zoom
              ? { transform: "scale(2.2)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
              : { transform: "scale(1)", transformOrigin: "50% 50%" }
          }
        >
          {render(views[active], true)}
        </div>
        <span
          className={`pointer-events-none absolute end-4 bottom-4 inline-flex items-center gap-1.5 rounded-full bg-ivory/85 px-3 py-1.5 text-xs font-medium text-ink-soft backdrop-blur transition-opacity duration-300 ${
            zoom ? "opacity-0" : "opacity-100"
          }`}
        >
          <ZoomIn className="size-3.5" />
          {t("zoomHint")}
        </span>
      </div>
    </div>
  );
}
