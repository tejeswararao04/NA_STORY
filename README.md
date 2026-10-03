# NASTORY — Your moments. Your story.

Prototype for the NASTORY mobile product — built locally first, then shipping to real users with AI, payments, photos and voice notes.

Live prototype: open `prototype/web/index.html` in a browser (or `http://localhost:5173` via `python -m http.server 5173`).

**Repo:** https://github.com/tejeswararao04/NA_STORY

---

## What's in the prototype (so far)

### 1. Splash
- Logo `N` emblem (placeholder `apps/mobile/assets/*` + `prototype/web/assets/*`)
- *Welcome to NASTORY — Your moments. Your story.* — auto-advances in ~2.2s, `Skip` clickable
- `apps/mobile/app/index.tsx:1`, `prototype/web/index.html:11`

### 2. Auth — Sign in / Sign up + Email / Phone + OTP (all clickable, testing only)
- Tabs: `Sign in | Sign up` and `Email | Phone` — content and placeholders switch
- Email rule: must be like `name@gmail.com` — requires `@` + domain + TLD, no spaces/`..` (`prototype/web/app.js:32` `getEmailError`)
- Phone rule: **exactly 10 digits**, starts 6-9 (Indian mobile) — `9876543210` ok; `987654321` / `+91 ...` / letters show specific error (`getPhoneError`)
- OTP screen: 6 centered boxes in one group (not scattered) + hidden paste helper, 30s resend timer, `Edit email/phone`, `Verify & continue` — mock OTP `123456` (any 6 digits accepted for testing)
- Files: `prototype/web/index.html:28`, `styles.css:118`, `app.js:32`

### 3. Trips (replaces Notes) — trips only, no Tpo/9i/irrelevant names
- **Header:** `All ▸ N trips` (tap to open folders) + search + sort icons — dark notes style `styles.css:142` (`#000` bg, `#1a1a1a` borders)
- **List:** Title (19px white), preview (gray ellipsis), date pill + category pill — 8 trips-only seeds: `Bangalore 2026`, `Manali 2024`, `First date with my love`, `Family trip 2025`, `Frnds trip 2027`, `South India Trip 2024`, `Goa Gateway 2025`, `Kerala Backwaters 2023`
- **Search:** tap `⌕` → inline bar filters by title/preview/category/blocks live
- **Sort:** tap `≡↕` → sheet `By modified (newest/oldest)` / `By created (newest/oldest)` + Cancel (`app.js:140`)
- **FAB:** yellow `+` at bottom-right — opens full **Editor** like screenshot (`prototype/web/index.html:185`, `styles.css:340`, `app.js:360`): `Title` + `10/3/2026, 21:56 | 0 characters | Category ▾` + toolbar (`AI`, `▦`, `Aa`, `≡`, `☑`, `🖼`, `＋`)
- **Add photo + context horizontally:** each block has **photo (left) + context textarea (right)** side-by-side — tap photo → sheet `Choose from gallery / Take photo` → gallery uses `<input type=file accept=image/*>` , camera uses `capture=environment`; tap context → type what happened there; `+ Add photo + context` adds another block
- **Bottom nav:** only **Trips | Me** (`To-do` removed) — active `#ffc400` (`styles.css:207`)
- **Detail:** tap any trip → detail view shows category/date + all photo+context blocks (side-by-side cards) + `Delete` (confirm)
- Files: `prototype/web/index.html:101`, `styles.css:142`, `app.js:260`

### 4. Folders / Categories
- Default: `Family`, `Frnds`, `Partner` — user can add custom folders via `＋` in drawer (`prototype/web/index.html:165`)
- Drawer: `All` (all trips), `Uncategorized`, `My folders` (custom) — counts live, tap to filter
- Create trip category dropdown includes custom folders
- Persisted in `localStorage` (`nastory_trips_v1`, `nastory_cats_v1`, `nastory_filter_v1`, `nastory_sort_v1`)

### 5. Me tab
- Shows signed-in identity (email/phone from OTP), trips count, folders count, `Log out` back to Sign in (`app.js:140`)

---

## How to run the clickable prototype (no build)

**Double-click:**
```
NA_STORY/prototype/web/index.html
```

**Or local server (same WiFi → phone):**
```bat
cd "C:\Users\paila\OneDrive\Documents\PERSONAL PROJECTS\TEJAS_PRODUCT\NA_STORY\prototype\web"
python -m http.server 5173
```
Open `http://localhost:5173` on laptop, or `http://<your-lan-ip>:5173` on phone.

**Flow:** Splash → Sign in/Sign up (Email/Phone) → Send OTP → OTP `123456` → Trips. Hard refresh `Ctrl+Shift+R` after updates.

---

## Tech for the prototype
- Vanilla HTML + CSS + JS, no build, no npm — `$0`, instantly shareable
- Dark theme matching reference, responsive, centered OTP (`styles.css:118`)
- Brand: night gradient `#14102B→#20144A`, gold `#E8B44A`

---

## What's next (not in prototype yet)
- Photo picker + voice note → story generation (AI via `services/ai` placeholder)
- Payments (RevenueCat + Razorpay/Stripe), user data sync via Supabase
- Real app: `apps/mobile` is Expo React Native + TypeScript + Expo Router scaffold (`apps/mobile/app.json`, `package.json`) — kept for when prototype is finalized

---

## Repo layout
```
apps/mobile         Expo app (splash + home scaffold) — use after prototype sign-off
prototype/web       Clickable prototype (this README's focus) — splash, auth, trips, me
  assets/           icon.png, splash.png
  index.html        All screens
  styles.css        Dark notes + auth styles
  app.js            Validation + trips logic
services/ai         FastAPI story service — mock now, GEMINI_API_KEY → real free tier
supabase/           Postgres schema + RLS (profiles, stories) + storage buckets
docs/               API_CONTRACT.md, SCREENS.md
```

## Costs (when shipping)
- Now: `$0` (prototype + Supabase free + Expo Go)
- At store: Apple $99/yr + Google $25 once — Expo Free (15+15 builds) enough for MVP

## Contributing
Prototype is intentionally local-file — no env needed. Update `prototype/web/*`, hard refresh, commit.
