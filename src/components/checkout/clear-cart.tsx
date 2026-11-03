"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";

/** Empties the cart once the payment page confirms the order. */
export function ClearCart() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
