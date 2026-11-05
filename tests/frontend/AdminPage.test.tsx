import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AdminPage } from '../../src/pages/AdminPage';
import * as api from '../../src/services/api';
import { AdminStatsResponse } from '../../src/types';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('AdminPage Frontend Integration', () => {
  const mockStats: AdminStatsResponse = {
    total: 20,
    stay: 8,
    switch: 12,
    stayPercent: 40,
    switchPercent: 60,
    updatedAt: '2026-11-05T15:30:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders login form and never reveals statistics when unauthenticated', async () => {
    vi.spyOn(api, 'checkAdminSession').mockResolvedValueOnce({ authenticated: false });

    renderWithRouter(<AdminPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Вхід для організатора/i })
      ).toBeInTheDocument();
      expect(screen.getByTestId('admin-password-input')).toBeInTheDocument();
    });

    // Verify statistics elements are NOT present in the DOM
    expect(screen.queryByTestId('stats-total')).not.toBeInTheDocument();
    expect(screen.queryByText(/Всього голосів/i)).not.toBeInTheDocument();
  });

  it('shows error message when password is wrong', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'checkAdminSession').mockResolvedValueOnce({ authenticated: false });
    vi.spyOn(api, 'loginAdmin').mockRejectedValueOnce(
      new api.ApiError('INVALID_CREDENTIALS', 'Невірний пароль адміністратора', 401)
    );

    renderWithRouter(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-password-input')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('admin-password-input'), 'wrong-pass');
    await user.click(screen.getByTestId('admin-login-submit'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Невірний пароль адміністратора/i)).toBeInTheDocument();
    });

    expect(screen.queryByTestId('stats-total')).not.toBeInTheDocument();
  });

  it('logs in successfully and renders stats dashboard', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'checkAdminSession').mockResolvedValueOnce({ authenticated: false });
    vi.spyOn(api, 'loginAdmin').mockResolvedValueOnce({ success: true });
    vi.spyOn(api, 'fetchAdminStats').mockResolvedValueOnce(mockStats);

    renderWithRouter(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-password-input')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('admin-password-input'), 'correct-password');
    await user.click(screen.getByTestId('admin-login-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('stats-total')).toHaveTextContent('20');
      expect(screen.getByTestId('stats-stay-count')).toHaveTextContent('8');
      expect(screen.getByTestId('stats-stay-percent')).toHaveTextContent('40%');
      expect(screen.getByTestId('stats-switch-count')).toHaveTextContent('12');
      expect(screen.getByTestId('stats-switch-percent')).toHaveTextContent('60%');
    });
  });

  it('renders empty state properly when total votes count is 0', async () => {
    vi.spyOn(api, 'checkAdminSession').mockResolvedValueOnce({ authenticated: true });
    vi.spyOn(api, 'fetchAdminStats').mockResolvedValueOnce({
      total: 0,
      stay: 0,
      switch: 0,
      stayPercent: 0,
      switchPercent: 0,
      updatedAt: '2026-11-05T15:30:00.000Z',
    });

    renderWithRouter(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByTestId('stats-total')).toHaveTextContent('0');
      expect(screen.getByText(/Голосів ще не зареєстровано/i)).toBeInTheDocument();
    });
  });

  it('toggles presentation mode and exits back', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'checkAdminSession').mockResolvedValueOnce({ authenticated: true });
    vi.spyOn(api, 'fetchAdminStats').mockResolvedValueOnce(mockStats);

    renderWithRouter(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-presentation-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('admin-presentation-button'));

    // Presentation view is active
    expect(
      screen.getByRole('region', { name: /Презентаційний режим/i })
    ).toBeInTheDocument();

    // Exit presentation mode
    const exitButton = screen.getByRole('button', { name: /Вийти з режиму/i });
    await user.click(exitButton);

    // Returned to regular dashboard
    expect(
      screen.queryByRole('region', { name: /Презентаційний режим/i })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('admin-presentation-button')).toBeInTheDocument();
  });

  it('logs out and returns to login form', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'checkAdminSession').mockResolvedValueOnce({ authenticated: true });
    vi.spyOn(api, 'fetchAdminStats').mockResolvedValueOnce(mockStats);
    const logoutSpy = vi.spyOn(api, 'logoutAdmin').mockResolvedValueOnce({ success: true });

    renderWithRouter(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-logout-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('admin-logout-button'));

    expect(logoutSpy).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Вхід для організатора/i })
      ).toBeInTheDocument();
      expect(screen.queryByTestId('stats-total')).not.toBeInTheDocument();
    });
  });
});

