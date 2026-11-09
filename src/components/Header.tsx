'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { SoundToggle } from './SoundToggle';
import { MusicToggle } from './MusicToggle';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <header className="w-full h-[66px] border-b border-obsidian/10 bg-paper/95 backdrop-blur-sm sticky top-0 z-40 transition-colors duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]">
      <div className="w-full px-4 sm:px-8 md:px-16 h-full flex items-center justify-between">
        {/* Wordmark Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 text-obsidian hover:opacity-70 transition-opacity duration-300"
        >
          <span className="w-2.5 h-2.5 bg-obsidian inline-block flex-shrink-0" />
          <div className="flex flex-col">
            <span className="font-normal text-xs sm:text-sm uppercase tracking-[0.2em] leading-none text-obsidian">
              Проблема вагонетки
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-felt-gray leading-none mt-1">
              Етичний експеримент
            </span>
          </div>
        </Link>

        {/* Minimal Navigation & Audio / Theme Controls */}
        <nav aria-label="Головна навігація" className="flex items-center gap-2 sm:gap-4 md:gap-5">
          {isAdmin && (
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.2em] text-obsidian hover:text-felt-gray transition-colors font-normal mr-2"
            >
              ← До дилеми
            </Link>
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
