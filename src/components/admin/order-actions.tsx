"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, CheckCircle2, Loader2, PackageCheck, RotateCcw, Store, Truck } from "lucide-react";
import type { OrderStatus } from "@/lib/data";
import { updateOrderStatus } from "@/app/admin/(console)/orders/actions";
import { Card } from "./ui";

type Step = { status: OrderStatus; label: string; icon: typeof Truck; hint: string };

function nextSteps(status: OrderStatus, fulfilment: "delivery" | "pickup"): Step[] {
  switch (status) {
    case "paid":
      return [{ status: "packed", label: "Mark as cut & packed", icon: PackageCheck, hint: "Fabric is cut and ready to go" }];
    case "packed":
      return fulfilment === "pickup"
        ? [{ status: "ready_for_pickup", label: "Ready for pickup", icon: Store, hint: "Let the customer know they can collect" }]
        : [{ status: "shipped", label: "Mark as shipped", icon: Truck, hint: "Handed to the driver or courier" }];
    case "shipped":
    case "ready_for_pickup":
      return [{ status: "delivered", label: fulfilment === "pickup" ? "Collected" : "Mark as delivered", icon: CheckCircle2, hint: "Order complete" }];
    default:
      return [];
  }
}

// Messages the owner can send in one tap after updating an order.
const MESSAGES: Record<string, { en: string; ar: string }> = {
  packed: {
    en: "Hello {name}, your Hamilton Textiles order {order} has been cut and packed. We'll be in touch when it's on its way.",
    ar: "مرحباً {name}، تم قصّ وتغليف طلبك {order} من منسوجات هاميلتون. سنبلغك عند إرساله.",
  },
  shipped: {
    en: "Hello {name}, your Hamilton Textiles order {order} is on its way to you today.",
    ar: "مرحباً {name}، طلبك {order} من منسوجات هاميلتون في الطريق إليك اليوم.",
  },
  ready_for_pickup: {
    en: "Hello {name}, your Hamilton Textiles order {order} is ready to collect from our shop in Hunainiya, Riffa.",
    ar: "مرحباً {name}، طلبك {order} جاهز للاستلام من محلنا في الحنينية، الرفاع.",
  },
  delivered: {
    en: "Thank you for shopping with Hamilton Textiles, {name}! We hope you love your fabric.",
    ar: "شكراً لتسوّقك من منسوجات هاميلتون يا {name}! نتمنى أن ينال القماش إعجابك.",
  },
  cancelled: {
    en: "Hello {name}, your Hamilton Textiles order {order} has been cancelled. Please message us if you have any questions.",
    ar: "مرحباً {name}، تم إلغاء طلبك {order} من منسوجات هاميلتون. راسلنا إن كان لديك أي سؤال.",
  },
};

export function OrderActions({
  orderId,
  status,
  fulfilment,
  paid,
  whatsapp,
}: {
  orderId: string;
  status: OrderStatus;
  fulfilment: "delivery" | "pickup";
  paid: boolean;
  whatsapp: { phone: string; name: string; orderNumber: string; locale: string };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [justSet, setJustSet] = useState<OrderStatus | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [restock, setRestock] = useState(true);
  const [note, setNote] = useState("");

  const run = (to: OrderStatus, opts?: { restock?: boolean; note?: string }) =>
    start(async () => {
      setError(null);
      const res = await updateOrderStatus(orderId, to, opts);
      if (!res.ok) return setError(res.error ?? "Couldn't update the order");
      setJustSet(to);
      setCancelling(false);
      router.refresh();
    });

  const messageFor = (s: OrderStatus | null) => {
    const tpl = s && MESSAGES[s];
    if (!tpl) return null;
    const text = (whatsapp.locale === "ar" ? tpl.ar : tpl.en).replace("{name}", whatsapp.name).replace("{order}", whatsapp.orderNumber);
    return `https://wa.me/${whatsapp.phone}?text=${encodeURIComponent(text)}`;
  };

  const steps = nextSteps(status, fulfilment);
  const canCancel = ["pending_payment", "paid", "packed"].includes(status);
  const message = messageFor(justSet ?? (["packed", "shipped", "ready_for_pickup", "delivered", "cancelled"].includes(status) ? status : null));

  if (steps.length === 0 && !canCancel && !(status === "cancelled" && paid) && !message) return null;

  return (
    <Card className="space-y-3 p-4 sm:p-5">
      {steps.map((s) => (
        <button key={s.status} type="button" disabled={pending} onClick={() => run(s.status)} className="btn btn-primary h-14 w-full justify-start px-5 text-left">
          {pending ? <Loader2 className="size-5 animate-spin" /> : <s.icon className="size-5" />}
          <span className="flex flex-col">
            <span className="text-sm">{s.label}</span>
            <span className="text-[0.7rem] font-normal text-pine-100/75">{s.hint}</span>
          </span>
        </button>
      ))}

      {message && (
        <a href={message} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#25d366]/12 text-sm font-semibold text-[#128c4a]">
          Send update on WhatsApp
        </a>
      )}

      {status === "cancelled" && paid && (
        <button type="button" disabled={pending} onClick={() => run("refunded")} className="btn btn-ghost h-12 w-full">
          <RotateCcw className="size-4" />
          Mark as refunded
        </button>
      )}
      {status === "cancelled" && paid && <p className="text-xs text-muted">Issue the refund from your Tap dashboard first, then mark it here.</p>}

      {canCancel &&
        (cancelling ? (
          <div className="space-y-3 rounded-xl bg-crimson/5 p-3.5">
            <p className="text-sm font-semibold text-crimson">Cancel this order?</p>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)" className="h-11 w-full rounded-xl border border-sand bg-white px-3.5 text-base outline-none sm:text-sm" />
            {(status === "paid" || status === "packed") && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="size-4 accent-pine-700" />
                Put the fabric back into stock
              </label>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setCancelling(false)} className="btn btn-ghost h-11 flex-1">
                Keep order
              </button>
              <button type="button" disabled={pending} onClick={() => run("cancelled", { restock, note })} className="btn h-11 flex-1 bg-crimson text-white">
                {pending && <Loader2 className="size-4 animate-spin" />}
                Cancel order
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setCancelling(true)} className="flex w-full items-center justify-center gap-2 py-1 text-xs font-semibold text-crimson">
            <Ban className="size-3.5" />
            Cancel order
          </button>
        ))}

      {error && <p className="text-xs text-crimson">{error}</p>}
    </Card>
  );
}
