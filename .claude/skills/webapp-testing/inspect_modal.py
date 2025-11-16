#!/usr/bin/env python3
"""
Click participant detail buttons and inspect the modal for copro proceeds breakdown.
"""

from playwright.sync_api import sync_playwright
import sys

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        print("Navigating and authenticating...")
        page.goto('http://localhost:4321/credit-castor')
        page.wait_for_load_state('networkidle')

        # Authenticate
        password_input = page.locator('input[type="password"]').first
        if password_input.is_visible():
            password_input.fill('castor2025')
            page.locator('button:has-text("Accéder")').click()
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)

        print("\nLooking for participant detail buttons...")

        # Find all "Cliquer pour détails" buttons
        detail_buttons = page.locator('text=/Cliquer pour détails/i').all()
        print(f"Found {len(detail_buttons)} detail buttons")

        # Also look for participant cards in timeline
        timeline_cards = page.locator('.timeline-card, [class*="timeline"]').all()
        print(f"Found {len(timeline_cards)} timeline elements")

        # Try clicking the "Nouveau·elle Arrivant·e" detail button (the newcomer)
        print("\nSearching for 'Nouveau·elle Arrivant·e' section...")
        newcomer_section = page.locator('text=/Nouveau.*elle.*Arrivant/i').first
        if newcomer_section.is_visible():
            print("✓ Found newcomer section")

            # Find the detail button near this section
            newcomer_button = page.locator('text=/Nouveau.*elle.*Arrivant/i').locator('..').locator('..').locator('text=/Cliquer pour détails/i').first
            if newcomer_button.count() == 0:
                # Try broader search
                newcomer_button = page.locator('button:has-text("Cliquer pour détails")').first

            if newcomer_button.is_visible():
                print("Clicking newcomer detail button...")
                newcomer_button.click()
                page.wait_for_timeout(1500)

                page.screenshot(path='/tmp/modal_newcomer.png', full_page=True)
                print("✓ Screenshot saved: /tmp/modal_newcomer.png")

                # Check if modal is open
                modal = page.locator('.fixed.inset-0, [role="dialog"]').first
                if modal.is_visible():
                    print("\n✓ Modal opened!")

                    # Look for purchase details
                    print("\nLooking for purchase details...")
                    if page.locator('text=/Lot sélectionné/i').count() > 0:
                        print("  ✓ Found 'Lot sélectionné' section")

                        # Check who they're buying from
                        buying_from = page.locator('text=/De:/i').locator('..').inner_text()
                        print(f"  Buying from: {buying_from}")

                        if 'Copropriété' in buying_from:
                            print("\n  ✓ Buying from Copropriété!")

                            # Look for the breakdown
                            breakdown = page.locator('text=/Répartition des produits/i')
                            if breakdown.count() > 0:
                                print("  ✓✓ Found 'Répartition des produits' section!")

                                # Get the breakdown text
                                breakdown_parent = breakdown.locator('..').locator('..')
                                breakdown_text = breakdown_parent.inner_text()
                                print(f"\n  Breakdown content:\n{breakdown_text}")
                            else:
                                print("  ✗✗ 'Répartition des produits' NOT FOUND")
                                print("  This is the PROBLEM!")
                        else:
                            print(f"\n  → Buying from founder ('{buying_from}'), not copropriété")
                            print("  → Breakdown should NOT appear (this is correct)")

                    # Save modal HTML
                    modal_html = modal.inner_html()
                    with open('/tmp/modal_content.html', 'w') as f:
                        f.write(modal_html)
                    print("\n✓ Modal HTML saved to /tmp/modal_content.html")

                    # Close modal
                    close_button = page.locator('button:has([class*="X"])').first
                    if close_button.is_visible():
                        close_button.click()
                        page.wait_for_timeout(500)
                else:
                    print("✗ Modal did not open")

        # Try to add a new participant that buys from copropriété
        print("\n\nAttempting to create a participant buying from Copropriété...")
        add_button = page.locator('button:has-text("Ajouter")').first
        if add_button.is_visible():
            print("✓ Found 'Ajouter' button")
            add_button.click()
            page.wait_for_timeout(1000)

            # Look for available lots section
            if page.locator('text=/Lots disponibles/i').count() > 0:
                print("✓ Participant modal opened with lot selection")

                # Look for a copropriété lot
                copro_lot = page.locator('text=/Copropriété/i').locator('..').locator('..').locator('button').first
                if copro_lot.count() > 0 and copro_lot.is_visible():
                    print("✓ Found copropriété lot button, clicking...")
                    copro_lot.click()
                    page.wait_for_timeout(1000)

                    page.screenshot(path='/tmp/modal_copro_buyer.png', full_page=True)
                    print("✓ Screenshot saved: /tmp/modal_copro_buyer.png")

                    # Check for the breakdown
                    print("\nChecking for breakdown in copro buyer modal...")
                    breakdown = page.locator('text=/Répartition des produits/i')
                    if breakdown.count() > 0:
                        print("✓✓ Found 'Répartition des produits' section!")
                        breakdown_parent = breakdown.locator('..').locator('..')
                        breakdown_text = breakdown_parent.inner_text()
                        print(f"\nBreakdown content:\n{breakdown_text}")
                    else:
                        print("✗✗ 'Répartition des produits' NOT FOUND")
                        print("This is the PROBLEM - breakdown should appear for copro sales!")
                else:
                    print("✗ No copropriété lot found")

        print("\n\nKeeping browser open for 20 seconds...")
        try:
            page.wait_for_timeout(20000)
        except KeyboardInterrupt:
            pass

        browser.close()
        print("Done!")

if __name__ == '__main__':
    main()
