// Public address of the shop, used for SEO links, emails and payment redirects.
// Falls back to Netlify's own URL variable so a missing setting never leaks localhost.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "http://localhost:3000").replace(/\/$/, "");
