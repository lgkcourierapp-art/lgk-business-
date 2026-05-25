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
