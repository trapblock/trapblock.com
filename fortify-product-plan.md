# Fortify — Product Plan
*Gambling Blocker & Focus App for iOS*

---

## App Identity

**Name:** Fortify  
**Tagline:** Block gambling before it reaches your phone.  
**Category:** Health & Fitness (App Store)  
**Platform:** iOS 16+  
**Monetization:** $4.99/mo or $39.99/yr subscription  
**Primary user:** Person with a gambling problem seeking self-exclusion  
**Secondary user:** General focus/productivity user (social media, gaming, news blocking)

---

## Visual Direction

- **Tone:** Clean & minimal — Opal-inspired white aesthetic
- **Typography:** SF Pro Display (large numbers), SF Pro Text (body)
- **Colors:** White background, deep navy accent (#1A2B4A), success green (#22C55E), alert red (#EF4444), streak gold (#F59E0B)
- **Icons:** SF Symbols throughout
- **Key visual:** Shield motif — "you are protected" feeling

---

## Information Architecture

```
Fortify
├── Tab 1: Home
│   ├── Streak hero (days clean, large number)
│   ├── Protection status pill (Protected / Not Active)
│   ├── Block counter (X blocked today)
│   └── Quick actions (Start Focus Session, View Progress)
│
├── Tab 2: Block
│   ├── DNS Layer toggle (Gambling Block Active)
│   ├── Category toggles (Gambling, Social, Gaming, News, Adult)
│   ├── App blocker (FamilyActivityPicker)
│   ├── Install lock (App Store 17+ restriction)
│   └── Deep Lock (config profile, supervised mode)
│
├── Tab 3: Progress
│   ├── Streak calendar heatmap
│   ├── Milestones / badges grid
│   ├── Stats (sites blocked this week/month, sessions completed)
│   └── Usage report (screen time, top apps)
│
└── Tab 4: Settings
    ├── Schedules (recurring blocks by time/day)
    ├── Profiles (Work, Sleep, Gambling-free, Custom)
    ├── Notifications
    ├── Accountability contact
    ├── PIN & security
    └── Subscription

Special Screens (appear contextually)
├── Onboarding (5 screens, first launch)
├── Craving Intercept (shown on block fire / manual trigger)
├── Milestone Celebration (full-screen, on milestone unlock)
├── Focus Session Active (countdown, PIN to cancel)
└── Deep Lock Setup Guide (step-by-step supervised mode)
```

---

## Screen Specifications

### Onboarding Flow (5 screens)

**Screen 1 — Welcome**
- Hero: Shield illustration (SF Symbol `lock.shield.fill`, large, navy)
- Headline: "Block gambling before it reaches your phone."
- Subtext: "Fortify stops gambling at the network level — before it reaches any app or browser on your device."
- CTA: "Get Started" button (full-width, navy)

**Screen 2 — What's your goal?**
- Headline: "What brings you here?"
- 3 option cards (tap to select):
  - 🎰 "Stop gambling" (primary, pre-selected)
  - 📱 "Reduce screen time"
  - 🎯 "Stay focused at work"
- Subtext: "We'll tailor the app to your goal."
- CTA: "Continue"

**Screen 3 — What to block**
- Headline: "What should Fortify block?"
- Category pill toggles (pre-selected based on goal):
  - Gambling sites & apps ✓
  - App Store installs (17+) ✓
  - Social media (optional)
  - Online gaming (optional)
  - News (optional)
- CTA: "Continue" / "Skip"

**Screen 4 — Set a PIN**
- Headline: "Set a PIN to protect your settings."
- Subtext: "This prevents you from turning off the blocker when cravings hit."
- 4-digit custom numpad (no keyboard)
- Enter twice to confirm
- Small print: "You can change this later. Don't skip — this is your safety net."
- CTA: "Set PIN" / "Skip (not recommended)"

**Screen 5 — Activate Protection**
- Headline: "You're almost protected."
- Two permission rows with status icons:
  - DNS Blocker — [Activate] button → calls `DNSManager.enableDNS()`
  - Family Controls — [Allow] button → requests FamilyControls permission
- Both turn green with checkmarks when granted
- CTA: "Start protecting" (enabled when both granted)
- After tap: sets `onboardingComplete = true`, shows Home tab

---

### Home Tab

**Layout (top to bottom):**

1. **Streak Hero** — centered, large
   - Number: current streak in days (e.g., "7")
   - Label: "days gambling-free" (or "days clean")
   - Subtext: "Longest: 23 days" (personal best, smaller gray)
   - Color: gold/amber when streak > 0; neutral gray if 0

2. **Protection Status Pill** — centered below streak
   - Green pill: "🛡 Protected" when DNS active
   - Red pill: "⚠️ Not Active" when DNS off
   - Tap → goes to Block tab

3. **Block Counter Card** — below status
   - "47 gambling sites blocked today"
   - Subtext: "2,341 this month"
   - Small icon: shield with X

4. **Quick Actions Row**
   - "Start Focus Session" button → Focus Session screen
   - "I'm having a craving" button → Craving Intercept screen (subtle, secondary style)

5. **Bottom Nav:** Home | Block | Progress | Settings

---

### Block Tab

**Section 1 — Protection Layers**
- Large toggle: "Gambling Block" (ON/OFF)
  - ON: green, activates DNS + Safari Content Blocker
  - OFF: requires PIN entry first, then 1-hour grace period before streak resets
- Sub-rows (all tied to main toggle):
  - DNS Layer — "Blocks in every app & browser" ✓
  - Safari Blocker — "URL-level catch for Safari" ✓
  - Install Lock — "Prevents 17+ app installs" ✓

**Section 2 — Block Categories**
- Row toggles with icons:
  - 🎰 Gambling (50k+ domains, always-on core)
  - 📱 Social Media (Instagram, TikTok, Twitter, Facebook)
  - 🎮 Gaming (Steam, Twitch, game sites)
  - 📰 News
  - 🔞 Adult content

**Section 3 — Block Specific Apps**
- Button: "Choose apps to block →" → presents FamilyActivityPicker sheet
- List of currently blocked apps with remove buttons

**Section 4 — Deep Lock**
- Card with navy background
- "Deep Lock — make it permanent"
- Subtext: "Install a device profile that can't be removed without wiping your phone."
- Button: "Set up Deep Lock →" → Deep Lock Setup Guide

---

### Progress Tab

**Section 1 — Streak Calendar**
- GitHub-style heatmap (7 cols × N rows)
- Green = clean day, gray = no data, red = breach day
- Current month visible, scroll up for history

**Section 2 — Milestones**
- Grid of 6 badges:
  - 🌱 1 Day — "First step"
  - 🔥 7 Days — "One week"
  - 💪 30 Days — "One month"
  - ⭐ 90 Days — "Three months"
  - 🏆 180 Days — "Half a year"
  - 👑 365 Days — "One year"
- Locked: gray, blurred icon
- Unlocked: color, date achieved shown below

**Section 3 — Stats Cards**
- Row 1: "Sites blocked this week: 312" | "This month: 1,847"
- Row 2: "Focus sessions completed: 8" | "Total focus time: 6h 20m"

**Section 4 — Screen Time** (DeviceActivityReport extension)
- "Screen time today: 3h 14m"
- Bar: vs. last week average (4h 20m) → "1h 6m reclaimed"
- Top 5 apps with time bars

---

### Focus Session Active Screen

- **Full screen, minimal**
- Large countdown timer (e.g., "47:23")
- Label: "Focus Session Active"
- Status: "Gambling block: ON" (green)
- Dim "Cancel" button at bottom
- Tap Cancel → PIN entry required → if correct, shows confirmation dialog
- On completion: celebration animation + streak update

---

### Craving Intercept Screen

Shown when:
- User taps "I'm having a craving" on Home
- (Future: when DNS blocks a gambling domain — shows overlay)

**Layout:**
- Soft navy background (calming, not alarming)
- **Current streak:** "You're 7 days clean. Don't stop now." (gold text, top)
- **Breathing ring animation:** Expanding/contracting circle
  - 4 seconds inhale → 7 hold → 8 exhale (4-7-8 pattern)
  - Label changes: "Breathe in..." / "Hold..." / "Breathe out..."
  - Countdown: 15:00 timer ticking down
- **"Your why":** User's saved reason for quitting (e.g., "For my kids")
- **Bottom actions:**
  - Primary: "Message my accountability partner" → opens pre-written iMessage
  - Secondary: "Get help now" → GamCare 0808 8020 133 (UK) / NCPG 1-800-522-4700 (US)
- Small X dismiss (top right) — available but not prominent

---

### Milestone Celebration Screen

- Full-screen modal
- Large badge icon (animated, scale in)
- "🎉 30 Days Gambling-Free!"
- "You've been protecting yourself for a full month."
- Confetti animation
- Share button: "Share my milestone" → generates shareable image (no personal data)
- Dismiss: "Keep going →"

---

### Deep Lock Setup Guide

Step-by-step instructions (5 cards, swipeable):
1. Download Apple Configurator 2 on your Mac
2. Connect iPhone via USB, trust the computer
3. In Configurator: Prepare → Supervise
4. Fortify detects supervised mode — Deep Lock activates
5. "You're now fully protected. Profile cannot be removed without wiping the device."

---

## User Journeys

### Journey 1 — First-Time Gambling Addict

1. **Discovery:** Finds Fortify searching "gambling blocker" or "self exclusion app"
2. **Download:** App Store → installs
3. **Onboarding:** Goal = "Stop gambling" → blocks gambling + App Store 17+ → sets PIN → activates DNS + Family Controls
4. **Day 1:** Streak starts. Home shows "1 day clean."
5. **Day 3 — Craving:** Tries to open gambling site in Safari → blank page. Opens Fortify → taps "I'm having a craving" → breathes through it → messages accountability partner
6. **Day 7 — Milestone:** App opens → full-screen "7 Days!" celebration → badge unlocked → push notification: "You're doing amazing."
7. **Day 30 — Deep Lock:** Decides they want stronger lock → sets up supervised mode → now even Fortify can't be uninstalled without wiping phone
8. **Day 90+:** Habit formed. App recedes into background. Streak counter is motivation to maintain.

### Journey 2 — Daily Use (established user)

- **Morning:** Widget shows "23 days clean" + "Protected" on home screen
- **Work hours:** Schedule activates automatically — social media blocked 9am–5pm
- **Evening:** Schedule deactivates. Notification: "Work block ended. You reclaimed 1h 20m today."
- **Week:** Sunday evening notification: "This week: 847 gambling sites blocked. 23-day streak continues."

---

## Blocking Architecture

### Layer 1 — DNS (NEDNSSettingsManager)
- Scope: ALL apps, ALL browsers, ALL WKWebViews (TikTok, Meta)
- How: Device sends all DNS queries to Cloudflare Worker
- Worker checks domain against KV blocklist (50k+ gambling domains)
- Returns NXDOMAIN for blocked domains → app/browser gets "cannot connect"
- Catches: cloaking relay domains, fake app store domains (FriendlyDealer list)

### Layer 2 — Safari Content Blocker (Extension)
- Scope: Safari browser only
- How: JSON rules that block URL patterns (not just domains)
- Catches: path-level redirects that DNS can't see
- Updates: main app can push new rules without App Store release

### Layer 3 — Family Controls (FamilyActivityPicker + ManagedSettingsStore)
- Scope: App blocking + App Store install restriction
- How: User selects apps via Apple's native picker → app shields them
- Install lock: Restricts App Store to apps rated 12+ (blocks gambling apps rated 17+)
- Catches: App Store installs from redirect flows

### Layer 4 — Config Profile (.mobileconfig)
- Scope: Device-wide, survives app deletion
- How: App generates .mobileconfig XML → user installs via Safari
- Contains: DNS settings + VPN creation block
- Catches: Users who delete the app or try to use a VPN to bypass DNS

---

## Feature Priority

### MVP (Weeks 1–8)
- DNS blocking (gambling domains)
- Safari Content Blocker
- App blocking (FamilyActivityPicker)
- App Store install lock
- PIN protection
- Streak tracking (days clean)
- Block counter
- Basic notifications (streak reminder, milestone)
- Onboarding flow
- Home screen widget (small)

### V1.1 (post-launch)
- Focus sessions with timer
- Scheduling (recurring blocks)
- Profiles (Work, Sleep, Gambling-free)
- Craving intercept screen
- Deep Lock (config profile)
- Milestone badges
- Usage stats (DeviceActivityReport)
- Accountability partner messaging

### V2.0 (post-traction)
- Android
- Community / social features
- Therapist/partner monitoring mode
- Location-based blocking

---

## Monetization

**Free tier:** DNS gambling block (always on), basic streak, 1 app blocked

**Subscription ($4.99/mo or $39.99/yr):**
- Unlimited app blocking
- All category toggles
- Focus sessions + scheduling
- Profiles
- Deep Lock
- Craving intercept
- Widget

---

## App Store Submission

**Category:** Health & Fitness  
**Age rating:** 4+  
**Keywords:** gambling blocker, self exclusion, focus app, screen time, gambling addiction, bet blocker  
**Privacy:** No personal data, no browsing history, anonymous block counts only

---

## Cost Summary

| Item | Cost |
|---|---|
| Apple Developer Account | $99/yr |
| Cloudflare Workers | $0–$50/mo |
| iOS dev — 1 day Xcode setup | $150–200 |
| Cursor (vibecoding) | Free |
| **Total MVP** | **~$300–400** |
