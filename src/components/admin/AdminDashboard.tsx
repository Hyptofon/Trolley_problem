'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AdminStatsResponse } from '@/lib/shared/types';
import { fetchAdminStats, logoutAdmin } from '@/lib/client/api';
import { StatsChart } from './StatsChart';
import { PresentationView } from './PresentationView';
import {
  LogOut,
  RefreshCw,
  Tv,
  AlertCircle,
  Loader2,
  Clock,
  Users,
  GitCommit,
  ArrowRightLeft,
  BarChart3,
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AUTO_REFRESH_INTERVAL_MS = 15000;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const loadStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    setErrorMessage(null);

    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Не вдалося завантажити статистику';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Auto-refresh when tab is active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    timerRef.current = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadStats();
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [loadStats]);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } finally {
      onLogout();
    }
  };

  if (presentationMode && stats) {
    return (
      <PresentationView
        stats={stats}
        onExit={() => setPresentationMode(false)}
        onRefresh={() => loadStats(true)}
        isRefreshing={isRefreshing}
      />
    );
  }

  return (
    <div className="w-full max-w-[1340px] mx-auto my-6 sm:my-8 px-4 sm:px-8 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-obsidian/10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-felt-gray block mb-1.5">
            [ Панель організатора · Аналітика експерименту ]
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-light text-obsidian tracking-tight">
            Статистика дилеми вагонетки
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            data-testid="admin-refresh-button"
            onClick={() => loadStats(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center justify-center rounded-pill border border-obsidian/25 hover:border-obsidian text-obsidian bg-paper hover:bg-obsidian/5 text-xs uppercase tracking-[0.14em] py-2.5 px-4 sm:px-5 transition-all cursor-pointer disabled:opacity-50"
            title="Оновити зараз"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Оновити</span>
          </button>

          <button
            type="button"
            data-testid="admin-presentation-button"
            onClick={() => setPresentationMode(true)}
            disabled={!stats}
            className="inline-flex items-center justify-center rounded-pill border border-obsidian bg-obsidian text-paper hover:opacity-90 text-xs uppercase tracking-[0.14em] font-medium py-2.5 px-5 sm:px-6 transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <Tv className="w-3.5 h-3.5 mr-2" />
            <span>Презентація</span>
          </button>

          <button
            type="button"
            data-testid="admin-logout-button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-pill border border-obsidian/20 hover:border-obsidian text-felt-gray hover:text-obsidian bg-paper hover:bg-obsidian/5 text-xs uppercase tracking-[0.14em] py-2.5 px-4 sm:px-5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            <span>Вийти</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-6 p-4 rounded-xl border border-obsidian/25 bg-obsidian/[0.03] text-obsidian text-xs font-mono flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle className="w-4 h-4 text-obsidian flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Помилка оновлення даних</p>
              <p className="mt-0.5 text-felt-gray">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadStats(true)}
            className="inline-flex items-center justify-center rounded-pill border border-obsidian/30 hover:border-obsidian px-4 py-1.5 text-xs uppercase tracking-wider cursor-pointer self-start sm:self-center"
          >
            Спробувати знову
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !stats ? (
        <div className="my-20 flex flex-col items-center justify-center text-felt-gray gap-3 font-mono text-xs uppercase tracking-widest">
          <Loader2 className="w-6 h-6 animate-spin text-obsidian" />
          <p>Завантаження даних...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* 01: Total Votes Card */}
            <div className="p-5 sm:p-7 rounded-2xl border border-obsidian/15 bg-paper shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-felt-gray">
                    01 · Всього голосів
                  </span>
                  <span className="p-2 rounded-lg bg-obsidian/[0.04] text-obsidian">
                    <Users className="w-4 h-4" />
                  </span>
                </div>

                <div
                  className="text-4xl sm:text-5xl lg:text-6xl font-light font-mono tabular-nums text-obsidian tracking-tighter"
                  data-testid="stats-total"
                >
                  {stats.total}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-obsidian/10 flex items-center gap-2 text-xs font-mono text-felt-gray">
                <span
                  className={`w-2 h-2 rounded-full inline-block ${
                    stats.total > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-ash-mist'
                  }`}
                />
                <span>
                  {stats.total === 0
                    ? 'Очікуємо перших відповідей'
                    : 'Дані активної вибірки'}
                </span>
              </div>
            </div>

            {/* 02: Stay Votes Card (Blue - Deontology) */}
            <div className="p-5 sm:p-7 rounded-2xl border border-obsidian/15 border-t-4 border-t-[#2563EB] bg-paper shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.16em] text-obsidian font-medium">
                    <GitCommit className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>02 · Не втручатися</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-[#1D4ED8] dark:text-[#60A5FA] font-semibold">
                    Деонтологія
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-3">
                  <div
                    className="text-4xl sm:text-5xl lg:text-6xl font-light font-mono tabular-nums text-obsidian tracking-tighter"
                    data-testid="stats-stay-count"
                  >
                    {stats.stay}
                  </div>
                  <span
                    className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-[#2563EB] dark:text-[#60A5FA]"
                    data-testid="stats-stay-percent"
                  >
                    {stats.stayPercent}%
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <div className="w-full h-1.5 rounded-full bg-obsidian/[0.06] overflow-hidden mb-2.5">
                  <div
                    style={{ width: `${stats.stayPercent}%` }}
                    className="h-full bg-[#2563EB] rounded-full transition-all duration-700"
                  />
                </div>
                <span className="text-xs font-mono text-felt-gray block">
                  Пряма загроза 5 людям · бездіяльність
                </span>
              </div>
            </div>

            {/* 03: Switch Votes Card (Amber - Utilitarianism) */}
            <div className="p-5 sm:p-7 rounded-2xl border border-obsidian/15 border-t-4 border-t-[#F59E0B] bg-paper shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.16em] text-obsidian font-medium">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>03 · Перевести стрілку</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-[#92400E] dark:text-[#FBBF24] font-semibold">
                    Утилітаризм
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-3">
                  <div
                    className="text-4xl sm:text-5xl lg:text-6xl font-light font-mono tabular-nums text-obsidian tracking-tighter"
                    data-testid="stats-switch-count"
                  >
                    {stats.switch}
                  </div>
                  <span
                    className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-[#B45309] dark:text-[#FBBF24]"
                    data-testid="stats-switch-percent"
                  >
                    {stats.switchPercent}%
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <div className="w-full h-1.5 rounded-full bg-obsidian/[0.06] overflow-hidden mb-2.5">
                  <div
                    style={{ width: `${stats.switchPercent}%` }}
                    className="h-full bg-[#F59E0B] rounded-full transition-all duration-700"
                  />
                </div>
                <span className="text-xs font-mono text-felt-gray block">
                  Загроза 1 людині · врятовано 5
                </span>
              </div>
            </div>
          </div>

          {/* Visual Charts Suite Card */}
          <div className="p-5 sm:p-8 lg:p-10 rounded-2xl border border-obsidian/15 bg-paper shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-obsidian/10 mb-6 sm:mb-8">
              <div>
                <h2 className="text-lg sm:text-2xl font-normal text-obsidian tracking-tight flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-obsidian flex-shrink-0" />
                  <span>Візуальна аналітика результатів</span>
                </h2>
                <p className="text-xs sm:text-sm text-felt-gray mt-0.5">
                  Круговий розподіл, чесна шкала 0–100% та готові інсайти для презентації
                </p>
              </div>
              {stats.total === 0 && (
                <span className="text-xs font-mono uppercase tracking-wider text-felt-gray">
                  Порожній стан
                </span>
              )}
            </div>

            {stats.total === 0 ? (
              <div className="py-12 sm:py-16 text-center text-felt-gray font-light">
                <p className="text-base sm:text-lg text-obsidian font-normal">
                  Голосів ще не зареєстровано
                </p>
                <p className="text-xs font-mono text-felt-gray mt-1.5 max-w-md mx-auto">
                  Щойно учасники зроблять перший вибір на головній сторінці, тут автоматично зʼявляться діаграми та висновки.
                </p>
              </div>
            ) : (
              <StatsChart stats={stats} />
            )}
          </div>

          {/* Status & Last Updated */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-felt-gray pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-obsidian/60 inline-block" />
              <span>Автооновлення кожні 15 с (коли вкладка активна)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Останнє оновлення: {new Date(stats.updatedAt).toLocaleTimeString('uk-UA')}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
