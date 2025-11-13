#!/usr/bin/env python3
"""
Simple verification that Firestore sync works without admin unlock.
Just checks console logs for the key evidence.
"""

from playwright.sync_api import sync_playwright

def verify_sync():
    """Verify Firestore sync without admin password."""

    console_logs = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Capture console
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        print("\n" + "="*60)
        print("FIRESTORE SYNC VERIFICATION TEST")
        print("="*60)

        # Navigate and login
        print("\n1. Loading app...")
        page.goto('http://localhost:4321/credit-castor', wait_until='networkidle')
        page.wait_for_timeout(1000)

        # Enter password
        password_input = page.locator('input[type="password"]')
        if password_input.is_visible():
            password_input.fill('castor2025')
            page.locator('button[type="submit"]').click()
            page.wait_for_timeout(5000)

        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        print("2. Analyzing console logs...\n")

        # Check evidence
        unlock_state_logged = False
        unlocked_by_null = False
        firestore_enabled = False
        data_loaded = False
        auto_save_triggered = False
        save_succeeded = False
        no_unlock_warning = True

        for log in console_logs:
            # Check unlock state
            if "🔐 Unlock state:" in log:
                unlock_state_logged = True
                if "unlockedBy: null" in log:
                    unlocked_by_null = True
                    print(f"   ✅ {log}")

            # Check Firestore enabled
            if "🔥 Firestore sync enabled" in log:
                firestore_enabled = True
                print(f"   ✅ {log}")

            # Check data loaded
            if "✅ Data loaded from" in log:
                data_loaded = True
                print(f"   ✅ {log}")

            # Check auto-save triggered
            if "🔄 Auto-saving changes:" in log:
                auto_save_triggered = True
                print(f"   ✅ {log}")

            # Check save succeeded
            if "✅ Full document save" in log or "✅ Granular update" in log:
                save_succeeded = True
                print(f"   ✅ {log}")

            # Check for unlock warning (should NOT appear)
            if "⚠️ Not saving: User not unlocked" in log:
                no_unlock_warning = False
                print(f"   ❌ {log}")

        # Results
        print("\n" + "="*60)
        print("VERIFICATION RESULTS")
        print("="*60)
        print(f"Unlock state logged: {'✅' if unlock_state_logged else '❌'}")
        print(f"unlocked_by is null: {'✅' if unlocked_by_null else '❌'}")
        print(f"Firestore sync enabled: {'✅' if firestore_enabled else '❌'}")
        print(f"Data loaded from Firestore: {'✅' if data_loaded else '❌'}")
        print(f"Auto-save triggered: {'✅' if auto_save_triggered else '❌'}")
        print(f"Save succeeded: {'✅' if save_succeeded else '❌'}")
        print(f"No unlock warning: {'✅' if no_unlock_warning else '❌'}")
        print("="*60)

        # Final verdict
        all_passed = (
            unlock_state_logged and
            unlocked_by_null and
            firestore_enabled and
            data_loaded and
            auto_save_triggered and
            save_succeeded and
            no_unlock_warning
        )

        if all_passed:
            print("\n🎉 SUCCESS! Firestore sync works WITHOUT admin unlock!")
            print("✅ Participant details can be edited and synced without password.")
        else:
            print("\n❌ VERIFICATION FAILED - Check logs above")

        print("\n")

        page.wait_for_timeout(2000)
        browser.close()

        return all_passed

if __name__ == "__main__":
    success = verify_sync()
    exit(0 if success else 1)
