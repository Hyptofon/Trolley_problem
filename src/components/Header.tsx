'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { SoundToggle } from './SoundToggle';
import { MusicToggle } from './MusicToggle';
import { useExperiment } from './ExperimentProvider';
import { RotateCcw } from 'lucide-react';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const { hasVoted, triggerRevote } = useExperiment();

  return (
    <header className="w-full h-14 sm:h-[66px] border-b border-obsidian/10 bg-paper/95 backdrop-blur-sm sticky top-0 z-40 transition-colors duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]">
      <div className="w-full px-3 sm:px-6 md:px-12 h-full flex items-center justify-between gap-2">
        {/* Wordmark Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3 text-obsidian hover:opacity-70 transition-opacity duration-300 min-w-0 flex-shrink"
        >
          <span className="w-2.5 h-2.5 bg-obsidian inline-block flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-normal text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-none text-obsidian truncate">
              Проблема вагонетки
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.15em] text-felt-gray leading-none mt-1 truncate">
              Етичний експеримент · 1967
            </span>
          </div>
        </Link>

        {/* Minimal Navigation & Audio / Theme Controls */}
        <nav aria-label="Головна навігація" className="flex items-center gap-1.5 sm:gap-2.5 md:gap-4 flex-shrink-0">
          {isAdmin && (
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.2em] text-obsidian hover:text-felt-gray transition-colors font-normal mr-2"
            >
              ← До дилеми
            </Link>
          )}

          {/* Revote (Заново) Button in Header */}
          {hasVoted && (
            <button
              type="button"
              data-testid="header-revote-btn"
              onClick={triggerRevote}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-pill text-[11px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.15em] py-1 px-2 sm:px-3 text-felt-gray hover:text-obsidian hover:bg-obsidian/[0.05] transition-colors cursor-pointer border border-obsidian/20 flex-shrink-0"
              title="Змінити рішення та запустити вагонетку заново"
            >
              <RotateCcw className="w-3 h-3 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">Заново</span>
            </button>
          )}

          {/* Ambient Music Toggle */}
          <MusicToggle />

          {/* Sound Effects Toggle (Ticking, Lever, Collision) */}
          <SoundToggle />

          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};
