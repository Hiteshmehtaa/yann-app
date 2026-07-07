# Frontend Stability Audit — Crash & Scale Risks

## Context

The user asked for a full pass over the frontend (React Native / Expo app at `/Users/hiteshmehta/Desktop/yann-app`) to find anything that could crash or misbehave, with an explicit bar: the app must hold up cleanly at ~10,000 users, with zero crashes. This is a read-only audit — no code was changed. A prior audit (`app-improvements.md`, Feb 2026) already covered feature-completeness/architecture gaps (fake dashboard data, missing pagination, no offline queue, etc.) — this document is scoped specifically to **crash risk and load/scale behavior on the frontend**, and does not repeat those findings except where directly relevant to a crash.

Three parallel audits were run (core infra: contexts/services/navigation; screens; components/modals), then several of the highest-severity claims were independently verified by reading the actual source. Findings below are organized by severity so fix work can be prioritized. Nothing here has been fixed yet — this is the map for the next phase of work.

---

## 🔴 Critical — Will crash the app today

These all share one root cause: **screens destructure `route.params` and immediately use fields without checking they exist.** Any of the following will produce an instant white-screen/crash:
- Android back-gesture restoring a screen from stale nav state
- A deep link opening the screen directly
- Navigating to the screen from a code path that forgot to pass a param
- (React Navigation / OS) restoring navigation state after the app was killed and relaunched

Confirmed via direct read of `BookingWizardScreen.tsx:75` — `const { service, selectedProvider, selectedAddress } = route.params;` with `service.title`/`service.pricingModel` used unconditionally a few lines later, no guard, no fallback UI.

Same pattern found (via agent audit, not yet individually re-verified line-by-line but pattern is consistent with the confirmed case) in:
- `src/screens/booking/BookingWizardScreen.tsx:75` — `service`, `selectedProvider`, `selectedAddress`
- `src/screens/booking/BookingDetailScreen.tsx:33` — `booking`
- `src/screens/booking/BookingWaitingScreen.tsx:44` — `bookingId`, `providerId`, etc.
- `src/screens/booking/DriverBookingFormScreen.tsx:71-85` — `service`, `selectedDriver`, `driverRate` (used at L135-136 in arithmetic — `driverRate * selectedDuration`, `service.gstRate`)
- `src/screens/booking/DriverBookingScreen.tsx:151` — `service`
- `src/screens/booking/DriverSearchResultsScreen.tsx:90-102` + `161-163` — `vehicleType.toLowerCase()`, `transmission.toLowerCase()`, `tripType.toLowerCase()` called inside `fetchMatchingDrivers()`, which runs from `useEffect` **on mount** — this one crashes on screen load, not just on some interaction
- `src/screens/booking/ServiceDetailScreen.tsx:190` — `service`
- `src/screens/booking/ProviderPublicProfileScreen.tsx:89` — `provider` (used as initial `useState`, then `provider._id`/`provider.services` on render)
- `src/screens/auth/DocumentUploadScreen.tsx:56,80` — `identityType` indexes into a `documentTypes` map; if it's not exactly `'foreigner'|'nri'`, `documentTypes[identityType]` is `undefined` and `.map`/`.filter` on it throws immediately on mount

**Fix pattern for all of the above:** guard the destructure (optional chaining + early-return to an error/empty state, or redirect back) instead of trusting `route.params` shape. This is a single repeatable fix applied ~9 times.

---

## 🟠 High — Will degrade badly under load, or crash intermittently

### Unbounded / uncancelled polling (biggest scale risk for 10k users)
- `src/contexts/NotificationContext.tsx` runs **three independent polling loops simultaneously**, none of which cancel an in-flight request before firing the next:
  - `setInterval(loadNotifications, 15000)` (~L125-129)
  - `setInterval(checkPendingBookingRequests, 3000)` while a booking modal is open (~L397-407)
  - `setInterval(checkActiveJobs + checkPendingRequests, 5000)` (~L625-800), duplicated by an `AppState` "active" listener re-firing the same calls
  - Axios has a 30s timeout (to tolerate Vercel cold starts) vs. 3-5-15s poll intervals — any slow backend response guarantees overlapping in-flight requests per client. At 10k concurrent users this compounds both device battery/CPU load and backend load, with no backoff or circuit breaker.
- `src/services/api.ts` response interceptor: on a 401 (session expired) it only `console.log`s and does nothing else — no token clear, no redirect, no signal to stop the pollers above. An expired session keeps polling every 3-15s indefinitely for the life of the app session.
- `src/services/api.ts:150-174` (`initializeBackend`): a `setInterval(..., 30000)` health-check ping is never cleared (acceptable at app-lifetime scope, but stacks with the above).

### Unguarded JSON.parse on cached data (recurring crash-adjacent bug)
- `src/contexts/NotificationContext.tsx:609` and `:616` — `JSON.parse(stored)` on cached AsyncStorage notifications, no try/catch around the parse itself, inside a function that also runs every 15s via the poller above. **One corrupted cache entry = a recurring uncaught rejection every 15 seconds for the rest of the session.**
- `src/services/api.ts` `markNotificationsRead` (~L344-346) reads raw `AsyncStorage.getItem('user')` (bypassing the safer `storage.ts` helper) and calls `JSON.parse` with no guard.

### Missing status → color mapping (confirmed)
- `src/utils/constants.ts:816-827` — `STATUS_COLORS` has no entries for `confirmed` or `active`.
- `src/screens/booking/BookingsListScreen.tsx:457` explicitly treats `'confirmed'` and `'active'` as valid statuses in its "ongoing" filter. Any booking in one of these statuses renders `STATUS_COLORS[status]` as `undefined` → an invalid color string in the style, producing a broken/blank badge (confirmed both sides directly; not yet confirmed whether this hard-crashes on any RN/Android version or just renders wrong — worth checking on-device).

### No virtualization on lists that grow per-user over time
- `src/screens/provider/ProviderBookingsScreen.tsx:732-751` — provider's booking list is a `ScrollView` + `.map()`, not `FlatList`. A provider who accumulates hundreds/thousands of bookings over time will see full re-renders and growing memory use — real jank/crash risk on low-end Android at scale. (Contrast: `BookingsListScreen` and `WalletScreen` correctly use `FlatList` with pagination.)
- `src/screens/profile/NotificationsListScreen.tsx:192-215` — same `ScrollView.map()` issue, and each row additionally allocates two fresh `Animated.Value` refs per item — unbounded memory/render growth for users with long notification histories.
- `src/screens/booking/BookingsListScreen.tsx` fetches the **entire** booking history in one call (`getMyBookings()`) every time the screen is focused — no limit/pagination on the request itself, even though the list rendering is virtualized. Fine at low volume, will slow down as booking history grows.

### Error boundary coverage gaps
- `src/components/ErrorBoundary.tsx` is correctly implemented (`getDerivedStateFromError` + `componentDidCatch`), but:
  - It's mounted **once at the very top** of the tree (`App.tsx:68`) — any render-phase error anywhere takes down the *entire app* to one generic fallback, with no per-route boundaries and no reset-on-navigation.
  - `componentDidCatch` only `console.error`s — nothing is sent to Sentry/Crashlytics. `src/utils/logger.ts` has a **commented-out** `Sentry.captureException` call that was never wired up. At 10k users in production, any crash that does occur will be **completely invisible** — no crash reporting pipeline exists today.
  - Standard React limitation, worth flagging explicitly: error boundaries cannot catch errors in event handlers, timers, or async code — which is exactly where most of the bugs in this report live (unhandled promise rejections, `JSON.parse` in async functions, `setTimeout` callbacks). These will surface as red-box warnings / silent failures, not boundary-caught fallbacks.

### Timer callbacks firing after unmount
- `src/components/BookingTimerModal.tsx:176-191, 211-215` — `setTimeout(onAccepted/onRejected/onTimeout, 1500)` calls are never stored/cleared; `clearAllIntervals()` only clears the interval/poll/buzzer refs, not these timeouts. If the modal is dismissed within that 1.5s window, the callback still fires against a torn-down tree.
- `src/components/JobTimer.tsx:55-70` — an `Animated.loop(...).start()` pulsing animation is started in the same effect as a countdown interval; only the interval is cleared on cleanup, the animation loop is not `.stop()`ed. Since the effect re-runs on `startTime`/`expectedDuration` changes, loops can accumulate on a long-lived screen.
- `src/screens/booking/DriverBookingScreen.tsx` — multiple `setTimeout(goToNextStep, 200)` calls (L235, 593, 616, 656, 679, 785) not tracked or cleared.
- `src/screens/auth/LoginScreen.tsx:153` / `PartnerLoginScreen.tsx:143` — `setTimeout(...,1500)` after OTP send, no cleanup if the user navigates away before it fires.

### Double-submission gaps
- `src/screens/booking/BookingWaitingScreen.tsx:500-529` — "select alternative provider" row has no `disabled={isLoading}` guard on the `TouchableOpacity`, only an internal state check; rapid double-tap can fire the reassignment call twice concurrently.
- `src/components/ui` button primitives (`AnimatedButton`, `GradientButton`, `NeoButton`) have no built-in in-flight guard — they rely entirely on the caller passing `disabled={isLoading}`. Everywhere checked, callers currently do this correctly (payment/OTP modals, WalletScreen), so no active bug, but it's one missed prop away from a duplicate-booking/duplicate-payment bug.

---

## 🟡 Medium — Real bugs, not crash-causing (worth fixing, lower priority)

- **`src/services/api.ts`** — inconsistent error handling: many endpoints (`getBookingById`, `acceptBooking`, `updateBookingStatus`, `rejectBooking`, `negotiateBooking`, `cancelBookingByMember`, `sendBookingRequest`, `createPaymentOrder`, `verifyPayment`, `payInitialBookingAmount`, `createReview`, `getProviderReviews`, `getFavorites`, `addToFavorites`, wallet + job-OTP endpoints) have **no try/catch**, relying entirely on every calling screen to wrap the call. This is inconsistent with the handful of methods that do have safe fallbacks, and is a latent source of unhandled-rejection bugs whenever a new call site forgets to wrap it.
- **`src/contexts/AuthContext.tsx:315-321`** — `updateUser` calls `storage.saveUserData(updatedUser)` without `await`/`.catch`; `storage.ts` explicitly re-throws on failure, so this is a floating unhandled rejection on AsyncStorage write failure.
- **`App.tsx:36-53`** — the boot `initialize()` async function has no try/catch and no timeout; if `initializeBuzzerSound()`, `setupNotificationChannels()`, or `isOnboardingCompleted()` throws or hangs, `setIsReady(true)` is never reached and the splash screen hangs forever with no fallback.
- **`NotificationContext.tsx:810-825`** (`markAsRead`) — reads `notifications` from a stale render closure rather than a functional `setState` updater; two rapid taps can each compute from a stale array and clobber each other.
- **`src/components/MapLocationPicker.tsx:102-106`** — "Use Current Location" button is fake: hardcodes Delhi coordinates instead of calling `expo-location`, misleading users into thinking GPS was used.
- **`src/components/JobOTPDisplay.tsx:37` / `JobOTPEntry.tsx:35`** — `new Animated.Value(...)` created directly in render body instead of via `useRef`; every re-render (e.g. every OTP keystroke) throws away animation state.
- **`src/components/BookingSuccessModal.tsx`** — accepts an `autoCloseDuration` prop that is never actually used/implemented; the modal never auto-dismisses despite the documented feature.
- **`src/screens/provider/ProviderBookingsScreen.tsx`** — several `parseInt(...)` calls on date-string parts with no `isNaN` guard before constructing `new Date(...)`, producing silent `Invalid Date`/blank rendering rather than a crash.
- **`src/screens/provider/ProviderServicesScreen.tsx:718`** — `parseInt(priceInput)` with no `isNaN` check; non-numeric input silently no-ops the save with no error message shown.
- **`src/utils/offlineStorage.ts`** — `pendingActions` queue (persisted to AsyncStorage) has no upper bound; a device that stays offline long enough (or hits non-retry-limited failures) could accumulate an unbounded queue.
- **Duplicate component definitions**, confirmed as genuinely divergent (not just copies) between top-level and `ui/` versions of the same name:
  - `AnimatedButton` — top-level version (spreads `TouchableOpacityProps`) is the one actually imported everywhere; `ui/AnimatedButton.tsx` (adds haptics) is currently dead code.
  - `EmptyState` — top-level version is used; `ui/EmptyState.tsx` has a stricter, incompatible API (`description` required) and is unused.
  - `ErrorDisplay`, `SearchBar`, `SkeletonLoader` — inverse of the above: only the `ui/` variants are actively used; top-level ones are dead code.
  - No screen currently imports the "wrong" one, so there's no live bug today — but it's a standing hazard: an accidental import-path change silently swaps behavior (e.g. losing haptics, or `EmptyState` suddenly requiring a prop it doesn't get, which **would** crash).
- **`src/services/socket.ts`** — entirely dead code today (chat feature disabled, socket never constructed), so no current leak risk. Flagging for later: `SocketService`'s `on`/`off` methods have no duplicate-listener guard, so re-enabling chat without adding listener bookkeeping risks accumulating duplicate `.on()` registrations across reconnects.
- **`src/screens/home/HomeScreen.tsx:526`** — `<Image source={{ uri: user.avatar }} />` has no `onError` fallback; a broken avatar URL silently fails to render (cosmetic, not a crash).

---

## Second-pass findings (screens/components/hooks/deep-links not covered in the first pass)

Fixes from the first pass (route.params guards on 9 screens, STATUS_COLORS, JSON.parse guards, double-tap guard, timer cleanup in BookingTimerModal/JobTimer, FlatList conversions) are already applied — see [implementation-plan.md](./implementation-plan.md). This section covers everything found in a follow-up sweep of the remaining screens, hooks, components, and the deep-link config.

### 🔴 Critical — live, reachable crash today (FIXED)
- **`src/screens/admin/AdminPushNotificationScreen.tsx:60,62`** — used `<TouchableOpacity>` but never imported it from `react-native`. This screen **is** registered and reachable (`AdminPush` route in `AppNavigator.tsx:390,421`), so this was a guaranteed `ReferenceError: TouchableOpacity is not defined` crash for any admin who opened it. **Fixed**: added `TouchableOpacity` to the import list. Verified via `tsc --noEmit` — the two `TS2304: Cannot find name 'TouchableOpacity'` errors are gone, no new errors introduced.
- **`src/screens/debug/BackendDebugScreen.tsx:201,232`** — same class of bug: `Platform.OS` used inside a module-scope `StyleSheet.create({...})` but `Platform` was never imported. Currently not registered in `AppNavigator.tsx` (dead code today), but would have crashed immediately the instant it was wired into navigation or a dev menu. **Fixed**: added `Platform` to the import list. Verified via `tsc --noEmit` — the two `TS2304: Cannot find name 'Platform'` errors are gone.

### 🟠 High — broken features (not crashes, but dead-end user flows) and scale risk
- **Provider earnings → booking detail is broken**: `src/screens/provider/ProviderEarningsScreen.tsx:261` calls `navigation.navigate('BookingDetail', { bookingId: txn.id })`, but `BookingDetailScreen` requires a full `route.params.booking` object and has no fetch-by-id fallback. Every *other* caller of `BookingDetail` in the codebase passes the full `booking` object correctly — this is the one wrong caller. Net effect: tapping any "Recent Job" transaction on the provider earnings screen always dead-ends on the (already-added) `MissingDataFallback` screen instead of showing the booking. Confirmed directly by reading both files.
- **The `/provider/:providerId` deep link has never worked**: `AppNavigator.tsx`'s `linking` config (~L323-345) maps deep link path `provider/:providerId` to `ProviderPublicProfileScreen`, which requires a full `provider` object in `route.params.provider`, not a `providerId` string. Confirmed: there is no code path anywhere in that screen that reads `route.params.providerId` and fetches by ID. A dead-code duplicate in `src/utils/shareUtils.ts:77-95` (`handleDeepLink`) attempts the same providerId extraction but is never imported/called anywhere. Result: opening a shared provider profile link (e.g. from a share action) always dead-ends on the fallback screen. This was likely masked before the Phase 1 fix because it would have crashed instead of showing a clear dead-end — now it's a visible-but-silent broken feature. If provider profile sharing/deep-linking is a feature you actually want working, this needs either (a) the screen updated to fetch-by-id when only `providerId` is present, or (b) the linking config removed if the feature was abandoned.
- **`Profile: 'verification-success'` / `ProviderProfile: 'verification-success'` deep links are safe but no-ops**: neither `ProfileScreen.tsx` nor `ProviderProfileScreen.tsx` read `route.params` at all, so these links just land on the plain profile tab — whatever "show verification success state" behavior was intended doesn't exist. Not a crash, but likely not what was intended when this config was written.
- **`usePagination.ts` (wide blast radius — used by any paginated list screen)**: `loadData` has no unmounted-guard and no request cancellation/generation token. A fast page-2 tap before page-1 resolves can let responses land out of order, and `setData(prev => [...prev, ...response.data])` has no dedup-by-id, so out-of-order responses can duplicate or misorder list items. `loadMore`'s `hasMore`/`isLoadingMore` guards read from closure state, so two rapid `onEndReached` fires (common on Android at scale) before state updates land can still slip through and double-fetch a page.
- **`useWalletBalance.ts`**: `fetchBalance` has no mounted-check and no cancellation; `useFocusEffect` re-triggers it on every screen refocus. Rapid tab-switching can leave multiple in-flight `getWalletBalance()` calls that resolve out of order — the last one to *land* (not the most recent request) wins, silently showing a stale wallet balance under real-world network jitter. This is a correctness bug, not just a leak, and hits every screen that shows wallet balance.
- **`src/components/animations/RiveAnimation.tsx`**: `riveRef.current.play()` fires unconditionally in a `useEffect` with no try/catch, and there's no `onError` handler for a failed `.riv` asset load. Currently not imported by any screen (dead code), but if wired in later without a rescue, a corrupt/missing asset would only be caught by the app-wide `ErrorBoundary` (which takes down the whole app, per the first-pass finding on error boundary coverage).

### 🟡 Medium
- **`ProviderDashboardScreen.tsx:390-391`** and **`ProviderEarningsScreen.tsx:114,117,270`**: both call `format(parseISO(dateField), ...)` in the render path, guarded only by a truthiness check on the raw string, not validity. A malformed/non-ISO date from the backend makes `parseISO` return an Invalid Date, and `date-fns`'s `format()` throws a `RangeError` for it — this is an actual render-path crash risk (not wrapped in try/catch) if the backend ever sends a bad `bookingDate`/transaction `date`.
- **`src/screens/profile/ProfileScreen.tsx:295`**: delete-account call has no `.catch` — a failed delete is a floating unhandled rejection with no user-facing error (contrast with `ProviderProfileScreen`'s equivalent flow, which correctly wraps this in try/catch).
- **`ProviderServicesScreen.tsx`**: the trash-icon service-delete and add-service flows have no in-flight/disable guard on their `TouchableOpacity`s, so a rapid double-tap can fire two concurrent `apiService` calls (the price-input modal path is unaffected since it closes immediately after validation).
- **Timer-stacking in date/time pickers**: `src/components/ui/TimeScrubber.tsx:75-93` and `src/components/ui/GlassDateStrip.tsx:40-57` both call `setTimeout(..., 500)` inside a `useEffect` with no `clearTimeout` cleanup. Rapid selection changes stack multiple pending timeouts that all eventually fire an auto-scroll, fighting the user's own scroll gesture. (`CustomTimePickerWheel.tsx` has the identical pattern but *does* clean up correctly — good reference for the fix.)
- **`src/components/ui/StickyBookingCTA.tsx:34-61`**: the pulsing `Animated.loop(...)` starts conditionally inside a `useEffect` keyed on `[disabled, loading]` with no cleanup to stop the loop on unmount or re-trigger. Wasted native-thread animation cycles accumulate on a booking-flow screen users revisit often.
- **`src/components/home/ServiceMatrix.tsx:11-29`**: `animValues` ref array is sized to the services list's length on first render and never resized; if the list grows later (category/filter change), new items either don't animate correctly or recreate a fresh `Animated.Value` every render (perf cost, not a crash).
- **`src/components/ui/GlassCard.tsx`'s tilt gesture** (`enableTilt`) is used on several auth-screen form cards that contain `TextInput`s/`ScrollView`s inside the tilted card — a `Gesture.Pan()` layered over form inputs is a plausible (not confirmed) touch-reliability risk under real device timing; worth a manual check on a physical device.
- **`src/hooks/useNetworkStatus.ts:36`** has a stray garbage comment (`// naviugatuabdkjabkjfbkjdbkblkadslbadslkjsb`) — cosmetic, but worth checking nothing was accidentally deleted near it.

### Confirmed clean in this pass
`EditProfileScreen`, `HelpSupportScreen`, `SavedAddressesScreen`, `LanguageSettingsScreen`, `NotificationsScreen`, `BankDetailsScreen` (solid regex validation on account number/IFSC) — all correctly guarded. `ChatScreen`/`ProviderChatScreen` are static "Coming Soon" screens with no state or API calls — cannot crash. Push-notification taps don't currently drive `navigation.navigate` anywhere in `NotificationContext.tsx` (confirmed via full-file grep), so the "notification deep-links to a detail screen with missing params" risk doesn't exist in the current code. `useSearch.ts`, `useToast.tsx`, `useResponsive.ts`, `CustomBottomSheet`, `PaymentMethodSelector`, `PremiumDateTimePicker`, `SwipeableListItem`, `LiquidBackground`, `FAB`, `FloatingDock`, `SmartHero`, `ProviderIncomingRequest` (careful cancellation-flag pattern), `maps.ts`, `locationService.ts`, `favoritesStorage.ts`, `shareUtils.ts`, `versionCheck.ts` — all reviewed, no findings above Medium.

---

## What's already solid (no action needed)
- `WalletScreen.tsx` — best-guarded screen reviewed: real `FlatList` pagination, `isNaN`-guarded `parseFloat`, try/catch everywhere, correct double-submit guards.
- `FavoritesScreen.tsx` — correct `FlatList` usage.
- `HomeScreen.tsx` — proper try/catch, loading/error/empty states throughout.
- Payment modals (`GlobalPaymentModal`, `GlobalInitialPaymentModal`, `CompletionPaymentModal`, `InitialPaymentModal`) — all wrap payment calls in try/catch/finally, so the "processing" spinner is always reset even on failure; no stuck-spinner risk found.
- `AppNavigator.tsx`, `ThemeContext.tsx`, `useNetworkStatus.ts`, `storage.ts`, `offlineStorage.ts` (aside from the unbounded-queue note above) — no missing-cleanup effects, all subscriptions unsubscribe correctly.
- Form components (`FormInput`, `FloatingLabelInput`, `Input`, `OTPInputModal`) and `MapLocationPickerModal`/`AddressPicker` — properly guarded numeric input and location-permission handling.

---

## Suggested next steps (for planning, not yet executed)
1. **Critical first:** add a shared param-guard pattern to the ~9 screens listed above (either a small helper/HOC or repeated inline guard) — this is the only category that reliably crashes the app today.
2. **High, scale-related:** consolidate `NotificationContext`'s three pollers into one, add request-in-flight guards, and wire the 401 interceptor to actually stop polling and clear the session. This is the single biggest lever for 10k-user stability.
3. **High:** wrap the two unguarded `JSON.parse` calls in `NotificationContext.tsx:609,616` (and `api.ts`'s `markNotificationsRead`) in try/catch.
4. **High:** add `confirmed`/`active` (and ideally `assigned` if it exists elsewhere) to `STATUS_COLORS`.
5. **High:** convert `ProviderBookingsScreen` and `NotificationsListScreen` from `ScrollView.map()` to `FlatList`.
6. **High:** wire up real crash reporting (Sentry is already a dependency reference in `logger.ts` but commented out) so production crashes at 10k-user scale are actually visible.
7. Medium-severity items can be batched into a general cleanup pass afterward.

## Verification approach once fixes are made
- Since this is React Native, verify via: `npx expo start` and manually exercising each fixed screen's "missing params" path (navigate via a stripped-down deep link or by calling `navigation.navigate` with partial params in dev) to confirm the guard triggers instead of crashing.
- For the polling consolidation, use React DevTools / a network inspector (e.g. Flipper or Reactotron) to confirm only one in-flight request per interval, and confirm 401 responses stop further polling.
- For list virtualization changes, test with a seeded large dataset (100+ bookings/notifications) on a low-end Android emulator profile to confirm no jank/OOM.
