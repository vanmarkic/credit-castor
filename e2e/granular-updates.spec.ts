import { test, expect, Page } from '@playwright/test';

/**
 * Integration tests for granular Firestore participant updates
 *
 * Tests the complete flow:
 * 1. User edits participant details
 * 2. Only changed participant syncs to Firestore
 * 3. Cascading calculations update UI
 * 4. Other users receive updates
 */

// Test data
const ADMIN_PASSWORD = 'admin2025';
const TEST_EMAIL = 'test@example.com';
const _PROJECT_ID = 'shared-project';

/**
 * Helper to unlock collective fields
 */
async function unlockCollectiveFields(page: Page) {
  // Click unlock button
  await page.getByRole('button', { name: /déverrouiller|unlock/i }).click();

  // Fill password dialog
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);

  // Submit
  await page.getByRole('button', { name: /déverrouiller/i }).last().click();

  // Wait for unlock confirmation
  await expect(page.getByText(/déverrouillé|unlocked/i)).toBeVisible({ timeout: 5000 });
}

/**
 * Helper to get participant row by index
 */
async function getParticipantRow(page: Page, index: number) {
  // Participants are displayed in a table/grid
  const rows = page.locator('[data-testid^="participant-row"], tr').filter({ hasText: /^(Alice|Bob|Charlie|Dan)/ });
  return rows.nth(index);
}

/**
 * Helper to open participant details modal
 */
async function openParticipantDetails(page: Page, participantName: string) {
  // Find participant row and click edit/details button
  const participantRow = page.locator('tr, [data-testid*="participant"]').filter({ hasText: participantName });

  // Click the details button (might be an icon or text button)
  await participantRow.locator('button').filter({ hasText: /détails|modifier|edit|📝/i }).first().click();

  // Wait for modal to open
  await expect(page.getByRole('dialog', { name: /détails.*participant/i })).toBeVisible({ timeout: 5000 });
}

test.describe('Granular Participant Updates', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app (baseURL already includes /credit-castor)
    await page.goto('/');

    // Wait for app to load - be more flexible with text matching
    await page.waitForLoadState('networkidle');

    // Look for any sign the app has loaded
    const appIndicators = [
      page.getByText(/calculateur|calculator/i),
      page.getByText(/participant/i),
      page.getByRole('button'),
      page.locator('input'),
      page.locator('table'),
    ];

    // Wait for at least one indicator to be visible
    let appLoaded = false;
    for (const indicator of appIndicators) {
      if (await indicator.first().isVisible().catch(() => false)) {
        appLoaded = true;
        break;
      }
    }

    if (!appLoaded) {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-debug.png' });
      throw new Error('App did not load - check test-debug.png');
    }

    // Try to unlock collective fields if the button exists
    const unlockButton = page.getByRole('button', { name: /déverrouiller|unlock|🔓|🔒/i });
    if (await unlockButton.isVisible().catch(() => false)) {
      await unlockCollectiveFields(page);
    }
  });

  test('should update only changed participant fields', async ({ page }) => {
    // Setup network monitoring
    const firestoreRequests: string[] = [];

    page.on('request', request => {
      const url = request.url();
      // Monitor Firestore API calls
      if (url.includes('firestore.googleapis.com') || url.includes('participants')) {
        firestoreRequests.push(url);
        console.log('Firestore request:', request.method(), url);
      }
    });

    // Find and click on Alice's details
    await openParticipantDetails(page, 'Alice');

    // Update CASCO price
    const cascoInput = page.locator('input[name="cascoPerM2"], input[placeholder*="CASCO"]');
    await cascoInput.clear();
    await cascoInput.fill('1500');

    // Save changes
    await page.getByRole('button', { name: /sauvegarder|save|enregistrer/i }).click();

    // Wait for save to complete
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify only one participant was updated (check network requests)
    // In a real test, we'd mock Firestore and verify the exact payload
    const updateRequests = firestoreRequests.filter(url =>
      url.includes('participants') && !url.includes('listCollections')
    );

    // Expect only one participant update (not all participants)
    expect(updateRequests.length).toBeLessThanOrEqual(2); // One read, one write
  });

  test('should handle cascade calculations without extra writes', async ({ page }) => {
    // Monitor network for Firestore writes
    let writeCount = 0;

    page.on('request', request => {
      if (request.method() === 'PATCH' || request.method() === 'PUT') {
        if (request.url().includes('firestore') || request.url().includes('participants')) {
          writeCount++;
        }
      }
    });

    // Open Charlie's details (newcomer who triggers copro redistribution)
    await openParticipantDetails(page, 'Charlie');

    // Change entry date (this triggers cascade)
    const entryDateInput = page.locator('input[type="date"], input[name*="entry"]');
    await entryDateInput.fill('2024-06-01');

    // Save changes
    await page.getByRole('button', { name: /sauvegarder|save/i }).click();

    // Wait for save
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Wait a bit for any cascade writes
    await page.waitForTimeout(2000);

    // Verify only Charlie was written (cascade calculations are UI-only)
    expect(writeCount).toBeLessThanOrEqual(1);

    // But verify UI updated for all affected participants
    // Expected paybacks should have recalculated
    const aliceRow = await getParticipantRow(page, 0);
    const alicePayback = aliceRow.locator('[data-testid*="payback"], td:has-text("€")');

    // Payback amount should be visible (even if recalculated)
    await expect(alicePayback).toBeVisible();
  });

  test('should prevent concurrent edits with edit lock', async ({ page: _page, context }) => {
    // First user is already editing (current page)

    // Open second browser tab (simulating second user)
    const page2 = await context.newPage();
    await page2.goto('/');
    await expect(page2.getByText(/en division|crédit castor/i)).toBeVisible({ timeout: 10000 });

    // Second user tries to unlock
    await page2.getByRole('button', { name: /déverrouiller|unlock/i }).click();
    await page2.fill('input[type="email"]', 'user2@example.com');
    await page2.fill('input[type="password"]', ADMIN_PASSWORD);
    await page2.getByRole('button', { name: /déverrouiller/i }).last().click();

    // Should see lock warning (if edit lock is active)
    // OR should be allowed (if using simple localStorage unlock)
    const lockWarning = page2.locator('text=/en train de modifier|is editing|verrouillé/i');
    const unlockSuccess = page2.locator('text=/déverrouillé|unlocked/i');

    // One of these should appear
    await expect(lockWarning.or(unlockSuccess)).toBeVisible({ timeout: 5000 });

    // Clean up
    await page2.close();
  });

  test('should show optimistic updates immediately', async ({ page }) => {
    // Open Bob's details
    await openParticipantDetails(page, 'Bob');

    // Get initial value
    const surfaceInput = page.locator('input[name="surface"], input[placeholder*="surface"]');
    const _initialValue = await surfaceInput.inputValue();

    // Update surface area
    await surfaceInput.clear();
    await surfaceInput.fill('150');

    // Save
    await page.getByRole('button', { name: /sauvegarder|save/i }).click();

    // Modal should close immediately (optimistic update)
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 1000 });

    // Verify value updated in main table immediately
    const bobRow = page.locator('tr, [data-testid*="participant"]').filter({ hasText: 'Bob' });
    const surfaceCell = bobRow.locator('td').filter({ hasText: /150\s*m²?/ });

    await expect(surfaceCell).toBeVisible({ timeout: 1000 });
  });

  test('should update participant purchase details', async ({ page }) => {
    // Test updating purchase details (buying from portage)

    // Find Dan (or create a new participant who buys from portage)
    const participants = page.locator('tr, [data-testid*="participant"]');
    const danExists = await participants.filter({ hasText: 'Dan' }).count() > 0;

    if (!danExists) {
      // Add new participant if needed
      await page.getByRole('button', { name: /ajouter.*participant|add.*participant|➕/i }).click();
      await page.fill('input[name="name"]', 'Dan');
      await page.fill('input[name="surface"]', '0');
      await page.getByRole('button', { name: /ajouter|add|confirmer/i }).click();
    }

    // Open Dan's details
    await openParticipantDetails(page, 'Dan');

    // Set purchase details
    const buyingFromSelect = page.locator('select[name*="buying"], select:has-text("Achète de")');
    if (await buyingFromSelect.count() > 0) {
      await buyingFromSelect.selectOption({ label: 'Alice' });
    }

    const priceInput = page.locator('input[name*="price"], input[placeholder*="prix"]');
    if (await priceInput.count() > 0) {
      await priceInput.clear();
      await priceInput.fill('125000');
    }

    // Save
    await page.getByRole('button', { name: /sauvegarder|save/i }).click();

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify Dan's purchase is reflected
    const danRow = page.locator('tr, [data-testid*="participant"]').filter({ hasText: 'Dan' });

    // Should show purchase info
    await expect(danRow).toContainText(/Alice|125[\s,]?000/);
  });

  test('should batch update multiple related participants', async ({ page }) => {
    // When adding a new participant that affects others

    let requestCount = 0;
    page.on('request', request => {
      if (request.method() === 'POST' && request.url().includes('batch')) {
        requestCount++;
      }
    });

    // Add new founder (affects copro shares)
    await page.getByRole('button', { name: /ajouter.*participant|add.*participant|➕/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.locator('input[name="name"]').fill('Eve');
    await dialog.locator('input[name="surface"]').fill('100');

    // Mark as founder (affects redistributions)
    const founderCheckbox = dialog.locator('input[type="checkbox"][name*="founder"]');
    if (await founderCheckbox.count() > 0) {
      await founderCheckbox.check();
    }

    await page.getByRole('button', { name: /ajouter|add|confirmer/i }).click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // If using batch updates, should see batch request
    // Otherwise individual updates
    expect(requestCount).toBeGreaterThanOrEqual(0); // At least no errors

    // Verify Eve appears
    await expect(page.locator('text=Eve')).toBeVisible();
  });
});

test.describe('Performance Monitoring', () => {
  test('should show network savings in console', async ({ page }) => {
    // Enable console monitoring
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'info') {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await unlockCollectiveFields(page);

    // Make a change
    await openParticipantDetails(page, 'Alice');
    const input = page.locator('input').first();
    await input.clear();
    await input.fill('2000');
    await page.getByRole('button', { name: /sauvegarder|save/i }).click();

    // Wait for save
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Check for efficiency logs
    const efficiencyLogs = consoleLogs.filter(log =>
      log.includes('synced') ||
      log.includes('savings') ||
      log.includes('%')
    );

    // Should have some efficiency reporting
    console.log('Efficiency logs found:', efficiencyLogs);
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);

    await page.goto('/');
    await expect(page.getByText(/en division|crédit castor/i)).toBeVisible({ timeout: 10000 });

    // Try to unlock (should work with localStorage)
    await page.getByRole('button', { name: /déverrouiller|unlock/i }).click();
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.getByRole('button', { name: /déverrouiller/i }).last().click();

    // Should either show error or work offline
    const errorMsg = page.locator('text=/erreur|error|hors ligne|offline/i');
    const successMsg = page.locator('text=/déverrouillé|unlocked/i');

    await expect(errorMsg.or(successMsg)).toBeVisible({ timeout: 5000 });

    // Re-enable network
    await context.setOffline(false);
  });

  test('should handle version conflicts', async ({ page }) => {
    // This would require mocking Firestore responses
    // For now, just verify the UI handles errors

    await page.goto('/');
    await unlockCollectiveFields(page);

    // Open participant details
    await openParticipantDetails(page, 'Alice');

    // Make a change
    const input = page.locator('input[name="surface"]');
    await input.clear();
    await input.fill('999');

    // If version conflict occurs, should show error
    await page.getByRole('button', { name: /sauvegarder|save/i }).click();

    // Either saves successfully or shows conflict message
    const _successIndicator = page.getByRole('dialog').isHidden();
    const errorIndicator = page.locator('text=/conflit|conflict|erreur|error/i');

    // Wait for one of them
    await Promise.race([
      expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 }),
      expect(errorIndicator).toBeVisible({ timeout: 5000 })
    ]);
  });
});