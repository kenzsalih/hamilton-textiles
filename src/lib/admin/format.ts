// Formatting for the owner console (English, Bahrain time, BHD).

const TZ = "Asia/Bahrain";

export function bhd(fils: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(fils) >= 1_000_000) {
    return `BD ${(fils / 1_000_000).toFixed(1)}k`;
  }
  return `BD ${(fils / 1000).toLocaleString("en-BH", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
}

export function metres(m: number): string {
  return `${Number(m.toFixed(2))} m`;
}

export function dateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function date(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/** YYYY-MM-DD in Bahrain time — used to bucket sales by day. */
export function bahrainDay(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
}

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "To pack",
  packed: "Packed",
  shipped: "Shipped",
  ready_for_pickup: "Ready for pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const STATUS_TONE: Record<string, string> = {
  pending_payment: "bg-stone/20 text-ink-soft",
  paid: "bg-brass/15 text-[#7a5a26]",
  packed: "bg-pine-100 text-pine-800",
  shipped: "bg-[#dfe8f3] text-[#2c4a72]",
  ready_for_pickup: "bg-[#dfe8f3] text-[#2c4a72]",
  delivered: "bg-pine-700 text-ivory",
  cancelled: "bg-crimson/10 text-crimson",
  refunded: "bg-crimson/10 text-crimson",
};
