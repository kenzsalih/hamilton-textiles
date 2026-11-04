import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { fontVariables } from "@/lib/fonts";
import { localeDirection, routing } from "@/i18n/routing";
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, isCurrency } from "@/lib/currency";
import { getRates } from "@/lib/fx";
import { SITE_URL } from "@/lib/site";
import { CurrencyProvider } from "@/components/currency/currency-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: `%s · Hamilton Textiles` },
    description: t("description"),
    alternates: { languages: { en: "/en", ar: "/ar" } },
    openGraph: { type: "website", siteName: "Hamilton Textiles", locale: locale === "ar" ? "ar_BH" : "en_BH" },
  };
}

export const viewport: Viewport = { themeColor: "#132820" };

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const stored = (await cookies()).get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(stored) ? stored : DEFAULT_CURRENCY;
  const rates = await getRates();

  return (
    <html
      lang={locale}
      dir={localeDirection[locale]}
      className={fontVariables}
    >
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <CurrencyProvider initial={currency} rates={rates}>
            <CartProvider>
              <SiteHeader />
              <main>{children}</main>
              <SiteFooter />
              <WhatsAppButton />
              <CartDrawer />
            </CartProvider>
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
