#!/usr/bin/env python3
"""
Test Firestore sync for participant details without admin unlock.
"""

from playwright.sync_api import sync_playwright
import time

def test_firestore_sync():
    """Test that participant edits sync to Firestore without admin password."""

    console_logs = []

    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=False)  # Use visible for debugging
        context = browser.new_context()
        page = context.new_page()

        # Capture console logs
        def handle_console(msg):
            console_logs.append(f"[{msg.type}] {msg.text}")
            print(f"[{msg.type}] {msg.text}")

        page.on("console", handle_console)

        print("\n🧪 Starting Firestore sync test...\n")

        # Step 1: Navigate to app
        print("1️⃣ Navigating to app...")
        page.goto('http://localhost:4321/credit-castor', wait_until='networkidle')
        page.wait_for_timeout(1000)

        # Step 2: Check if password gate is present
        print("2️⃣ Checking for password gate...")
        page.screenshot(path='/tmp/firestore_test_password_gate.png', full_page=True)

        password_input = page.locator('input[type="password"]')
        if password_input.count() > 0 and password_input.is_visible():
            print("   Password gate found, entering password...")
            password_input.fill('castor2025')

            # Submit the form
            submit_button = page.locator('button[type="submit"]')
            submit_button.click()
            print("   Waiting for app to load...")
            page.wait_for_timeout(4000)
        else:
            print("   No password gate found, proceeding...")

        # Wait for app to initialize
        print("3️⃣ Waiting for app to initialize...")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        # Step 3: Take initial screenshot
        print("4️⃣ Taking initial screenshot...")
        page.screenshot(path='/tmp/firestore_test_initial.png', full_page=True)

        # Step 4: Find a participant detail input (capital apporté)
        print("5️⃣ Finding participant detail input...")

        # Look for capital apporté inputs
        capital_inputs = page.locator('input[type="number"]').all()

        if len(capital_inputs) == 0:
            print("❌ No number inputs found")
            browser.close()
            return

        print(f"   Found {len(capital_inputs)} number inputs")

        # Find first editable capital input (look for one with a specific pattern)
        target_input = None
        original_value = None

        for input_elem in capital_inputs[:10]:  # Check first 10 inputs
            try:
                if input_elem.is_visible() and input_elem.is_editable():
                    val = input_elem.input_value()
                    if val and int(val) > 10000:  # Likely a capital apporté field
                        target_input = input_elem
                        original_value = int(val)
                        print(f"   Selected input with value: {original_value}")
                        break
            except:
                continue

        if not target_input:
            print("❌ Could not find suitable capital input")
            browser.close()
            return

        # Step 5: Make a small change (increment by 1)
        new_value = original_value + 1
        print(f"6️⃣ Changing value from {original_value} to {new_value}...")

        target_input.click()
        target_input.fill(str(new_value))

        # Trigger blur to save
        page.keyboard.press('Tab')

        # Step 6: Wait for debounced auto-save (500ms + buffer)
        print("7️⃣ Waiting for auto-save (debounced 500ms)...")
        page.wait_for_timeout(2000)

        # Step 7: Check console logs for Firestore sync
        print("\n8️⃣ Checking console logs for Firestore sync...\n")

        sync_started = False
        sync_succeeded = False
        no_unlock_warning = False

        for log in console_logs:
            if "🔄 Auto-saving changes" in log:
                sync_started = True
                print(f"   ✅ {log}")
            elif "✅ Full document save" in log or "✅ Granular update" in log:
                sync_succeeded = True
                print(f"   ✅ {log}")
            elif "⚠️ Not saving: User not unlocked" in log:
                no_unlock_warning = True
                print(f"   ❌ {log}")
            elif "🔥 Firestore sync enabled" in log:
                print(f"   ℹ️  {log}")
            elif "✅ Data loaded from" in log:
                print(f"   ℹ️  {log}")

        # Step 8: Take final screenshot
        print("\n9️⃣ Taking final screenshot...")
        page.screenshot(path='/tmp/firestore_test_final.png', full_page=True)

        # Step 9: Results
        print("\n" + "="*60)
        print("TEST RESULTS")
        print("="*60)
        print(f"Original value: {original_value}")
        print(f"New value: {new_value}")
        print(f"Sync started: {'✅ YES' if sync_started else '❌ NO'}")
        print(f"Sync succeeded: {'✅ YES' if sync_succeeded else '❌ NO'}")
        print(f"Unlock warning shown: {'❌ YES (BUG!)' if no_unlock_warning else '✅ NO'}")
        print("="*60)

        if sync_started and sync_succeeded and not no_unlock_warning:
            print("\n🎉 SUCCESS! Participant details sync to Firestore without admin unlock!")
        else:
            print("\n❌ FAILED! Check the logs above for issues.")

        print(f"\nScreenshots saved:")
        print(f"  - Initial: /tmp/firestore_test_initial.png")
        print(f"  - Final: /tmp/firestore_test_final.png")

        # Keep browser open for a moment to see result
        page.wait_for_timeout(2000)

        browser.close()

if __name__ == "__main__":
    test_firestore_sync()
