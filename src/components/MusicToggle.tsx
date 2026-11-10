'use client';

import React from 'react';
import { useSound } from './SoundProvider';
import { Music } from 'lucide-react';

export const MusicToggle: React.FC = () => {
  const { musicEnabled, toggleMusic } = useSound();

  return (
    <button
      type="button"
      data-testid="music-toggle-btn"
      onClick={toggleMusic}
      aria-label={
        musicEnabled
          ? 'Музика увімкнена — натисніть, щоб вимкнути фонову музику'
          : 'Музика вимкнена — натисніть, щоб увімкнути фонову музику'
      }
      title={
        musicEnabled
          ? 'Вимкнути фонову напружену музику'
          : 'Увімкнути фонову напружену музику'
      }
      className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-pill px-2.5 sm:px-3.5 py-1 sm:py-1.5 border transition-all duration-300 text-xs font-mono tracking-wider cursor-pointer ${
        musicEnabled
          ? 'border-obsidian/30 hover:border-obsidian text-obsidian bg-paper/60 hover:bg-obsidian/5'
          : 'border-neutral-400/40 text-felt-gray hover:text-obsidian bg-paper/30 hover:bg-obsidian/5'
      }`}
    >
      {musicEnabled ? (
        <>
          <Music className="w-3.5 h-3.5 text-amber-500 animate-pulse flex-shrink-0" />
          <span className="hidden sm:inline uppercase text-[11px]">Музика</span>
        </>
      ) : (
        <>
          <Music className="w-3.5 h-3.5 text-neutral-400 opacity-60 flex-shrink-0" />
          <span className="hidden sm:inline uppercase text-[11px] line-through decoration-neutral-400">
            Музика
          </span>
        </>
      )}
    </button>
  );
};

