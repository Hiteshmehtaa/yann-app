# YANN App — Deep Dive Improvement Report
> Date: 18 February 2026

---

## 🔴 Critical Issues (Fix First)

### 1. Polling Instead of Real-Time (BookingDetailScreen)
`BookingDetailScreen.tsx` polls the API **every 3 seconds** to detect job completion. This is expensive and unreliable. Replace with **WebSocket or Server-Sent Events (SSE)** — your push notification system already exists (`sendPushNotification.js`), use it fully.

### 2. Provider Dashboard Uses Fake/Mock Graph Data
`ProviderDashboardScreen.tsx` hardcodes `defaultEarningsData = [120, 250, 180, 420...]` as fallback when API doesn't return history arrays. The API at `/api/provider/stats` doesn't return `earningsHistory` with daily breakdowns. The chart always shows fake data. Either populate real data from DB or don't show the chart at all.

### 3. Debug Routes Exposed in Production
`/api/debug/bookings/route.js` and `/api/debug/verify-tokens/route.js` are live. These should be behind an admin auth check or removed entirely.

### 4. Booking Pricing Calculated Twice (Different Logic)
GST and total price are calculated both on the **frontend** (`BookingWizardScreen`) and in the **backend** (`/api/bookings/create`). The two calculations can diverge — e.g., the frontend reads `service.gstPercentage` while the backend has its own `SERVICE_CONFIG` lookup. Use **backend as single source of truth** — frontend should only show an estimated price.

### 5. No Idempotency on Booking Creation
`/api/bookings/create` has no duplicate-submission guard. A user double-tapping "Confirm Booking" or a network retry can create double bookings. Add an idempotency key (device-generated UUID) checked before insert.

---

## 🟠 Major Functional Issues

### 6. OTP Screen Accepts Any 4+ Character String
`VerifyOTPScreen` checks `otp.length < 4` but your OTPs are 6 digits. The validation should be **exactly 6 digits**. Also the OTP input is a plain `TextInput` — there's no auto-submit on 6th digit and no individual box UI (common for Indian apps, improves UX significantly).

### 7. Booking Wizard: Experience Range Logic is Incomplete
`BookingWizardScreen.tsx` has a comment: `// For brevity, skipping logic re-implementation unless critical` — the experience range selection logic is literally missing/placeholder. This is a rewrite artifact that needs to be properly restored.

### 8. Address Book Not Synced After Edit
In `BookingWizardScreen`, addresses are read from `user.addressBook` at mount time. If a user adds a new address in `SavedAddressesScreen` mid-flow, the wizard relies on `route.params?.selectedAddress` but there's no guarantee it refreshes. Use React Navigation's `useFocusEffect` + re-fetch pattern.

### 9. Provider Profile Screen vs. Public Profile Screen Mismatch
There's both a `ProviderProfileScreen` (provider-own view) and `ProviderPublicProfileScreen` (customer-facing). The customer-facing one doesn't show **Aadhaar verification badge**, **service rates**, or **available time slots** — critical trust signals for booking decisions.

### 10. Wallet Top-Up Has No Minimum/Maximum Enforcement on Frontend
The wallet top-up flow doesn't enforce any min/max amounts on the app side even though Razorpay has limits. A user entering ₹1 would create a failed order. Add frontend validation matching backend limits.

### 11. Chat Screen is Basically Empty
`ChatScreen.tsx` and `ProviderChatScreen.tsx` exist but there's no real-time chat implementation — presumably "Coming Soon". The app shows chat icons in booking details that raise user expectations. Either launch it or **remove the chat entry points** and replace with a "Call Support" button.

### 12. Notification Context is 737 Lines / Overcomplicated
`NotificationContext.tsx` is a 737-line god-context handling push tokens, booking modals, payment modals, polling, and deep-link listeners all in one file. This causes unnecessary re-renders app-wide. Split into `BookingNotificationContext` and `PushTokenContext`.

---

## 🟡 UI / UX Improvements

### 13. Home Screen: Category Filter Doesn't Persist
The `selectedCategory` state resets on every refresh. If a user filters to "Cleaning" and pulls-to-refresh, they're back to "all." Persist the selection across refreshes.

### 14. HomeScreen Fetches Partner Counts Per Service Individually
`HomeScreen` fetches partner counts for all services. If you have 30+ services, this could be many calls. Move this to a **single batch API endpoint** that returns all service counts in one response.

### 15. Service Icon Fallback is `✨` for Everything
`getServiceIcon()` in `HomeScreen.tsx` always returns `'✨'`. The actual icon map exists (`SERVICE_ICONS` object) but `getServiceIcon()` doesn't use it. Wire them up.

### 16. Onboarding Slides Are Generic
The 3 onboarding slides use `Campers-Welcome.json`, `Email-Sent.json`, `Success.json` — generic animations not specific to home services. The descriptions are translation keys that should show Yann-specific USPs (e.g., verified providers, secure escrow, OTP-based job start).

### 17. BookingDetail Screen: No Pull-to-Refresh
`BookingDetailScreen` has no `RefreshControl`. Users can't manually refresh booking status. Combined with the polling issue (#1), this makes the screen feel unresponsive when status doesn't auto-update.

### 18. Dark Mode Incomplete
`ThemeContext.tsx` is only 48 lines. Not all screens properly use `colors` from `useTheme()` — several screens hardcode `COLORS.*` (the light-mode constants) directly. This causes broken UI in dark mode.

### 19. Profile Screen: Membership Tier Based on Raw Booking Count
The "Gold/Silver/Bronze" tier is based on `bookingsCount` from a full booking fetch that includes all statuses (pending, cancelled, etc.). It should only count **completed** bookings.

### 20. Provider Earnings Screen: No Date Range Filter
`ProviderEarningsScreen` shows earnings but has no way to filter by week/month/custom range. This is table-stakes for any earnings dashboard.

---

## 🔵 Backend / API Issues

### 21. No API Versioning
All routes are at `/api/...` with no versioning. When you ship breaking changes, existing app versions will break. Use `/api/v1/...` from the start.

### 22. In-Memory Rate Limiter Won't Work at Scale
`rateLimiter.js` uses in-memory Maps for rate limiting. This resets on every serverless cold start and doesn't work across multiple instances. You have `redisRateLimiter.js` — use it everywhere or switch fully to Redis.

### 23. `serviceId` Typed as `String` in Booking Model
The `Booking` model has `serviceId: { type: String }` with a comment "Changed from Number to String to accept MongoDB ObjectIds." This is a hack. Use `mongoose.Schema.Types.ObjectId` with `ref: 'Service'` properly and update all queries.

### 24. No Pagination on Bookings List APIs
`/api/bookings` returns all bookings for a user. For users with 50+ bookings this will be slow. You have a `pagination.js` utility — use it on the bookings list endpoint.

### 25. Admin Dashboard: "Audit Logs" Link Goes Nowhere
The sidebar has "Audit Logs → `/admin/logs`" but there's no `src/app/admin/logs/page.jsx`. Clicking it will 404. Either build the page or remove the link.

### 26. Payment Webhook Has No Signature Verification Fallback
`/api/payment/webhook/route.js` should verify Razorpay's `X-Razorpay-Signature` header. If this is missing or improperly handled, a bad actor could fake payment success events. Double-check that `paymentVerification.js` is always called before processing.

### 27. `console.log` Everywhere in Production Routes
The booking create route alone has 8+ `console.log` statements with sensitive data (`💰 Provider pricing:`, etc.). These should use a proper logger (you already have Sentry configured — use `Sentry.addBreadcrumb` instead). Strip raw console logs from production.

### 28. Booking Status Enum Inconsistency
The `Booking` model has statuses like `awaiting_completion_payment` but the app also checks for `awaiting_completion_payment` vs `completed` in different places. The `STATUS_COLORS` constant in `constants.ts` may not cover all status values, causing missing color highlights.

---

## 🟢 Performance & Architecture

### 29. Duplicate Component Definitions
There are two `EmptyState` components — `src/components/EmptyState.tsx` (root-level) and `src/components/ui/EmptyState.tsx`. Same for `ErrorDisplay`, `SearchBar`, `AnimatedButton`, `SkeletonLoader`. Consolidate to the `ui/` folder and delete root-level duplicates.

### 30. `apiService` Has No Request Deduplication or Caching
Multiple screens calling `getAllServices()` or `getProviderById()` simultaneously will fire duplicate API calls. Add a simple in-flight request dedupe using a `Map<string, Promise>` pattern or integrate React Query / TanStack Query.

### 31. `AuthContext` Stores User in AsyncStorage Without Encryption
User tokens and profile data stored in AsyncStorage are unencrypted. For a home-services app with payment data, use `expo-secure-store` for the JWT token at minimum.

### 32. No Offline Queue for Booking Actions
If a user taps "Cancel Booking" while offline, the request silently fails with no retry. Build an action queue that replays failed mutations when connectivity is restored (you already have `useNetworkStatus` hook).

### 33. Admin Panel Has No Role-Based Access
The admin panel only checks if you're logged in as "admin" — there's no granular role (super-admin vs. support vs. finance). A support agent can access financial data. Add role scopes.

---

## Summary by Priority

| Priority | Count | Examples |
|---|---|---|
| 🔴 Critical | 5 | Polling, fake graph data, debug routes exposed |
| 🟠 Major Functional | 7 | OTP validation, broken experience range, no chat |
| 🟡 UI/UX | 8 | Dark mode, onboarding, icon fallback, missing refresh |
| 🔵 Backend/API | 8 | No API versioning, webhook security, console.log in prod |
| 🟢 Architecture | 5 | Duplicate components, no caching, unencrypted storage |

**Suggested fix order:** #1–5 (critical) → #21, #26, #27 (security) → #6, #7, #8 (booking flow) → #29, #30 (cleanup) → everything else.
