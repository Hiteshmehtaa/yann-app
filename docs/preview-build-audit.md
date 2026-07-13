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

### 6. Lag/crashes during document photo verification uploads
**Repo:** mobile app · **File:** `src/screens/auth/DocumentUploadScreen.tsx` (foreigner/NRI identity document upload — passport, visa/OCI, proof of residence)

Documents were picked and stored as raw, uncompressed URIs, with WebP conversion deferred to `handleSubmit` — which then looped over **every** selected document and ran `convertToWebP` on all of them sequentially, right before firing the network request. That meant: several heavy native image-manipulation calls back-to-back with no gap, multiple full-size processed images (each up to ~1600px WebP as base64) held in memory at the same time, immediately followed by JSON-serializing and POSTing all of them together in one request — all inside a single tap-and-wait moment for the user. This is exactly the kind of pattern that causes visible freezing and, on lower-RAM Android devices, native OOM kills (the "crashing a lot" symptom). `ProviderSignupScreen.tsx`'s driver license/police-verification upload already did this correctly (convert immediately after each pick), so this screen was the outlier.

**Fix:** `DocumentUploadScreen.tsx` now converts each document to WebP immediately after it's picked (new `addDocument` helper), same pattern as the rest of the codebase. `handleSubmit` no longer does any conversion — it just sends the already-processed data.

**Not changed, worth knowing:** both this screen and `ProviderSignupScreen`'s driver docs use `allowsEditing: true` (native crop UI) when picking. That crop step has to decode the photo at its *original* camera resolution before any of our downscaling ever runs — on modern 48MP+ phone cameras that's a well-known source of memory pressure/OOM crashes on Android, independent of anything in this codebase. If crashes persist after this fix, that's the next thing to look at (e.g. dropping `allowsEditing` for these specific document/ID photos, since free-form cropping isn't essential for photographing a license or ID document).

### 7. Driver photo upload could leave the app stuck with an unresponsive keyboard (iOS)
**Repo:** mobile app · **File:** `src/screens/auth/ProviderSignupScreen.tsx`

Reported directly: after uploading the driving license front photo on iOS, the numeric keyboard (from the per-service "Set rate" price input higher up the form) stayed open and the app stopped responding to any input. Root cause: `uploadDriverDocument` never dismissed the keyboard before opening the image picker. If a rate `TextInput` still had focus when the picker flow completed, the resulting `setFormData` call injects a multi-MB base64 photo into the single monolithic `formData` object that drives this entire multi-section form, forcing a full-tree re-render while that keyboard was still up - the previously-focused input gets disrupted mid-render, leaving the keyboard stuck with nothing left driving it.

**Fix:** `uploadDriverDocument` now calls `Keyboard.dismiss()` twice - once before requesting permissions/opening the picker, and again right before the `setFormData` call that triggers the heavy re-render (the picker's own dismiss animation can re-grant a field focus, so the first call alone isn't airtight). `handleSubmit` (final form submission - same heavy multi-image payload assembly, same risk if a field has focus when tapped) got the same guard.

**Not changed, worth knowing:** the deeper issue is architectural - `formData` is one giant state object shared by every section of this form (cleaning/laundry/pujari/driver/electrical/etc.), so any single field update, including dropping in a large base64 image, re-renders the whole tree. This fix prevents the specific stuck-keyboard symptom, but the same full-tree re-render cost still applies generally; splitting form state per-section or memoizing the heavy sections would be the real fix if lag persists elsewhere in this screen.

### 8. App freezes completely (not just the keyboard) after uploading a driving license front/back photo (iOS)
**Repo:** mobile app · **Files:** `src/screens/auth/ProviderSignupScreen.tsx` (`uploadDriverDocument`), `src/screens/auth/DocumentUploadScreen.tsx` (`handleCamera`/`handleLibrary`)

Reported via video from a tester: after picking the front or back license photo, the entire screen stops responding to any tap - not just a stuck keyboard (no text input was even focused in the reported case, ruling out #7 above as the cause here). Not reproducible on the reporter's own device/iOS version, which pointed at a version/device-dependent native issue rather than app logic.

Root cause: both screens called `ImagePicker.launchImageLibraryAsync`/`launchCameraAsync` with `allowsEditing: true`, which shows Apple's native crop screen after picking. This is a known, recurring `expo-image-picker`/iOS issue where that crop screen's dismissal leaves the app's touch handling dead afterward on certain iOS versions/devices (e.g. [expo#38424](https://github.com/expo/expo/issues/38424), [expo#11435](https://github.com/expo/expo/issues/11435)) - exactly matching "freezes after selecting a photo, can't reproduce on every device." This was already flagged as the next suspect in finding #6 above.

**Fix:** dropped `allowsEditing`/`aspect` from all four pick calls in both screens. Free-form cropping isn't needed for photographing a license/ID document, so there's no functional loss.

### 9. Aadhaar/DigiLocker verification was broken, which blocked all bookings and all provider accept/reject actions
**Repo:** mobile app + Server · **Reported as two separate bugs** ("users are not able to do bookings" and "providers are not able to accept or reject bookings") that turned out to share one root cause. Every booking requires `aadhaarVerified === true` on **both sides**: the customer (`BookingWizardScreen.tsx:352` client-side, `bookings/create/route.js:142` server-side) and the assigned provider (`bookings/request/route.js:159`, `bookings/accept/route.js:50`, `bookings/respond/route.js:86`). Verification itself never completed, for two stacking reasons:

1. **Callback never reached the backend.** `verification/initiate/route.js` built the DigiLocker return URL from `NEXT_PUBLIC_APP_URL`, which locally is set to `http://yannhome.com` - a domain not wired to this backend, so the callback that sets `aadhaarVerified: true` never ran.
2. **The app couldn't detect success even when it did work, and lied about it anyway.** `AadhaarVerificationScreen.tsx` watched for a redirect to `yannapp://verification-success` (wrong scheme - the app's real registered scheme is `yann`, confirmed against `app.json` and the `AppNavigator.tsx` linking config, which already maps `verification-success` → the Profile screens) and never passed a `returnUrl` to the backend. The browser session effectively always ended as `'dismiss'`, and the code treated `'dismiss'` identically to `'success'` - so the user always saw "Verification Submitted" regardless of what the backend actually did.

There are also two other, apparently newer verification systems already built server-side (`/aadhaar/*`, `/identity/*`) that nothing in the mobile app currently calls - this DigiLocker flow looks like it was mid-migration and never finished. Not touched by this fix.

**Fix:** `verification/initiate/route.js` now derives the callback URL from the incoming request's own origin instead of `NEXT_PUBLIC_APP_URL` (self-correcting - always matches wherever this API is actually deployed, no env var to keep in sync). `AadhaarVerificationScreen.tsx` now sends the correct `yann://verification-success` scheme, actually passes it through as `returnUrl` (the client was calling the param `redirectUrl` while `api.ts` silently dropped it - the server reads `returnUrl`), and no longer trusts the browser session's `success`/`dismiss` result type - it re-fetches the profile afterward and only shows "Verification Submitted" if `aadhaarVerified` actually came back `true`. `verification/callback/route.js`'s redirect allowlist now also accepts the app's own `yann://` scheme (previously only accepted `http(s)` origins, so a passed-through deep link would've been silently rejected).

### 10. Manage Services: editing a provider's service price/details failed with a generic error
**Repo:** mobile app + Server · Reported with a screenshot of "Failed to update service details" while editing the price of an already-active "Personal Driver" service.

Two compounding server-side bugs in `provider/profile/route.js`:
1. Its hardcoded `CATEGORY_SERVICES_DRIVER` whitelist (used to decide whether the driver-exclusivity rule and the license-docs-required gate apply) only recognized `'Full-Day Personal Driver'`/`'Outstation Driving Service'` - not `'Personal Driver'`, which is the mobile app's actual driver catalog entry (`src/utils/constants.ts`). A sibling route, `provider/add-service/route.js`, already had this fixed; this one didn't.
2. `provider.save()` re-validates **every** field on the document, not just the ones being changed. Any pre-existing legacy/invalid data anywhere on a provider's document (plausibly caused by bug #1 letting an incomplete `driverServiceDetails` through in the first place) would make **all future edits** to that provider fail, regardless of what was actually being changed - consistent with the report describing broad "can't update anything" behavior, not something scoped to one field.

Compounding client bug: `ProviderServicesScreen.tsx`'s `performUpdate` always showed the same hardcoded "Failed to update service details" string regardless of cause (its sibling `performToggle` already correctly surfaced the real server message - this one just hadn't been brought in line).

**Fix:** added `'Personal Driver'` to the whitelist in `provider/profile/route.js` (and to `register/route.js`'s equivalent list, so newly-registering drivers under this name get the license-docs gate enforced too); changed `provider.save()` to `provider.save({ validateModifiedOnly: true })` so a save only validates the fields it's actually touching; `performUpdate`'s catch block now surfaces `error.response.data.message` like the rest of the screen does.

### 11. Provider accept/reject buttons could silently do nothing while looking like they worked
**Repo:** mobile app · Two separate provider-facing surfaces call the accept/reject APIs: the incoming-request popup (`ProviderIncomingRequest.tsx` → `/bookings/respond`) and the bookings list (`ProviderBookingsScreen.tsx` → `/bookings/accept`/`/bookings/reject`). Once bug #9 blocked most providers from ever being Aadhaar-verified, every accept attempt would 403 from all three server routes that gate on it - but the UI never showed that.

In `ProviderIncomingRequest.tsx`, any failure (403 from the Aadhaar gate, an expired 3-minute window, anything) was caught and then **the code called `onAccept()`/`onReject()` anyway** "to prevent being stuck," which tells the parent (`GlobalBookingRequestModal.tsx`) the action succeeded and to stop polling that booking - so the modal closed looking like it worked while the booking was left completely untouched server-side. `ProviderBookingsScreen.tsx`'s equivalent handlers had the same generic-message problem as #10's `performUpdate`, plus a silent no-op when the response was `{ success: false }` without throwing.

**Fix:** `ProviderIncomingRequest.tsx` no longer calls `onAccept()`/`onReject()` on failure - it shows an alert with the real server message and leaves the modal open so the provider can retry (or let it expire naturally). `ProviderBookingsScreen.tsx`'s handlers now surface the real error message on both the thrown-error and `success: false` paths.

---

## Known issue — analyzed, not yet fixed

(none currently - see fixes #9-#11 above for the previously-listed Aadhaar verification issue)

---

## Other things noticed during the initial audit (lower priority / FYI)

- **TypeScript:** `npx tsc --noEmit` reports ~20 pre-existing type errors across the codebase (duplicate object keys, a couple of missing `borderRadius.xl`/`.xxlarge` tokens, a few "possibly null" cases). None block a Metro/EAS build since it doesn't type-check; worth a cleanup pass later.
- **expo-doctor:** 8 packages are one patch version behind SDK 54 (`expo-updates`, `expo-notifications`, etc.). Not blocking; `npx expo install --check` when convenient.
- **iOS preview distribution:** past iOS builds were all `store` distribution (TestFlight/App Store). The `preview` EAS profile uses `internal` (ad-hoc) distribution for iOS, which only installs on device UDIDs registered via `eas device:create` — none are registered yet. For iOS testers, either register their UDIDs first or submit to TestFlight instead (credentials for that are already configured in `eas.json`).
- `builds/newdev.apk` (250MB) is a stray local build artifact — harmless, already `.gitignore`'d.

---

## Deployment note

The Server-side fixes (#2, #3) are **local, uncommitted changes in the separate `Server/` git repo** — they won't take effect on the live app until committed and pushed to `github.com/Sourabh-beast/yann.git` and redeployed on Railway. The mobile-app fixes (#1, #5) similarly need a commit + a new build to reach testers (the currently-running preview APK was built before all of these).
