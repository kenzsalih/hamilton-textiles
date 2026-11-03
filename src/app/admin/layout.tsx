import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { RegisterServiceWorker } from "@/components/admin/register-sw";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Hamilton Admin", template: "%s · Hamilton Admin" },
  manifest: "/admin.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Hamilton", statusBarStyle: "black-translucent" },
  icons: { apple: "/admin/apple-touch-icon.png", icon: "/admin/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#132820",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh bg-ivory">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
