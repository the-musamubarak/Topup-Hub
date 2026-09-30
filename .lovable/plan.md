# TopUp Hub — Feature Rollout Plan

Nine features, grouped so each phase leaves the app fully working. Every backend piece uses Lovable Cloud (RLS + server functions). ClubKonnect calls run only from the server so the API key never touches the browser.

## Prerequisite (needed once)

Before ClubKonnect features work, we need two secrets stored in Lovable Cloud:
- `CLUBKONNECT_USER_ID`
- `CLUBKONNECT_API_KEY`

I'll request these via the secure secret form as soon as you approve the plan. Nothing else is needed from you until then.

---

## Phase 1 — Foundation (schema + ClubKonnect proxy)

New tables (all with RLS, `created_at`/`updated_at`, and `service_role` grants):

- `wallets` — one row per user, `balance_kobo bigint`.
- `wallet_ledger` — every credit/debit with `type` (`funding | purchase | refund | admin_credit | cashback | referral_bonus`), `amount_kobo`, `balance_after_kobo`, `reference`, `notes`, `actor_id`.
- `transactions` — every service purchase: `service_type`, `provider_id`, `recipient`, `amount_kobo`, `cost_kobo` (what CK charged us), `margin_kobo`, `status` (`pending|success|failed|refunded`), `clubkonnect_ref`, `raw_response jsonb`.
- `beneficiaries` — `nickname`, `service_type`, `provider_id`, `identifier` (phone/meter/smartcard/IUC), unique per user.
- `service_pricing` — admin-editable margins: `service_type`, `provider_id`, `plan_code`, `base_cost_kobo`, `markup_kobo`, `markup_percent`, `is_active`.
- `broadcasts` + `broadcast_reads` — admin messages + per-user read state.
- `loyalty_points` — running balance per user.
- `loyalty_ledger` — earn/redeem history.
- `admin_audit_log` — every admin action (refund, credit, price change, broadcast) with actor, target, before/after JSON.
- `clubkonnect_balance_snapshots` — timestamped cache of CK wallet balance.

Server functions in `src/lib/`:
- `clubkonnect.server.ts` — one shared fetch wrapper (base URL, auth, error normalization). Server-only, never imported by routes.
- `clubkonnect.functions.ts` — thin `createServerFn` wrappers admins/users call.

---

## Phase 2 — Admin features

### 1. Live ClubKonnect balance widget + low-balance alert
- Server fn `getClubkonnectBalance()` hits CK Wallet Balance API, writes a snapshot, returns `{ balance, fetched_at }`.
- Admin dashboard shows the balance card, "Refresh" button, and a threshold input (default ₦5,000).
- When balance < threshold: red banner across every admin route + a toast on load.
- Snapshot table lets us later show a "balance over time" sparkline.

### 2. Per-service margin controls
- New admin page `/admin/pricing` lists every service/provider/plan.
- Admin sets either a flat `markup_kobo` or `markup_percent`; UI shows resulting user-facing price.
- When a user buys, price = `base_cost + markup`. `transactions.margin_kobo` is stamped so profit reports are exact.
- Every change writes to `admin_audit_log`.

### 3. Manual refund / wallet credit tool with audit log
- On `/admin/transactions`: each row gets a "Refund" action (only for `success` or `failed`).
- On `/admin/users`: each user gets "Credit wallet" and "Debit wallet" with required reason.
- Server fn wraps everything in a single DB transaction: update `wallets.balance_kobo`, insert `wallet_ledger` row, update `transactions.status` if applicable, insert `admin_audit_log`.
- New `/admin/audit-log` page: filterable table (actor, action type, date range).

### 4. Broadcast notifications to all users or a segment
- Admin page `/admin/broadcasts`: title, body, CTA link, audience selector (`all | active_last_30d | never_transacted | admins_only | single_user`).
- Server fn resolves audience → inserts a broadcast row + fan-out rows into `broadcast_reads` (unread).
- User side: bell icon in the tab header shows unread count, opens a sheet listing broadcasts, marks read on open.

### 5. Export analytics to CSV + revenue/cost/profit chart
- `/admin/analytics` gains:
  - Date-range picker (today, 7d, 30d, custom).
  - Stacked bar chart: **Revenue** (amount_kobo), **Cost** (cost_kobo), **Profit** (margin_kobo) per day.
  - KPI cards: total revenue, total cost, gross profit, margin %.
  - "Export CSV" buttons for: transactions in range, wallet ledger in range, admin audit log in range.
- CSV built server-side, returned as a downloadable blob (server route at `src/routes/api/admin.export.$type.ts` gated by admin role).

---

## Phase 3 — User features

### 6. Save beneficiaries with nicknames
- On any service page, after entering a recipient, a "Save as beneficiary" toggle + nickname field.
- Service pages get a horizontal "Saved" strip at the top — tap to autofill.
- Full CRUD page under Settings → Beneficiaries (edit nickname, delete).

### 7. One-tap "repeat last transaction"
- Transactions list: each successful row gets a "Repeat" button.
- Tapping opens the matching service page with recipient + plan pre-filled and a "Confirm & pay" primary button (skips selection steps).
- For failed transactions, button label becomes "Retry".

### 8. Auto-detect network from phone number prefix
- Utility `detectNetwork(phone)` with the current NCC prefix map (MTN, Airtel, Glo, 9mobile — including ported ranges we can flag as "verify").
- On airtime/data pages, as the user types the phone number, the network chip auto-selects and shows the logo.
- Manual override remains available; auto-detect is a hint, not a lock.

### 9. Cashback / loyalty points, redeemable for airtime
- Rules: earn 1 point per ₦100 spent on any successful transaction. 100 points = ₦100 airtime credit.
- Points card on Home + Wallet showing balance and "Redeem" CTA.
- Redemption flow: choose network + phone → confirm → server fn deducts points, calls ClubKonnect airtime, logs to `loyalty_ledger` + `transactions`.
- Every earn/redeem shows in a "Rewards" tab in transactions.

---

## Technical notes (for reference)

- All ClubKonnect calls go through `createServerFn` with input validated by Zod. User-facing errors are generic ("Purchase failed, try again"); raw provider messages are logged server-side.
- Wallet mutations use `SELECT … FOR UPDATE` inside a server-side transaction to prevent double-spend / race conditions.
- Admin-only server fns check `has_role(auth.uid(), 'admin')` before any privileged action; the audit log is written even on failed attempts.
- `_authenticated` layout unchanged; admin pages stay under `src/routes/admin.*`.
- CSV export route lives under `src/routes/api/` (not `api/public/`) so it inherits auth; admin role checked inside the handler.
- No breaking changes to existing pages — new features layer on top of current routes.

## Rollout order

1. Approve plan → I request the two ClubKonnect secrets.
2. Phase 1 migration (all tables + policies + audit log).
3. Phase 2 admin features (balance widget → pricing → refunds/audit → broadcasts → analytics/CSV).
4. Phase 3 user features (beneficiaries → repeat → auto-detect → loyalty).

If you want a smaller first slice, say "just phase 2" or name specific features and I'll ship those first.
