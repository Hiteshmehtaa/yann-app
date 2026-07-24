# Backend & Database System Audit

**Date:** 2026-07-14
**Scope:** `Server/` — every route under `Server/src/app/api/**` (133 routes), all Mongoose models under `Server/src/models/`, and all shared libraries under `Server/src/lib/`.
**Method:** Three independent deep-read passes (auth/identity/OTP; bookings/payments/wallet/cron; provider management/admin/catalog/misc), each cross-referenced against the mobile client (`src/services/api.ts`) to establish which server routes are actually reachable from the app today vs. dead/legacy code. Read-only — no code was changed and no data was written as part of this audit.
**Context:** dev and production share one MongoDB database (`YannDB`, same Atlas cluster) — every finding below applies to real, live data, not a sandboxed copy.

Each finding is marked **CONFIRMED** (the full code path was traced end to end) or **SUSPECTED** (the defect is real in the code but the audit couldn't fully verify live impact without querying/mutating production data, which was out of scope).

---

## Executive summary

The headline risk isn't any single bug — it's a **systemic pattern**: a small number of routes (`bookings/create`, `bookings/cancel`, `bookings/complete-payment`, `admin/settings`) correctly verify a JWT and check resource ownership. The large majority of the other ~120 routes were built assuming the *mobile app's* UI would be the only caller, and never added server-side authentication at all. Given the API is a plain public HTTPS surface, that assumption doesn't hold — every one of the "no auth" findings below is callable today with a bare `curl`, no login, no token.

On top of that, the money-handling code (wallet, escrow, GST, cron expiry) has several correctness bugs independent of auth that can double-charge, double-credit, or silently strand a customer's payment.

| Severity | Count |
|---|---|
| Critical | 12 |
| High | 12 |
| Medium | 11 |
| Low | 8 |

---

## CRITICAL

### C1. Nearly the entire `/api/admin/**` surface has no authentication
**Files:** `admin/analytics`, `admin/bookings`, `admin/coupons` (incl. POST/PUT/PATCH/DELETE), `admin/disputes`, `admin/export`, `admin/fix-indexes`, `admin/homeowners` (incl. block/unblock/delete/verify), `admin/notifications` (POST/PATCH — mass push broadcast), `admin/providers` (incl. block/unblock/delete/verify, approve-service, reject-service, pending-services), `admin/requests`, `admin/revenue`, `admin/reviews` (PATCH/DELETE), `admin/service-requests` (+ approve/reject — literally have `// TODO: Add admin authentication check` left in as a comment, unimplemented), `admin/services` (POST/PUT/DELETE/PATCH), `admin/stats`, `admin/tickets`, `admin/transactions` (creates refunds), `admin/wallet`, `admin/withdrawals` + `admin/withdrawals/process`.
Only `admin/settings/route.js` calls `requireAdmin()`. `admin/reports/route.js` is a partial exception: it accepts **any** valid homeowner/provider session token, not specifically an admin one.
**CONFIRMED.**

**Failure scenario:** anyone with the API base URL — no login required — can: create a 100%-off unlimited-use coupon; broadcast a push notification (including a phishing link) to every homeowner and provider; delete any review/ticket/coupon/service; block or delete any provider or homeowner account; export every user's PII; approve or reject withdrawals and refunds that move real money.

### C2. `identity/approve` and `identity/reject` have zero authentication
**Files:** `Server/src/app/api/identity/approve/route.js:34-36`, `identity/reject/route.js:35-36` — both literally contain `// TODO: Add admin authentication check here`.
**CONFIRMED.** Any unauthenticated caller can mark any homeowner or provider `isVerified: true` (or reject them) with a plain POST of `{userId, userType}`.

### C3. `identity/pending` leaks PII and raw identity-document images with no auth
**File:** `Server/src/app/api/identity/pending/route.js:22` (same TODO-instead-of-check pattern).
**CONFIRMED.** Returns `name, email, phone, avatar, identityDocuments` (base64 passport/visa/OCI scans) for every pending user to anyone who calls it.

### C4. The Aadhaar/DigiLocker verification flow can be used to verify a victim's account with someone else's real ID (IDOR)
**Files:** `verification/initiate/route.js:16` (no auth on the `userId`/`userType` in the body), `verification/callback/route.js:56-108`.
**CONFIRMED — this is the flow the mobile app actually uses** (`AadhaarVerificationScreen.tsx` → `apiService.verifyIdentity()`). Nothing binds the `userId` embedded in the DigiLocker callback URL to the person who actually completes the DigiLocker steps. An attacker can initiate the flow carrying a victim's `userId`, complete DigiLocker with their own real Aadhaar, and the *victim's* account gets marked Aadhaar-verified — or simply edit the `userId` query param on their own callback URL before the redirect fires.

### C5. `aadhaar/webhook` has no signature/secret verification
**File:** `Server/src/app/api/aadhaar/webhook/route.js:12-78`.
**CONFIRMED.** Trusts any POST body's `client_ref_id`/`status` to set `aadhaarVerified: true` via `findByIdAndUpdate`, no HMAC check against the provider (Meon). Currently orphaned from the mobile app's actual flow (see Architecture Notes), but still live and exploitable.

### C6. `/api/auth/session` can return a random other user's profile
**File:** `Server/src/app/api/auth/session/route.js:28, 73` — `ServiceProvider.findOne({ email: decoded.email })` / `Homeowner.findOne({ email: decoded.email })`.
**CONFIRMED (verified with an isolated BSON serialization test against this repo's actual `bson` dependency).** Phone-login JWTs never carry an `email` claim. MongoDB's BSON serializer drops object keys whose value is `undefined`, so `findOne({email: undefined})` is sent to Mongo as `findOne({})` — returning an **arbitrary document** by collection order. A phone-authenticated caller hitting this route can get back someone else's account data. Contrast with the correct pattern in `auth/me/route.js` (`findById(decoded.id)`).

### C7. `GET /api/notifications` leaks plaintext job start/end OTPs to anyone who knows a user ID — zero authentication
**File:** `Server/src/app/api/notifications/route.js:16` (also `mark-read/route.js:15`).
**CONFIRMED end to end.** Accepts `?userId=` or `x-user-id` header, no JWT check, returns `n.metadata` verbatim — and `job/start-otp`/`job/end-otp` store the literal OTP in that same metadata object. Anyone who obtains a homeowner's ObjectId (trivial given C1's `admin/export`) can read their live job OTP and use it to fraudulently authorize starting/ending a paid job.

### C8. `provider/bookings` and `provider/requests` impersonate any provider via an unverified header/param — leaks plaintext OTPs and customer PII
**Files:** `provider/bookings/route.js:50-89` (trusts raw `x-user-id` header, no JWT), OTPs returned at `:170-171` (`jobSession.startOTPPlain`/`endOTPPlain`); `provider/requests/route.js:62-78` (no auth mechanism at all, just `?providerId=`).
**CONFIRMED.** Send `x-user-id: <any provider ObjectId>` and receive that provider's full booking list, customer phone numbers, and the live OTPs needed to start/complete jobs.

### C9. Job start/end OTP routes trust a client-supplied `providerId` with no JWT at all
**Files:** `job/start-otp`, `job/verify-start`, `job/end-otp`, `job/verify-end` (all four).
**CONFIRMED.** None import `jwt` or call `authMiddleware.js`. "Ownership" is only a comparison against a client-supplied `providerId` in the body. `requireOwnership()` exists in `authMiddleware.js` for exactly this purpose but is used in only 2 routes repo-wide.

### C10. Cron `expire-payments` can overwrite a just-paid booking back to "cancelled" (TOCTOU race, no refund)
**File:** `Server/src/app/api/cron/expire-payments/route.js:17-39`.
**CONFIRMED via code** (the `updateMany` filter is provably status-blind — it doesn't re-check `status`/`timedOut` at write time, only at the earlier `find()`). If `/bookings/pay-initial` completes (customer debited, provider credited, status → `accepted`) in the narrow window between the cron's `find()` snapshot and its `updateMany`, the cron force-overwrites that booking to `cancelled` with no refund and no reconciliation — the booking permanently shows cancelled while real money already moved.

### C11. GST rate computed three different, inconsistent ways — the admin-configurable rate is silently ignored
**Files:** `bookings/create/route.js:14-92, 207-208, 404-419` (fetches `Service.gstPercentage` into a variable, then never uses it — actual rate comes from a separate hardcoded ~46-entry `SERVICE_CONFIG` map, defaulting to 18% for anything unlisted); `bookings/reassign/route.js:73-74` (uses a third source — the rate frozen on the original booking); `utils/pricingCalculator.js` (`calculateGST`/`calculateBookingTotal` imported in `bookings/create` but never called — dead duplicate implementation).
**CONFIRMED.** An admin setting a custom GST rate for a non-listed service has no effect; three code paths would each compute a different number if asked.

### C12. Wallet top-up wipes referral bonus balance and has no idempotency (double-credit on retry)
**File:** `wallet/topup/verify/route.js:66-94`.
**CONFIRMED.** `user.wallet = { balance: X, currency: 'INR' }` replaces the *entire* nested wallet subdocument — every sibling route does field-level assignment (`user.wallet.balance = X`); this one uniquely resets `bonusBalance`/`bonusBalanceGranted` to 0 on every top-up. Separately, there's no idempotency check on `razorpay_order_id`/`razorpay_payment_id` before crediting, and no unique index on `Transaction.razorpayOrderId` — a retried/duplicated POST credits the wallet twice for one real payment.

---

## HIGH

### H1. Homeowner referral-apply endpoint trusts an unverified `x-user-id` header — referral fraud
**Files:** `homeowner/referral/apply/route.js:20`, `homeowner/referral/route.js:15`. **CONFIRMED.** Attacker supplies a victim's ID to burn their one-time referral-code slot and credit their own bonus.

### H2. `POST /api/test/email` — unauthenticated open mail relay + credential-metadata leak, live in production
**File:** `test/email/route.js:20-25, 74-79`. **CONFIRMED.** Sends real email from the company account to any address with no auth; echoes `emailUser` and app-password length/spacing on success.

### H3. `POST /api/services` (public path) creates arbitrary catalog services with no auth
**File:** `services/route.js:867-924` — comment says "admin only," handler has no check. **CONFIRMED.**

### H4. Two admin withdrawal-approval endpoints make opposite, contradictory assumptions about wallet mutation
**Files:** `admin/withdrawals/route.js:162-216` (PUT) vs `admin/withdrawals/process/route.js:57-99` (POST). **CONFIRMED, both unauthenticated per C1.** `process` deducts the wallet on approve, does nothing on reject. `withdrawals` PUT does *not* deduct on approve, but *adds back* on reject (assuming a deduction that never happened). Whichever one the real admin UI uses, the other is a live endpoint whose math will corrupt provider balances if ever hit.

### H5. Duplicate provider-reject implementations — the one wired to the live provider UI doesn't refund
**Files:** `bookings/respond/route.js:169-217` (reject branch — called by `ProviderIncomingRequest.tsx`, the actual buzzer/timer modal) vs `bookings/reject/route.js:42-144` (called by `ProviderBookingsScreen.tsx`, does correctly refund escrow). **CONFIRMED.** `respond`'s reject branch returns `refundProcessed: booking.paymentMethod === 'wallet'` with **no refund logic backing that claim at all**. Currently low-impact because no money is collected pre-acceptance in the normal flow, but any future path where escrow is held before this point (see C-adjacent finding on `pay-with-wallet` below) would silently strand customer money behind a fabricated "refunded: true" response.

### H6. `bookings/pay-initial` moves money across two documents with no database transaction
**File:** `bookings/pay-initial/route.js:108-172` — three independent, unwrapped `.save()` calls (customer debit → provider credit → booking status), unlike `complete-payment` which correctly uses a Mongo session/transaction. **CONFIRMED no session exists in the file.** If the last `.save()` throws after the first two commit, the customer is debited and provider credited but the booking stays `pending_payment` — retryable, risking a second debit/credit.

### H7. `bookings/pay-with-wallet` trusts client-supplied `totalPrice` with no server-side recomputation
**File:** `bookings/pay-with-wallet/route.js:34-158` — spreads the raw client body (including `totalPrice`) into `Booking.create()`, unlike `bookings/create` which always resolves price server-side. **CONFIRMED as written.** Also never maps `bookingData.providerId` to the schema's `assignedProvider` field, likely creating an orphaned, un-assignable booking with money already escrowed. **Reachability SUSPECTED-low** — no call site found in the current mobile app (`createBookingWithWallet` appears unused), but the route itself is live.

### H8. Money- and state-changing booking routes missing authentication/ownership checks
**Files:** `bookings/reject`, `respond`, `pay-initial`, `update-status`, `reassign`, `negotiate`, `accept`, `request`, `buzzer` — none check the caller against `booking.assignedProvider`. **CONFIRMED.** `bookings/reject` never verifies the submitted `providerId` matches the booking before pushing a rejection + refund; `update-status` only checks provider identity *if* `providerId` happens to be present in the body — omitting it skips the check entirely.

### H9. Admin login: hardcoded weak default password, no rate limiting, real DB model bypassed entirely
**File:** `admin/login/route.js:5-24`. **CONFIRMED.** `ADMIN_PASSWORD` defaults to `admin@123` (matches the live `.env.local` value verbatim); `JWT_SECRET` also has a hardcoded fallback. No rate limiter on this route at all (contrast with `auth/send-otp`). The fully-built `Admin` model (bcrypt, roles, lockout, per-admin permissions) is never queried — every successful login just mints `role: 'admin'`.

### H10. Duplicate provider service-request approval flows — the simpler one fails to roll back rejected rate/removal changes
**Files:** `admin/providers/approve-service` + `reject-service` (handles addition/rate_update/removal) vs `admin/service-requests/approve` + `reject` (only handles the "addition" shape). **CONFIRMED.** Rejecting a price-increase or service-removal request via the simpler endpoint leaves the (rejected) change live permanently, while reporting success.

### H11. Broken notification-helper call signature silently kills notifications on withdrawal/service-request decisions
**Files:** `admin/providers/approve-service/route.js:68-79`; `admin/withdrawals/process/route.js:119-134, 168-180`. **CONFIRMED.** Both call `createAndSendNotification('type', null, null, providerId, {...})` — 5 positional args — but the helper only accepts one destructured options object. The resulting `title`/`message` are `undefined`, `Notification.save()` throws (both are `required`), the helper swallows the error, and the route reports success regardless. Providers never learn their withdrawal/service request was approved or rejected.

### H12. `provider/profile` lets a provider bypass the admin-approval workflow that sibling endpoints exist to enforce
**File:** `provider/profile/route.js:200-232` — its `allowedUpdates` whitelist includes `services`/`serviceRates` and writes them directly, with no `status: 'pending'`/`pendingServiceRequest` gate, unlike `add-service`/`update-service`/`remove-service` which all correctly force admin review first. **CONFIRMED.**

---

## MEDIUM

### M1. Systemic reliance on full-document `.save()` across nearly every write route (the "one bad field blocks everything" trap)
Confirmed present in: `bookings/{request,respond,accept,reject,reassign,negotiate,update-status,cancel,buzzer,pay-initial}`, `payment/webhook`'s capture/fail handlers, `auth/verify-otp` (`homeowner.save()` for `lastLoginAt`), `job/verify-end` (wallet `.save()`s), `admin/withdrawals` + `admin/withdrawals/process`.
Mongoose's `.save()` re-validates the **entire** document, not just the touched field. Any one pre-existing invalid/legacy field anywhere on that document (an old schema version, a manual edit) makes **every future write from any of these routes** throw a generic 500 — unrelated to the field actually being changed. This exact pattern was already found and fixed once this session in `provider/profile` (via `validateModifiedOnly: true`); it recurs at every call site listed above. **SUSPECTED as to which specific documents are currently affected** (would require a live data query, out of this audit's read-only scope) but the structural exposure is **CONFIRMED** and spans nearly the entire write surface of the app.

### M2. Field-shape/count drift across five different provider-listing endpoints
**Files:** `providers/route.js:35`, `providers/[id]/route.js:80,108`, `providers/search/route.js:119`, `provider/by-service/route.js:34-37,62`, `services/[id]/providers/route.js:71-81`, `provider/service-counts/route.js:33`. **CONFIRMED.** Each selects a different field subset; `service-counts`'s aggregation hard-filters `{status:'active', isOnline:true}` while listing endpoints only filter `status:'active'` — a homepage's "N providers available" count can disagree with what's actually shown when the list is opened. Same bug class as the `aadhaarVerified`-exposure inconsistency already found and fixed once this session.

### M3. `GET /api/favorites` accepts an unverified `x-user-id` header fallback
**File:** `favorites/route.js:54-61`. **CONFIRMED.** Same unauthenticated-header-trust pattern as the Critical findings — reads another homeowner's saved-providers list given only their ID.

### M4. Unauthenticated debug endpoints dump PII and push tokens
**Files:** `debug/bookings/route.js`, `debug/verify-tokens/route.js`. **CONFIRMED**, live in production (shared DB).

### M5. Four homeowner routes resolve the caller by `email` instead of `id` — same wrong-account risk class as C6
**Files:** `homeowner/route.js:64`, `homeowner/addresses/route.js:42`, `.../addresses/[id]/route.js:39`, `.../addresses/[id]/primary/route.js:39`. **SUSPECTED** (pattern confirmed; `admin/fix-indexes` itself documents that phone-only signups with no `email` exist, which is exactly the precondition for C6's bug to recur here).

### M6. `provider/add-service` skips the driver-exclusivity/license-document rule enforced everywhere else
**File:** `provider/add-service/route.js` — no such check exists, unlike `provider/profile` and `register`. **CONFIRMED.** A non-driver provider can add "Personal Driver" with no license docs via this one path.

### M7. Provider "reject" via `bookings/respond` vs `bookings/reject` — see H5 (listed here too since the underlying inconsistency also affects non-money bookkeeping, e.g. `providerResponses` entries diverge in shape between the two).

### M8. `reviews/pending` and `GET /api/homeowner` only accept the web session cookie — unreachable from the mobile app
**Files:** `reviews/pending/route.js:25-26`, `homeowner/route.js:31-33`. **CONFIRMED.** Every sibling route falls back to `Authorization: Bearer`; these two don't, so a mobile caller always gets 401.

### M9. `update-status` bypasses the `awaiting_completion_payment` intermediate state
**File:** `bookings/update-status/route.js:52-58` — allows `accepted → in_progress → completed` directly. **CONFIRMED.** A booking can show `status: 'completed'` while the customer still owes the 75% balance.

### M10. Customer cancellation never refunds, regardless of how much escrow is held
**File:** `bookings/cancel/route.js:36-45` — comment explicitly states no refund is issued regardless of payment state, with no guard against cancelling an `'accepted'`/`'in_progress'` (escrow-held) booking. **CONFIRMED as written; SUSPECTED as to whether this is intentional policy** (nothing documents it as such).

### M11. Provider earnings dashboards show gross booking value, not net (post-commission) earnings, and one variant reports a nonexistent field
**Files:** `provider/earning/route.js:80-81,123` (`walletBalance` field doesn't exist on the schema — always 0), `provider/earnings/route.js:109` (sums `totalPrice` with no commission deducted). **CONFIRMED.**

---

## LOW

- **`payment/verify`** re-implements Razorpay signature checking with plain `===` instead of the existing `verifyRazorpaySignature()` helper (which correctly uses `crypto.timingSafeEqual`) — a weaker, duplicated security check. `payment/verify`/`create-order` appear to have no live mobile call sites (wallet top-up is the only reachable Razorpay path today). — `payment/verify/route.js:34-40`, `lib/paymentVerification.js:17-34`.
- **`timingSafeEqual` can throw** on a malformed/wrong-length signature instead of returning `false`; swallowed into a generic 500 in the webhook route, which could make Razorpay's retry mechanism hammer the endpoint. — `lib/paymentVerification.js:30-33,52-55`.
- **Two separate provider-withdrawal balance implementations disagree** — `wallet/withdraw` (live) uses `provider.wallet.balance` + the configured 15% commission; `provider/withdrawal/request` + `.../balance` instead sum `Transaction` records of types the real payment routes never create (so it's always ~0) and hardcode a 2% commission. Likely unreachable from the current app but a live, exploitable route. — `wallet/withdraw/route.js`, `provider/withdrawal/{request,balance}/route.js`.
- **`provider/verify`** — unauthenticated PII lookup by email (name/email/phone/services/status for any provider). Not called from the mobile app currently. — `provider/verify/route.js`.
- **Dead `/api/login` route** references `otpRecord.otp`, a field that doesn't exist on the `Otp` schema (`otpHash` only) — can never succeed, not called by the app. — `login/route.js:20-29`.
- **`aadhaar/status`** has a dead cookie-auth branch (cookie names it checks are never set anywhere) and a live, unauthenticated `x-user-id` header fallback. — `aadhaar/status/route.js:8-9,21,53-62`.
- **Hardcoded third-party secret** (Meon DigiLocker) checked into source in two separate files, one with no env-var override at all. — `verification/initiate/route.js:9`, `aadhaar/initiate/route.js:5`.
- **Public Google Maps proxy routes** (`location/autocomplete`, `directions`, `details`, `reverse-geocode`) have no auth or rate limiting of their own — anyone can drive arbitrary billed Google Maps usage through the server's API key.

---

## Architecture-level patterns (not single bugs — systemic, worth a dedicated fix pass)

1. **Two parallel identity-verification systems.** The DigiLocker flow (`verification/*`) is what the mobile app actually calls; a second, newer system (`aadhaar/*` + `identity/*`) is either partially wired (`identity/submit-documents` is live, used by the foreigner/NRI document flow) or entirely orphaned client-side (`aadhaar/initiate`/`aadhaar/status` are defined in `api.ts` but never called from any screen) while still being live, unauthenticated attack surface server-side (C5). Recommend consolidating to one system or removing the dead one.
2. **Business-logic constants duplicated with no shared source of truth**, found in at least 4 places even after this session's fixes: driver-service-name whitelists, GST-rate tables (C11), category/price-ceiling maps (`register`, `services`, `admin/services`, `provider/add-service` all copy-paste the same tables). Currently in sync by coincidence, not by construction.
3. **The full-document `.save()` trap (M1)** — this is the single highest-leverage structural fix available: switching write-heavy routes to `findByIdAndUpdate(..., { runValidators: true })` (already the pattern used correctly in `provider/add-service`) would eliminate an entire class of "unrelated legacy field blocks this whole document from ever being edited again" incidents in one pass.
4. **No consistent authentication middleware applied at the routing layer.** Every route hand-rolls its own auth (or doesn't). A single Next.js middleware or route-wrapper that enforces "every `/api/**` route except an explicit allowlist must present a valid JWT with the right `audience`" would have prevented essentially all of the Critical/High findings in this document at the source, rather than requiring each route to remember to add it individually.
5. **The real `Admin` model (bcrypt, roles, permissions, lockout) is fully built but never used** — `admin/login` bypasses it for a single shared hardcoded-fallback password. This one change (H9) plus wiring `requireAdmin()` into every `/api/admin/**` route (C1) would close the largest single block of findings in this document.

---

## Suggested priority order for remediation

1. Add `requireAdmin()` (or equivalent JWT+role check) to every `/api/admin/**` route — closes C1, most of H4/H10/H11.
2. Add `requireAuth()` + ownership checks to `identity/approve|reject|pending`, `notifications`, `provider/bookings`, `provider/requests`, `favorites`, `homeowner/referral/*`, `debug/*` — closes C2/C3/C7/C8/M3/M4/H1.
3. Fix the DigiLocker IDOR (C4) by binding verification completion to the authenticated session rather than a URL-embedded `userId`, and add webhook signature verification (C5).
4. Fix `auth/session`'s `email` lookup to use `decoded.id` (C6), and audit the other four `findOne({email:...})` call sites (M5) the same way.
5. Wrap `bookings/pay-initial`'s multi-document money movement in a Mongo transaction (H6), fix the cron TOCTOU race (C10), and add idempotency to wallet top-up (C12).
6. Consolidate GST-rate calculation to one source (C11) and delete the dead `pricingCalculator.js` duplicate or actually wire it in.
7. Migrate write-heavy `.save()` call sites to `findByIdAndUpdate` with `runValidators` (M1) — do this incrementally, but treat it as a standing rule for all new routes going forward.
