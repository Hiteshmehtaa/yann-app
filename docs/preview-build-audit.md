# Preview Build Audit — 2026-07-11

Findings and fixes from testing the Android preview build (local build, profile `preview`, commit `554ecc7` + local changes below). Two repos are involved:
- **Mobile app** (this repo, `yann-mobile`)
- **Server** (`Server/` — a *separate* git repo, remote `github.com/Sourabh-beast/yann.git`, deployed to Railway at `yann-production.up.railway.app`)

---

## Fixed

### 1. Dead backend URL used on cold start / early requests
**Repo:** mobile app · **Files:** `src/utils/constants.ts`, `src/services/api.ts`, `src/services/socket.ts`

The app's real backend is Railway (`yann-production.up.railway.app`), but two other stale URLs were still wired in from before the Vercel→Railway migration:
- `src/utils/constants.ts` pinged a hardcoded home-WiFi IP (`192.168.31.198:3000`) on every cold start before falling back to production — a real 5s network probe testers outside that WiFi always eat.
- `src/services/api.ts`'s initial `baseURL` and error-fallback both pointed at `https://yann-care.vercel.app`, which returns `402` (dead/suspended deployment) — confirmed live via curl. Any request firing before backend-detection resolves (e.g. the auth check on app launch) would hit this dead URL.

**Fix:** local-IP probing now only runs when `__DEV__` is true (`constants.ts`); preview/production builds go straight to the Railway URL. `api.ts` and `socket.ts` now reference the same `PRODUCTION_API_URL` constant instead of the hardcoded dead Vercel URL.

### 2. OTP send blocked by an overly aggressive, IP-shared rate limit
**Repo:** Server · **File:** `src/lib/redisRateLimiter.js`

`redisOtpRateLimiter` allowed only **3 OTP requests per 15 minutes, keyed purely by IP** — shared across every phone/email, login/signup, homeowner/provider request from that IP. Confirmed live: two test requests with different phone numbers, seconds apart, were both instantly blocked (429) because the shared bucket was already exhausted by other traffic. Indian mobile carriers (Jio/Airtel/Vi) route large numbers of subscribers through the same CGNAT IP, so this reliably locks out unrelated legitimate users, not just abusers.

**Fix:** raised `maxRequests` from 3 → 30 per 15 min. The existing per-phone-number limit (5/hour, in `src/app/api/auth/send-otp/route.js`) remains as the real anti-abuse guard.

### 3. Booking rejects providers the app just showed you
**Repo:** Server · **File:** `src/app/api/provider/by-service/route.js`

The provider-list endpoint (`/provider/by-service`, used by `ServiceDetailScreen` etc.) returned **every** provider offering a service regardless of `status` (`active` / `inactive` / `pending`) — the code comment even said "mobile app will handle displaying offline providers as grayed out." It never did: `ServiceDetailScreen.tsx` maps the full list into selectable cards with no status filtering, and even auto-selects the highest-rated provider from the unfiltered list. Meanwhile two separate downstream checks reject providers the list never screened for:
- `bookings/create` requires `provider.status === 'active'` → `"Selected service partner is no longer available"`.
- `bookings/request` (the follow-up step that actually assigns the booking to the chosen provider) requires `provider.aadhaarVerified === true` → `"This provider is not Aadhaar verified and cannot receive bookings"`. This one only surfaces *after* `bookings/create` already succeeded, so it's a second, later point of failure for the same root cause.

**Fix:** `by-service` now filters `status: 'active'` **and** `aadhaarVerified: true` at the query level, so only providers the whole booking flow will actually accept are ever returned. `isOnline` is kept in the response/sort (online-first, then price) since it doesn't block booking, only these two fields do.

### 5. Errors were silently swallowed instead of shown to the user
**Repo:** mobile app · **Files:** `BookingWizardScreen.tsx`, `EditProfileScreen.tsx`, `SavedAddressesScreen.tsx`, `HelpSupportScreen.tsx`

These 4 screens call `useToast()` and its `showError(...)`, but never actually render the `<Toast>` component anywhere in their JSX. `showError()` just updates local hook state that nothing reads — so on failure, the only visible trace was a `console.error` in the Metro/logcat log, invisible to anyone not plugged into dev tools. This is what made the Aadhaar-verification booking failure look "silent" — the real, correctly-worded error message was there in the response the whole time, it just had nowhere to render. (Checked every other screen using `useToast()` — the rest already render `<Toast>` correctly, e.g. `LoginScreen.tsx`, `WalletScreen.tsx`.)

Also fixed in `BookingWizardScreen.tsx`: the `sendBookingRequest` failure path discarded the real server message and threw a generic `"Failed to send request"` instead — now it propagates `reqRes.message`.

**Fix:** each screen now imports `Toast` from `components/Toast`, destructures `toast`/`hideToast` from `useToast()`, and renders `<Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />`.

---

## Known issue — analyzed, not yet fixed

### 4. Aadhaar/DigiLocker verification is broken, which blocks all bookings until a user is verified
**Repo:** mobile app + Server · Every booking requires `aadhaarVerified === true` (`BookingWizardScreen.tsx:351` client-side, `bookings/create/route.js:142` server-side, defaults to `false` on signup). Verification itself doesn't complete, for two stacking reasons:

1. **Callback never reaches the backend.** `verification/initiate/route.js` builds the DigiLocker return URL from `NEXT_PUBLIC_APP_URL`, which locally is set to `http://yannhome.com`. Confirmed live: that domain returns `404` on `/api/health` (vs `200` on the real Railway backend) — it isn't wired to this app, so the callback that sets `aadhaarVerified: true` never runs.
2. **The app can't detect success even when it does work, and lies about it anyway.** `AadhaarVerificationScreen.tsx:97` watches for a redirect to `yannapp://verification-success`, but the app's real registered scheme is `yann` (`app.json`), not `yannapp` — and the app never passes a `returnUrl` to the backend, so the callback page's auto-redirect goes to a plain website, not a deep link at all. The browser session effectively always ends as `'dismiss'`, and line 104 treats `'dismiss'` identically to `'success'`, so the user always sees "Verification Submitted — you can now book services!" regardless of what the backend actually did.

There are also two other, apparently newer verification systems already built server-side (`/aadhaar/*`, `/identity/*`) that nothing in the mobile app currently calls — this DigiLocker flow looks like it was mid-migration and never finished.

**Suggested fix (not yet applied):** derive the callback URL from the request's own origin instead of `NEXT_PUBLIC_APP_URL` (self-correcting, no env var to keep in sync); fix the app-side scheme to `yann://verification-success` and pass a real `returnUrl`; stop treating `dismiss` as `success` — only trust a fresh `getProfile()` check for `aadhaarVerified`.

---

## Other things noticed during the initial audit (lower priority / FYI)

- **TypeScript:** `npx tsc --noEmit` reports ~20 pre-existing type errors across the codebase (duplicate object keys, a couple of missing `borderRadius.xl`/`.xxlarge` tokens, a few "possibly null" cases). None block a Metro/EAS build since it doesn't type-check; worth a cleanup pass later.
- **expo-doctor:** 8 packages are one patch version behind SDK 54 (`expo-updates`, `expo-notifications`, etc.). Not blocking; `npx expo install --check` when convenient.
- **iOS preview distribution:** past iOS builds were all `store` distribution (TestFlight/App Store). The `preview` EAS profile uses `internal` (ad-hoc) distribution for iOS, which only installs on device UDIDs registered via `eas device:create` — none are registered yet. For iOS testers, either register their UDIDs first or submit to TestFlight instead (credentials for that are already configured in `eas.json`).
- `builds/newdev.apk` (250MB) is a stray local build artifact — harmless, already `.gitignore`'d.

---

## Deployment note

The Server-side fixes (#2, #3) are **local, uncommitted changes in the separate `Server/` git repo** — they won't take effect on the live app until committed and pushed to `github.com/Sourabh-beast/yann.git` and redeployed on Railway. The mobile-app fixes (#1, #5) similarly need a commit + a new build to reach testers (the currently-running preview APK was built before all of these).
