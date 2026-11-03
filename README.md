# Hamilton Textiles

Online fabric shop and owner console for Hamilton Textile W.L.L, Hunainiya, Riffa, Bahrain.

- **Storefront** — English + Arabic (RTL), currency switcher, fabrics sold by the metre.
- **Admin console** — installable web app for the owner (phase 3).

## Stack

Next.js 16 (App Router) · Tailwind CSS 4 · next-intl · Supabase (Postgres, Auth, Storage) · Tap Payments for BenefitPay and cards (phase 2/4).

## Running locally

```bash
npm install
npm run dev
```

Without Supabase credentials the site runs on the starter catalogue in `src/lib/catalog/seed.ts`.

## Connecting Supabase

1. Create a project at supabase.com and copy `.env.example` to `.env.local` with its URL and keys.
2. In the SQL editor, run `supabase/migrations/0001_initial_schema.sql`, then `supabase/seed.sql`.
3. Create the owner's login under Authentication → Users, then run
   `insert into public.admins (user_id) values ('<owner user id>');`

## Connecting Tap Payments

1. Add `TAP_SECRET_KEY` (test key first) to `.env.local`.
2. Set `NEXT_PUBLIC_SITE_URL` to the public site address — Tap redirects shoppers to `/{locale}/checkout/return` and posts updates to `/api/webhooks/tap`.
3. Until both Supabase and Tap are configured, checkout runs in demo mode in development (promo code `WELCOME10` works) and is disabled in production.

Delivery fees and VAT are placeholders in `src/lib/shipping.ts` until the owner confirms them.

Regenerate `supabase/seed.sql` after editing the starter catalogue with `npm run seed:sql`.

## Admin app

The owner console lives at `/admin` (English, mobile-first). It installs to the home screen as an app (Android: Chrome → Install app; iPhone: Safari → Share → Add to Home Screen). Once the site is on its own HTTPS domain, an Android APK can be produced from it with [PWABuilder](https://www.pwabuilder.com/) or Bubblewrap.

- **Sign-in:** create the owner under Supabase → Authentication → Users and add their id to `public.admins` (see above). Without Supabase, local development offers a one-tap sign-in that uses the dev store.
- **Dev store:** without Supabase, the site and admin share `.data/dev-store.json` (sample orders included). Delete the file to reset it.
- Run `supabase/migrations/0002_admin_helpers.sql` after the initial schema.
- Regenerate the app icons after a logo change with `node scripts/admin-icons.mjs`.

## Layout

| Path | What lives there |
| --- | --- |
| `src/app/[locale]` | Storefront pages (`/en`, `/ar`) |
| `src/components` | UI — `brand`, `fabric`, `home`, `layout`, `currency` |
| `src/lib/catalog` | Catalogue types, seed data and data access |
| `src/lib/currency.ts` | Prices are integer fils; other currencies are display-only |
| `messages/` | English and Arabic copy |
| `supabase/` | Schema, row-level security and seed data |
