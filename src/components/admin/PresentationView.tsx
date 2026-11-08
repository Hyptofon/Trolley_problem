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
      // Graceful fallback if Fullscreen API is blocked or not supported
      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <div
      role="region"
      aria-label="Презентаційний режим результатів"
      className="fixed inset-0 z-50 bg-graphite-950 text-white flex flex-col justify-between p-6 sm:p-10 overflow-y-auto"
    >
      {/* Top Bar with Minimal Controls */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-graphite-800">
        <div>
          <span className="text-xs uppercase tracking-widest font-mono text-trolley-amber">
            Презентаційний режим
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Проблема вагонетки — Результати голосування
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-graphite-850 hover:bg-graphite-800 text-graphite-300 hover:text-white border border-graphite-700 transition-colors"
            aria-label="Оновити результати"
            title="Оновити результати"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-graphite-850 hover:bg-graphite-800 text-graphite-300 hover:text-white border border-graphite-700 transition-colors"
            aria-label={isFullscreen ? 'Вийти з повного екрана' : 'На весь екран'}
            title={isFullscreen ? 'Вийти з повного екрана' : 'На весь екран'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Вийти з режиму</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mx-auto my-auto py-8">
        {/* Total Votes Big Metric */}
        <div className="text-center mb-8">
          <span className="text-sm uppercase tracking-wider text-graphite-400 font-semibold block">
            Загальна кількість голосів
          </span>
          <span
            data-testid="presentation-total"
            className="text-6xl sm:text-8xl font-black font-mono text-white tracking-tight"
          >
            {stats.total}
          </span>
        </div>

        {/* Big Chart */}
        <div className="p-6 sm:p-10 rounded-3xl bg-graphite-900 border border-graphite-800 shadow-2xl">
          <StatsChart stats={stats} large />
        </div>
      </main>

      {/* Footer Timestamp */}
      <footer className="w-full max-w-6xl mx-auto pt-4 border-t border-graphite-900 flex items-center justify-between text-xs text-graphite-400 font-mono">
        <span>Анонімне опитування</span>
        <span>Оновлено: {new Date(stats.updatedAt).toLocaleTimeString('uk-UA')}</span>
      </footer>
    </div>
  );
};
