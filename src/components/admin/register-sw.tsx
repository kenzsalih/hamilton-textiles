"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch((err) => console.warn("Service worker failed", err));
  }, []);
  return null;
}
