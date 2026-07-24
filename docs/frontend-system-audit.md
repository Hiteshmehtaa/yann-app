# Frontend & Mobile App System Audit

**Date:** 2026-07-14
**Scope:** the entire React Native/Expo mobile app under `src/` — `src/services/api.ts` (the full network layer, ~2000 lines), all screens under `src/screens/**`, all contexts, navigation, and the shared component library.
**Method:** Four independent deep-read passes (auth/onboarding/navigation/contexts/API layer; the full booking flow screen-by-screen; provider-facing + home/profile/settings/admin screens), each cross-referenced against the actual server routes they call. Read-only — no code was changed as part of this audit.

Each finding is marked **CONFIRMED** (the full code path was traced end to end, ideally cross-referencing the matching server route) or **SUSPECTED** (plausible from reading, but couldn't be fully verified — reason given).

---

## Executive summary

Four recurring anti-patterns account for most of what's below:
1. **A failed API call is sometimes treated as a success** — a modal closes, a "success" callback fires, a screen navigates onward, or an item disappears from a list, as if the request worked, when it actually returned an error or `{success:false}`.
2. **The real server error is discarded** in favor of a hardcoded generic string (or `error.message` instead of `error.response?.data?.message`), so failures are indistinguishable from each other in the UI (and in any support conversation based on what the user saw). This is by far the single most repeated defect in the app — found independently on well over a dozen screens across every audit pass.
3. **A provider/driver's `aadhaarVerified` status is checked on some selection screens but not others** — this exact gate was added to three screens earlier this session, and this audit specifically went looking for any screen that was missed.
4. **Account-critical actions (delete account, avatar upload, service edits) have no error handling at all** — not even a generic message. A failure is a silent unhandled rejection; the user just sees a spinner disappear with nothing having happened and no explanation.

| Severity | Count |
|---|---|
| Critical | 4 |
| High | 10 |
| Medium | 16 |
| Low | 8 |

---

## CRITICAL

### C1. The "select an alternative provider" rebooking screen has no Aadhaar-verification gate
**File:** `src/screens/booking/BookingWaitingScreen.tsx:264-311` (`selectAlternativeProvider`), list rendered at `:513-545`.
**CONFIRMED.** This is the exact gate added to `ProviderPublicProfileScreen`, `DriverSearchResultsScreen`, and `ServiceDetailScreen` earlier this session — but it was missed on the one screen a customer lands on when their original provider rejects or the request times out. `loadAlternativeProviders()` fetches replacements via `apiService.getProvidersByService(...)` and renders them with no `aadhaarVerified` mapping or check at all. Tapping any of them calls `reassignBooking` → `sendBookingRequest` directly.
**Failure scenario:** original provider rejects a booking → customer is shown a replacement list that includes unverified providers → taps one → a request is sent to a provider who cannot legally accept jobs, reproducing the exact "providers can't accept" symptom from earlier this session, on a path that wasn't covered by the original fix.

### C2. Admin broadcast screen is reachable by any logged-in user — client has no concept of an admin role at all
**Files:** `src/navigation/AppNavigator.tsx:392,424` (registers `AdminPush` in *both* the provider stack and the homeowner stack, gated only by `isAuthenticated`), `src/screens/admin/AdminPushNotificationScreen.tsx`, `src/types/index.ts` (`User.role` is only `'homeowner' | 'provider'` — there is no `admin` role modeled anywhere client-side).
**CONFIRMED.** No in-app menu currently links to this screen, so it's latent rather than one-tap-exploitable today — but any `navigation.navigate('AdminPush')` call from anywhere (a future settings button, a patched client, RN dev tools) reaches a fully-authenticated (JWT auto-attached) admin broadcast console with no client-side rejection. See the backend audit's C1 finding — the server-side endpoint behind this screen has no auth either, so this is exploitable independent of the client too.

### C3. Silent payment failures — `if (response.success)` with no `else` branch, on real money
**Files:** `src/components/InitialPaymentModal.tsx:77-103`, `src/components/CompletionPaymentModal.tsx:40-66`, `src/screens/booking/BookingDetailScreen.tsx:144-177` (`handleCompletionPayment`).
**CONFIRMED.** `apiService.payInitialAmount`/`payCompletionAmount` just return `response.data` verbatim, and the shared axios interceptor only rejects on non-2xx/network errors — never on a 200 response carrying `{success:false, message:"..."}`. So a business-logic payment failure (escrow already released, booking already paid, provider cancelled mid-payment) hits neither the `if` branch nor the `catch` block. The loading state resets, the button goes back to normal, and **the user gets zero feedback that their payment didn't go through** — worse than an error message, because nothing suggests anything is wrong.

### C4. Admin push notification screen always shows "Success," and the endpoint it calls doesn't even exist
**Files:** `src/screens/admin/AdminPushNotificationScreen.tsx:44-48`, `src/services/api.ts:1990-2011` (`sendAdminNotification`).
**CONFIRMED — three compounding bugs stacked on one screen (independently confirmed by two separate audit passes).** The client posts to `/admin/notifications/send`, but the real server route is `/api/admin/notifications` (no `/send` subpath exists — every call 404s). Even if the URL were right, the client sends `{title, message, target, recipientId, priority, data}` while the server requires `{type, targetAudience, title, message}` — an immediate 400. And `sendAdminNotification` catches every error internally and returns `{success:false, ...}` instead of throwing, while the screen `await`s the call and unconditionally shows `Alert.alert('Success', 'Notification Sent Successfully!')` without ever checking `response.success`. This feature has apparently never worked, and nothing about using it would tell you that. Also has no confirmation step before broadcasting to "All Users" — an irreversible mass send is one tap away.

---

## HIGH

### H1. Provider accept/reject: every other action button in the provider app needs the same "don't fake success on failure" fix applied earlier to two screens
Earlier this session, `ProviderIncomingRequest.tsx` and `ProviderBookingsScreen.tsx` were fixed so a failed accept/reject shows a real error instead of silently closing as if it worked. **Re-verified current state: both fixes are correctly in place and hold up.** No further provider-facing action buttons matching this exact pattern were found beyond what's already fixed — flagged here as a verified-clean item precisely because it was the single highest-risk thing to silently regress.

### H2. `BookingWizardScreen` re-fetches the provider's live data but never re-checks the Aadhaar flag it just fetched
**File:** `src/screens/booking/BookingWizardScreen.tsx:145-152` (refetch), `:345-436` (`handleSubmitBooking`).
**CONFIRMED.** On mount, this screen explicitly re-fetches the selected provider by ID and merges the fresh object into state — which can carry an updated `aadhaarVerified` value if it changed since selection. But `handleSubmitBooking` only checks the *customer's* own verification status; it never re-checks `provider?.aadhaarVerified` before submitting, discarding the very signal it just fetched.
**Failure scenario:** provider's verification is revoked while the customer is still on the Date/Location/Review steps of the wizard (easily minutes) → booking is created and sent to a now-unverified provider anyway.

### H3. Two independent, uncoordinated triggers for the same completion payment
**File:** `src/screens/booking/BookingDetailScreen.tsx` — an inline "Pay Remaining" button (`:390-412`) and a separate polling effect (`:53-99`) that mounts the *global* `CompletionPaymentModal` under an overlapping condition, with no shared lock between them.
**CONFIRMED both paths reachable simultaneously.** Two independent "Pay Now" buttons for the same booking, each capable of calling `payCompletionAmount` with no client-side mutex — a double-submission risk distinct from an ordinary double-tap because it's two different components racing, not one.

### H4. Logout never unregisters the device's push token — can leak another user's job OTPs on a shared device
**Files:** `src/contexts/AuthContext.tsx:213-224` (`logout`), `src/utils/storage.ts:126-135` (`clearAll`), cross-referenced against the server's `user/push-token` route (has a `POST` to register, no corresponding unregister).
**CONFIRMED.** Local storage and the session cookie are cleared, but the Expo push token on the user's DB record is never cleared. On a shared/borrowed device, a second account logging in typically gets the *same* device push token; if a push fires for the first user's still-open booking before it resolves (job-start/end OTP, cancellation), it lands on the second, now-logged-in account's device — a real content-leak, not just a UX glitch, since job-start/end pushes literally contain the OTP (see `NotificationsListScreen.tsx`, which renders `notification.otp` with a "Copy" button by design).

### H5. Orphaned/duplicate booking risk on partial submit failure
**Files:** `src/screens/booking/BookingWizardScreen.tsx:399-430`, `src/screens/booking/DriverBookingFormScreen.tsx:331-383`.
**CONFIRMED gap; SUSPECTED server-side consequence.** Both call `createBooking` then, only on success, `sendBookingRequest`. If the second call fails after the first already succeeded, the user sees a generic failure alert and can retry — which calls `createBooking` again from scratch (no idempotency key in the payload), potentially creating a second pending booking while the first sits unsent.

### H6. Client-driven 3-minute provider-response timer is not synced to the server's actual expiry
**File:** `src/screens/booking/BookingWaitingScreen.tsx:29,108-124,223-227`.
**CONFIRMED code pattern.** Unlike `InitialPaymentModal.tsx` (which correctly derives remaining time from a server `expiresAt` timestamp), this screen's countdown is a bare local `setInterval` from a hardcoded 180 seconds, with no server-provided expiry. `handleTimeout()` fires purely on the local clock and immediately lets the customer reassign — without telling the server the request timed out first. Client clock drift (backgrounding, GC pause) could let the original provider still accept server-side while the customer has already moved to an alternative.

### H7. Widespread error-swallowing across `api.ts`'s read/list endpoints
**File:** `src/services/api.ts` — `getAllServices`, `getProvidersByService`, `getServicePartnerCounts`, `searchProviders`, `getNotifications`, `searchPlaces`, `reverseGeocode`, `getDirections`, and (separately) `src/screens/booking/BookingDetailScreen.tsx:168-176` and `BookingWaitingScreen.tsx:330-335`.
**CONFIRMED.** All discard `error.response?.data?.message` for a hardcoded generic string. Lower severity than the payment/booking-critical findings above since most of these are "fail quietly, fall back to empty list" by design — but it means a genuine backend outage looks identical to "no results" everywhere, with no way to tell from the UI or from a support conversation what actually happened.

### H8. No global handling of an expired/invalid session (401) — app stays "logged in" with a dead token
**Files:** `src/services/api.ts:105-143` (response interceptor only logs and rethrows), `src/contexts/AuthContext.tsx:38-117` (`checkAuthStatus` silently keeps stale cached data on a 401 instead of logging out).
**CONFIRMED.** `isAuthenticated` is derived purely from local state (`!!token && !!user`), so a revoked/expired token leaves the user stuck in the authenticated tab stack, with every subsequent call failing inconsistently screen-by-screen and no path back to `Login` short of manually finding a logout button.

### H9. Homeowner "Delete Account" has no error handling at all
**File:** `src/screens/profile/ProfileScreen.tsx:294-299` — `showConfirm('Delete Account', ..., () => apiService.deleteAccount().then(logout))`, no `.catch`.
**CONFIRMED.** If `deleteAccount()` throws (network error, 401, 500), it's an unhandled promise rejection: no alert, `logout()` never runs, and the user is left in limbo with zero explanation right after confirming a "this action is permanent" dialog.

### H10. Homeowner avatar upload has no error handling at all
**File:** `src/screens/profile/ProfileScreen.tsx:145-162` — `try { ... } finally { setIsUploadingAvatar(false); }`, no `catch` block.
**CONFIRMED.** Any failure in image compression or upload is an unhandled rejection; the spinner just disappears with no feedback and the old avatar silently stays in place.

---

## MEDIUM

### M1. `DriverBookingFormScreen` never checks `selectedDriver.aadhaarVerified` at its own submit boundary
**File:** `src/screens/booking/DriverBookingFormScreen.tsx:221-384`. **SUSPECTED** — no live refetch happens on this screen (unlike H2), so the staleness window is only however long a user takes between selecting a driver and tapping "Book Now" on this form. No code-level trigger for staleness was found, but there's also no defense-in-depth re-check here, unlike the pattern used on the other three fixed screens.

### M2. Client-computed pricing sent to the server as if authoritative
**Files:** `src/screens/booking/BookingWizardScreen.tsx:220-282` (GST defaulted to 18% client-side), `DriverBookingFormScreen.tsx:148-160,284-286,317` (GST defaulted to 18%, `overtimeMultiplier: 2` hardcoded with `overtimeHours` always populated as `0` — dead/inconsistent overtime math).
**SUSPECTED** as to whether the server independently recomputes and ignores these client-sent values (that's the backend audit's territory) — flagged here because the *displayed* commitment to the customer ("Total ₹X," "Pay ₹Y now") is computed entirely client-side and could diverge from whatever is actually charged if the server doesn't recompute it.

### M3. Logout wipes the "onboarding completed" flag, replaying the onboarding carousel on every subsequent login
**Files:** `src/utils/storage.ts:126-135` (`clearAll` clears `ONBOARDING_COMPLETED` alongside auth data), `src/contexts/AuthContext.tsx:213-224`.
**CONFIRMED.** Not a security issue — an unintended UX regression baked into the logout path. Every logout forces the next session, even a returning user's, back through the onboarding slides.

### M4. `BookingWaitingScreen`'s cancel and reassign-failure paths show weak or no error feedback
**File:** `src/screens/booking/BookingWaitingScreen.tsx:299-310` (reassign failure: only `console.error`, no `Alert`/toast at all — user taps a replacement provider and nothing visibly happens), `:330-335` (cancel: hardcoded generic message instead of the real server error).
**CONFIRMED.**

### M5. No Android hardware-back handling on `BookingWaitingScreen`
**File:** `src/screens/booking/BookingWaitingScreen.tsx` — no `BackHandler` listener, unlike `BookingWizardScreen.tsx:194-205` which explicitly intercepts it. **SUSPECTED** (depends on default navigator back behavior, not independently traced) — pressing back mid-countdown could pop the screen with no cancellation and no warning.

### M6. Dead component referencing a nonexistent API method
**File:** `src/components/GlobalInitialPaymentModal.tsx:25` calls `apiService.getBooking(bookingId)` — no such method exists (`getBookingById`/`getBookingStatus`/`getMyBookings` are the real ones). **CONFIRMED but currently harmless** — this component is never rendered anywhere in the app (only `GlobalPaymentModal` is mounted). Flagged so it isn't mistakenly reused later; it would throw immediately if wired up.

### M7. Dead timer-modal import in the booking wizard
**File:** `src/screens/booking/BookingWizardScreen.tsx:40` imports and declares state for `BookingTimerModal`, but it's never rendered — the wizard correctly hands off to `BookingWaitingScreen` instead. Not a functional bug, just confusing leftover code that looks like a safety net and isn't.

### M8. Provider online/offline toggle shows a fabricated error message
**File:** `src/screens/provider/ProviderBookingsScreen.tsx:320-323` — `catch (e) { setIsAvailable(!newStatus); Alert.alert('Error', 'Failed to update status'); }`, discards `e.response?.data?.message` entirely.
**CONFIRMED.** Same hardcoded-message pattern as H7, but this one directly controls whether the provider receives any bookings at all — worth its own line given the stakes.

### M9. Job start/end OTP flows show generic axios errors instead of the real reason
**File:** `src/screens/provider/ProviderBookingsScreen.tsx:238-288` (`handleStartJob`, `handleEndJob`, `handleOTPSubmit`) — all three use `e.message` instead of `e?.response?.data?.message`.
**CONFIRMED.** Backend-specific reasons ("OTP expired," "wrong OTP, 2 attempts left," "booking window closed") get replaced by generic axios text like "Request failed with status code 400." Notably, `handleAcceptBooking`/`handleRejectBooking` in this same file *do* extract the real message correctly — this is an inconsistent, unfixed instance of the pattern this session already fixed elsewhere in the same screen.

### M10. Bank details save shows a generic error, never the real validation reason
**File:** `src/screens/provider/BankDetailsScreen.tsx:114-119` — `Alert.alert('Error', error.message || 'Failed to update bank details')`, never reads `error.response?.data?.message`.
**CONFIRMED.** This gates a provider's ability to withdraw money — a provider blocked from saving valid-looking bank details never learns the specific reason why.

### M11. Provider profile screen: delete account and avatar upload also drop the real server message
**File:** `src/screens/provider/ProviderProfileScreen.tsx:459-461` (delete account), `:235-242` (avatar upload) — both use `e.message`/`error.message` only.
**CONFIRMED.** Same class as H9/H10 but at least these two do have a catch block (H9/H10 have none at all) — the message shown is just never the real one.

### M12. Provider bookings list and dashboard show no error at all when the requests fetch fails
**Files:** `src/screens/provider/ProviderBookingsScreen.tsx:106-172` (`fetchBookings`), `src/screens/provider/ProviderDashboardScreen.tsx:85-115` (`fetchDashboardData`).
**CONFIRMED.** `apiService.getProviderRequests()` internally catches every error and resolves `{success:false, ...}` — it never throws. Both callers only branch on `if (response.success) {...}` with no `else` — on a real backend failure, nothing happens: no error state, no toast, no retry affordance. The provider just sees an empty bookings list or a blank dashboard with zero indication anything is wrong.

### M13. "My Services" optimistic UI updates are never reverted on failure, and delete has no confirmation dialog
**File:** `src/screens/provider/ProviderServicesScreen.tsx` — `performToggle`'s "turn off" branch and `performUpdate` both mutate `services` state via `setServices` *before* the network call resolves; the `catch` block has an explicit comment `// Revert optimization logic omitted for brevity`, confirming the optimistic change is never rolled back on failure. Separately, the trash icon calls `toggleService` directly with no confirmation dialog — an accidental tap immediately disables an active service.
**CONFIRMED.** A failed save leaves the on-screen active/inactive state or displayed rate out of sync with what's actually persisted, with no visual indication until the screen reloads.

### M14. Notification preferences screen doesn't persist anything — a fully non-functional settings screen
**File:** `src/screens/profile/NotificationsScreen.tsx` (whole file) — all six toggles live in local `useState` only; no `apiService` import, no `AsyncStorage` usage anywhere in the file.
**CONFIRMED.** Flipping a switch changes nothing on the backend or on disk. Preferences silently reset to hardcoded defaults on next app launch and never actually affect what notifications get sent — the screen looks fully functional and isn't.

### M15. "Update available" banner is permanently dead code
**File:** `src/utils/versionCheck.ts:80-99` (`fetchLatestVersion`), used by `src/screens/home/HomeScreen.tsx:257,392`.
**CONFIRMED.** `fetchLatestVersion()` only ever returns `null` — even its one branch that attempts to detect an OTA update via `expo-updates` explicitly returns `null` per its own comment ("the manifest doesn't expose version directly"). `compareVersions` never runs against a real version, so no user is ever notified of an available update through this path, no matter how outdated their installed build is.

### M16. Driver-service naming mismatch persists in the mobile catalog itself — the earlier fix patched the symptom, not the source
**Files:** `src/utils/constants.ts:121` (mobile catalog defines a single driver entry, `"Personal Driver"`) vs `Server/src/app/api/services/route.js:121-138` (the canonical backend catalog — same one that feeds the home screen and admin panel — defines two *differently-named* driver services: `"Full-Day Personal Driver"` and `"Outstation Driving Service"`); merge logic in `src/screens/provider/ProviderServicesScreen.tsx:73-96` (`mergeServicesByTitle`, merges by lowercased title).
**CONFIRMED.** With zero name overlap between the mobile and backend catalogs, "My Services" ends up showing **three** separate driver entries instead of one coherent set. A provider who enables "Full-Day Personal Driver" or "Outstation Driving Service" — the names customers actually see and book from the home screen — is registered under those names, while the driver search path (`DriverSearchResultsScreen.tsx`) queries for the literal string `"Personal Driver"` first. The backend whitelist fix made earlier this session (`provider/profile/route.js` now *accepts* all three names) papers over the immediate symptom, but the mobile catalog constant itself was never reconciled with the backend's canonical one — the same root-cause class of bug, recurring in the same file the earlier fix touched.

---

## LOW

- **Aadhaar screen shows no feedback if the user cancels the DigiLocker browser mid-flow** — `WebBrowser.openAuthSessionAsync` can resolve `'cancel'` in addition to `'success'`/`'dismiss'`, and only the latter two are handled; a cancel falls through silently (loading state resets, no dialog). — `src/screens/auth/AadhaarVerificationScreen.tsx:113`. **SUSPECTED**, correctness of the already-fixed `dismiss`-vs-`success` logic re-verified as still holding.
- **`NotificationsScreen.tsx`'s notification-preference toggles are entirely local, fake state** — the switches (push/SMS/email/promotions/etc.) update a `useState` array with no persistence and no API call; every preference silently resets to the hardcoded defaults on next app launch, and toggling them has zero actual effect on what notifications are sent. Not a crash risk, but a fully non-functional settings screen presented as if it works.
- Several `api.ts` functions (`initiateAadhaarVerification`, `getAadhaarStatus`) wrap server routes that are never called from any screen — dead client code pointing at a live-but-unauthenticated server surface (see backend audit's architecture notes).
- `cancelBooking()` in `api.ts:795-796` is implemented as a call to the *provider-reject* endpoint with a possibly-empty `providerId`, despite its name suggesting a customer-initiated cancel — confusing given a separate, correctly-named `cancelBookingByMember` exists that hits the real `/bookings/cancel` endpoint. Naming/routing confusion rather than a confirmed bug in current behavior.
- **Favorites removal shows success even if it actually failed** — `handleRemoveFavorite` (`src/screens/profile/FavoritesScreen.tsx:98-103`) ignores the boolean return value of `removeFromFavorites` (which is `false` if both the backend call and the local AsyncStorage fallback fail) and always removes the item from the visible list plus shows a success toast. CONFIRMED.
- **No verification gate before a provider can start an add-service request** — nowhere in `ProviderServicesScreen.tsx`'s enable-service flow is `aadhaarVerified`/`isVerified`/`identityVerificationStatus` checked before letting a provider submit pricing/documents for a new service (including driver services). The backend `add-service` route doesn't check it either — the only real gate is manual admin approval later. May be intentional (admin approval as the checkpoint), but an unverified provider can walk through an entire pricing/document flow only to be rejected at the very end with no earlier warning. SUSPECTED severity (intended friction level unknown).
- **Provider earnings screen silently shows ₹0 on fetch failure** — `ProviderEarningsScreen.tsx:68-90`'s catch block only does `console.error`, no error state or retry UI; the screen renders "Total Profit ₹0" and "No transactions found" exactly as if that were true. Misleading for financial data. CONFIRMED.

---

## Verified clean (checked for regressions, found correct)

- `ServiceDetailScreen.tsx` "Book Now" — correctly gates on `selectedProvider.aadhaarVerified`.
- `ProviderPublicProfileScreen.tsx` "Book Now" — correctly gates on guest state, customer verification, and `provider.aadhaarVerified`, and the gate runs before the service-selection modal opens (no bypass via `handleBookService`).
- `DriverSearchResultsScreen.tsx` driver selection — correctly gates on `driver.aadhaarVerified`.
- `verifyIdentity`'s `returnUrl` field name — matches the server's expected key; the earlier field-name-mismatch fix holds.
- `isVerified`/`aadhaarVerified` field presence on login/profile responses — all four response paths checked always emit both fields with an explicit `|| false` fallback; the "missing field" bug class does not recur here.
- `register`/`identity/submit-documents` payload shapes — match their respective server routes exactly.
- `RoleSelectionScreen`, `LoginScreen`, `SignupScreen`, `PartnerLoginScreen`, `VerifyOTPScreen`, `IdentityTypeSelectionScreen` — all correctly check `response.success`/catch real errors before navigating or showing a success state.
- Dynamic backend URL detection (local-dev probing) is correctly gated behind `!__DEV__` and skipped entirely in production/preview builds.
- `ProviderIncomingRequest.tsx`'s `handleAction` (accept/reject) — re-verified: correctly checks `response.success`, throws on failure, surfaces the real message, and does not fake success on failure. The fix made earlier this session holds.
- `ProviderBookingsScreen.tsx`'s `handleAcceptBooking`/`handleRejectBooking` — re-verified: correctly check `.success` and extract the real error message (only the *other* handlers in this same file — start/end job, OTP submit, availability toggle, per M8/M9 above — still have the bug).
- `src/screens/profile/SavedAddressesScreen.tsx` — add/delete address flows correctly check `response.success`, extract real error messages, and delete has a confirmation dialog.
- `src/components/ui/ProviderCard.tsx` — correctly gates interactivity (disables press, shows "Approval Pending"/"Currently Offline") based on provider `status` — a good counter-example showing the verification-gate pattern handled correctly.

---

## Suggested priority order for remediation

1. Add the Aadhaar-verification gate to `BookingWaitingScreen`'s alternative-provider list (C1) — closes the direct gap left by earlier work.
2. Fix the silent-payment-failure pattern (C3) across `InitialPaymentModal`, `CompletionPaymentModal`, and `BookingDetailScreen` — check `response.success` explicitly everywhere money changes hands.
3. Either remove `AdminPush` from the client navigator entirely or gate it behind a real admin role check once one exists client-side (C2) — paired with the backend fix.
4. Fix or remove the admin notification screen (C4) — right now it's a non-functional feature reporting false success.
5. Re-check `provider?.aadhaarVerified` at the actual submit boundary in `BookingWizardScreen` (H2) and add the same check to `DriverBookingFormScreen` (M1) for defense in depth against a staleness window.
6. Add a push-token-unregister call to the logout flow (H4).
7. Add a global 401 handler that forces logout/re-auth (H8), so a dead token can't leave the app in a stuck-but-authenticated state.
8. Add error handling to delete-account and avatar-upload on both the homeowner and provider profile screens (H9, H10, M11) — these currently fail silently on an account-critical action.
9. Sweep every remaining `e.message`/hardcoded-generic-string catch block for the real `error.response?.data?.message` — at minimum the ones found here (M8, M9, M10) — since this single pattern accounts for more findings in this document than any other.
10. Reconcile the mobile `SERVICES` catalog's driver-service name with the backend's canonical catalog (M16) so "My Services" stops showing three separate driver entries — this is the actual source of the naming drift the earlier session's whitelist fix only patched around.
11. Either wire up `NotificationsScreen`'s preference toggles to a real backend/storage-backed setting, or remove the screen until it does something (M14).
