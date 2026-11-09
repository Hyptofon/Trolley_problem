'use client';

import React, { useState } from 'react';
import { AdminStatsResponse } from '@/lib/shared/types';
import { StatsChart } from './StatsChart';
import { Maximize2, Minimize2, X, RefreshCw } from 'lucide-react';

interface PresentationViewProps {
  stats: AdminStatsResponse;
  onExit: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const PresentationView: React.FC<PresentationViewProps> = ({
  stats,
  onExit,
  onRefresh,
  isRefreshing,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <div
      role="region"
      aria-label="Презентаційний режим результатів"
      className="fixed inset-0 z-50 bg-obsidian text-paper flex flex-col justify-between p-8 sm:p-14 overflow-y-auto"
    >
      {/* Top Bar with Minimal Controls */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between pb-8 border-b border-paper/10">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-mono text-ash-mist block mb-1">
            [ Презентаційний режим ]
          </span>
          <h1 className="text-2xl sm:text-4xl font-light tracking-tight text-paper">
            Проблема вагонетки — Результати
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-ghost-pill-dark p-3 rounded-full"
            aria-label="Оновити результати"
            title="Оновити результати"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="btn-ghost-pill-dark p-3 rounded-full"
            aria-label={isFullscreen ? 'Вийти з повного екрана' : 'На весь екран'}
            title={isFullscreen ? 'Вийти з повного екрана' : 'На весь екран'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onExit}
            className="btn-ghost-pill-dark text-xs uppercase tracking-[0.15em] py-2.5 px-6"
          >
            <X className="w-4 h-4 mr-1.5" />
            <span>Вийти з режиму</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto my-auto py-12">
        {/* Total Metric */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.25em] text-ash-mist font-mono block mb-2">
            Загальна кількість зареєстрованих відповідей
          </span>
          <span
            data-testid="presentation-total"
            className="text-7xl sm:text-9xl font-light font-mono text-paper tracking-tighter"
          >
            {stats.total}
          </span>
        </div>

        {/* Big Chart Container */}
        <div className="p-8 sm:p-14 rounded-none border border-paper/20 bg-paper text-obsidian">
          <StatsChart stats={stats} large />
        </div>
      </main>

      {/* Footer Timestamp */}
      <footer className="w-full max-w-7xl mx-auto pt-6 border-t border-paper/10 flex items-center justify-between text-xs font-mono text-ash-mist">
        <span>Анонімне опитування · Upstash Redis</span>
        <span>Оновлено: {new Date(stats.updatedAt).toLocaleTimeString('uk-UA')}</span>
      </footer>
    </div>
  );
};
