"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FabricPattern, Material } from "@/lib/catalog/types";
import { lineTotal, snapMetres } from "@/lib/metres";

/**
 * Cart lives in the shopper's browser. Prices here are for display only —
 * checkout re-reads every material from the database and re-prices the order.
 */
export type CartLine = {
  materialId: string;
  slug: string;
  sku: string;
  name_en: string;
  name_ar: string;
  colour_hex: string | null;
  pattern: FabricPattern;
  image: string | null;
  price_fils: number;
  min_order_m: number;
  step_m: number;
  stock_m: number;
  metres: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalFils: number;
  isOpen: boolean;
  ready: boolean;
  open: () => void;
  close: () => void;
  add: (material: Material, metres: number) => void;
  setMetres: (materialId: string, metres: number) => void;
  remove: (materialId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "ht_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    setLines(readStored());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setLines(readStored());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage unavailable (private mode); the cart still works for this visit.
    }
  }, [lines, ready]);

  const add = useCallback((m: Material, metres: number) => {
    setLines((current) => {
      const existing = current.find((l) => l.materialId === m.id);
      const total = snapMetres((existing?.metres ?? 0) + metres, m.min_order_m, m.step_m, m.stock_m);
      const line: CartLine = {
        materialId: m.id,
        slug: m.slug,
        sku: m.sku,
        name_en: m.name_en,
        name_ar: m.name_ar,
        colour_hex: m.colour_hex,
        pattern: m.pattern,
        image: m.images[0]?.url ?? null,
        price_fils: m.price_fils,
        min_order_m: m.min_order_m,
        step_m: m.step_m,
        stock_m: m.stock_m,
        metres: total,
      };
      return existing ? current.map((l) => (l.materialId === m.id ? line : l)) : [...current, line];
    });
    setOpen(true);
  }, []);

  const setMetres = useCallback((materialId: string, metres: number) => {
    setLines((current) =>
      current.map((l) =>
        l.materialId === materialId ? { ...l, metres: snapMetres(metres, l.min_order_m, l.step_m, l.stock_m) } : l,
      ),
    );
  }, []);

  const remove = useCallback((materialId: string) => {
    setLines((current) => current.filter((l) => l.materialId !== materialId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.length,
      subtotalFils: lines.reduce((sum, l) => sum + lineTotal(l.price_fils, l.metres), 0),
      isOpen,
      ready,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setMetres,
      remove,
      clear,
    }),
    [lines, isOpen, ready, add, setMetres, remove, clear],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
