import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoundProvider, useSound } from '@/components/SoundProvider';
import { SoundToggle } from '@/components/SoundToggle';
import { MusicToggle } from '@/components/MusicToggle';

const AudioTestConsumer: React.FC = () => {
  const {
    soundEnabled,
    musicEnabled,
    playImpact,
    playLeverPull,
    startTicking,
    stopTicking,
  } = useSound();

  return (
    <div>
      <div data-testid="sound-state">{soundEnabled ? 'sound-on' : 'sound-off'}</div>
      <div data-testid="music-state">{musicEnabled ? 'music-on' : 'music-off'}</div>
      <button data-testid="btn-impact" onClick={playImpact}>Impact</button>
      <button data-testid="btn-lever" onClick={playLeverPull}>Lever</button>
      <button data-testid="btn-ticking-start" onClick={startTicking}>Start Ticking</button>
      <button data-testid="btn-ticking-stop" onClick={stopTicking}>Stop Ticking</button>
    </div>
  );
};

describe('Sound & Music Independent Audio Controls', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders both Music and Sound toggles enabled by default', () => {
    render(
      <SoundProvider>
        <MusicToggle />
        <SoundToggle />
        <AudioTestConsumer />
      </SoundProvider>
    );

    const musicBtn = screen.getByTestId('music-toggle-btn');
    const soundBtn = screen.getByTestId('sound-toggle-btn');

    expect(musicBtn).toBeInTheDocument();
    expect(soundBtn).toBeInTheDocument();
    expect(musicBtn).toHaveAccessibleName(/Музика/);
    expect(soundBtn).toHaveAccessibleName(/Звук/);
    expect(screen.getByTestId('sound-state')).toHaveTextContent('sound-on');
    expect(screen.getByTestId('music-state')).toHaveTextContent('music-on');
  });

  it('toggles Music independently without affecting Sound effects', () => {
    render(
      <SoundProvider>
        <MusicToggle />
        <SoundToggle />
        <AudioTestConsumer />
      </SoundProvider>
    );

    const musicBtn = screen.getByTestId('music-toggle-btn');
    fireEvent.click(musicBtn);

    expect(screen.getByTestId('music-state')).toHaveTextContent('music-off');
    expect(screen.getByTestId('sound-state')).toHaveTextContent('sound-on');
    expect(localStorage.getItem('trolley-music-enabled')).toBe('false');

    // Toggle back on
    fireEvent.click(musicBtn);
    expect(screen.getByTestId('music-state')).toHaveTextContent('music-on');
    expect(localStorage.getItem('trolley-music-enabled')).toBe('true');
  });

  it('toggles Sound independently without affecting Music', () => {
    render(
      <SoundProvider>
        <MusicToggle />
        <SoundToggle />
        <AudioTestConsumer />
      </SoundProvider>
    );

    const soundBtn = screen.getByTestId('sound-toggle-btn');
    fireEvent.click(soundBtn);

    expect(screen.getByTestId('sound-state')).toHaveTextContent('sound-off');
    expect(screen.getByTestId('music-state')).toHaveTextContent('music-on');
    expect(localStorage.getItem('trolley-sound-enabled')).toBe('false');

    // Toggle back on
    fireEvent.click(soundBtn);
    expect(screen.getByTestId('sound-state')).toHaveTextContent('sound-on');
    expect(localStorage.getItem('trolley-sound-enabled')).toBe('true');
  });

  it('loads persistent audio preferences from localStorage on mount', () => {
    localStorage.setItem('trolley-music-enabled', 'false');
    localStorage.setItem('trolley-sound-enabled', 'false');

    render(
      <SoundProvider>
        <MusicToggle />
        <SoundToggle />
        <AudioTestConsumer />
      </SoundProvider>
    );

    expect(screen.getByTestId('music-state')).toHaveTextContent('music-off');
    expect(screen.getByTestId('sound-state')).toHaveTextContent('sound-off');
  });
});

