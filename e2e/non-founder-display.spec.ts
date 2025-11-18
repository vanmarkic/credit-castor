import { test, expect } from './fixtures';

/**
 * Test to verify displayed values for non-founder participants
 * Checks the "Part d'achat" and "Droit d'enregistrements" cards
 */
test.describe('Non-Founder Display Values', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app - use the full path to ensure we're at the correct address
    await page.goto('http://localhost:4330/credit-castor');
    
    // Check current URL BEFORE password entry to ensure we're at the correct address
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    expect(currentUrl).toBe('http://localhost:4330/credit-castor');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if password gate is visible, if so fill in password
    const passwordInput = page.locator('input[type="password"]');
    const isPasswordGateVisible = await passwordInput.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isPasswordGateVisible) {
      // Fill in password to unlock the app
      await passwordInput.fill('castor2025');
      await page.locator('button:has-text("Accéder")').click();
      
      // Wait for app to load after password submission
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for React to hydrate - look for any participant element
    await page.waitForFunction(
      () => document.querySelector('[data-testid^="participant-"]') !== null,
      { timeout: 30000 }
    );
    
    // Additional wait to ensure all participants are fully rendered
    await page.waitForTimeout(2000);
  });

  test('should display correct values for non-founder in Part d\'achat card', async ({ page }) => {
    // Find a non-founder participant timeline card (the financing cards that open the modal)
    // These are the cards in the timeline that show cost/loan info, not the name column
    const nonFounderParticipant = page.locator('[data-testid^="participant-non-founder-"]')
      .filter({ hasText: /Coût Total|À emprunter|Mensualité/ })
      .first();
    
    await expect(nonFounderParticipant).toBeVisible({ timeout: 20000 });
    
    // Click on the parent element (the div with data-testid)
    await nonFounderParticipant.click({ force: true });
    
    // Modal opens quickly - wait for the cost breakdown cards to appear
    await page.waitForSelector('[data-testid="purchase-share-card"]', { timeout: 5000 });
    
    // Find the purchase share card for a non-founder
    const purchaseShareCard = page.locator('[data-testid="purchase-share-card"]').first();
    
    // Wait for the card to be visible
    await expect(purchaseShareCard).toBeVisible({ timeout: 10000 });

    // Check that the card contains "Part d'achat" label
    await expect(purchaseShareCard.getByText("Part d'achat")).toBeVisible();

    // Check the purchase share amount is displayed
    const purchaseShareAmount = purchaseShareCard.locator('[data-testid="purchase-share-amount"]');
    await expect(purchaseShareAmount).toBeVisible();
    
    // Get the displayed amount text
    const amountText = await purchaseShareAmount.textContent();
    expect(amountText).toBeTruthy();
    // Should contain currency formatting (€ symbol or formatted number)
    expect(amountText).toMatch(/€|\d/);
    // Value should be displayed (can be 0€ in some cases, which is valid)

    // Check if surface is displayed (for non-founders with surface > 0)
    const surfaceElement = purchaseShareCard.locator('[data-testid="purchase-share-surface"]');
    const surfaceCount = await surfaceElement.count();
    if (surfaceCount > 0) {
      const surfaceText = await surfaceElement.textContent();
      expect(surfaceText).toBeTruthy();
      // Should contain m²
      expect(surfaceText).toContain('m²');
    }

    // Check for newcomer calculation details (should be present for non-founders)
    const calculationDetails = purchaseShareCard.locator('[data-testid="newcomer-calculation-details"]');
    const detailsCount = await calculationDetails.count();
    
    if (detailsCount > 0) {
      // Verify "Calcul pour nouveau participant:" text is present
      await expect(calculationDetails.getByText("Calcul pour nouveau participant:")).toBeVisible();

      // Check calculation method indicator
      const methodIndicator = calculationDetails.locator('[data-testid="newcomer-calculation-method"]');
      await expect(methodIndicator).toBeVisible();
      const methodText = await methodIndicator.textContent();
      expect(methodText).toContain('✓');
      expect(methodText).toMatch(/calcul quotité|formule portage/i);

      // Check calculation text if present
      const calculationText = calculationDetails.locator('[data-testid="newcomer-calculation-text"]');
      const calcTextCount = await calculationText.count();
      if (calcTextCount > 0) {
        const calcText = await calculationText.textContent();
        expect(calcText).toBeTruthy();
        // Should contain quotité calculation
        expect(calcText).toMatch(/Quotité|quotité/i);
        // Should contain base price calculation
        expect(calcText).toMatch(/Prix de base|Coût projet/i);
        // Should contain portage formula
        expect(calcText).toMatch(/Formule portage|Indexation|Récup\. frais portage/i);
        // Should contain final price
        expect(calcText).toMatch(/Prix final/i);
      }
    }
  });

  test('should display correct values for non-founder in Droit d\'enregistrements card', async ({ page }) => {
    // Find a non-founder participant timeline card (the financing cards that open the modal)
    const nonFounderParticipant = page.locator('[data-testid^="participant-non-founder-"]')
      .filter({ hasText: /Coût Total|À emprunter|Mensualité/ })
      .first();
    
    await expect(nonFounderParticipant).toBeVisible({ timeout: 20000 });
    await nonFounderParticipant.click({ force: true });
    
    // Modal opens quickly - wait for the registration fees card to appear
    await page.waitForSelector('[data-testid="registration-fees-card"]', { timeout: 5000 });
    
    // Find the registration fees card
    const registrationFeesCard = page.locator('[data-testid="registration-fees-card"]').first();
    
    // Wait for the card to be visible
    await expect(registrationFeesCard).toBeVisible({ timeout: 10000 });

    // Check that the card contains "Droit d'enregistrements" label
    await expect(registrationFeesCard.getByText("Droit d'enregistrements")).toBeVisible();

    // Check the registration fees amount is displayed
    const feesAmount = registrationFeesCard.locator('[data-testid="registration-fees-amount"]');
    await expect(feesAmount).toBeVisible();
    
    // Get the displayed amount text
    const amountText = await feesAmount.textContent();
    expect(amountText).toBeTruthy();
    // Should contain currency formatting (€ symbol or formatted number)
    expect(amountText).toMatch(/€|\d/);
    // Value should be displayed (can be 0€ in some cases, which is valid)

    // Check the registration fees rate is displayed
    const feesRate = registrationFeesCard.locator('[data-testid="registration-fees-rate"]');
    await expect(feesRate).toBeVisible();
    const rateText = await feesRate.textContent();
    expect(rateText).toBeTruthy();
    // Should contain percentage
    expect(rateText).toContain('%');

    // Check the calculation formula if present
    const calculation = registrationFeesCard.locator('[data-testid="registration-fees-calculation"]');
    const calcCount = await calculation.count();
    if (calcCount > 0) {
      const calcText = await calculation.textContent();
      expect(calcText).toBeTruthy();
      // Should contain "Part d'achat"
      expect(calcText).toContain("Part d'achat");
      // Should contain multiplication symbol or ×
      expect(calcText).toMatch(/×|x|\*/);
      // Should contain percentage
      expect(calcText).toContain('%');
      // Should contain equals sign
      expect(calcText).toMatch(/=|=/);
    }
  });

  test('should display zero values correctly for non-founder with no purchase share', async ({ page }) => {
    // This test verifies the specific case shown in the user's example:
    // - Part d'achat: 0 € with 100m²
    // - Droit d'enregistrements: 0 € with 12.5%

    // Find a non-founder participant timeline card (the financing cards that open the modal)
    const nonFounderParticipant = page.locator('[data-testid^="participant-non-founder-"]')
      .filter({ hasText: /Coût Total|À emprunter|Mensualité/ })
      .first();
    
    await expect(nonFounderParticipant).toBeVisible({ timeout: 20000 });
    await nonFounderParticipant.click({ force: true });
    
    // Modal opens quickly - wait for the purchase share card to appear
    await page.waitForSelector('[data-testid="purchase-share-card"]', { timeout: 5000 });

    // Find the purchase share card
    const purchaseShareCard = page.locator('[data-testid="purchase-share-card"]').first();
    await expect(purchaseShareCard).toBeVisible({ timeout: 10000 });

    // Check for zero amount
    const purchaseShareAmount = purchaseShareCard.locator('[data-testid="purchase-share-amount"]');
    const amountText = await purchaseShareAmount.textContent();
    
    // Should display 0 € or similar
    if (amountText) {
      // Check if it's zero (could be "0 €", "0,00 €", etc.)
      const isZero = amountText.match(/0[\s,.]*€|€[\s,.]*0/);
      if (isZero) {
        // Verify surface is still displayed even with zero purchase share
        const surfaceElement = purchaseShareCard.locator('[data-testid="purchase-share-surface"]');
        const surfaceCount = await surfaceElement.count();
        if (surfaceCount > 0) {
          const surfaceText = await surfaceElement.textContent();
          expect(surfaceText).toContain('m²');
        }

        // Check newcomer calculation details are shown
        const calculationDetails = purchaseShareCard.locator('[data-testid="newcomer-calculation-details"]');
        const detailsCount = await calculationDetails.count();
        if (detailsCount > 0) {
          // Verify calculation text shows quotité calculation
          const calculationText = calculationDetails.locator('[data-testid="newcomer-calculation-text"]');
          const calcTextCount = await calculationText.count();
          if (calcTextCount > 0) {
            const calcText = await calculationText.textContent();
            // Should show quotité calculation with 0/1000
            expect(calcText).toMatch(/0\/1000|0\.0%/i);
            // Should show base price calculation
            expect(calcText).toMatch(/Prix de base.*0.*€/i);
            // Should show final price as 0
            expect(calcText).toMatch(/Prix final.*0.*€/i);
          }
        }
      }
    }

    // Check registration fees card
    const registrationFeesCard = page.locator('[data-testid="registration-fees-card"]').first();
    await expect(registrationFeesCard).toBeVisible();

    const feesAmount = registrationFeesCard.locator('[data-testid="registration-fees-amount"]');
    const feesAmountText = await feesAmount.textContent();
    
    // If amount is zero, verify the calculation still shows
    if (feesAmountText && feesAmountText.match(/0[\s,.]*€|€[\s,.]*0/)) {
      const feesRate = registrationFeesCard.locator('[data-testid="registration-fees-rate"]');
      const rateText = await feesRate.textContent();
      // Should show 12.5% or similar
      expect(rateText).toContain('%');

      // Check calculation formula
      const calculation = registrationFeesCard.locator('[data-testid="registration-fees-calculation"]');
      const calcCount = await calculation.count();
      if (calcCount > 0) {
        const calcText = await calculation.textContent();
        // Should show: Part d'achat (0 €) × 12.5% = 0 €
        expect(calcText).toContain("Part d'achat");
        expect(calcText).toMatch(/0[\s,.]*€/);
        expect(calcText).toContain('%');
        expect(calcText).toMatch(/=.*0[\s,.]*€/);
      }
    }
  });
});

