import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExperimentProvider, useExperiment } from '@/components/ExperimentProvider';
import { Header } from '@/components/Header';
import { TrolleyScene } from '@/components/scene/TrolleyScene';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

const TestConsumer: React.FC = () => {
  const { setHasVoted, registerRevoteHandler } = useExperiment();

  React.useEffect(() => {
    return registerRevoteHandler(() => {
      setHasVoted(false);
    });
  }, [registerRevoteHandler, setHasVoted]);

  return (
    <div>
      <button data-testid="mark-voted" onClick={() => setHasVoted(true)}>
        Mark Voted
      </button>
    </div>
  );
};

describe('Header & Revote Integration', () => {
  it('renders wordmark with "Етичний експеримент · 1967"', () => {
    render(
      <ExperimentProvider>
        <Header />
      </ExperimentProvider>
    );

    expect(screen.getByText('Проблема вагонетки')).toBeInTheDocument();
    expect(screen.getByText('Етичний експеримент · 1967')).toBeInTheDocument();
    expect(screen.queryByTestId('header-revote-btn')).not.toBeInTheDocument();
  });

  it('reveals "Заново" button in Header after voting and handles revote click', () => {
    render(
      <ExperimentProvider>
        <Header />
        <TestConsumer />
      </ExperimentProvider>
    );

    // Initial state: no revote button
    expect(screen.queryByTestId('header-revote-btn')).not.toBeInTheDocument();

    // Mark as voted
    fireEvent.click(screen.getByTestId('mark-voted'));

    // Revote button should now be visible in header
    const revoteBtn = screen.getByTestId('header-revote-btn');
    expect(revoteBtn).toBeInTheDocument();
    expect(revoteBtn).toHaveTextContent('Заново');

    // Click revote button
    fireEvent.click(revoteBtn);

    // Revote resets voted state
    expect(screen.queryByTestId('header-revote-btn')).not.toBeInTheDocument();
  });

  it('renders in-scene decision HUD during decision-pause and handles choices', () => {
    const handleSelectChoice = vi.fn();

    const { rerender } = render(
      <TrolleyScene
        phase="idle"
        selectedChoice={null}
        onSelectChoice={handleSelectChoice}
      />
    );

    // Idle phase: no HUD
    expect(screen.queryByTestId('scene-decision-hud')).not.toBeInTheDocument();
    expect(screen.getByTestId('start-experiment-button')).toBeInTheDocument();

    // Decision pause phase: HUD rendered with both options
    rerender(
      <TrolleyScene
        phase="decision-pause"
        selectedChoice={null}
        onSelectChoice={handleSelectChoice}
      />
    );

    expect(screen.getByTestId('scene-decision-hud')).toBeInTheDocument();
    expect(screen.getByTestId('scene-choice-stay-button')).toBeInTheDocument();
    expect(screen.getByTestId('scene-choice-switch-button')).toBeInTheDocument();

    // Click switch option
    fireEvent.click(screen.getByTestId('scene-choice-switch-button'));
    expect(handleSelectChoice).toHaveBeenCalledWith('switch');

    // Click stay option
    fireEvent.click(screen.getByTestId('scene-choice-stay-button'));
    expect(handleSelectChoice).toHaveBeenCalledWith('stay');

    // Result phase: HUD hidden
    rerender(
      <TrolleyScene
        phase="result"
        selectedChoice="switch"
        onSelectChoice={handleSelectChoice}
      />
    );

    expect(screen.queryByTestId('scene-decision-hud')).not.toBeInTheDocument();
  });
});

