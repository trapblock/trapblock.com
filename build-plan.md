# Fortify — Step-by-Step Build Plan for Beginners

## What You're Building
A web service (like Tech Lockdown) that blocks fraudulent gambling ads, relay domains, and PWA installs. Users subscribe on your website, download a config profile, install it on their device in 2 minutes, and are protected on every browser and app on that device.

No iOS app needed to start. No App Store. No Apple entitlement approval.

## Tools You Need (all free to start)
- **Cursor** — cursor.com — AI coding tool. Free tier is enough.
- **Cloudflare** — cloudflare.com — hosts your DNS resolver and website. Free tier.
- **Supabase** — supabase.com — user accounts and database. Free tier.
- **Stripe** — stripe.com — payments. Free until you make money (they take 2.9% + 30¢ per transaction).
- **GitHub** — github.com — stores your code. Free.
- **Vercel** — vercel.com — hosts your website. Free tier.

**Total upfront cost: $0**
**When you get your first paying user: $99 Apple Developer account (only if you add iOS app later — skip for now)**

---

## PHASE 0 — Accounts Setup
**Time: 2 hours | Cost: $0**

Create accounts on all 5 services above. Nothing to code yet.

1. Sign up at cursor.com — download and install Cursor on your Mac
2. Sign up at cloudflare.com — verify your email
3. Sign up at supabase.com — create a new project called "fortify"
4. Sign up at stripe.com — complete the business verification (use your real name/details)
5. Sign up at github.com — create a new repository called "fortify"
6. Sign up at vercel.com — connect it to your GitHub account

**✓ Done when:** All 5 accounts exist and Cursor is installed on your Mac.

---

## PHASE 1 — The DNS Resolver (your core product)
**Time: 2–3 days | Tool: Cursor**

This is the engine. Every blocked gambling relay domain goes through this.

### Step 1.1 — Create the Cloudflare Worker

1. Log in to cloudflare.com
2. Go to **Workers & Pages → Create Worker**
3. Name it `fortify-dns`
4. Click **Deploy** (ignore the default code for now)
5. Open Cursor, create a new file called `worker.js`
6. Paste this prompt into Cursor:

```
Build a Cloudflare Worker that acts as a DNS-over-HTTPS (DoH) resolver.

Requirements:
- Accept GET requests at /dns-query?name=DOMAIN&type=A
- Accept POST requests at /dns-query with application/dns-message body
- Check the queried domain against a Cloudflare KV namespace called BLOCKLIST
- Also check parent domains (if sub.evil.com is queried, also check evil.com)
- If domain is in BLOCKLIST, return a proper NXDOMAIN response
- If domain is NOT in BLOCKLIST, forward the query to 1.1.1.1 and return the result
- Add CORS headers to all responses
- Return proper DNS wire format for POST requests, JSON for GET requests

The KV binding name is BLOCKLIST.
```

7. Copy the code Cursor generates → paste it into the Cloudflare Worker editor → click **Deploy**

### Step 1.2 — Create the blocklist storage

1. In Cloudflare dashboard → **Workers & Pages → KV**
2. Click **Create namespace** → name it `FORTIFY_BLOCKLIST`
3. Go back to your Worker → **Settings → Variables → KV Namespace Bindings**
4. Add binding: Variable name = `BLOCKLIST`, KV namespace = `FORTIFY_BLOCKLIST`
5. Click **Save and deploy**

### Step 1.3 — Seed the blocklist with gambling fraud domains

In Cursor, create a new file called `seed-blocklist.js` and prompt:

```
Write a Node.js script that seeds a Cloudflare KV namespace with gambling and fraud domains.

It should:
1. Download these blocklists:
   - https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/gambling/hosts
   - https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt
2. Parse them into a clean list of domains (remove comments, IPs, duplicates, blank lines)
3. Upload each domain to Cloudflare KV using the bulk write API (max 10,000 per request)
   - Cloudflare Account ID: YOUR_ACCOUNT_ID (find in Cloudflare dashboard right sidebar)
   - KV Namespace ID: YOUR_KV_NAMESPACE_ID (find in KV settings)
   - API Token: YOUR_API_TOKEN (create at cloudflare.com/profile/api-tokens)
4. Print progress every 100 domains
5. Print total count when done

Use node-fetch for HTTP requests.
```

Run it: `node seed-blocklist.js`

### Step 1.4 — Test it

Open your browser and go to:
`https://fortify-dns.YOUR-SUBDOMAIN.workers.dev/dns-query?name=bet365.com&type=A`

You should see `NXDOMAIN` in the response.
Test a safe domain: `?name=google.com&type=A` — should return an IP address.

**✓ Done when:** bet365.com returns NXDOMAIN, google.com returns an IP.

---

## PHASE 2 — The Config Profile Generator
**Time: 1–2 days | Tool: Cursor**

This is what users install on their iPhone/Mac. It points their device DNS to your resolver.

### Step 2.1 — Build the profile generator

In Cursor, create `generate-profile.js`:

```
Write a Node.js function called generateConfigProfile(userId, options) that creates
an Apple configuration profile (.mobileconfig file) as a string.

The profile should contain:
1. A DNS-over-HTTPS payload pointing to:
   https://fortify-dns.YOUR-SUBDOMAIN.workers.dev/dns-query
   Use the userId to create a unique DNS URL: 
   https://fortify-dns.YOUR-SUBDOMAIN.workers.dev/dns-query?user=USER_ID
   This lets us apply per-user policies later.

2. A VPN prevention payload that blocks users from adding new VPN configurations
   (PayloadType: com.apple.vpn.managed.apns — set RestrictVPN to true)

3. Profile metadata:
   - PayloadDisplayName: "Fortify Protection"
   - PayloadDescription: "Blocks fraudulent gambling ads and relay domains"
   - PayloadIdentifier: com.fortify.profile
   - PayloadOrganization: Fortify

Return the complete .mobileconfig XML as a string.
```

### Step 2.2 — Test the profile on your own iPhone

1. Create a simple test script that calls `generateConfigProfile("test-user-123", {})`
2. Save the output as `test.mobileconfig`
3. Email it to yourself or put it on a web server
4. Open it on your iPhone in Safari
5. Go to **Settings → Profile Downloaded → Install**
6. After install, open Safari and try bet365.com — it should fail to load

**✓ Done when:** Your iPhone blocks bet365.com after installing the test profile.

---

## PHASE 3 — The Website
**Time: 1–2 weeks | Tool: Cursor**

The website has two parts: a public landing page and a private dashboard (shown after login).

### Step 3.1 — Set up the project

In Cursor, open a new folder called `fortify-web` and prompt:

```
Create a Next.js 14 project with:
- App router
- Tailwind CSS for styling
- TypeScript

The project has these pages:
- / (landing page)
- /dashboard (protected, requires login)
- /api/generate-profile (API route that generates .mobileconfig)
- /api/webhook (Stripe webhook handler)

Install dependencies: next, react, react-dom, tailwindcss, @supabase/supabase-js, stripe
```

### Step 3.2 — Build the landing page

Prompt Cursor:

```
Build a landing page for a web security service called Fortify.

Fortify blocks fraudulent gambling ads, cloaking relay domains, and fake PWA installs
on all devices — iPhone, Mac, Android, Windows — without an app.

Sections:
1. Hero: "Block fraudulent gambling ads before they reach your device"
   Subtext: "Works on every browser and app. Installs in 2 minutes. No app needed."
   CTA button: "Start Free Trial"

2. How it works (3 steps):
   - Step 1: Subscribe on this website
   - Step 2: Download your protection profile (30 seconds)
   - Step 3: Install it on your device — you're protected everywhere

3. What it blocks:
   - Fraudulent casino relay domains (TikTok, Meta, Google ad redirects)
   - Fake PWA casino install pages
   - 50,000+ known gambling fraud domains
   - Works inside TikTok, Instagram, Facebook — not just Safari

4. Devices supported: iPhone, iPad, Mac, Android, Windows, Router

5. Pricing: $4.99/month or $39.99/year. 7-day free trial.

6. FAQ section

Use Tailwind CSS. Clean, minimal, dark navy and white color scheme.
```

### Step 3.3 — Build user auth with Supabase

Prompt Cursor:

```
Add Supabase authentication to this Next.js app.

Requirements:
- Email + password signup and login
- After signup: create a user record in a Supabase table called "users" with fields:
  id, email, created_at, subscription_status (default: 'trial'), trial_ends_at (7 days from now)
- Protect the /dashboard route — redirect to /login if not authenticated
- Add login and signup pages at /login and /signup

Supabase URL: YOUR_SUPABASE_URL
Supabase anon key: YOUR_SUPABASE_ANON_KEY
(Both found in Supabase project settings → API)
```

### Step 3.4 — Add Stripe payments

Prompt Cursor:

```
Add Stripe subscription payments to this Next.js app.

Requirements:
- Two plans:
  - Monthly: $4.99/month (create this product in Stripe dashboard first, paste price ID here)
  - Annual: $39.99/year (same)
- /api/create-checkout: creates a Stripe checkout session, redirects user to Stripe
- /api/webhook: handles Stripe webhooks
  - On checkout.session.completed: update user's subscription_status to 'active' in Supabase
  - On customer.subscription.deleted: update to 'cancelled'
- After successful payment: redirect to /dashboard

Stripe secret key: YOUR_STRIPE_SECRET_KEY
Stripe webhook secret: YOUR_STRIPE_WEBHOOK_SECRET
```

### Step 3.5 — Build the dashboard

Prompt Cursor:

```
Build a dashboard page at /dashboard for a DNS security service called Fortify.

The user sees:
1. Status card: "Your protection is active" (green) or "Set up your protection" (yellow)
2. "Download your protection profile" button
   - Calls /api/generate-profile which returns a .mobileconfig file
   - Browser downloads it automatically
3. Install instructions tabs: iPhone/iPad | Mac | Android | Windows | Router
   - iPhone: "Open the downloaded file in Safari → Settings → Profile Downloaded → Install"
   - Mac: "Open the downloaded file → System Settings → Privacy & Security → Profiles → Install"
   - Android: "Go to Settings → Network → Private DNS → enter: fortify-dns.workers.dev"
   - Windows: "Go to Settings → Network → DNS → enter your custom DNS address"
   - Router: "Log into your router admin panel → DNS settings → enter your DNS address"
4. Account section: email, subscription status, billing portal link (Stripe customer portal)

Check if the user has an active subscription — if not, show "Your trial ends in X days" 
and an "Upgrade" button.
```

### Step 3.6 — Wire up the profile generator API

Prompt Cursor:

```
Create a Next.js API route at /api/generate-profile that:
1. Checks the user is authenticated (Supabase session)
2. Checks the user has an active subscription or active trial
3. Calls generateConfigProfile(userId, {}) to generate the .mobileconfig
4. Returns the file as a download with:
   Content-Type: application/x-apple-aspen-config
   Content-Disposition: attachment; filename="fortify-protection.mobileconfig"

Import generateConfigProfile from the generator you built in Phase 2.
```

**✓ Done when:** You can sign up, subscribe (use Stripe test mode), download a profile, install it on your iPhone, and bet365.com is blocked.

---

## PHASE 4 — Deploy It
**Time: 1 day**

### Step 4.1 — Push to GitHub

In Cursor terminal:
```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/fortify.git
git push -u origin main
```

### Step 4.2 — Deploy to Vercel

1. Go to vercel.com → **New Project**
2. Import your GitHub repository
3. Add environment variables (Vercel → Project → Settings → Environment Variables):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**
5. Get your live URL (e.g., `fortify-web.vercel.app`)

### Step 4.3 — Custom domain (optional but recommended)

1. Buy domain at namecheap.com (~$10/yr) — something like `getfortify.app` or `fortifyprotect.com`
2. In Vercel → Project → Settings → Domains → add your domain
3. Follow Vercel's DNS instructions

**✓ Done when:** Your site is live at your domain. Full flow works: signup → pay → download profile → install → blocked.

---

## PHASE 5 — Blocklist Maintenance Pipeline
**Time: 2–3 days**

Your blocklist goes stale without this. New relay domains appear weekly.

### Step 5.1 — Automated daily update

In Cursor, create `update-blocklist.js`:

```
Write a Node.js script that:
1. Downloads the same blocklists from Phase 1 (gambling, fraud domains)
2. Also fetches from OISD full list: https://big.oisd.nl/domainswild
3. Compares against what's already in the KV namespace
4. Only uploads NEW domains (not already in KV)
5. Logs how many new domains were added
6. Can be run as a cron job

Same Cloudflare API credentials as before.
```

### Step 5.2 — Domain submission form

Add to your dashboard:

```
Add a "Report a domain" form to the Fortify dashboard.

A simple form with:
- Domain field (e.g., "relay-track247.com")
- Where did you see it? (dropdown: TikTok ad / Facebook ad / Google ad / Other)
- Submit button

On submit: save to a Supabase table called "reported_domains" with fields:
domain, source, user_id, created_at, status (default: 'pending')

You review these manually and add confirmed ones to the KV blocklist.
```

**✓ Done when:** Blocklist updates automatically every day. Users can report new domains.

---

## PHASE 6 — Private Relay Warning
**Time: 1 day**

### Step 6.1 — Detect and warn

Add to the dashboard install instructions section:

```
Add an iCloud Private Relay warning to the Fortify dashboard.

Show a yellow warning card that says:
"If you use iCloud Private Relay, your protection in TikTok and Instagram 
will be reduced. To get full protection:
Settings → [Your Name] → iCloud → Private Relay → turn off"

Show this card prominently above the install instructions. 
Include a "I've turned it off" button that dismisses it 
and saves the preference to localStorage.
```

---

## PHASE 7 — Launch
**Time: 1 week**

### Before you launch checklist:

- [ ] Full flow tested end-to-end on your own iPhone
- [ ] Stripe in live mode (not test mode)
- [ ] Privacy policy page written (Cursor can generate it)
- [ ] Terms of service page (Cursor can generate it)
- [ ] Contact/support email set up
- [ ] Domain confirmed working

### How to get first users:

**Week 1:**
1. Write one blog post: "How fake casino apps bypass the App Store using TikTok ads (and how to block them)" — Cursor writes it, you edit it
2. Post it to: Reddit (r/Scams, r/personalfinance, r/privacy), Hacker News Show HN
3. Share in relevant Facebook groups and forums

**Week 2–4:**
1. Reach out to 10 gambling harm charities (GamCare UK, NCPG US) — offer free accounts for their clients
2. Write second post: "We analysed 500 fake casino ad relay domains. Here's what we found."
3. Submit to ProductHunt

---

## Total Timeline

| Phase | What | Time |
|---|---|---|
| 0 | Accounts setup | 2 hours |
| 1 | DNS resolver (Cloudflare Worker) | 2–3 days |
| 2 | Config profile generator | 1–2 days |
| 3 | Website (landing + dashboard + auth + payments) | 1–2 weeks |
| 4 | Deploy | 1 day |
| 5 | Blocklist maintenance | 2–3 days |
| 6 | Private Relay warning | 1 day |
| 7 | Launch | 1 week |
| **Total** | | **4–6 weeks** |

## Total Cost to Launch

| Item | Cost |
|---|---|
| Cloudflare Workers (free tier covers ~500 users) | $0 |
| Supabase (free tier covers ~500 users) | $0 |
| Vercel (free tier) | $0 |
| Domain name | ~$10/yr |
| Stripe (pay per transaction, 2.9% + 30¢) | $0 upfront |
| Cursor | $0 (free tier) |
| **Total to launch** | **~$10** |

## When You Get Stuck

**Code error:** Paste the full error into Cursor: "I got this error: [paste error]. Here is the code: [paste code]. Fix it."

**Cloudflare Worker not working:** Go to Workers → your worker → **Logs** tab — shows real-time errors.

**Stripe payments not working:** Make sure you're using test mode keys during development. Check Stripe Dashboard → **Events** for webhook errors.

**Profile not installing on iPhone:** Must be opened in Safari specifically (not Chrome). Must use MIME type `application/x-apple-aspen-config`.

**Supabase auth issues:** Check Supabase Dashboard → **Authentication → Logs** for errors.
