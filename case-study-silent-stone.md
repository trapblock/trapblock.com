# Case Study: How a Fake Casino App Bypassed the App Store Using TikTok Ads
*Documented: June 29, 2026*

---

## What We Found

While testing TrapBlock (a DNS-based gambling ad blocker), we clicked on a TikTok ad and captured the full redirect chain used by a fake casino operator to bypass App Store review and reach users directly.

---

## The Attack Chain

**Step 1 — The TikTok Ad**
A paid TikTok ad runs targeting users in Poland (and likely other markets). The ad creative promotes what appears to be a mobile game.

- Ad platform: TikTok
- Campaign name (from URL): "Copy 1 of Copy 1 of Copy 1 of Copy 1 of Sales20260623030101"
- Ad group: "Ad group 20260626062616"
- Creative: bigbass (slot machine theme)
- TikTok Click ID (ttclid): captured in URL parameters
- Date first seen: June 26, 2026

**Step 2 — The Relay Domain (Cloaking)**
Clicking the ad does not go directly to the App Store. Instead it routes through a relay domain:

```
https://shopquesthaven500.info/?ttclid=E_C_P_...&utm_source=tiktok
```

- Relay domain: `shopquesthaven500.info`
- Registrar: Cloudflare (IPs: 188.114.97.11, 188.114.96.11)
- Purpose: cloaking — hides the true destination from TikTok's ad review system
- Tracking parameters present: ttclid, pixel_fb, sub_id_2 through sub_id_7, utm_campaign, utm_medium, utm_source

This is the cloaking step. TikTok's ad review bots see a generic landing page. Real users get redirected to the App Store.

**Step 3 — The App Store Destination**
The relay redirects to:

```
https://apps.apple.com/pl/app/silent-stone/id6766202167
```

- App name: Silent Stone
- App Store ID: 6766202167
- Country: Poland (pl)
- Category: appears to be a game, almost certainly contains casino mechanics

---

## Why This Works (The Exploit)

**Against TikTok's review system:**
TikTok scans ad landing pages for prohibited content (gambling). By routing through `shopquesthaven500.info`, the operator shows TikTok a clean page and shows real users the casino app install page. This is called "cloaking."

**Against Apple's App Store review:**
The app itself may pass initial App Store review by hiding casino features behind a login, age gate, or server-side flag. The gambling content activates only after install.

**Against traditional blocklists:**
The relay domain `shopquesthaven500.info` was not present in any major public blocklist (StevenBlack, OISD, uBlock) at the time of discovery. These lists lag days to weeks behind newly registered relay domains.

---

## How TrapBlock Blocked It

TrapBlock operates at the DNS layer — before any web request is made. When the user's device tried to resolve `shopquesthaven500.info`:

1. Device sends DNS query for `shopquesthaven500.info`
2. TrapBlock's DNS resolver checks the domain against the blocklist
3. Domain found → returns NXDOMAIN (domain does not exist)
4. Device never connects to the relay → App Store page never loads
5. User sees: connection failed

The block works inside TikTok's in-app browser, Safari, Chrome, and every other app on the device — because it operates at the OS DNS level, not inside a specific browser.

---

## Indicators of Compromise (IOCs)

| Type | Value |
|------|-------|
| Relay domain | shopquesthaven500.info |
| Relay IP | 188.114.97.11 |
| Relay IP | 188.114.96.11 |
| App Store ID | 6766202167 |
| App name | Silent Stone |
| TikTok pixel | D8RSCIRC77U6G5SH5C80 |
| Ad platform | TikTok |
| First seen | June 26, 2026 |

---

## Second Campaign — Same Operator, Different App

A second TikTok ad was found on the same day using an identical cloaking structure:

**Relay domain:** `gamespotjourney.top`
**App Store destination:** `https://apps.apple.com/pl/app/symbionyx/id6769332720`
**App name:** Symbionyx
**App Store ID:** 6769332720
**TikTok pixel:** D8QQVOJC77U677EP1UUG

The TikTok pixel IDs from both campaigns share the `D8` prefix, strongly suggesting the same operator is running Silent Stone and Symbionyx simultaneously under different relay domains.

| Type | Value |
|------|-------|
| Relay domain | gamespotjourney.top |
| App Store ID | 6769332720 |
| App name | Symbionyx |
| TikTok pixel | D8QQVOJC77U677EP1UUG |
| First seen | June 29, 2026 |

## Other Relay Domains Found Same Day

Two additional relay domains were discovered from TikTok casino ads with no known App Store destination yet:

- `nertix.fun` — not in any public blocklist at time of discovery
- `wyraxis.space` — not in any public blocklist at time of discovery

All domains share the same hosting pattern (Cloudflare CDN IPs: 188.114.96.x / 188.114.97.x) and the same ad redirect structure. This IP range appears to be the preferred hosting infrastructure for this cloaking network.

---

## What This Means for Users

A user who sees this TikTok ad and clicks it will:
1. Be taken to what looks like a legitimate game in the App Store
2. Install the app (free, no friction)
3. Encounter casino mechanics inside the app
4. Potentially spend money on in-app purchases before realizing it is gambling

Users with gambling addiction are specifically targeted — the ad creative uses slot machine imagery ("bigbass" = Big Bass, a popular fishing slot game brand) which is a known trigger.

---

## Article Angles

**Technical:** "Inside a TikTok casino ad cloaking operation — how relay domains bypass platform review"

**Consumer:** "You clicked a TikTok ad. Here's what happened before you reached the App Store."

**Advocacy:** "Fake casino apps are targeting gambling addicts through TikTok. Here's the evidence."

**SEO targets:** gambling blocker, casino ad cloaking, TikTok gambling ads, fake casino apps App Store, gambling relay domains

---

*Documented by TrapBlock — trapblock.com*
*All IOCs are real and captured during live testing on June 29, 2026.*
