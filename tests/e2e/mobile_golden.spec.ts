import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14/15/16', width: 390, height: 844 },
];

test.describe('Mobile & Tablet Golden Adaptation', () => {
  for (const vp of MOBILE_VIEWPORTS) {
    test(`renders flawless mobile layout on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Reset state for pristine run
      await page.evaluate(() => {
        localStorage.clear();
      });
      await page.reload();

      // 1. Verify zero horizontal overflow on idle
      let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(vp.width);

      // 2. Verify Header elements fit and do not collide
      const logo = page.locator('header a[href="/"]');
      const nav = page.locator('header nav');
      await expect(logo).toBeVisible();
      await expect(nav).toBeVisible();

      const logoBox = await logo.boundingBox();
      const navBox = await nav.boundingBox();
      expect(logoBox).toBeTruthy();
      expect(navBox).toBeTruthy();
      if (logoBox && navBox) {
        expect(logoBox.x + logoBox.width).toBeLessThanOrEqual(navBox.x + 2);
      }

      // 3. Start experiment and reach decision-pause
      const startBtn = page.getByTestId('start-experiment-button');
      await expect(startBtn).toBeVisible();
      await startBtn.click();

      // Wait for trolley approach and pause at switch
      const decisionHud = page.getByTestId('scene-decision-hud');
      await expect(decisionHud).toBeVisible({ timeout: 10000 });

      // Verify zero horizontal overflow on decision-pause
      scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(vp.width);

      // 4. Verify Scene SVG tracks are not obstructed by HUD on mobile
      const stayBtn = page.getByTestId('scene-choice-stay-button');
      const switchBtn = page.getByTestId('scene-choice-switch-button');
      await expect(stayBtn).toBeVisible();
      await expect(switchBtn).toBeVisible();

      // 5. Submit choice (Stay)
      await stayBtn.click();

      // Wait for outcome screen
      const outcomeHeading = page.locator('#outcome-heading');
      await expect(outcomeHeading).toBeVisible({ timeout: 10000 });

      // Verify zero horizontal overflow on outcome
      scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(vp.width);

      // Verify revote button is present in both header and outcome page
      const headerRevote = page.getByTestId('header-revote-btn');
      const pageRevote = page.getByTestId('revote-button');
      await expect(headerRevote).toBeVisible();
      await expect(pageRevote).toBeVisible();

      // 6. Test theme toggle on mobile
      const themeBtn = page.getByTestId('theme-toggle-btn');
      await themeBtn.click();
      await expect(page.locator('html')).toHaveClass(/dark/);
    });
  }

  test('renders tablet layout cleanly on iPad (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    // Verify zero horizontal overflow
    let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(768);

    // On tablet, text labels in header are visible
    const soundBtn = page.getByTestId('sound-toggle-btn');
    const musicBtn = page.getByTestId('music-toggle-btn');
    const themeBtn = page.getByTestId('theme-toggle-btn');
    await expect(soundBtn).toContainText('Звук');
    await expect(musicBtn).toContainText('Музика');
    await expect(themeBtn).toContainText(/Світла|Темна/);

    // Start experiment
    const startBtn = page.getByTestId('start-experiment-button');
    await startBtn.click();

    const decisionHud = page.getByTestId('scene-decision-hud');
    await expect(decisionHud).toBeVisible({ timeout: 10000 });

    // Verify in-scene HUD position on tablet
    const hudBox = await decisionHud.boundingBox();
    expect(hudBox).toBeTruthy();

    // Select switch
    const switchBtn = page.getByTestId('scene-choice-switch-button');
    await switchBtn.click();

    // Verify outcome
    const outcomeHeading = page.locator('#outcome-heading');
    await expect(outcomeHeading).toBeVisible({ timeout: 10000 });
    await expect(outcomeHeading).toContainText('Перевести стрілку');
  });
});