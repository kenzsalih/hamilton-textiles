# Launch checklist

How Hamilton Textiles goes from this computer to a live shop. Everything below is free except the domain (about $11 a year) and Tap's fee on each sale.

| Piece | Service | Cost |
| --- | --- | --- |
| Domain | Cloudflare Registrar | ~$11 / year |
| Website + admin app | Netlify (free plan) | $0 |
| Database, owner login, photos | Supabase (free plan) | $0 — Pro is $25/month when the shop outgrows it |
| Order emails | Resend (free plan, 3,000 emails/month) | $0 |
| BenefitPay + cards | Tap Payments | per-transaction fee, no monthly fee |

The owner creates each account and enters passwords and payment or bank details personally. Steps marked **[dev]** are done by the developer.

---

## 1. Domain — Cloudflare

1. Sign up at **dash.cloudflare.com**.
2. Go to **Domain Registration → Register Domains**. Search for `hamiltontextiles.com`, or another name if that one is taken, and buy it. Turn on auto-renew.
3. Leave the DNS settings for now. Step 4 adds the records.

## 2. Database — Supabase

1. Sign up at **supabase.com**, then create a project:
   - Name: `hamilton`
   - Region: **East US (Ohio) `us-east-2`**, the same place where Netlify's free plan runs the site's server code. Every page makes several database calls, so keeping the server and database side by side matters more than being close to Bahrain. Visitors still get the pages and images from Netlify's servers near them.
   - Database password: save it in a password manager
   - Security:
     - **Enable Data API**: leave it ticked.
     - **Automatically expose new tables**: leave it ticked. The schema doesn't grant access table by table, and row-level security protects every table.
     - **Enable automatic RLS**: tick it.
2. Go to **Authentication → Sign In / Providers → Email** and **turn off "Allow new users to sign up"**. Only the owner ever logs in.
3. Go to **Authentication → Users → Add user** and create the owner's login (email and password).
4. **[dev]** In the **SQL Editor**, run these files in order:
   1. `supabase/migrations/0001_initial_schema.sql`
   2. `supabase/migrations/0002_admin_helpers.sql`
   3. `supabase/seed.sql`
5. **[dev]** Give the owner's account admin rights:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'OWNER_EMAIL_HERE';
   ```
6. **[dev]** Copy these from **Project Settings → API**: the project URL, the `anon` key and the `service_role` key. **The `service_role` key is secret.** It goes only into Netlify's settings and never into the code.

## 3. Hosting — Netlify

1. **[dev]** Push the code to a **private** GitHub repository.
2. Sign up at **app.netlify.com** using GitHub. Choose **Add new site → Import from Git** and pick the repository. The build settings come from `netlify.toml`.
3. In **Site configuration → Environment variables**, add:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase (secret) |
   | `NEXT_PUBLIC_SITE_URL` | `https://hamiltontextiles.com` |
   | `TAP_SECRET_KEY` | from Tap (step 5) |
   | `RESEND_API_KEY` | from Resend (step 6) |
   | `EMAIL_FROM` | `Hamilton Textiles <orders@hamiltontextiles.com>` |
   | `OWNER_EMAIL` | the owner's email, for new-order alerts |

4. Deploy. The site first appears at `something.netlify.app`.

## 4. Connect the domain

1. In Netlify, go to **Domain management → Add a domain** and enter `hamiltontextiles.com`. Netlify then shows the DNS records it needs.
2. In Cloudflare, go to **DNS → Records** and add them:
   - `CNAME` `www` → `something.netlify.app`
   - the apex (`@`) record that Netlify shows

   Set both to **DNS only (grey cloud)**.
3. Wait for Netlify to say HTTPS is active. That usually takes minutes, but can take a few hours.

## 5. Payments — Tap

1. Apply at **tap.company** as a Bahrain business. You'll need the CR (146350-1), owner ID, bank account (IBAN) and the live website address. Ask for **BenefitPay and cards**.
2. While the application is in review, put the **test** secret key (`sk_test_…`) into Netlify and place a test order with Tap's test cards.
3. In Tap's dashboard, set the webhook URL to `https://hamiltontextiles.com/api/webhooks/tap`.
4. Once approved, swap in the **live** key (`sk_live_…`) and redeploy.

Checkout stays switched off on the live site until both Supabase and Tap are connected. No customer can pay into an unfinished setup.

## 6. Order emails — Resend

1. Sign up at **resend.com**. Go to **Domains → Add domain** and enter `hamiltontextiles.com`.
2. Add the DNS records Resend shows to Cloudflare's DNS. Wait for **Verified**.
3. Create an API key and put it in Netlify as `RESEND_API_KEY`.

Customers who enter an email address at checkout get a receipt. The owner gets an email for every paid order, with a button that opens it in the admin app.

## 7. Owner's phone

1. On the phone, open `https://hamiltontextiles.com/admin` and sign in.
2. Add it to the home screen:
   - **Android:** Chrome → ⋮ → **Install app**.
   - **iPhone:** Safari → Share → **Add to Home Screen**.
3. In the app, open **More → Turn on alerts**.
4. **[dev]** Optional: build a real Android APK from the live site with **pwabuilder.com**.

## Before announcing the shop

- [ ] Real delivery fees and VAT in `src/lib/shipping.ts` (still placeholders)
- [ ] Real product photos and stock for every fabric, entered in the admin app. Delete or hide the starter fabrics you don't sell.
- [ ] Shop opening hours
- [ ] The corrected logo, then regenerate the app icons with `node scripts/admin-icons.mjs`
- [ ] Test order with a Tap test card → shows up in admin → emails arrive → tracking works
- [ ] One real BenefitPay order for a small amount, then refund it from Tap
