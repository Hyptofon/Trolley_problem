import { test, expect } from '@playwright/test';

test.describe('Trolley Problem Voting Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear browser storage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('completes successful voting for "stay" choice (desktop)', async ({ page }) => {
    // Intercept /api/vote
    await page.route('**/api/vote', async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      expect(postData.choice).toBe('stay');
      expect(postData.participantId).toBeTruthy();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'recorded', choice: 'stay' }),
      });
    });

    await page.goto('/');

    // Check title and scene
    await expect(page.locator('h1')).toContainText('Проблема вагонетки');
    await expect(page.locator('svg[role="img"]')).toBeVisible();

    // Verify exactly two choices
    const stayBtn = page.getByTestId('choice-stay-button');
    const switchBtn = page.getByTestId('choice-switch-button');
    await expect(stayBtn).toBeVisible();
    await expect(switchBtn).toBeVisible();

    // Click stay
    await stayBtn.click();

    // Verify outcome view is shown
    await expect(page.getByRole('heading', { name: /Ваш вибір: Не втручатися/i })).toBeVisible();
    await expect(page.getByText('Дякуємо за вашу участь у дилемі!')).toBeVisible();

    // Verify voting buttons are gone
    await expect(stayBtn).not.toBeVisible();
    await expect(switchBtn).not.toBeVisible();
  });

  test('completes successful voting for "switch" choice', async ({ page }) => {
    await page.route('**/api/vote', async (route) => {
      const postData = JSON.parse(route.request().postData() || '{}');
      expect(postData.choice).toBe('switch');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'recorded', choice: 'switch' }),
      });
    });

    await page.goto('/');

    const switchBtn = page.getByTestId('choice-switch-button');
    await switchBtn.click();

    await expect(page.getByRole('heading', { name: /Ваш вибір: Перевести стрілку/i })).toBeVisible();
    await expect(page.getByText('Дякуємо за вашу участь у дилемі!')).toBeVisible();
  });

  test('prevents repeated voting upon page reload', async ({ page }) => {
    await page.route('**/api/vote', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'recorded', choice: 'stay' }),
      });
    });

    await page.goto('/');
    await page.getByTestId('choice-stay-button').click();
    await expect(page.getByRole('heading', { name: /Ваш вибір: Не втручатися/i })).toBeVisible();

    // Reload page
    await page.reload();

    // Must still show outcome and NOT display choice buttons
    await expect(page.getByRole('heading', { name: /Ваш вибір: Не втручатися/i })).toBeVisible();
    await expect(page.getByTestId('choice-stay-button')).not.toBeVisible();
  });

  test('handles network failure and allows retry', async ({ page }) => {
    let attempts = 0;
    await page.route('**/api/vote', async (route) => {
      attempts++;
      if (attempts === 1) {
        await route.abort('failed');
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'recorded', choice: 'stay' }),
        });
      }
    });

    await page.goto('/');
    await page.getByTestId('choice-stay-button').click();

    // Verify error banner is visible
    await expect(page.locator('div[role="alert"]')).toBeVisible();

    // Click retry
    const retryBtn = page.getByRole('button', { name: /Спробувати ще раз/i });
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();

    // Now success
    await expect(page.getByRole('heading', { name: /Ваш вибір: Не втручатися/i })).toBeVisible();
  });
});

