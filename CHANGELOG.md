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
