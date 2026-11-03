"use client";

import { useEffect, useState } from "react";
import { Bell, Download, Smartphone } from "lucide-react";
import { Card } from "./ui";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function AppSettings() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setPermission("Notification" in window ? Notification.permission : "unsupported");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return (
    <Card className="divide-y divide-sand/70 overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-4">
        <Smartphone className="mt-0.5 size-5 shrink-0 text-brass" strokeWidth={1.6} />
        <div className="flex-1">
          <p className="text-sm font-medium">Install on this phone</p>
          {installed ? (
            <p className="text-xs text-pine-700">Installed — you&apos;re using the app.</p>
          ) : installEvent ? (
            <>
              <p className="text-xs text-muted">Adds Hamilton to your home screen like a normal app.</p>
              <button
                type="button"
                onClick={async () => {
                  await installEvent.prompt();
                  const { outcome } = await installEvent.userChoice;
                  if (outcome === "accepted") setInstalled(true);
                  setInstallEvent(null);
                }}
                className="btn btn-primary mt-3 h-10 px-4 text-xs"
              >
                <Download className="size-4" />
                Install app
              </button>
            </>
          ) : isIos ? (
            <p className="text-xs text-muted">In Safari, tap the Share button, then &ldquo;Add to Home Screen&rdquo;.</p>
          ) : (
            <p className="text-xs text-muted">Open this page in Chrome on your phone and choose &ldquo;Install app&rdquo; from the ⋮ menu.</p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 px-4 py-4">
        <Bell className="mt-0.5 size-5 shrink-0 text-brass" strokeWidth={1.6} />
        <div className="flex-1">
          <p className="text-sm font-medium">New order alerts</p>
          {permission === "granted" ? (
            <p className="text-xs text-pine-700">On — you&apos;ll get an alert when an order comes in while the app is open.</p>
          ) : permission === "denied" ? (
            <p className="text-xs text-muted">Blocked. Allow notifications for this site in your phone&apos;s settings.</p>
          ) : permission === "unsupported" ? (
            <p className="text-xs text-muted">{isIos ? "Install the app to the home screen first, then turn this on." : "Not supported in this browser."}</p>
          ) : (
            <>
              <p className="text-xs text-muted">Get a notification and a buzz when a new order is paid.</p>
              <button
                type="button"
                onClick={async () => setPermission(await Notification.requestPermission())}
                className="btn btn-ghost mt-3 h-10 px-4 text-xs"
              >
                Turn on alerts
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
