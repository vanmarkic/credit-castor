#!/usr/bin/env python3
"""
Investigate copro sale distribution display issue
"""

from playwright.sync_api import sync_playwright
import json

def investigate():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Show browser for debugging
        page = browser.new_page()

        # Enable console logging
        page.on('console', lambda msg: print(f'CONSOLE: {msg.text}'))

        print("Navigating to http://localhost:4321/credit-castor")
        page.goto('http://localhost:4321/credit-castor')
        page.wait_for_load_state('networkidle')

        print("\n=== Taking screenshot ===")
        page.screenshot(path='/tmp/copro_sale_debug.png', full_page=True)
        print("Screenshot saved to /tmp/copro_sale_debug.png")

        # Find the element with "0 €" and "joined (copro sale)"
        print("\n=== Looking for copro sale transaction ===")

        # Search for elements containing "joined (copro sale)"
        copro_elements = page.locator('text=/joined.*copro sale/i').all()
        print(f"Found {len(copro_elements)} elements with 'joined (copro sale)' text")

        for i, elem in enumerate(copro_elements):
            print(f"\n--- Element {i+1} ---")
            # Get parent container
            parent = elem.locator('xpath=ancestor::div[contains(@class, "border-t")]').first
            if parent:
                text = parent.text_content()
                html = parent.inner_html()
                print(f"Text content: {text}")
                print(f"HTML snippet: {html[:200]}...")

        # Look for the specific element with "0 €"
        print("\n=== Looking for '0 €' elements ===")
        zero_euro_elements = page.locator('text=/0.*€/').all()
        print(f"Found {len(zero_euro_elements)} elements with '0 €'")

        for i, elem in enumerate(zero_euro_elements[:5]):  # Limit to first 5
            print(f"\n--- Zero Euro Element {i+1} ---")
            print(f"Text: {elem.text_content()}")
            print(f"Classes: {elem.get_attribute('class')}")
            # Get parent context
            parent = elem.locator('xpath=..').first
            if parent:
                print(f"Parent text: {parent.text_content()}")

        # Try to access participant data from React/state
        print("\n=== Checking for data in window/state ===")
        try:
            state_data = page.evaluate("""
                () => {
                    // Try to find React state or data
                    const data = {
                        localStorage: Object.keys(localStorage),
                        hasReactRoot: !!document.querySelector('[data-reactroot]'),
                    };

                    // Look for any global state
                    if (window.__INITIAL_STATE__) {
                        data.initialState = window.__INITIAL_STATE__;
                    }

                    return data;
                }
            """)
            print(f"State data: {json.dumps(state_data, indent=2)}")
        except Exception as e:
            print(f"Could not access state: {e}")

        # Check localStorage for calculator data
        print("\n=== Checking localStorage ===")
        try:
            storage_keys = page.evaluate("() => Object.keys(localStorage)")
            print(f"LocalStorage keys: {storage_keys}")

            if 'credit-castor-scenario' in storage_keys:
                scenario_data = page.evaluate("() => localStorage.getItem('credit-castor-scenario')")
                data = json.loads(scenario_data)
                print(f"\nScenario data found:")
                print(f"- Participants: {len(data.get('participants', []))}")
                print(f"- Deed date: {data.get('deedDate', 'N/A')}")

                # Look for the newcomer
                participants = data.get('participants', [])
                for p in participants:
                    if 'Nouveau' in p.get('name', ''):
                        print(f"\nNewcomer found: {p.get('name')}")
                        print(f"- Entry date: {p.get('entryDate')}")
                        print(f"- Purchase details: {p.get('purchaseDetails')}")
                        print(f"- Is founder: {p.get('isFounder')}")
        except Exception as e:
            print(f"Could not read localStorage: {e}")

        # Look for timeline/transaction display components
        print("\n=== Looking for timeline components ===")
        timeline_divs = page.locator('[data-testid*="timeline"], [class*="timeline"]').all()
        print(f"Found {len(timeline_divs)} potential timeline components")

        # Keep browser open for manual inspection
        print("\n=== Browser will stay open for 30 seconds for manual inspection ===")
        print("Press Ctrl+C to close early")
        try:
            page.wait_for_timeout(30000)
        except KeyboardInterrupt:
            print("Closing browser...")

        browser.close()
        print("\nInvestigation complete!")

if __name__ == '__main__':
    investigate()
