'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const labelText = isDark ? 'Темна' : 'Світла';

  return (
    <button
      type="button"
      data-testid="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={`${labelText} тема — перемкнути на ${isDark ? 'світлу' : 'темну'}`}
      title={`${labelText} тема — перемкнути на ${isDark ? 'світлу' : 'темну'}`}
      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-pill px-2.5 sm:px-3.5 py-1 sm:py-1.5 border border-obsidian/20 hover:border-obsidian text-obsidian bg-paper/60 hover:bg-obsidian/5 transition-all duration-300 text-xs font-mono tracking-wider cursor-pointer"
    >
      {isDark ? (
        <>
          <Moon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="hidden sm:inline uppercase text-[11px]">Темна</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span className="hidden sm:inline uppercase text-[11px]">Світла</span>
        </>
      )}
    </button>
  );
};
