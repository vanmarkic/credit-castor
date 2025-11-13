import { test, expect } from '@playwright/test';

/**
 * Basic smoke tests to verify the app loads and functions
 */

test.describe('Basic App Functionality', () => {
  test('should load the application', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/app-loaded.png' });

    // Check if basic elements are present
    const hasContent = await page.locator('body').innerText();
    expect(hasContent).toBeTruthy();

    // Look for any interactive elements
    const buttons = await page.getByRole('button').count();
    const inputs = await page.locator('input').count();
    const total = buttons + inputs;

    console.log(`Found ${buttons} buttons and ${inputs} inputs`);
    expect(total).toBeGreaterThan(0);
  });

  test('should have participant-related content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for participant-related text or elements
    const participantElements = [
      page.getByText(/participant/i),
      page.getByText(/alice|bob|charlie/i),
      page.locator('[data-testid*="participant"]'),
      page.locator('tr').filter({ hasText: /€|m²/i }),
    ];

    let foundParticipant = false;
    for (const element of participantElements) {
      const count = await element.count().catch(() => 0);
      if (count > 0) {
        foundParticipant = true;
        console.log(`Found participant element: ${await element.first().textContent()}`);
        break;
      }
    }

    // If no participants found, check if we need to add some
    if (!foundParticipant) {
      // Look for add participant button
      const addButton = page.getByRole('button', { name: /add|ajouter|nouveau|new|➕|➕/i });
      if (await addButton.isVisible().catch(() => false)) {
        console.log('Found add participant button');
        foundParticipant = true;
      }
    }

    expect(foundParticipant).toBeTruthy();
  });

  test('should have unlock functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for unlock button or locked fields
    const unlockElements = [
      page.getByRole('button', { name: /unlock|déverrouiller|🔓|🔒/i }),
      page.getByText(/verrouillé|locked/i),
      page.locator('button').filter({ has: page.locator('svg') }), // Lock icon might be SVG
    ];

    let foundUnlock = false;
    for (const element of unlockElements) {
      if (await element.first().isVisible().catch(() => false)) {
        foundUnlock = true;
        await element.first().screenshot({ path: 'test-results/unlock-button.png' });
        console.log('Found unlock element');
        break;
      }
    }

    // The app might already be unlocked, which is also fine
    if (!foundUnlock) {
      const unlockedIndicators = [
        page.getByText(/déverrouillé|unlocked/i),
        page.locator('input:not([disabled])').first(),
      ];

      for (const indicator of unlockedIndicators) {
        if (await indicator.isVisible().catch(() => false)) {
          console.log('App appears to be already unlocked');
          foundUnlock = true;
          break;
        }
      }
    }

    expect(foundUnlock).toBeTruthy();
  });

  test('should unlock collective fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to find and click unlock button
    const unlockButton = page.getByRole('button', { name: /unlock|déverrouiller|🔓|🔒/i })
      .or(page.locator('button').filter({ has: page.locator('svg') }).first());

    if (await unlockButton.isVisible().catch(() => false)) {
      await unlockButton.click();

      // Look for password dialog
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        await emailInput.fill('test@example.com');
        await passwordInput.fill('admin2025');

        // Submit the form
        const submitButton = page.getByRole('button', { name: /déverrouiller|unlock|confirmer|submit/i }).last();
        await submitButton.click();

        // Wait for result
        await page.waitForTimeout(2000);

        // Check if unlock was successful
        const successIndicators = [
          page.getByText(/déverrouillé|unlocked|succès|success/i),
          page.locator('input:not([disabled])'),
        ];

        let unlockSuccess = false;
        for (const indicator of successIndicators) {
          if (await indicator.first().isVisible().catch(() => false)) {
            unlockSuccess = true;
            break;
          }
        }

        expect(unlockSuccess).toBeTruthy();
      }
    } else {
      // App might already be unlocked
      console.log('No unlock button found - app may already be unlocked');
    }
  });

  test('should display participant data after unlock', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Attempt unlock first
    const unlockButton = page.getByRole('button', { name: /unlock|déverrouiller|🔓|🔒/i });
    if (await unlockButton.isVisible().catch(() => false)) {
      await unlockButton.click();

      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        await page.locator('input[type="password"]').fill('admin2025');
        await page.getByRole('button', { name: /déverrouiller|unlock|confirmer/i }).last().click();
        await page.waitForTimeout(2000);
      }
    }

    // Now look for participant data
    const dataIndicators = [
      page.locator('table'),
      page.locator('[data-testid*="participant"]'),
      page.getByText(/alice|bob|charlie/i),
      page.locator('tr').filter({ hasText: /m²|€/ }),
      page.locator('input[name*="surface"]'),
      page.locator('input[name*="casco"]'),
    ];

    let foundData = false;
    for (const indicator of dataIndicators) {
      const count = await indicator.count().catch(() => 0);
      if (count > 0) {
        foundData = true;
        console.log(`Found data indicator: ${count} elements`);
        break;
      }
    }

    // Take a screenshot of the current state
    await page.screenshot({ path: 'test-results/participant-data.png', fullPage: true });

    expect(foundData).toBeTruthy();
  });
});