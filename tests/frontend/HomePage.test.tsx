import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';
import * as api from '../../src/services/api';
import { VoteResponse } from '../../src/types';
import {
  clearStoredVote,
  saveStoredVote,
} from '../../src/services/participant';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('HomePage Frontend Integration', () => {
  beforeEach(() => {
    clearStoredVote();
    vi.restoreAllMocks();
  });

  it('renders dilemma title, SVG scene, and exactly two choices', () => {
    renderWithRouter(<HomePage />);

    expect(screen.getByRole('heading', { name: /Проблема вагонетки/i })).toBeInTheDocument();
    expect(screen.getByTestId('choice-stay-button')).toBeInTheDocument();
    expect(screen.getByTestId('choice-switch-button')).toBeInTheDocument();
    expect(screen.getByLabelText(/Схема руху вагонетки/i)).toBeInTheDocument();

    // Verify there is no third decision button
    const choiceButtons = screen.getAllByRole('button', { name: /Рішення/i });
    expect(choiceButtons.length).toBe(2);
  });

  it('submits "stay" choice successfully and shows outcome screen', async () => {
    const user = userEvent.setup();
    const submitSpy = vi.spyOn(api, 'submitVote').mockResolvedValueOnce({
      status: 'recorded',
      choice: 'stay',
    });

    renderWithRouter(<HomePage />);

    const stayButton = screen.getByTestId('choice-stay-button');
    await user.click(stayButton);

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        choice: 'stay',
        participantId: expect.any(String),
      })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Ваш вибір: Не втручатися/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Дякуємо за вашу участь/i)).toBeInTheDocument();
    });

    // Verify choice buttons are no longer rendered
    expect(screen.queryByTestId('choice-stay-button')).not.toBeInTheDocument();
  });

  it('submits "switch" choice successfully and shows outcome screen', async () => {
    const user = userEvent.setup();
    const submitSpy = vi.spyOn(api, 'submitVote').mockResolvedValueOnce({
      status: 'recorded',
      choice: 'switch',
    });

    renderWithRouter(<HomePage />);

    const switchButton = screen.getByTestId('choice-switch-button');
    await user.click(switchButton);

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        choice: 'switch',
        participantId: expect.any(String),
      })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Ваш вибір: Перевести стрілку/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Дякуємо за вашу участь/i)).toBeInTheDocument();
    });
  });

  it('prevents duplicate submissions on rapid double clicks', async () => {
    const user = userEvent.setup();
    let resolveSubmit: (val: VoteResponse) => void;
    const submitPromise = new Promise<VoteResponse>((res) => {
      resolveSubmit = res;
    });

    const submitSpy = vi.spyOn(api, 'submitVote').mockReturnValueOnce(submitPromise);

    renderWithRouter(<HomePage />);

    const stayButton = screen.getByTestId('choice-stay-button');
    // Double click rapidly
    await user.click(stayButton);
    await user.click(stayButton);

    expect(submitSpy).toHaveBeenCalledTimes(1);

    // Resolve the submission
    resolveSubmit!({ status: 'recorded', choice: 'stay' });

    await waitFor(() => {
      expect(screen.getByText(/Дякуємо за вашу участь/i)).toBeInTheDocument();
    });
  });

  it('handles network error gracefully and retries with the same participantId and choice', async () => {
    const user = userEvent.setup();
    const submitSpy = vi
      .spyOn(api, 'submitVote')
      .mockRejectedValueOnce(new api.ApiError('NETWORK_ERROR', 'Помилка мережі звʼязку', 0))
      .mockResolvedValueOnce({ status: 'recorded', choice: 'stay' });

    renderWithRouter(<HomePage />);

    const stayButton = screen.getByTestId('choice-stay-button');
    await user.click(stayButton);

    // Error alert is displayed
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/Помилка мережі звʼязку/i);
    });

    // Ensure it does not falsely claim the vote was saved
    expect(screen.queryByText(/Дякуємо за вашу участь/i)).not.toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /Спробувати ще раз/i });
    await user.click(retryButton);

    expect(submitSpy).toHaveBeenCalledTimes(2);
    // Verify both calls used identical participantId and choice
    const firstCallArg = submitSpy.mock.calls[0][0];
    const secondCallArg = submitSpy.mock.calls[1][0];
    expect(secondCallArg.participantId).toBe(firstCallArg.participantId);
    expect(secondCallArg.choice).toBe('stay');

    await waitFor(() => {
      expect(screen.getByText(/Дякуємо за вашу участь/i)).toBeInTheDocument();
    });
  });

  it('loads completed outcome directly on mount if already voted in localStorage', () => {
    saveStoredVote({
      participantId: '00000000-0000-4000-8000-000000000001',
      choice: 'switch',
      status: 'already_voted',
      timestamp: '2026-11-05T12:00:00Z',
    });

    renderWithRouter(<HomePage />);

    expect(
      screen.getByRole('heading', { name: /Ваш вибір: Перевести стрілку/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Голос уже було враховано раніше/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByTestId('choice-switch-button')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation through choices', async () => {
    const user = userEvent.setup();
    const submitSpy = vi.spyOn(api, 'submitVote').mockResolvedValueOnce({
      status: 'recorded',
      choice: 'stay',
    });

    renderWithRouter(<HomePage />);

    const stayButton = screen.getByTestId('choice-stay-button');
    stayButton.focus();
    expect(stayButton).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(submitSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText(/Дякуємо за вашу участь/i)).toBeInTheDocument();
    });
  });
});
