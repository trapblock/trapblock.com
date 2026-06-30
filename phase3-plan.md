# TrapBlock — Phase 3: Website & Launch Plan
*Step-by-step for beginners. No admin access required.*

---

## The Goal

Turn what you built (DNS resolver + config profile) into something people can buy.
Model: Tech Lockdown — content-first, SEO-driven, subscription product.

---

## Overview: 4 Sub-Phases

| Sub-Phase | What | Time | Cost |
|---|---|---|---|
| 3a | Landing page (no code) | 2–3 days | $0 |
| 3b | Payment + profile delivery | 1 day | $0 |
| 3c | Proper website with auth + dashboard | 2–3 weeks | $0 |
| 3d | Blog + SEO content engine | Ongoing | $0 |

---

## PHASE 3a — Landing Page
**Time: 2–3 days | Tool: Framer (free, no code, no install)**

### Why Framer?
- No coding. Drag and drop.
- Deploys to a real URL in one click.
- Free tier covers everything you need now.
- Later you can migrate to Next.js — or keep it in Framer forever.

### Step 3a.1 — Create Framer account
1. Go to framer.com → Sign up with your Google account
2. Click **New Project** → choose **Blank**
3. Name it "TrapBlock"

### Step 3a.2 — Build the landing page
One page with these sections (in order):

**Hero:**
- Headline: "Block Fake Casino Ads Before They Reach Your Phone"
- Subtext: "TrapBlock stops cloaked gambling ads at the DNS level — inside TikTok, Instagram, Safari, and every app on your device."
- Button: "Start Free Trial" (links to Stripe — you'll add this in Phase 3b)

**How it works (3 steps):**
1. Subscribe on this page
2. Download your protection profile (30 seconds)
3. Install it — you're protected everywhere

**What it blocks:**
- Cloaked casino relay domains from TikTok ads
- Fake App Store casino installs
- 90,000+ known gambling and fraud domains
- Works inside TikTok, Instagram, Facebook — not just Safari

**Proof (use your case study):**
- "We found a live TikTok ad redirecting to a fake casino app. TrapBlock blocked it automatically."
- Show the relay chain: TikTok ad → shopquesthaven500.info → [BLOCKED]

**Pricing:**
- €4.99/month or €39.99/year
- 7-day free trial
- Works on iPhone, iPad, Mac, Android, Windows

**FAQ:**
- Does it work inside TikTok? Yes — it operates at the OS DNS level
- Does it slow my internet? No — it adds <5ms to DNS lookups
- Can I bypass it? No — it works at the network level, not inside a browser
- What if a site is wrongly blocked? Email us and we add it to the whitelist within 24h

**Footer:**
- Email: support@trapblock.com
- Privacy Policy (link — generate with Cursor later)
- Terms (link — generate with Cursor later)

### Step 3a.3 — Connect your domain
1. In Framer → Settings → Custom Domain
2. Add trapblock.com
3. Follow Framer's DNS instructions (you'll update DNS in Namecheap)

**✓ Done when:** trapblock.com shows your landing page.

---

## PHASE 3b — Payment + Profile Delivery
**Time: 1 day | Tools: Stripe + Gmail**

### The manual MVP approach
Before building automation, validate that people will pay. 
First 10 customers: handle manually. That's fine.

### Step 3b.1 — Create Stripe payment link
1. Go to dashboard.stripe.com → make sure you're in **Live mode** (not test)
2. **Products → Add product**
   - Name: TrapBlock Monthly
   - Price: €4.99 / month / recurring
3. **Payment Links → Create link**
   - Add your Monthly product
   - Add a 7-day free trial
   - Collect: Email address
4. Copy the link → paste it into your Framer "Start Free Trial" button
5. Repeat for annual: €39.99/year

### Step 3b.2 — Manual profile delivery
When someone subscribes:
1. Stripe sends you an email notification
2. You reply to the customer with the .mobileconfig file attached
3. Include install instructions (copy from the template below)

**Email template:**
```
Subject: Your TrapBlock Protection Profile

Hi,

Thank you for subscribing to TrapBlock!

Attached is your protection profile. To install:

iPhone/iPad:
1. Open this email on your iPhone in Safari (not Chrome)
2. Tap the attached .mobileconfig file
3. Go to Settings → Profile Downloaded → Install
4. Enter your passcode and confirm

Mac:
1. Open the .mobileconfig file
2. Go to System Settings → Privacy & Security → Profiles → Install

After installing, your device will block fake casino ads and gambling relay 
domains automatically — in every app, including TikTok and Instagram.

If you have any issues, reply to this email.

TrapBlock Team
```

### Step 3b.3 — Create a generic profile to send
Run this in Terminal (updated with your real domain):

```python
python3 << 'EOF'
profile = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerURL</key>
                <string>https://trapblock-dns.hidden-block-0f73.workers.dev/dns-query</string>
            </dict>
            <key>PayloadDisplayName</key>
            <string>TrapBlock DNS</string>
            <key>PayloadIdentifier</key>
            <string>com.trapblock.dns.settings</string>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadUUID</key>
            <string>C3D4E5F6-A7B8-9012-CDEF-012345678901</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>TrapBlock Protection</string>
    <key>PayloadIdentifier</key>
    <string>com.trapblock.profile</string>
    <key>PayloadOrganization</key>
    <string>TrapBlock</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>D4E5F6A7-B8C9-0123-DEFA-123456789012</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>'''

with open('/Users/rabota1/Desktop/trapblock-protection.mobileconfig', 'w') as f:
    f.write(profile)
print('Saved: trapblock-protection.mobileconfig')
EOF
```

Keep this file on your Desktop. Send it to each new customer manually.

**✓ Done when:** Someone can pay on trapblock.com and receive the profile by email.

---

## PHASE 3c — Proper Website
**Time: 2–3 weeks | Tool: Cursor (once you have admin access)**

This automates everything from Phase 3b and adds a user dashboard.

### Pages to build:
- `/` — landing page (migrate from Framer or rebuild in Next.js)
- `/pricing` — pricing page
- `/dashboard` — after login: download profile, device instructions, subscription status
- `/blog` — blog/article listing
- `/blog/[slug]` — individual articles
- `/guides` — setup guides per device
- `/api/generate-profile` — generates .mobileconfig for logged-in user
- `/api/webhook` — handles Stripe subscription events

### What gets automated:
- User signs up → Supabase creates account
- User pays → Stripe webhook marks subscription active
- User logs into dashboard → downloads their profile (unique per user)
- User's trial ends → Stripe handles billing automatically

### Database tables (Supabase):
- `users` — id, email, subscription_status, trial_ends_at
- `reported_domains` — domain, user_id, source, status (pending/approved/rejected)
- `candidate_domains` — domains auto-detected by the worker pattern matching

**Build order within Phase 3c:**
1. Set up Next.js project in Cursor
2. Landing page
3. Supabase auth (login/signup)
4. Stripe checkout + webhook
5. Dashboard with profile download
6. Device setup instructions
7. Domain reporting form

---

## PHASE 3d — Blog + SEO Content Engine
**Time: Ongoing | Tool: Cursor + your brain**

This is how Tech Lockdown gets free traffic. It should run parallel to everything else.

### Content structure (copy Tech Lockdown's model):

**Guides** (evergreen, high SEO value):
- How to block gambling ads on iPhone
- How to block casino ads on TikTok
- What is DNS-over-HTTPS and how does it protect you?
- How fake casino apps bypass the App Store
- How to set up parental controls for gambling sites

**Blog** (news + analysis, builds authority):
- Your case study (already written): "Inside a TikTok casino ad cloaking operation"
- "We analysed 50 fake casino relay domains. Here's what they have in common."
- "Why traditional ad blockers don't stop casino relay ads"
- "How gambling operators bypass Apple's App Store review"

**Tools** (drives links + traffic):
- Relay domain checker: enter a URL, we tell you if it's a known casino relay
- TikTok ad risk checker: paste a URL, we show its risk score

### SEO targets:
- gambling blocker
- block casino ads iPhone
- TikTok casino ads
- fake casino apps App Store
- DNS gambling block
- self exclusion app
- casino ad blocker

### AI citation strategy (how to get cited by ChatGPT/Perplexity):
1. Write detailed, factual articles with real data (your relay domain research)
2. Add structured data (schema markup) to every page
3. Create an llms.txt file at trapblock.com/llms.txt listing your key content
4. Get mentioned on Reddit (r/Scams, r/privacy, r/gambling) — AI pulls from Reddit heavily
5. Submit to HARO for journalist quotes on gambling/tech topics

---

## Start Today (Without Admin Access)

**Day 1:** Create Framer account → build landing page
**Day 2:** Finish landing page → connect trapblock.com
**Day 3:** Set up Stripe payment links → add to landing page
**Day 4:** Write and publish your first blog post (the TikTok case study is already written)
**Day 5:** Share on Reddit r/Scams and r/privacy

You can have paying customers within 5 days with zero code.

---

## Tech Lockdown Comparison

| Feature | Tech Lockdown | TrapBlock MVP |
|---|---|---|
| DNS blocking | ✓ | ✓ (done) |
| Config profile | ✓ | ✓ (done) |
| Pattern auto-block | ✗ | ✓ (done — your advantage) |
| Landing page | ✓ | Phase 3a |
| Payment | ✓ | Phase 3b |
| Dashboard | ✓ | Phase 3c |
| Blog/guides | ✓ (50+ articles) | Phase 3d |
| AI citations | ✓ | Phase 3d |

Your technical product is already better than their baseline for gambling specifically.
The gap is content and distribution — which is Phase 3d.
