# LGK Business — Bug Tracker & Improvement Loop

> Format: each bug has **Root cause**, **Symptom**, **Fix**, **Commit**, **Status**
> Add new bugs at the top of the relevant section. Move to ✅ RESOLVED when deployed.

---

## HOW TO USE THIS FILE

1. **Spot** — user reports symptom or console error appears
2. **Diagnose** — identify root cause (not just symptom)
3. **Fix** — minimal code change, one concern per commit
4. **Log** — add entry here with commit hash
5. **Verify** — confirm fix on production (Vercel deploy)
6. **Loop** — check if the fix exposed a related issue; if so, add new bug entry

---

## 🔴 OPEN / IN PROGRESS

*(none currently known — add here when discovered)*

---

## 🟡 MONITORING (fixed but watch for regressions)

### BUG-014 — Mapy suggest returns 422 for ALL requests (type param)
- **Symptom**: `GET .../v1/suggest?...&type=address 422` — geocoding always fails, map never renders, distance always null
- **Root cause**: Mapy v1/suggest returns 422 for ANY request that includes a `type` parameter — even `type=address` alone. Also: geocoding without city context returns wrong city (e.g. "Piastów 44" matched Piechowice instead of Szczecin).
- **Fix (1)**: Removed `type` param entirely from `mapyService.js mapyAutocomplete`.
- **Fix (2)**: Append city with space to all geocoding queries — `mapyAutocomplete(base + ' Szczecin')` in both delivery handler and profile self-heal.
- **Commit**: `cfdaa4f`
- **Status**: 🟡 Monitor — deploy and verify map renders + price updates

### BUG-009 — Mapy static map still not rendering
- **Symptom**: Map image area is blank in order form step 3 and step 4
- **Root cause**: `getRouteSnapshotUrl` returns a valid URL but browser may still block if `NEXT_PUBLIC_MAPY_API_KEY` is not baked into the Vercel build (env vars require redeploy to take effect)
- **Status**: API key confirmed added to Vercel. Monitor after next deploy to confirm images load.
- **Related**: BUG-007, BUG-008

### BUG-008 — Route distance / price calculation
- **Symptom**: Price always shows PLN 24.95 minimum regardless of delivery distance
- **Root cause (1)**: HERE autocomplete API never returns `position.lat/lng` — that requires a separate `/v1/lookup` call. So `deliveryLat/Lng` were always null, skipping the route calculation entirely.
- **Root cause (2)**: Profile had `pickup_lat = null` because address was saved via manual typing (not dropdown selection). No coordinates → no route.
- **Fix**: On dropdown selection, geocode via Mapy if lat/lng missing. On profile load, self-heal missing pickup coordinates via Mapy autocomplete and persist back to DB.
- **Commit**: `a73836c`, `129fb83`
- **Status**: 🟡 Monitor — Mapy geocoding now resolves coordinates, price should update

---

## ✅ RESOLVED

### BUG-013 — Mapy geocoding fires on every keystroke (422 spam)
- **Symptom**: Console floods with `GET https://api.mapy.com/v1/suggest?query=p,+Szczecin 422` on every character typed
- **Root cause**: `handleDeliveryChange` called `mapyAutocomplete` when `!lat && base`. `base` = typed text, which is truthy on every keystroke. `addr.street` is `''` on keystrokes but populated on real dropdown selections — the wrong field was checked.
- **Fix**: Changed condition to `if (!lat && addr.street)` — only runs after actual dropdown selection.
- **Commit**: `129fb83`

### BUG-012 — Mapy suggest returns 422 when query contains commas
- **Symptom**: `GET .../v1/suggest?query=aleja%20Piast%C3%B3w%2044%2C%2070-311%20Szczecin 422`
- **Root cause**: Mapy suggest API rejects queries containing commas. Full formatted address (`"Piastów 44, 70-311 Szczecin"`) was being passed. Self-healing geocode passed full `pickup_address` string (`"osiedle Skarbówek 101, 71-450 Szczecin"`).
- **Fix**: Pass only `base` (street + houseNumber, no postcode/city) to `mapyAutocomplete`. Self-healing strips everything after the first comma before querying.
- **Commit**: `129fb83`

### BUG-011 — Saved addresses 400 in Settings
- **Symptom**: `GET .../saved_addresses?select=*&user_id=eq.xxx 400 (Bad Request)`
- **Root cause**: `settings/page.js` queried with `.eq('user_id', ...)` but the column is `client_id`. Same wrong column used in the set-default-pickup update.
- **Fix**: Changed both occurrences to `.eq('client_id', ...)`.
- **File**: `app/(portal)/settings/page.js:29,38`
- **Commit**: `129fb83`

### BUG-010 — Delivery address shows only street + house number (no city/postcode)
- **Symptom**: Step 3 and step 4 summary show "Piastów 44" instead of "Piastów 44, 70-311 Szczecin"
- **Root cause**: `handleDeliveryChange` stored `[addr.street, addr.houseNumber].join(' ')` only. City/postcode are stored separately but not included in the display field.
- **Fix**: Build `fullAddress = base + ', ' + cityPart` and store in `deliveryAddress`. City/postcode still stored separately for DB.
- **File**: `app/(portal)/orders/new/page.js:327`
- **Commit**: `a73836c`

### BUG-007 — Pickup address save blocked in Settings
- **Symptom**: Clicking Save after selecting address from dropdown shows error "Select address from suggestions list"
- **Root cause**: Validation blocked save if `pickupLat/Lng` were null. HERE autocomplete often does not return `position` — so coordinates were null even after valid dropdown selection.
- **Fix**: Removed the GPS validation from savePickup. Self-healing geocoding on order page handles missing coordinates.
- **File**: `app/(portal)/settings/components/AddressesSection.js:113-120`
- **Commit**: `88abc39`

### BUG-006 — Pickup address display truncated / formatting broken
- **Symptom**: After saving, address chip shows "Piastów44" (no space) or gets cut off by the Edit button
- **Root cause (1)**: `onChange` built address with `join('')` — no separator between street and house number.
- **Root cause (2)**: `<span>` in readonlyChip had no flex/overflow rules — Edit button squished it.
- **Fix**: Use `addr.address` as base (AddressInput already joins with space), append `, postcode city`. Add `flex:1, wordBreak:'break-word'` to span and `flexShrink:0` to Edit button.
- **File**: `app/(portal)/settings/components/AddressesSection.js:221-228, 206`
- **Commit**: `88abc39`

### BUG-005 — Hardcoded Polish/English text not going through translation system
- **Symptom**: Language switching leaves some strings untranslated (Polish hardcoded in EN mode or vice versa)
- **Root cause**: Inline `lang === 'pl' ? '...' : '...'` ternaries scattered across `orders/new/page.js`, `dashboard/page.js`, `AddressesSection.js` instead of using STRINGS/TRANSLATIONS system.
- **Fix**: Moved all 30+ hardcoded strings into STRINGS (orders, settings) and TRANSLATIONS (dashboard, appContext) objects. Added pl/en/uk keys for all missing strings.
- **Files**: `utils/appContext.js`, `app/(portal)/orders/new/page.js`, `app/(portal)/dashboard/page.js`, `app/(portal)/settings/components/AddressesSection.js`
- **Commit**: `88abc39`

### BUG-004 — React hydration error #418
- **Symptom**: Console: `Hydration failed because the server rendered HTML didn't match the client`
- **Root cause**: `useState(() => localStorage.getItem('lgk_lang'))` ran on both server (no localStorage, returns 'pl') and client (returns stored lang). Mismatch caused React to bail.
- **Fix**: Always initialise `lang` state to `'pl'` on both server and client. Read localStorage only in `useEffect` after mount.
- **File**: `utils/appContext.js:342-351`
- **Commit**: earlier session

### BUG-003 — CSS border shorthand conflict warnings
- **Symptom**: Console: `Updating a style property during rerender (border) when a conflicting property is set (borderLeft)`
- **Root cause**: Components set `border: '1px solid ...'` and `borderLeft: '4px solid ...'` on the same element. React cannot apply both — shorthand overwrites the longhand.
- **Fix**: Replaced all `border:` with explicit `borderTop + borderRight + borderBottom + borderLeft` across 6 files.
- **Files**: `dashboard/page.js`, `admin/messages`, `admin/flags`, `admin/settings`, `admin/brama`, `admin/moderation`
- **Commit**: earlier session

### BUG-002 — Mapy static map URL malformed
- **Symptom**: Map image does not render; curl exits with code 3 (URL malformed)
- **Root cause**: `shapes` and `markers` params contained raw `:;[]()` characters which break URL parsing. These must be percent-encoded.
- **Fix**: Switched all URL construction in `mapyService.js` to `URLSearchParams` which encodes special chars automatically.
- **File**: `lib/mapyService.js`
- **Commit**: earlier session

### BUG-001 — Mapy routing response misread
- **Symptom**: Route distance always null; price always PLN 24.95 (minimum)
- **Root cause**: Code looked for `data.route || data.routes[0]` but Mapy routing API returns a flat object `{ length, duration, geometry, parts, routePoints }` — no nesting.
- **Fix**: Read `data` directly. Guard with `if (!data?.length) return null`.
- **File**: `lib/mapyService.js:83`
- **Commit**: earlier session

---

## IMPROVEMENT LOOP — NEXT CHECKS

After each deploy, test these flows end-to-end and note any new symptoms:

| Flow | What to verify | Last verified |
|------|----------------|---------------|
| New order — pickup address | Profile pickup loads with coordinates, `s. Skarbówek` geocodes correctly | 2026-06-12 |
| New order — delivery address | Select from dropdown → address shows full city/postcode → route calculates → price updates | 2026-06-12 |
| New order — map image | Static map renders in step 3 after delivery selection | 🔴 unverified |
| Settings — pickup address | Select from dropdown → full address displayed → Save works | 2026-06-12 |
| Settings — saved addresses | List loads (no 400 error) | 2026-06-12 |
| Language switch | All strings change to PL / EN / UK — no Polish text left in EN mode | 2026-06-12 |
| Dashboard — empty state | Shows translated text + CTA button | 2026-06-12 |
| Dashboard — stat cards | Orders/Spent/Success cards show current-month data | 2026-06-12 |
