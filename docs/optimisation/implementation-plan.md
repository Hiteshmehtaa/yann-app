# Implementation Plan — Frontend Stability Fixes

Source: [frontend-stability-audit.md](./frontend-stability-audit.md). Executed in phases, Critical first. Each phase is a separate, verifiable unit of work.

## Phase 1 — Critical: route.params guards (done)
Added a shared `MissingDataFallback` component (`src/components/MissingDataFallback.tsx`) and guarded all 9 screens that destructure required `route.params` fields and use them unconditionally:

- Made the destructure itself safe against `route.params` being `undefined` (`route.params || ({} as any)`), since the crash can happen at the destructure line before any hook runs.
- Guarded any `useEffect`/function that dereferences the param and runs automatically (e.g. on mount) with an internal `if (!param) return;`.
- Added a render-level guard (`if (!requiredField) return <MissingDataFallback ... />`) placed after all hooks *and* after all `const`/function definitions that any earlier-registered effect might reference in its closure — placing it too early causes a temporal-dead-zone crash when an effect (already registered) later calls a function whose `const` declaration was skipped by an early return. Verified this ordering per-screen by checking what each effect calls before finalizing placement.
- `DriverSearchResultsScreen` didn't need a new fallback — it already had a `renderError()` state UI, so the internal guard in `fetchMatchingDrivers()` now feeds that existing path instead.

Screens fixed: `BookingWizardScreen`, `BookingDetailScreen`, `BookingWaitingScreen`, `DriverBookingFormScreen`, `DriverBookingScreen`, `DriverSearchResultsScreen`, `ServiceDetailScreen`, `ProviderPublicProfileScreen`, `DocumentUploadScreen`.

Verified via `npx tsc --noEmit`: no new type errors introduced (repo has some pre-existing, unrelated type errors in other files not touched here).

## Phase 2 — High: quick, isolated fixes (done)
- Added `confirmed`/`active` entries to `STATUS_COLORS` in `src/utils/constants.ts` (matched to `accepted`/`in_progress` semantics respectively, per how `BookingsListScreen` groups them as "ongoing").
- Guarded the two unguarded `JSON.parse` calls in `NotificationContext.tsx` (now wrapped individually, clearing the corrupted cache entry on failure instead of leaving a recurring uncaught rejection).
- Fixed `api.ts`'s `markNotificationsRead`: it was reading a raw `'user'` AsyncStorage key that nothing in the codebase ever writes to (so `userId` was always `undefined` — a bug beyond just the missing try/catch). Replaced with the existing `storage.getUserData()` helper, which uses the correct key and already has its own try/catch.
- Added `disabled={isLoading}` to `BookingWaitingScreen`'s alternative-provider row to close the double-tap gap.
- Fixed `AuthContext.updateUser`'s floating promise by adding `.catch()` to the `storage.saveUserData` call.
- `BookingTimerModal.tsx`: added an `outcomeTimeoutRef` to track the `onAccepted`/`onRejected`/`onTimeout` `setTimeout(…, 1500)` calls, cleared on unmount — previously these could fire against a torn-down modal.
- `JobTimer.tsx`: captured the pulsing `Animated.loop(...)` in a variable and called `.stop()` in the effect's cleanup alongside the existing `clearInterval` — previously the loop was never stopped, so re-running the effect could accumulate overlapping animation loops.

Verified via `npx tsc --noEmit`: output is byte-identical to the pre-Phase-2 baseline (no new errors introduced).

## Phase 3 — High: NotificationContext polling consolidation
Bigger architectural change — merge the three overlapping pollers (3s/5s/15s) into one coordinated poller with in-flight guards, and make the 401 interceptor actually stop polling / clear session. Will check in with user before starting since this touches core app behavior significantly.

## Phase 4 — High: list virtualization (done)
Converted both `ProviderBookingsScreen` and `NotificationsListScreen` from `ScrollView` + `.map()` to `FlatList`. Both kept their existing loading/empty-state visuals via `ListEmptyComponent` (with `data={isLoading ? [] : filteredBookings}` in `ProviderBookingsScreen` to distinguish loading vs. truly-empty) and kept `refreshControl` pull-to-refresh behavior unchanged. `renderBookingCard`/`renderNotification` functions were reused as-is inside `renderItem`, `keyExtractor` uses each item's existing `id` field. `ScrollView` import kept in `ProviderBookingsScreen` since it's still used for the horizontal filter-tab strip.

Verified via `npx tsc --noEmit`: no new errors introduced (identical to Phase 2 baseline).

## Phase 3 and Phase 5 — held per user decision
User chose to defer Phase 3 (NotificationContext polling consolidation) and skip Phase 5 (crash reporting, needs an external Sentry/DSN account) for a future pass.

## Phase 5 — Crash reporting
Requires a product decision (new dependency `@sentry/react-native` or similar, a DSN, and a native rebuild via EAS) — will confirm with user before adding.

## Phase 6 — Medium-severity cleanup batch
Remaining items from the audit's Medium section, batched together once Phases 1-4 are verified.

## Phase 7 — Critical fixes from second-pass audit (done)
A follow-up sweep (see "Second-pass findings" in [frontend-stability-audit.md](./frontend-stability-audit.md)) found two guaranteed-crash bugs, both missing-import `ReferenceError`s at render time:
- `src/screens/admin/AdminPushNotificationScreen.tsx` — used `<TouchableOpacity>` without importing it. This screen is registered/reachable (`AdminPush` route), so this crashed for any admin opening it. Fixed by adding `TouchableOpacity` to the `react-native` import.
- `src/screens/debug/BackendDebugScreen.tsx` — used `Platform.OS` inside a module-scope `StyleSheet.create` without importing `Platform`. Not currently reachable (no route registered), but would have crashed instantly once wired in. Fixed by adding `Platform` to the import.

Verified via `npx tsc --noEmit`: both corresponding `TS2304: Cannot find name` errors are gone, no new errors introduced elsewhere.

The rest of the second-pass findings (High: broken `ProviderEarningsScreen` → `BookingDetail` navigation, non-functional `/provider/:providerId` deep link, race conditions in `usePagination`/`useWalletBalance`; Medium: `parseISO` crash risk, timer leaks, floating promise, double-tap guards) are documented but not yet fixed — pending review.

---
Starting Phase 1 now.
