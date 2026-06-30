# How to Vibecode the Gambling Blocker App — Step by Step

## What You Need Before Starting

- Mac (required for Xcode)
- Apple Developer account — $99/yr at developer.apple.com
- iPhone for testing (Simulator won't work for this app)
- Cursor — cursor.com (best AI coding tool for Swift/iOS, free tier works)
- Cloudflare account — cloudflare.com (free)
- 1 hired iOS dev for setup day — find on Upwork, search "iOS NetworkExtension"

---

## How to Use This Guide

Each step has:
- What to do
- The exact Cursor prompt to use (copy-paste it)
- What to check before moving on

When Cursor gives you code: read the explanation, not just the code. If something breaks, paste the error back into Cursor and say "fix this error".

---

## PHASE 0 — One-Time Dev Setup (hire someone for this)
**Time: 1 day | Cost: $500–800**

This is the only part you can't vibecode. Give this list to the developer:

1. Create new Xcode project — iOS App, SwiftUI, Swift, bundle ID: `com.yourname.focusblocker`
2. Add capabilities in Signing & Capabilities:
   - Network Extensions → DNS Settings
   - Family Controls (apply for Apple entitlement first at developer.apple.com/contact/request/family-controls-distribution)
3. Add 3 extension targets:
   - Safari Content Blocker Extension
   - DeviceActivity Report Extension
   - Widget Extension
4. Create `Shared` group with App Groups entitlement so main app and extensions share data
5. Confirm it builds and runs on your iPhone (even if blank)
6. Push to a GitHub repo and give you access

**After this day, you take over. Everything from here is vibecoding.**

---

## PHASE 1 — Backend: Cloudflare Worker DNS Resolver
**Time: 1–2 days | Tool: Cursor (JavaScript)**

### Step 1.1 — Create the Worker

1. Go to cloudflare.com → Workers & Pages → Create Worker
2. Open Cursor, create a new file called `worker.js`
3. Paste this prompt:

```
Build a Cloudflare Worker that acts as a DNS-over-HTTPS (DoH) resolver.

Requirements:
- Accept DoH requests at GET /dns-query?name=DOMAIN&type=A
- Also accept POST /dns-query with application/dns-message body
- Check the queried domain against a KV namespace called BLOCKLIST
- If domain is in BLOCKLIST, return NXDOMAIN response
- Otherwise, forward the query to 1.1.1.1 (Cloudflare DNS) and return the result
- Also check parent domains (e.g. if sub.evil.com is queried, also check evil.com)
- Add CORS headers
- Return proper DNS wire format for POST requests, JSON for GET requests

Use Cloudflare Workers KV for the blocklist. The KV binding is named BLOCKLIST.
```

4. Paste the code into your Cloudflare Worker editor
5. Create a KV namespace called `BLOCKLIST` in Cloudflare dashboard → Workers → KV
6. Bind it to your worker (Settings → Variables → KV Namespace Bindings)
7. Deploy

### Step 1.2 — Seed the blocklist

In Cursor, create `seed-blocklist.js` with this prompt:

```
Write a Node.js script that:
1. Downloads these blocklists:
   - https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/gambling/hosts
   - https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt (extract gambling domains only)
2. Parses them into a clean list of domains (no comments, no IPs, no duplicates)
3. Uploads each domain to a Cloudflare KV namespace via the Cloudflare API
   - Account ID: YOUR_ACCOUNT_ID
   - KV Namespace ID: YOUR_KV_ID
   - API Token: YOUR_API_TOKEN
4. Prints progress every 100 domains

Use the Cloudflare KV bulk write API (max 10,000 keys per request).
```

Run it: `node seed-blocklist.js`

### Step 1.3 — Test it

Open your browser and go to:
`https://your-worker.your-subdomain.workers.dev/dns-query?name=bet365.com&type=A`

You should see NXDOMAIN in the response. If you see an IP address, the block isn't working.

**✓ Done when:** bet365.com returns NXDOMAIN, google.com returns an IP.

---

## PHASE 2 — iOS: DNS Blocking
**Time: 2–3 days | Tool: Cursor (Swift)**

Open your Xcode project in Cursor.

### Step 2.1 — DNS Settings Manager

Create a new file `DNSManager.swift` in Cursor and prompt:

```
Write a Swift class called DNSManager for an iOS app that uses NEDNSSettingsManager to configure the device to use a custom DNS-over-HTTPS server.

Requirements:
- The DoH server URL is "https://your-worker.workers.dev/dns-query"
- Function loadConfiguration() loads existing config from preferences
- Function enableDNS() saves and enables the DoH configuration
- Function disableDNS() removes the configuration
- Property isEnabled: Bool that returns current state
- Use async/await
- Handle errors gracefully

The app has the Network Extension DNS Settings capability enabled.
```

### Step 2.2 — Main toggle UI

Create `ContentView.swift` prompt:

```
Build a SwiftUI view for a focus/blocker app home screen.

Shows:
- A large toggle "Gambling Block Active" that calls DNSManager.shared.enableDNS() / disableDNS()
- Current status (green "Protected" or red "Not Active")
- A counter showing "X sites blocked today" (read from UserDefaults key "blockCount")
- A streak view showing "X days clean" (calculate from UserDefaults key "streakStartDate")
- A "Set PIN" button that navigates to a PIN setup screen

Use SwiftUI, clean minimal design, SF Symbols icons.
```

### Step 2.3 — PIN lock

Create `PINView.swift`:

```
Build a SwiftUI PIN entry and verification screen for a focus blocker app.

Requirements:
- 4-digit PIN entry using a custom numpad (not the keyboard)
- Two modes: setup (enter twice to confirm) and verify (enter once to unlock)
- Store PIN in UserDefaults (key: "appPIN")
- On verify success: call a completion handler
- On verify failure: shake animation + "Incorrect PIN" message
- No cancel button in verify mode (user cannot dismiss)

This is used to prevent the user from disabling the blocker.
```

**✓ Done when:** You can toggle DNS on your iPhone, visit bet365.com in Safari, and see it fail to load.

---

## PHASE 3 — Safari Content Blocker
**Time: 1 day**

Open the Safari Content Blocker extension target in Cursor.

### Step 3.1 — Content rules

In the extension's `ContentBlockerRequestHandler.swift`, prompt:

```
Complete this Safari Content Blocker extension for an iOS app.

The extension should:
1. Read a JSON file called "blocklist-rules.json" from the App Group container (group.com.yourname.focusblocker)
2. If the file doesn't exist, fall back to a bundled "default-rules.json"
3. Pass the rules to the completion handler

Also write the default-rules.json file that blocks these URL patterns:
- Any URL containing: bet365, betway, 888casino, pokerstars, draftkings, fanduel, williamhill, paddypower, coral, ladbrokes, betfair, bwin, unibet, sportingbet
- Any URL with query parameters: btag=, aff=, affid=, ref= combined with gambling keywords
- Resource type: document

Format as valid Safari Content Blocker JSON rules.
```

### Step 3.2 — Register the blocker from main app

In your main app, prompt:

```
Write a Swift function that uses SFContentBlockerManager to reload the Safari Content Blocker extension with identifier "com.yourname.focusblocker.ContentBlocker".

Call this function:
- On app launch
- After the blocklist is updated
- When the user enables the blocker

Handle errors and show a console log if it fails.
```

**✓ Done when:** Visiting a gambling site in Safari shows a blank page or Safari's "cannot open page" error.

---

## PHASE 4 — App & PWA Install Blocking
**Time: 1–2 days**

### Step 4.1 — App picker + blocking

Create `AppBlockManager.swift`:

```
Write a Swift class using the FamilyControls and ManagedSettings frameworks to block apps.

Requirements:
- Function requestAuthorization() requests Family Controls permission
- Store selected apps as FamilyActivitySelection in AppStorage
- Function applyBlock(selection: FamilyActivitySelection) shields the selected apps using ManagedSettingsStore
  - Shield them with a custom shield label "Blocked by Focus App"
  - Also restrict App Store to only allow apps rated 12+ or below (to prevent gambling app installs)
- Function removeBlock() clears all shields and restrictions
- The ManagedSettingsStore should be in an App Group so extensions can also access it

Import: FamilyControls, ManagedSettings, DeviceActivity
```

### Step 4.2 — App picker UI

```
Build a SwiftUI view that lets users select apps to block.

Shows:
- A button "Choose Apps to Block" that presents FamilyActivityPicker
- List of currently blocked apps (from stored FamilyActivitySelection)
- Toggle to also block App Store installs (17+ rating restriction)
- "Apply Block" button

Use FamilyActivityPicker for the selection UI — it's Apple's built-in picker.
Present it as a sheet.
```

**✓ Done when:** You can select Instagram, tap Apply, and Instagram shows a shield screen when you try to open it.

---

## PHASE 5 — Focus Sessions & Scheduling
**Time: 2 days**

### Step 5.1 — Focus session

Create `FocusSession.swift`:

```
Build a focus session feature for a screen time blocker app in SwiftUI.

A focus session:
- Has a duration (25 min, 45 min, 1 hr, 2 hr, custom)
- When started: activates the app block (call AppBlockManager.applyBlock) and DNS block (DNSManager.enableDNS)
- Shows a countdown timer on the home screen
- Cannot be cancelled unless user enters PIN (use PINView)
- When timer ends: shows a completion screen with streak update
- Saves session history to SwiftData (model: FocusSession with date, duration, completed: Bool)

Build the session start screen, active session screen with countdown, and completion screen.
```

### Step 5.2 — Scheduling

Create `ScheduleManager.swift`:

```
Build a scheduling system using DeviceActivitySchedule for a screen time blocker app.

Requirements:
- User can create schedules with: name, start time, end time, days of week (e.g. Mon–Fri)
- Schedules are stored in SwiftData (model: BlockSchedule)
- Function applySchedules() registers all active schedules with DeviceActivityCenter
- Each schedule activates app blocking when it starts and deactivates when it ends
- Use DeviceActivityName as an identifier for each schedule

Also build a SwiftUI list view showing all schedules with add/delete/toggle active.
```

### Step 5.3 — Profiles

```
Build a profiles system for a screen time blocker app in SwiftUI.

Profiles are named presets, each storing:
- Which apps to block (FamilyActivitySelection)
- Which website categories to block (Set<String>: "gambling", "social", "news", "gaming")
- Whether schedules are active
- Strict mode duration (0 = off, otherwise minutes)

Built-in presets: "Gambling-free", "Work Focus", "Sleep", "Digital Detox"
User can create custom profiles.

Build: profile list screen, profile detail/edit screen, one-tap activate button.
Store in SwiftData.
```

---

## PHASE 6 — Streaks, Badges & Notifications
**Time: 1–2 days**

### Step 6.1 — Streak engine

```
Build a streak tracking system in Swift for a gambling/focus blocker app.

Rules:
- Streak starts when user first enables the blocker
- Streak increments each day the blocker stays on
- If user disables the blocker, start a 1-hour grace period before resetting the streak
- Save to SwiftData: StreakRecord with startDate, currentStreak: Int, longestStreak: Int, lastActiveDate: Date

Build a StreakManager class with:
- func updateStreak() — call on app foreground
- func handleBlockDisabled() — starts grace timer
- func handleBlockReEnabled() — cancels grace timer
- var currentStreak: Int
- var milestoneReached: Int? — returns 7, 30, 90, 180, 365 if just hit one
```

### Step 6.2 — Badges + milestones

```
Build a milestone and badge system in SwiftUI for a focus app.

Milestones: 1 day, 7 days, 30 days, 90 days, 180 days, 1 year
Each milestone has: name, icon (SF Symbol), color, description

Build:
- BadgeView: shows a single badge (locked/unlocked states)
- MilestonesScreen: grid of all badges, current streak displayed at top
- MilestoneUnlockedOverlay: full-screen celebration overlay when a milestone is reached (show on app foreground if milestoneReached != nil)

When a milestone is unlocked, also send a local notification.
```

### Step 6.3 — Notifications

```
Build a notification system for a focus/blocker app using UNUserNotificationCenter.

Schedule these notifications:
1. Daily streak reminder at 8pm: "You're on a X day streak! Keep it up."
2. Milestone notifications: "🎉 7 days gambling-free! You're doing amazing."
3. Schedule warning (10 min before a block starts): "Your Work Focus block starts in 10 minutes."
4. Weekly summary (Sunday 6pm): "This week: X gambling sites blocked, X day streak."

Functions:
- requestPermission()
- scheduleStreakReminder(streakDays: Int)
- scheduleMilestoneNotification(milestone: Int)
- scheduleBlockWarning(blockName: String, minutesBefore: Int, blockStart: Date)
- scheduleWeeklySummary(blockedCount: Int, streak: Int)
```

---

## PHASE 7 — Widget & Usage Stats
**Time: 1–2 days**

### Step 7.1 — Widget

Open the Widget Extension target in Cursor:

```
Build a WidgetKit home screen widget for a focus/blocker app.

Small widget shows:
- Current streak (large number)
- "days clean" label
- Green shield icon if active, red if not

Medium widget shows:
- Streak
- Today's blocked count
- Active session countdown (if running)
- Status (Protected / Not Active)

Data comes from App Group UserDefaults (group.com.yourname.focusblocker):
- Key "currentStreak": Int
- Key "blockCount": Int
- Key "sessionEndTime": Date?
- Key "isBlockActive": Bool

Use SwiftUI for widget views. Support iOS 16+ widget API.
```

### Step 7.2 — Usage stats screen

Open DeviceActivity Report Extension target:

```
Build a DeviceActivityReport extension view for a focus app showing usage stats.

The report shows:
- Total screen time today
- Top 5 most-used apps with time bars
- Comparison to last week average
- "Time reclaimed" = last week average minus today (if lower)

Use DeviceActivityReport framework.
The view is a SwiftUI view conforming to DeviceActivityReportScene.
Context identifier: "com.yourname.focusblocker.usagereport"
```

---

## PHASE 8 — Onboarding & Polish
**Time: 1–2 days**

```
Build an onboarding flow for a gambling/focus blocker iOS app in SwiftUI.

5 screens, full-screen with page indicator:

Screen 1: "Block gambling before it reaches your phone"
- Hero illustration placeholder (SF Symbols)
- Subtext explaining the DNS blocking approach

Screen 2: "Choose what to block"
- Show category pills: Gambling, Social Media, Gaming, News
- Let user toggle which categories they want

Screen 3: "Set your schedule" (optional, can skip)
- Quick preset buttons: Work Hours (9-5 Mon-Fri), Every Night (10pm-7am), Always On
- Skip button

Screen 4: "Set a PIN to protect your settings"
- Inline PIN entry (4 digits)
- Skip button (shows warning)

Screen 5: "You're protected"
- Requests DNS permission (calls DNSManager.enableDNS)
- Requests Family Controls permission
- Shows green shield when both granted
- "Start protecting" button

After onboarding, save UserDefaults key "onboardingComplete" = true.
Show onboarding only if this key is false.
```

---

## PHASE 9 — App Store Submission
**Time: 1 week (Apple review)**

### Checklist before submitting:

In Cursor, prompt:
```
Generate an App Store listing for an iOS app called "FocusGuard — Gambling Blocker":
- Subtitle (30 chars max)
- Description (4000 chars max) emphasizing: gambling addiction help, DNS-level blocking, focus sessions, no VPN required
- Keywords (100 chars max) — optimize for: gambling blocker, self exclusion, focus app, screen time, gambling addiction
- What's New text for v1.0
- Privacy policy outline (we collect: anonymous block counts, no personal data, no browsing history)
```

### Submission steps:
1. Bump version to 1.0.0 in Xcode
2. Archive: Product → Archive
3. Upload via Xcode Organizer → Distribute App → App Store Connect
4. Fill in App Store Connect listing (use the text Cursor generated)
5. Submit for review

**Category:** Health & Fitness (not Productivity — this gets better visibility for addiction-related searches)

---

## When You Get Stuck

**Error in Xcode:** Paste the full error into Cursor: *"I got this error in Xcode: [paste error]. Here is the relevant code: [paste code]. Fix it."*

**Feature not working on device:** *"This code runs fine in Xcode but doesn't work on my iPhone. The feature is [describe]. Here's what happens: [describe]. Here's the code: [paste]. What's wrong?"*

**Entitlement errors:** These usually look like "Missing entitlement" crashes. Screenshot it and send to your hired dev — this is their domain.

**Blank screen / view not showing:** *"My SwiftUI view shows a blank screen. Here's the code: [paste]. What's missing?"*

---

## Total Estimate

| Phase | Time |
|---|---|
| 0 — Dev setup (hire out) | 1 day |
| 1 — Cloudflare backend | 1–2 days |
| 2 — DNS blocking | 2–3 days |
| 3 — Safari content blocker | 1 day |
| 4 — App blocking | 1–2 days |
| 5 — Focus + scheduling | 2 days |
| 6 — Streaks + notifications | 1–2 days |
| 7 — Widget + usage stats | 1–2 days |
| 8 — Onboarding + polish | 1–2 days |
| 9 — App Store submission | 1 week (review) |
| **Total** | **~7–8 weeks** |
