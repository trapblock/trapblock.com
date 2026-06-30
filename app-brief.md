# App Brief — Focus & Gambling Blocker

## Concept

A screen time and focus app for iOS with a unique differentiator: the only blocker that stops gambling apps and sites at the network level — before they reach the phone — including cloaked ads, App Store redirects, and fake PWA installs from social media.

Positioned as a general focus/productivity tool (competing with Opal, AppBlock) with a best-in-class gambling addiction layer that no competitor has.

---

## The Problem It Solves

**General:** People can't stay off distracting apps and sites. Existing willpower isn't enough.

**Specific (the differentiator):** Gambling operators run cloaked ads on TikTok and Meta that redirect users through relay domains to the App Store or fake "app store" pages that install gambling PWAs. No consumer app currently blocks this flow.

---

## How the Blocking Works (3 layers, no VPN needed)

| Layer | What it does | API |
|---|---|---|
| DNS filtering | Blocks gambling/relay domains system-wide — applies inside TikTok, Meta, Safari, every app | `NEDNSSettingsManager` |
| Safari URL blocker | Catches path-level redirects DNS can't see, blocks by full URL pattern | Safari Content Blocker |
| App install lock | Prevents installing 17+ apps, restricts "Add to Home Screen" (PWA installs) | Family Controls / Screen Time API |

DNS is OS-level — it intercepts every domain lookup regardless of which app or in-app browser made the request. When a user clicks a gambling ad in TikTok, the relay domain is blocked before the redirect chain can complete.

---

## Features

### Blocking
- **Block any app** — user picks from their installed apps via Apple's native picker (FamilyActivityPicker). One tap to block.
- **Block any website category** — gambling, social media, adult, news, gaming. Toggle per category. DNS + Safari Content Blocker handles both.
- **Gambling-specific layer** — maintained blocklist of 50k+ gambling domains, fake app store domains, and known cloaker relay domains. Updated continuously.
- **PWA install blocking** — prevents fake "app store" sites from installing Progressive Web Apps. Unique to this app.
- **Redirect / cloaking blocking** — catches the relay domains used in gambling ad flows on TikTok and Meta before the App Store redirect fires.

### Focus & Scheduling
- **Focus sessions** — start a timed block (25 min, 1hr, custom). Timer runs, block activates automatically.
- **Strict / Deep Focus mode** — can't disable the block for X hours. Like Opal's Deep Focus. Enforced by a countdown lock on settings.
- **Scheduled blocking** — set recurring blocks by time of day and day of week (work hours, bedtime, weekends). Activates automatically.
- **Profiles / presets** — saved configurations: Work, Sleep, Digital Detox, Gambling-free. One tap to switch.

### Motivation & Retention
- **Streak tracking** — days without gambling / days focused. Resets on breach.
- **Milestones and badges** — 7 days, 30 days, 90 days clean. Shown on the home screen.
- **Block counter** — shows how many gambling sites/apps have been blocked today, this week, this month.
- **Smart nudges** — scheduled notifications: "You've been gambling-free for 7 days", "Bedtime block starts in 10 minutes".
- **Home screen widget** — current streak, today's blocks, active session status.

---

## What Gets Skipped in MVP

| Feature | Why |
|---|---|
| Android | Separate codebase. iOS first, fund Android from revenue. |
| Location-based blocking | CoreLocation + geofencing = significant complexity. Post-traction. |
| Social leaderboard / friends | Needs user accounts + backend. Validate retention first. |
| NEURLFilter (full URL chain inspection) | Requires Apple PIR server approval (weeks). DNS covers 90%+ of cases. |

---

## Technical Stack

### iOS App
- Swift + SwiftUI
- `NEDNSSettingsManager` — encrypted DNS (DoH), points device to your resolver
- `FamilyControls` + `ManagedSettingsStore` — app blocking, App Store install lock
- `DeviceActivitySchedule` — auto-activate/deactivate blocks on schedule
- `DeviceActivityReport` (extension) — usage stats UI
- Safari Content Blocker (extension) — URL-level blocking in Safari
- WidgetKit (extension) — home screen widget
- `UNUserNotificationCenter` — nudges and reminders
- SwiftData — local storage for streaks, profiles, settings

### Backend (Cloudflare Workers)
- DoH resolver — checks every DNS query against blocklist, returns NXDOMAIN for blocked domains
- KV store — blocklist of 50k+ domains, instant updates without app release
- Blocklist update pipeline — daily pull from public feeds + user-reported domains + manual additions
- Admin API — push new domains live in seconds

### Blocklist Sources (Day 1, free)
- OISD Full list
- uBlock Origin gambling filter
- Steven Black hosts (gambling category)
- Malwarebytes FriendlyDealer dump (fake app store / PWA domains)
- Cybernews scam PWA domain list

---

## What Needs a Developer (1 day, one-time)

The app is mostly vibecoding-friendly. A developer is needed once, at the start, to set up the Xcode project skeleton:

1. Entitlements: DNS Settings capability + Family Controls entitlement (Apple approval)
2. App extension targets: Safari Content Blocker, DeviceActivityReport, WidgetKit
3. Confirm build + deploy to real device (NetworkExtension doesn't run in Simulator)

After that, all feature code is pure SwiftUI and is fully vibecoding-friendly.

**Estimated dev setup cost:** $500–800 (one day).

---

## Build Timeline

| Weeks | Work |
|---|---|
| 1 | Cloudflare Worker DoH resolver + KV blocklist |
| 2 | NEDNSSettingsManager integration, DNS blocking live on device |
| 3 | Safari Content Blocker + Family Controls app/install blocking |
| 4 | Focus sessions, schedules, profiles |
| 5 | Streak tracking, badges, block counter, notifications |
| 6 | Usage stats (DeviceActivityReport) + widget |
| 7–8 | Onboarding UI, PIN/strict mode, QA, App Store submission |
| 9 | **MVP ships** |

---

## Cost Estimate

| Item | Cost |
|---|---|
| Developer setup (1 day, entitlements + extension targets) | $500–800 |
| iOS dev vibecoding support (part-time review, 8 weeks) | $2–4k |
| Cloudflare Workers (monthly infrastructure) | $10–50/mo |
| Apple Developer account | $99/yr |
| **Total MVP** | **~$3–5k** |

---

## Positioning

**Tagline ideas:**
- *"Block gambling before it reaches your phone."*
- *"The focus app that actually stops gambling ads."*
- *"Opal for people who need it most."*

**Target user:** Someone with a gambling problem (or a parent/partner of one) who wants a self-exclusion tool that works at the network level — not just an app they can uninstall when cravings hit.

**Secondary user:** Anyone who wants a general focus/productivity blocker (social media, games, news) and values the added protection depth.

**Monetization:** Subscription — $4.99/month or $39.99/year. Gambling addiction is a high-intent problem. Users are motivated to pay.
