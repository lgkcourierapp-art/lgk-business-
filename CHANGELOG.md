## [1.0.0] — 2026-05-26

### Added — Full Platform Build
- Client dashboard: stat cards (orders/month, PLN spent, success rate) + Supabase Realtime INSERT subscription
- Order detail page: `order_number` displayed as primary identifier, Realtime UPDATE subscription
- Collection QR page: single QR on dark card, order_number in yellow monospace, 24h expiry countdown, pickup notes box, "Collected at HH:MM" scanned state
- Printable A6 label: segment strip [CITY][ZONE][DATE][SEQ][CHK] with city+check highlighted, dual-column addresses, tracking URL `lgk.pl/track/{order_number}`
- Saved Addresses page (`/addresses`): full CRUD, default address, pickup/delivery type filter, bottom-sheet add/edit form
- Shared layout components: `Sidebar.js` (desktop nav), `BottomNav.js` (mobile 4-item nav), `Topbar.js` (L° logo + page title + New order button)
- PWA: `app/manifest.ts`, `public/sw.js` (network-first nav, cache-first assets, offline fallback), `InstallPrompt.jsx` (Android auto-banner, iOS Share → Add to Home Screen)
- SW registered via `InstallPrompt` on first load — no App Store required

### Changed — Order Numbering (DD-BIZ-002 → v2)
- Date format: YYMMDD (was DDMMYY — now sorts correctly chronologically)
- Sequence: global atomic counter via `get_next_order_sequence()` (was daily reset count — no more collisions)
- Check digit: Luhn mod-10 (catches phone transcription errors)
- International city codes added: PL · UK · DE · KE · AE
- New exports: `validateOrderNumber()`, `parseOrderNumber()`, `calculateCheckDigit()`

### Database (Phase 1 SQL — run in Supabase)
- `order_counter` table + `get_next_order_sequence()` atomic function
- `auto_create_qr_token()` trigger: QR auto-generated on every delivery INSERT (SCALE-007 fix)
- New `deliveries` columns: `order_number`, `pickup_city/postal/zone/notes`, `recipient_name/phone`, `time_window`, `label_printed_at`, `qr_scanned_at`, `disputed_at/reason`, `auto_confirmed_at`
- `auto_confirm_delivered_orders()` function: confirms delivered orders after 24h dispute window

---

## [0.9.0] — 2026-05-26

### Added
- Settings page — Business Type selector
  - Radio group: General Business / Restaurant / Food / Pharmacy / Medical
  - Auto-saves to `profiles.business_type` on radio change (no save button needed)
  - Info banner appears when restaurant mode is active, explaining what changes
  - Fetches `business_type` from profiles on load alongside existing company info
- New Order form — conditional Restaurant Details section
  - Shown between pickup and delivery sections when `businessType === 'restaurant'`
  - Order Ready Time: `<input type="time">` → stored as `HH:MM` in `time_window`
  - Prep Time chips: 10 min / 15 min / 20 min / 30 min / 45 min (toggleable)
  - Number of Bags / Items chips: 1–5+ (44px touch targets) → `order_item_count`
  - Handling flags checkboxes: Hot food, Liquid/spill risk, Keep upright,
    Contact-free dropoff → combined into `pickup_notes` with ` · ` separator
  - Note for Courier textarea → `pickup_notes` prefix before handling flags
  - INSERT updated: `time_window` from readyTime (fallback `any_time`),
    `order_item_count` from itemCount, `pickup_notes` from courierNote + handlingFlags

---

## [0.7.0] — 2026-05-25

### Changed
- Super Admin Moderation section wired to real image_moderation data
  - 4 tabs with live counts: pending / approved / removed / disputed
  - Approve / Remove / Ban courier actions (ban writes profiles.is_banned)
  - All actions logged to audit_log
  - AI flag banner shows activation status and cost info
  - Image thumbnails, type badges, AI score colour-coded badges
- Super Admin Feature Flags panel wired to real feature_flags table
  - Live toggle switches — changes instant and persistent
  - All toggles logged to audit_log (feature_flag_toggled event)
  - ai_moderation_enabled: confirmation dialog + cost context
  - Covers: ai_moderation_enabled, google_oauth_enabled, anonymous_auth_enabled

### Fixed
- Moderation section was showing static/empty content
- Feature Flags panel was hardcoded, not connected to database

---
