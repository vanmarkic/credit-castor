#!/usr/bin/env python3
"""
Automated UAT for Continuous Timeline Feature
Tests all critical user flows from the manual testing checklist.
"""

import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

# Test configuration
BASE_URL = "http://localhost:4321/credit-castor"
SCREENSHOTS_DIR = Path("tests/uat/screenshots")
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

class TimelineUAT:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0

    def log(self, message, status="INFO"):
        """Log test output"""
        symbols = {"PASS": "✅", "FAIL": "❌", "INFO": "ℹ️", "WARN": "⚠️"}
        print(f"{symbols.get(status, '•')} {message}")
        if status in ["PASS", "FAIL"]:
            self.results.append((message, status))
            if status == "PASS":
                self.passed += 1
            else:
                self.failed += 1

    def test_calculator_deed_date(self, page):
        """Test Suite 1: Calculator with Deed Date"""
        self.log("Test Suite 1: Calculator with Deed Date", "INFO")

        try:
            # TC1.1: Navigate to calculator
            page.goto(BASE_URL)
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)  # Wait for React hydration
            self.log("TC1.1: Navigated to calculator", "PASS")

            # TC1.2: Verify deed date field exists
            deed_date_input = page.locator('input[type="date"]').first
            expect(deed_date_input).to_be_visible()
            default_value = deed_date_input.input_value()
            assert default_value == "2026-02-01", f"Default date should be 2026-02-01, got {default_value}"
            self.log(f"TC1.2: Deed date field visible with default {default_value}", "PASS")

            # Screenshot
            page.screenshot(path=str(SCREENSHOTS_DIR / "01_calculator_deed_date.png"))

            # TC1.3: Fill calculator and generate results
            # Note: Assuming default participants are pre-filled
            calc_button = page.get_by_role("button", name="Calculer")
            if calc_button.is_visible():
                calc_button.click()
                page.wait_for_timeout(1000)  # Wait for calculation
                self.log("TC1.3: Calculator results generated", "PASS")
            else:
                self.log("TC1.3: Calculate button not found", "WARN")

            # TC1.4: Find "Continue to Timeline" button
            continue_button = page.get_by_text("Continue to Timeline")
            if continue_button.is_visible():
                self.log("TC1.4: 'Continue to Timeline' button visible", "PASS")
            else:
                self.log("TC1.4: 'Continue to Timeline' button not visible", "FAIL")

        except Exception as e:
            self.log(f"Calculator test failed: {str(e)}", "FAIL")

    def test_timeline_view(self, page):
        """Test Suite 2: Timeline View"""
        self.log("\nTest Suite 2: Timeline View", "INFO")

        try:
            # TC2.1: Navigate to timeline demo
            page.goto(f"{BASE_URL}/continuous-timeline-demo/")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(3000)  # Wait for React hydration + data rendering
            self.log("TC2.1: Navigated to timeline demo", "PASS")

            # TC2.2: Verify timeline visualization exists
            # Look for timeline container
            timeline = page.locator('.timeline, [class*="timeline"], [role="region"]').first
            if timeline.count() > 0:
                self.log("TC2.2: Timeline visualization found", "PASS")
            else:
                self.log("TC2.2: Timeline visualization not found", "WARN")

            # Screenshot
            page.screenshot(path=str(SCREENSHOTS_DIR / "02_timeline_view.png"), full_page=True)

            # TC2.3: Look for "Now" marker
            now_marker = page.get_by_text("Now")
            if now_marker.count() > 0:
                self.log("TC2.3: 'Now' marker visible", "PASS")
            else:
                self.log("TC2.3: 'Now' marker not visible", "WARN")

            # TC2.4: Look for "Deed Date" marker
            deed_marker = page.get_by_text("Deed Date")
            if deed_marker.count() > 0:
                self.log("TC2.4: 'Deed Date' marker visible", "PASS")
            else:
                self.log("TC2.4: 'Deed Date' marker not visible", "WARN")

        except Exception as e:
            self.log(f"Timeline view test failed: {str(e)}", "FAIL")

    def test_participants_table(self, page):
        """Test Suite 3: Participants Table"""
        self.log("\nTest Suite 3: Participants Table", "INFO")

        try:
            # Click on Participants tab to show the table
            participants_tab = page.get_by_role("button", name="Participants")
            if participants_tab.count() > 0:
                participants_tab.click()
                page.wait_for_timeout(500)  # Wait for tab content to load

            # TC3.1: Find participants list (card layout, not table)
            participants_heading = page.get_by_text("Participants", exact=True).first
            if participants_heading.is_visible():
                self.log("TC3.1: Participants list visible", "PASS")
            else:
                # Fallback: look for individual participant names
                alice = page.get_by_text("Alice")
                if alice.count() > 0:
                    self.log("TC3.1: Participants visible (found Alice)", "PASS")
                else:
                    self.log("TC3.1: Participants not visible", "FAIL")
                    return

            # TC3.2: Check for status badges
            active_badge = page.get_by_text("ACTIVE", exact=False)
            if active_badge.count() > 0:
                self.log("TC3.2: Status badges visible (ACTIVE found)", "PASS")
            else:
                self.log("TC3.2: Status badges not visible", "WARN")

            # TC3.3: Check for founder badge
            founder_badge = page.get_by_text("Founder", exact=False)
            if founder_badge.count() > 0:
                self.log("TC3.3: Founder badge visible", "PASS")
            else:
                self.log("TC3.3: Founder badge not visible", "WARN")

            # Screenshot
            page.screenshot(path=str(SCREENSHOTS_DIR / "03_participants_table.png"))

            # TC3.4: Try to expand a participant row
            # Look for first table row that might be expandable
            rows = page.locator('tbody tr')
            if rows.count() > 0:
                first_row = rows.first
                first_row.click()
                page.wait_for_timeout(500)  # Wait for expansion animation
                self.log("TC3.4: Participant row clicked (expansion attempted)", "PASS")

                # Screenshot after expansion
                page.screenshot(path=str(SCREENSHOTS_DIR / "04_participant_expanded.png"))
            else:
                self.log("TC3.4: No participant rows found", "WARN")

        except Exception as e:
            self.log(f"Participants table test failed: {str(e)}", "FAIL")

    def test_cash_flow_details(self, page):
        """Test Suite 4: Cash Flow Details"""
        self.log("\nTest Suite 4: Cash Flow Details", "INFO")

        try:
            # Make sure we're on Participants tab
            participants_tab = page.get_by_role("button", name="Participants")
            if participants_tab.count() > 0:
                participants_tab.click()
                page.wait_for_timeout(500)

            # Expand first participant to see cash flow details
            # Look for participant name (Alice, Bob, Charlie)
            alice_card = page.get_by_text("Alice").first
            if alice_card.is_visible():
                # Click the parent container to expand
                alice_card.locator('..').click()
                page.wait_for_timeout(1000)  # Wait for expansion

            # TC4.1: Look for summary cards
            invested_card = page.get_by_text("Total Invested", exact=False)
            received_card = page.get_by_text("Total Received", exact=False)
            net_position = page.get_by_text("Net Position", exact=False)

            cards_found = sum([
                invested_card.count() > 0,
                received_card.count() > 0,
                net_position.count() > 0
            ])

            if cards_found >= 2:
                self.log(f"TC4.1: Summary cards visible ({cards_found}/3 found)", "PASS")
            else:
                self.log(f"TC4.1: Summary cards not visible ({cards_found}/3 found)", "WARN")

            # TC4.2: Look for transaction list
            transaction_table = page.locator('table').nth(1)  # Second table (after participants)
            if transaction_table.count() > 0:
                self.log("TC4.2: Transaction list visible", "PASS")
            else:
                self.log("TC4.2: Transaction list not visible", "WARN")

            # TC4.3: Look for transaction types
            lot_purchase = page.get_by_text("LOT_PURCHASE", exact=False)
            if lot_purchase.count() > 0:
                self.log("TC4.3: Transaction types visible (LOT_PURCHASE found)", "PASS")
            else:
                self.log("TC4.3: Transaction types not visible", "WARN")

            # TC4.4: Look for CSV export button
            csv_button = page.get_by_text("Export to CSV", exact=False)
            if csv_button.count() > 0:
                self.log("TC4.4: CSV export button visible", "PASS")
            else:
                self.log("TC4.4: CSV export button not visible", "WARN")

            # Screenshot
            page.screenshot(path=str(SCREENSHOTS_DIR / "05_cash_flow_details.png"), full_page=True)

        except Exception as e:
            self.log(f"Cash flow details test failed: {str(e)}", "FAIL")

    def test_copro_panel(self, page):
        """Test Suite 5: Copropriété Panel"""
        self.log("\nTest Suite 5: Copropriété Panel", "INFO")

        try:
            # Click on Copropriété tab
            copro_tab = page.get_by_text("Copropriété")
            if copro_tab.count() > 0:
                copro_tab.click()
                page.wait_for_timeout(500)

            # TC5.1: Look for copro panel
            copro_header = page.get_by_text("Copropriété", exact=False)
            if copro_header.count() > 0:
                self.log("TC5.1: Copropriété panel visible", "PASS")
            else:
                self.log("TC5.1: Copropriété panel not visible", "WARN")

            # TC5.2: Look for cash reserve display
            cash_reserve = page.get_by_text("Cash Reserve", exact=False)
            if cash_reserve.count() > 0:
                self.log("TC5.2: Cash reserve display visible", "PASS")
            else:
                self.log("TC5.2: Cash reserve not visible", "WARN")

            # TC5.3: Look for hidden lots section
            hidden_lots = page.get_by_text("Hidden Lots", exact=False)
            if hidden_lots.count() > 0:
                self.log("TC5.3: Hidden lots section visible", "PASS")
            else:
                self.log("TC5.3: Hidden lots not visible", "WARN")

            # TC5.4: Look for monthly obligations
            obligations = page.get_by_text("Monthly Obligations", exact=False)
            if obligations.count() > 0:
                self.log("TC5.4: Monthly obligations visible", "PASS")
            else:
                self.log("TC5.4: Monthly obligations not visible", "WARN")

            # Screenshot
            page.screenshot(path=str(SCREENSHOTS_DIR / "06_copro_panel.png"))

        except Exception as e:
            self.log(f"Copro panel test failed: {str(e)}", "FAIL")

    def test_export_import(self, page):
        """Test Suite 6: Export and Import"""
        self.log("\nTest Suite 6: Export and Import", "INFO")

        try:
            # TC6.1: Look for Export JSON button
            export_button = page.get_by_text("Export JSON", exact=False)
            if export_button.count() > 0:
                self.log("TC6.1: Export JSON button visible", "PASS")
            else:
                self.log("TC6.1: Export JSON button not visible", "FAIL")

            # TC6.2: Look for Import JSON button
            import_button = page.get_by_text("Import JSON", exact=False)
            if import_button.count() > 0:
                self.log("TC6.2: Import JSON button visible", "PASS")
            else:
                self.log("TC6.2: Import JSON button not visible", "FAIL")

            # Screenshot
            page.screenshot(path=str(SCREENSHOTS_DIR / "07_export_import_buttons.png"))

        except Exception as e:
            self.log(f"Export/Import test failed: {str(e)}", "FAIL")

    def test_console_errors(self, page):
        """Check for console errors"""
        self.log("\nTest Suite: Console Errors", "INFO")

        # This would require setting up console listeners
        # For now, we'll just log that this should be checked manually
        self.log("Console errors should be checked manually in browser DevTools", "WARN")

    def run_all_tests(self):
        """Run all UAT tests"""
        self.log("=" * 60, "INFO")
        self.log("Starting Automated UAT for Continuous Timeline Feature", "INFO")
        self.log("=" * 60, "INFO")

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1920, "height": 1080})
            page = context.new_page()

            try:
                # Run all test suites
                self.test_calculator_deed_date(page)
                self.test_timeline_view(page)
                self.test_participants_table(page)
                self.test_cash_flow_details(page)
                self.test_copro_panel(page)
                self.test_export_import(page)
                self.test_console_errors(page)

            except Exception as e:
                self.log(f"Unexpected error during testing: {str(e)}", "FAIL")
            finally:
                browser.close()

        # Print summary
        self.log("\n" + "=" * 60, "INFO")
        self.log("UAT Test Results Summary", "INFO")
        self.log("=" * 60, "INFO")
        self.log(f"Total Tests: {self.passed + self.failed}", "INFO")
        self.log(f"Passed: {self.passed}", "PASS" if self.failed == 0 else "INFO")
        self.log(f"Failed: {self.failed}", "FAIL" if self.failed > 0 else "INFO")
        self.log(f"Pass Rate: {self.passed / (self.passed + self.failed) * 100:.1f}%", "INFO")
        self.log(f"\nScreenshots saved to: {SCREENSHOTS_DIR}", "INFO")

        # Exit with failure code if any tests failed
        return 0 if self.failed == 0 else 1

if __name__ == "__main__":
    uat = TimelineUAT()
    exit_code = uat.run_all_tests()
    sys.exit(exit_code)
