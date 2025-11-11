#!/usr/bin/env python3
"""
Explore the Credit Castor UI to find and inspect the copro proceeds breakdown
in the participant detail modal.
"""

from playwright.sync_api import sync_playwright
import sys

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Non-headless to see what's happening
        page = browser.new_page()

        print("Navigating to Credit Castor...")
        page.goto('http://localhost:4321/credit-castor')

        print("Waiting for page to load...")
        page.wait_for_load_state('networkidle')

        # Check if password gate exists
        password_input = page.locator('input[type="password"], input[placeholder*="mot de passe"]').first
        if password_input.is_visible():
            print("\nPassword gate detected. Authenticating...")
            password_input.fill('castor2025')
            page.locator('button:has-text("Accéder")').click()
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)  # Wait for transition
            print("✓ Authenticated successfully")

        # Take initial screenshot
        print("Taking initial screenshot...")
        page.screenshot(path='/tmp/credit_castor_initial.png', full_page=True)
        print("Screenshot saved to /tmp/credit_castor_initial.png")

        # Look for participant cards or ways to open participant details
        print("\nLooking for participant elements...")

        # Try to find participant names or cards
        participant_elements = page.locator('[class*="participant"]').all()
        print(f"Found {len(participant_elements)} elements with 'participant' in class")

        # Look for any modal triggers or participant detail buttons
        buttons = page.locator('button').all()
        print(f"Found {len(buttons)} buttons on the page")

        # Look for participant names that might be clickable
        names = page.locator('text=/Participant|Alice|Bob|Charlie/i').all()
        print(f"Found {len(names)} potential participant name elements")

        # Try to find the timeline or participant cards
        timeline_elements = page.locator('[class*="timeline"]').all()
        print(f"Found {len(timeline_elements)} timeline elements")

        # Look for cards that might represent participants
        cards = page.locator('[class*="card"]').all()
        print(f"Found {len(cards)} card elements")

        # Let's try to find a participant that has purchase details showing "Copropriété"
        print("\nSearching for 'Copropriété' text...")
        copro_elements = page.locator('text=/Copropriété/i').all()
        print(f"Found {len(copro_elements)} elements mentioning Copropriété")

        # Try to find and click on a participant card in the timeline
        print("\nLooking for clickable participant cards in timeline...")
        swimlane_cards = page.locator('.swimlane-row .timeline-card, .timeline-card').all()
        print(f"Found {len(swimlane_cards)} timeline cards")

        if swimlane_cards:
            print(f"\nAttempting to click first timeline card...")
            try:
                swimlane_cards[0].click()
                page.wait_for_timeout(1000)  # Wait for modal animation

                # Take screenshot after clicking
                page.screenshot(path='/tmp/credit_castor_modal.png', full_page=True)
                print("Modal screenshot saved to /tmp/credit_castor_modal.png")

                # Check if modal opened
                modal = page.locator('[class*="modal"], .fixed.inset-0').first
                if modal.is_visible():
                    print("\n✓ Modal opened successfully!")

                    # Look for purchase details section
                    purchase_section = page.locator('text=/Lot sélectionné|Prix|De:/i')
                    if purchase_section.count() > 0:
                        print("\n✓ Found purchase details section")

                        # Look for the new breakdown section
                        breakdown = page.locator('text=/Répartition des produits/i')
                        if breakdown.count() > 0:
                            print("\n✓ Found 'Répartition des produits' section!")

                            # Check for reserves and participants breakdown
                            reserves = page.locator('text=/Réserves copro/i')
                            participants = page.locator('text=/Redistribué aux participants/i')

                            print(f"  - Reserves line: {'✓ Found' if reserves.count() > 0 else '✗ Not found'}")
                            print(f"  - Participants line: {'✓ Found' if participants.count() > 0 else '✗ Not found'}")
                        else:
                            print("\n✗ 'Répartition des produits' section not found")
                            print("   This might mean the participant is not buying from Copropriété")

                    # Get the modal HTML for inspection
                    modal_html = modal.inner_html()
                    with open('/tmp/modal_content.html', 'w') as f:
                        f.write(modal_html)
                    print("\nModal HTML saved to /tmp/modal_content.html")
                else:
                    print("\n✗ Modal did not open")
            except Exception as e:
                print(f"\n✗ Error clicking card: {e}")

        # Keep browser open for manual inspection
        print("\n\nBrowser will stay open for 30 seconds for manual inspection...")
        print("Press Ctrl+C to close immediately")
        try:
            page.wait_for_timeout(30000)
        except KeyboardInterrupt:
            print("\nClosing browser...")

        browser.close()
        print("Done!")

if __name__ == '__main__':
    main()
