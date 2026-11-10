'use client';

import React from 'react';
import { useSound } from './SoundProvider';
import { Volume2, VolumeX } from 'lucide-react';

export const SoundToggle: React.FC = () => {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <button
      type="button"
      data-testid="sound-toggle-btn"
      onClick={toggleSound}
      aria-label={
        soundEnabled
          ? 'Звук увімкнено — натисніть, щоб вимкнути звукові ефекти'
          : 'Звук вимкнено — натисніть, щоб увімкнути звукові ефекти'
      }
      title={
        soundEnabled
          ? 'Вимкнути звукові ефекти (цокання коліс, перемикання стрілки, зіткнення)'
          : 'Увімкнути звукові ефекти (цокання коліс, перемикання стрілки, зіткнення)'
      }
      className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-pill px-2.5 sm:px-3.5 py-1 sm:py-1.5 border transition-all duration-300 text-xs font-mono tracking-wider cursor-pointer ${
        soundEnabled
          ? 'border-obsidian/30 hover:border-obsidian text-obsidian bg-paper/60 hover:bg-obsidian/5'
          : 'border-neutral-400/40 text-felt-gray hover:text-obsidian bg-paper/30 hover:bg-obsidian/5'
      }`}
    >
      {soundEnabled ? (
        <>
          <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse flex-shrink-0" />
          <span className="hidden sm:inline uppercase text-[11px]">Звук</span>
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <span className="hidden sm:inline uppercase text-[11px] line-through decoration-neutral-400">
            Звук
          </span>
        </>
      )}
    </button>
  );
};
