'use client';

import React, { useState } from 'react';
import { AdminStatsResponse } from '@/lib/shared/types';
import { StatsChart } from './StatsChart';
import { Maximize2, Minimize2, X, RefreshCw, Sun, Moon } from 'lucide-react';

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
  const [isDarkSlide, setIsDarkSlide] = useState(true);

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

  const stageClass = isDarkSlide
    ? 'bg-[#0B0D12] text-slate-100'
    : 'bg-[#F8FAFC] text-slate-900';
  const headerBorder = isDarkSlide ? 'border-white/15' : 'border-slate-200';
  const mutedText = isDarkSlide ? 'text-slate-300' : 'text-slate-600';
  const btnClass = isDarkSlide
    ? 'border-white/25 hover:border-white/60 text-slate-100 bg-white/5 hover:bg-white/10'
    : 'border-slate-300 hover:border-slate-600 text-slate-900 bg-white hover:bg-slate-100';
  const summaryCardClass = isDarkSlide
    ? 'bg-[#131722] border-white/15 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const stayMetricColor = isDarkSlide ? 'text-[#60A5FA]' : 'text-[#1D4ED8]';
  const switchMetricColor = isDarkSlide ? 'text-[#FBBF24]' : 'text-[#B45309]';

  return (
    <div
      role="region"
      aria-label="Презентаційний режим результатів"
      className={`fixed inset-0 z-50 ${stageClass} flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-y-auto transition-colors duration-300`}
    >
      {/* Top Bar with Projector-Friendly Controls */}
      <header
        className={`w-full max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${headerBorder}`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span className={`text-[11px] uppercase tracking-[0.22em] font-mono ${mutedText}`}>
              Презентація результатів · Live
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-light tracking-tight">
            Проблема вагонетки — Вибір аудиторії
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDarkSlide(!isDarkSlide)}
            className={`inline-flex items-center justify-center rounded-full border p-2.5 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${btnClass}`}
            aria-label={isDarkSlide ? 'Увімкнути світлий слайд' : 'Увімкнути темний слайд'}
            title={isDarkSlide ? 'Світлий фон слайда (для яскравих залів)' : 'Темний фон слайда (для проектора)'}
          >
            {isDarkSlide ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`inline-flex items-center justify-center rounded-full border p-2.5 transition-all cursor-pointer disabled:opacity-50 ${btnClass}`}
            aria-label="Оновити результати"
            title="Оновити результати"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className={`inline-flex items-center justify-center rounded-full border p-2.5 transition-all cursor-pointer ${btnClass}`}
            aria-label={isFullscreen ? 'Вийти з повного екрана' : 'На весь екран'}
            title={isFullscreen ? 'Вийти з повного екрана' : 'На весь екран'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onExit}
            className={`inline-flex items-center justify-center rounded-full border text-xs uppercase tracking-[0.15em] py-2 px-4 sm:px-5 transition-all cursor-pointer ${btnClass}`}
          >
            <X className="w-4 h-4 mr-1.5" />
            <span>Вийти з режиму</span>
          </button>
        </div>
      </header>

      {/* Main Slide Content Area */}
      <main className="w-full max-w-7xl mx-auto my-auto py-4 sm:py-5 space-y-4 sm:space-y-5">
        {/* Hero KPI Strip for Projector Readability */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 sm:p-5 rounded-xl border ${summaryCardClass}`}>
            <span className={`text-[11px] uppercase tracking-[0.18em] font-mono block mb-1 ${mutedText}`}>
              Усього відповідей
            </span>
            <span
              data-testid="presentation-total"
              className="text-4xl sm:text-5xl font-light font-mono tabular-nums tracking-tighter block"
            >
              {stats.total}
            </span>
          </div>

          <div className={`p-4 sm:p-5 rounded-xl border border-t-4 border-t-[#2563EB] ${summaryCardClass}`}>
            <span className={`text-[11px] uppercase tracking-[0.18em] font-mono block mb-1 ${mutedText}`}>
              Не втручатися (Деонтологія)
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className={`text-4xl sm:text-5xl font-semibold font-mono tabular-nums ${stayMetricColor} tracking-tighter`}>
                {stats.stayPercent}%
              </span>
              <span className={`text-base sm:text-lg font-mono ${mutedText}`}>
                {stats.stay} гол.
              </span>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-xl border border-t-4 border-t-[#F59E0B] ${summaryCardClass}`}>
            <span className={`text-[11px] uppercase tracking-[0.18em] font-mono block mb-1 ${mutedText}`}>
              Перевести стрілку (Утилітаризм)
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className={`text-4xl sm:text-5xl font-semibold font-mono tabular-nums ${switchMetricColor} tracking-tighter`}>
                {stats.switchPercent}%
              </span>
              <span className={`text-base sm:text-lg font-mono ${mutedText}`}>
                {stats.switch} гол.
              </span>
            </div>
          </div>
        </div>

        {/* High-Contrast Charts Canvas */}
        <div className={`p-4 sm:p-6 rounded-xl border ${summaryCardClass}`}>
          <StatsChart stats={stats} large slideMode={isDarkSlide ? 'dark' : 'light'} />
        </div>
      </main>

      {/* Footer Timestamp */}
      <footer
        className={`w-full max-w-7xl mx-auto pt-3 border-t ${headerBorder} flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${mutedText}`}
      >
        <span>Етичний експеримент · «Проблема вагонетки» (1967)</span>
        <span>Оновлено: {new Date(stats.updatedAt).toLocaleTimeString('uk-UA')}</span>
      </footer>
    </div>
  );
};
