# Manual Testing Checklist

**Date:** 2025-11-03
**Feature:** Continuous Timeline with Deed Date
**Branch:** `feature/chronology-timeline`
**Tester:** [Your Name]

---

## Pre-Testing Setup

- [ ] Run `npm run dev` to start dev server
- [ ] Open browser to `http://localhost:4321`
- [ ] Open browser console (F12) to check for errors
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile device or responsive mode

---

## Test Suite 1: Calculator with Deed Date

### TC1.1: Deed Date Field Visibility
- [ ] Navigate to `/`
- [ ] Locate "Date de l'acte / Deed Date" section (green border)
- [ ] Verify default date is February 1st, 2026
- [ ] Verify bilingual label is clear

### TC1.2: Deed Date Input
- [ ] Change deed date to a past date (e.g., 2025-01-01)
- [ ] Verify date picker accepts the change
- [ ] Change deed date to a future date (e.g., 2027-12-31)
- [ ] Verify date picker accepts the change
- [ ] Reset to default (2026-02-01)

### TC1.3: Calculator Results
- [ ] Fill in default participants (should auto-populate)
- [ ] Click "Calculer" to generate results
- [ ] Verify results table displays correctly
- [ ] Check that all prices are calculated
- [ ] Verify no console errors

### TC1.4: Continue to Timeline Button
- [ ] After calculation, locate "Continue to Timeline" button
- [ ] Verify button is green and prominent
- [ ] Verify button is next to Excel export
- [ ] Click the button
- [ ] Verify JSON file downloads (`timeline-YYYY-MM-DD.json`)
- [ ] Verify success message appears
- [ ] Open downloaded JSON in text editor
- [ ] Verify deed date is present in ISO format
- [ ] Verify participant data is included

**Expected Results:**
- ✅ Deed date field visible and functional
- ✅ Default date is 2026-02-01
- ✅ JSON export includes complete project data
- ✅ No console errors

---

## Test Suite 2: Timeline View

### TC2.1: Accessing Timeline
- [ ] Navigate to `/continuous-timeline-demo/`
- [ ] Verify page loads without errors
- [ ] Verify demo data displays (sample project)
- [ ] Check console for any errors or warnings

### TC2.2: Timeline Visualization
- [ ] Locate horizontal timeline at top of page
- [ ] Verify T0 "Deed Date" marker (green) is visible
- [ ] Verify "Now" marker (orange, pulsing) is visible
- [ ] Verify at least one event marker is visible (blue)
- [ ] Click on an event marker
- [ ] Verify event details popup appears
- [ ] Verify popup shows event type, date, and details
- [ ] Close popup by clicking outside

### TC2.3: Timeline Scrolling (Mobile)
- [ ] Switch to mobile view (DevTools responsive mode)
- [ ] Verify timeline is horizontally scrollable
- [ ] Scroll left and right
- [ ] Verify all events remain visible during scroll
- [ ] Switch back to desktop view

### TC2.4: Event Colors
- [ ] Verify event markers have distinct colors:
  - Blue: Initial purchase/join
  - Purple: Sale (if in demo)
  - Yellow: Hidden lot (if in demo)

**Expected Results:**
- ✅ Timeline visualizes correctly
- ✅ Event markers are clickable and show details
- ✅ Responsive on mobile and desktop
- ✅ No console errors

---

## Test Suite 3: Participants Table

### TC3.1: Table Structure
- [ ] Locate Participants Table below timeline
- [ ] Verify table has columns: Name, Entry Date, Status, Lots Owned, Net Position, Actions
- [ ] Verify at least one participant row is visible
- [ ] Verify founder badge (green "Founder") appears on founders

### TC3.2: Status Badges
- [ ] Identify participants with different statuses:
  - [ ] Active (green badge)
  - [ ] Portage (yellow badge)
  - [ ] Exited (red badge) - if in demo data
- [ ] Verify each status is visually distinct

### TC3.3: Lots Owned Display
- [ ] Check "Lots Owned" column
- [ ] Verify lot IDs are displayed (e.g., "A1, A2")
- [ ] If portage lots exist, verify 🏠 icon appears
- [ ] Hover over portage lots to check for styling

### TC3.4: Expandable Cash Flow
- [ ] Click on a participant row
- [ ] Verify row expands smoothly
- [ ] Verify cash flow details appear below
- [ ] Click again to collapse
- [ ] Verify row collapses smoothly
- [ ] Try expanding multiple participants
- [ ] Verify only one is expanded at a time (or multiple if allowed)

**Expected Results:**
- ✅ Table displays all participants correctly
- ✅ Status badges are clear and color-coded
- ✅ Founder badge appears on deed date participants
- ✅ Rows expand/collapse smoothly
- ✅ No console errors

---

## Test Suite 4: Participant Cash Flow Details

### TC4.1: Summary Cards
- [ ] Expand a participant to view cash flow
- [ ] Locate 4 summary cards at top:
  - [ ] Total Invested (red card)
  - [ ] Total Received (green card)
  - [ ] Net Position (red/green based on value)
  - [ ] Months Since Deed / Monthly Burn (blue card)
- [ ] Verify all values are numerical and formatted correctly
- [ ] Verify negative net position shows in red
- [ ] Verify positive net position shows in green (if any)

### TC4.2: Transaction List
- [ ] Locate transaction table below summary cards
- [ ] Verify columns: Date, Type, Description, Amount, Balance
- [ ] Verify dates are in DD/MM/YYYY format
- [ ] Verify transaction types have colored badges
- [ ] Verify amounts are formatted as currency
- [ ] Verify running balance updates with each row
- [ ] Check that negative amounts are in red
- [ ] Check that positive amounts are in green (if any)

### TC4.3: Transaction Types
- [ ] Identify each transaction type in the list:
  - [ ] LOT_PURCHASE (one-shot, at deed date)
  - [ ] NOTARY_FEES (one-shot, at deed date)
  - [ ] LOAN_PAYMENT (recurring, monthly)
  - [ ] PROPERTY_TAX (recurring, monthly)
  - [ ] INSURANCE (recurring, monthly)
  - [ ] COMMON_CHARGES (recurring, monthly)
- [ ] Verify recurring transactions appear every month
- [ ] Verify one-shot transactions appear only once

### TC4.4: Category Filter
- [ ] Locate "Category" dropdown above transaction table
- [ ] Select "All Transactions" - verify all transactions show
- [ ] Select "One-Shot Only" - verify only purchase, fees, sales show
- [ ] Select "Recurring Only" - verify only monthly costs show
- [ ] Reset to "All Transactions"

### TC4.5: CSV Export
- [ ] Scroll to bottom of cash flow section
- [ ] Click "Export to CSV" button
- [ ] Verify CSV file downloads
- [ ] Open CSV in Excel or text editor
- [ ] Verify headers: Date, Type, Description, Amount, Balance
- [ ] Verify all transactions are included
- [ ] Verify formatting is correct

**Expected Results:**
- ✅ Summary cards display accurate totals
- ✅ Transaction list is complete and chronological
- ✅ Category filter works correctly
- ✅ CSV export contains all data
- ✅ No console errors

---

## Test Suite 5: Copropriété Panel

### TC5.1: Panel Visibility
- [ ] Locate Copropriété Panel (usually on right side)
- [ ] Verify panel has header "Copropriété"
- [ ] Verify cash reserve amount is displayed prominently
- [ ] Verify reserve color coding:
  - [ ] Green background if ≥3 months of obligations
  - [ ] Red background if <3 months of obligations

### TC5.2: Cash Reserve Display
- [ ] Check "Cash Reserve" section
- [ ] Verify amount is formatted as currency
- [ ] Verify "Months of Reserve" is displayed
- [ ] If reserve is low (<3 months):
  - [ ] Verify warning icon appears
  - [ ] Verify warning message is clear

### TC5.3: Hidden Lots
- [ ] Locate "Hidden Lots" section
- [ ] Verify each hidden lot shows:
  - [ ] Lot ID
  - [ ] Acquisition date
  - [ ] Status badge (Available/Sold)
- [ ] Verify available lots are distinguishable from sold lots
- [ ] Check that lot count is accurate

### TC5.4: Monthly Obligations
- [ ] Locate "Monthly Obligations" breakdown
- [ ] Verify components are listed:
  - [ ] Loans
  - [ ] Insurance
  - [ ] Accounting
  - [ ] Total
- [ ] Verify all amounts are formatted as currency
- [ ] Verify total equals sum of components

### TC5.5: Months Since Deed Date
- [ ] Locate "Months since deed date" counter
- [ ] Verify count is accurate based on current date and deed date
- [ ] Calculate manually: (today - deed date) in months
- [ ] Compare with displayed value

**Expected Results:**
- ✅ Copro panel displays all information clearly
- ✅ Cash reserve alert works when low
- ✅ Hidden lots are tracked correctly
- ✅ Monthly obligations are accurate
- ✅ No console errors

---

## Test Suite 6: Export and Import

### TC6.1: Export Timeline JSON
- [ ] In Timeline View, locate "Export JSON" button (blue)
- [ ] Click the button
- [ ] Verify JSON file downloads (`timeline-export-YYYY-MM-DD.json`)
- [ ] Open JSON in text editor
- [ ] Verify structure:
  - [ ] `version` field exists
  - [ ] `exportedAt` timestamp exists
  - [ ] `events` array exists
  - [ ] Events contain participant data
  - [ ] Dates are in ISO format

### TC6.2: Import Timeline JSON
- [ ] In Timeline View, locate "Import JSON" button (green)
- [ ] Click the button
- [ ] Verify file picker opens
- [ ] Select a valid timeline JSON file
- [ ] Verify success message appears
- [ ] Verify timeline updates with imported data
- [ ] Verify participants table updates
- [ ] Verify copro panel updates

### TC6.3: Round-Trip Test
- [ ] Export current timeline to JSON (File A)
- [ ] Import File A
- [ ] Export again to JSON (File B)
- [ ] Compare File A and File B (should be identical except `exportedAt`)
- [ ] Verify data integrity is maintained

### TC6.4: Import Validation
- [ ] Try importing an invalid JSON file (e.g., text file)
- [ ] Verify error message appears
- [ ] Verify timeline does not change
- [ ] Try importing JSON with missing fields
- [ ] Verify appropriate error handling

**Expected Results:**
- ✅ Export creates valid JSON file
- ✅ Import successfully loads data
- ✅ Round-trip maintains data integrity
- ✅ Invalid imports are rejected with clear errors
- ✅ No console errors

---

## Test Suite 7: Integration Workflow

### TC7.1: Calculator to Timeline Flow
- [ ] Start at calculator (`/`)
- [ ] Set deed date to 2026-03-15
- [ ] Fill in participants (use custom values)
- [ ] Click "Calculer" to generate results
- [ ] Review results in table
- [ ] Click "Continue to Timeline"
- [ ] Download JSON file
- [ ] Navigate to `/continuous-timeline-demo/`
- [ ] Click "Import JSON"
- [ ] Select downloaded file
- [ ] Verify timeline loads with calculator data
- [ ] Verify participants match calculator inputs
- [ ] Verify deed date is 2026-03-15
- [ ] Verify founders have entry date = deed date
- [ ] Verify cash flows start from deed date

**Expected Results:**
- ✅ Seamless transition from calculator to timeline
- ✅ All data transfers correctly
- ✅ Deed date is preserved throughout
- ✅ Founders are correctly identified
- ✅ No data loss in conversion

---

## Test Suite 8: Performance

### TC8.1: Timeline Projection Speed
- [ ] Open browser DevTools Performance tab
- [ ] Start recording
- [ ] Import a timeline with 10+ participants
- [ ] Stop recording
- [ ] Measure time for timeline calculation
- [ ] **Target:** <100ms for full projection
- [ ] **Actual:** _____ ms

### TC8.2: Cash Flow Calculation Speed
- [ ] Open browser DevTools Performance tab
- [ ] Expand a participant with many transactions
- [ ] Measure render time
- [ ] **Target:** <50ms per participant
- [ ] **Actual:** _____ ms

### TC8.3: UI Render Performance
- [ ] Scroll through timeline
- [ ] Observe smoothness (should be 60fps)
- [ ] Open DevTools Rendering > Frame Rendering Stats
- [ ] Check FPS counter while scrolling
- [ ] **Target:** 60fps
- [ ] **Actual:** _____ fps

### TC8.4: Bundle Size
- [ ] Run `npm run build`
- [ ] Check build output for bundle sizes
- [ ] Timeline-related bundles:
  - [ ] timelineExport: ~1.36 kB ✓
  - [ ] ContinuousTimelineView: ~27 kB ✓
  - [ ] TimelineDemo: ~25 kB ✓
- [ ] **Total Added:** ~62 kB (target <75 kB) ✓

**Expected Results:**
- ✅ Timeline projection <100ms
- ✅ Cash flow calculation <50ms per participant
- ✅ UI renders at 60fps
- ✅ Bundle size increase <75KB

---

## Test Suite 9: Browser Compatibility

### TC9.1: Chrome/Edge (Latest)
- [ ] Open in Chrome or Edge
- [ ] Run all tests above
- [ ] Note any issues: _____________

### TC9.2: Firefox (Latest)
- [ ] Open in Firefox
- [ ] Run all tests above
- [ ] Note any issues: _____________

### TC9.3: Safari (Latest)
- [ ] Open in Safari
- [ ] Run all tests above
- [ ] Note any issues: _____________

### TC9.4: Mobile Safari (iOS)
- [ ] Open on iPhone/iPad
- [ ] Test timeline scrolling
- [ ] Test participant expansion
- [ ] Test import/export
- [ ] Note any issues: _____________

### TC9.5: Mobile Chrome (Android)
- [ ] Open on Android device
- [ ] Test timeline scrolling
- [ ] Test participant expansion
- [ ] Test import/export
- [ ] Note any issues: _____________

**Expected Results:**
- ✅ Works on all major browsers
- ✅ Responsive design works on mobile
- ✅ No critical browser-specific bugs

---

## Test Suite 10: Edge Cases

### TC10.1: Empty Timeline
- [ ] Import timeline with no events
- [ ] Verify graceful handling (empty state message?)
- [ ] Verify no errors

### TC10.2: Single Participant
- [ ] Import timeline with only 1 participant
- [ ] Verify displays correctly
- [ ] Verify cash flow calculates

### TC10.3: Many Participants (20+)
- [ ] Create timeline with 20 participants
- [ ] Verify performance is acceptable
- [ ] Verify table scrolls smoothly
- [ ] Verify all participants are visible

### TC10.4: Very Old Deed Date
- [ ] Set deed date to 2020-01-01
- [ ] Verify months since deed calculates correctly
- [ ] Verify recurring costs generate for all months
- [ ] Check transaction list length

### TC10.5: Future Deed Date
- [ ] Set deed date to 2030-01-01 (future)
- [ ] Verify "Now" marker appears before deed date
- [ ] Verify recurring costs don't generate yet
- [ ] Verify cash flow handles future start date

### TC10.6: Portage Scenarios
- [ ] Create participant with portage lots
- [ ] Verify loan payments show interest-only
- [ ] Verify portage indicator (🏠) appears
- [ ] Verify status badge is yellow "PORTAGE"

**Expected Results:**
- ✅ Edge cases handled gracefully
- ✅ No crashes or errors
- ✅ Appropriate messages for edge cases

---

## Summary

### Test Results Overview

| Test Suite | Tests Passed | Tests Failed | Issues Found |
|------------|--------------|--------------|--------------|
| 1. Calculator | __ / __ | __ | __________ |
| 2. Timeline View | __ / __ | __ | __________ |
| 3. Participants | __ / __ | __ | __________ |
| 4. Cash Flow | __ / __ | __ | __________ |
| 5. Copro Panel | __ / __ | __ | __________ |
| 6. Export/Import | __ / __ | __ | __________ |
| 7. Integration | __ / __ | __ | __________ |
| 8. Performance | __ / __ | __ | __________ |
| 9. Browsers | __ / __ | __ | __________ |
| 10. Edge Cases | __ / __ | __ | __________ |
| **TOTAL** | __ / __ | __ | __________ |

### Critical Issues
1. _________________________________
2. _________________________________
3. _________________________________

### Minor Issues
1. _________________________________
2. _________________________________
3. _________________________________

### Recommendations
- [ ] Fix critical issues before release
- [ ] Document known minor issues
- [ ] Consider performance optimizations
- [ ] Add more comprehensive error messages
- [ ] Improve mobile UX if needed

---

**Testing Completed By:** _____________
**Date:** _____________
**Time Spent:** ________ hours
**Overall Status:** 🟢 PASS / 🟡 PASS WITH ISSUES / 🔴 FAIL

**Next Steps:**
- [ ] Address critical issues
- [ ] Re-test failed cases
- [ ] Performance tuning if needed
- [ ] Final UAT approval
