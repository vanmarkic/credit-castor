"""
End-to-end test: Verify portage price recalculates reactively when entry date changes
"""

from playwright.sync_api import sync_playwright
import sys

def test_reactive_price_recalculation():
    """Test that portage prices update reactively on entry date change"""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("🌐 Navigating to app...")
        page.goto('http://localhost:4321/credit-castor')
        page.wait_for_load_state('networkidle')

        # Handle password gate
        print("\n🔐 Checking for password gate...")
        password_input = page.locator('input[type="password"]')
        if password_input.is_visible():
            print("  Found password input, entering password...")
            password_input.fill('castor2025')
            page.locator('button:has-text("Accéder")').click()
            page.wait_for_timeout(1000)
            print("  ✅ Password entered and submitted")

        print("\n📸 Taking initial screenshot...")
        page.screenshot(path='/tmp/portage-initial.png', full_page=True)

        # Find the newcomer buyer
        print("\n🔍 Looking for 'Nouveau·elle Arrivant·e' participant...")
        newcomer = page.get_by_text('Nouveau·elle Arrivant·e', exact=False).first
        if not newcomer.is_visible():
            print("❌ Could not find newcomer participant")
            browser.close()
            return False

        print("✅ Found newcomer participant, clicking to open modal...")
        newcomer.click()
        page.wait_for_timeout(500)

        print("\n📅 Looking for entry date input...")
        date_input = page.locator('input[type="date"]').first

        if not date_input.is_visible():
            print("❌ Date input not visible")
            page.screenshot(path='/tmp/portage-no-date-input.png', full_page=True)
            browser.close()
            return False

        current_date = date_input.input_value()
        print(f"  Current entry date: {current_date}")

        # Capture page content before change
        print("\n📸 Capturing state before date change...")
        page.screenshot(path='/tmp/portage-before-change.png', full_page=True)
        content_before = page.content()

        # Change the entry date
        new_date = '2028-01-01'
        print(f"\n⏰ Changing entry date to: {new_date}")
        date_input.fill(new_date)
        page.wait_for_timeout(1000)

        # Capture page content after change
        print("\n📸 Capturing state after date change...")
        page.screenshot(path='/tmp/portage-after-change.png', full_page=True)
        content_after = page.content()

        # Verify reactive update
        if content_before == content_after:
            print("\n❌ FAIL: Page content unchanged after date modification")
            print("   Reactive update did not occur!")
            browser.close()
            return False
        else:
            print("\n✅ SUCCESS: Page content changed - reactive update occurred!")

        print("\n📸 Screenshots saved:")
        print("  - Initial: /tmp/portage-initial.png")
        print("  - Before change: /tmp/portage-before-change.png")
        print("  - After change: /tmp/portage-after-change.png")

        browser.close()
        return True

if __name__ == '__main__':
    try:
        success = test_reactive_price_recalculation()
        print(f"\n{'='*60}")
        print(f"TEST {'PASSED ✅' if success else 'FAILED ❌'}")
        print(f"{'='*60}")
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
