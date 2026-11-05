import { test, expect } from '@playwright/test';

test.describe('Admin Panel Flow', () => {
  const mockStats = {
    total: 50,
    stay: 20,
    switch: 30,
    stayPercent: 40,
    switchPercent: 60,
    updatedAt: new Date().toISOString(),
  };

  test('requires login, handles wrong password, logs in, shows stats, and toggles presentation', async ({
    page,
  }) => {
    let isAuthenticated = false;

    // Mock session check
    await page.route('**/api/admin/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: isAuthenticated }),
      });
    });

    // Mock login
    await page.route('**/api/admin/login', async (route) => {
      const data = JSON.parse(route.request().postData() || '{}');
      if (data.password === 'admin-secret') {
        isAuthenticated = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { code: 'INVALID_CREDENTIALS', message: 'Невірний пароль' },
          }),
        });
      }
    });

    // Mock stats
    await page.route('**/api/admin/stats', async (route) => {
      if (!isAuthenticated) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'UNAUTHORIZED' } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockStats),
        });
      }
    });

    // Mock logout
    await page.route('**/api/admin/logout', async (route) => {
      isAuthenticated = false;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // 1. Visit /admin
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /Вхід для організатора/i })).toBeVisible();

    // Verify statistics are NOT present
    await expect(page.getByTestId('stats-total')).not.toBeVisible();

    // 2. Submit wrong password
    const passwordInput = page.getByTestId('admin-password-input');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('wrong-pass');
    const submitBtn = page.getByTestId('admin-login-submit');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page.locator('div[role="alert"]')).toBeVisible();
    await expect(page.getByText('Невірний пароль')).toBeVisible();

    // 3. Submit correct password
    await passwordInput.fill('admin-secret');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify dashboard loads
    await expect(page.getByTestId('stats-total')).toHaveText('50');
    await expect(page.getByTestId('stats-stay-count')).toHaveText('20');
    await expect(page.getByTestId('stats-stay-percent')).toHaveText('40%');
    await expect(page.getByTestId('stats-switch-count')).toHaveText('30');
    await expect(page.getByTestId('stats-switch-percent')).toHaveText('60%');

    // 4. Test Presentation mode
    const presentationBtn = page.getByTestId('admin-presentation-button');
    await presentationBtn.click();

    await expect(page.getByRole('region', { name: /Презентаційний режим/i })).toBeVisible();
    await expect(page.getByTestId('presentation-total')).toHaveText('50');

    // Exit presentation
    await page.getByRole('button', { name: /Вийти з режиму/i }).click();
    await expect(page.getByRole('region', { name: /Презентаційний режим/i })).not.toBeVisible();

    // 5. Logout
    await page.getByTestId('admin-logout-button').click();
    await expect(page.getByRole('heading', { name: /Вхід для організатора/i })).toBeVisible();
  });
});
