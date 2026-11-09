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
    <div className="w-full max-w-[1340px] mx-auto my-8 px-4 sm:px-8 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-obsidian/10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-felt-gray block mb-2">
            [ Адміністративна панель ]
          </span>
          <h1 className="text-3xl sm:text-5xl font-light text-obsidian tracking-tight">
            Статистика дилеми вагонетки
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-testid="admin-refresh-button"
            onClick={() => loadStats(true)}
            disabled={isRefreshing || isLoading}
            className="btn-ghost-pill text-xs uppercase tracking-[0.15em] py-2.5 px-6 disabled:opacity-50"
            title="Оновити зараз"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Оновити</span>
          </button>

          <button
            type="button"
            data-testid="admin-presentation-button"
            onClick={() => setPresentationMode(true)}
            disabled={!stats}
            className="btn-ghost-pill text-xs uppercase tracking-[0.15em] py-2.5 px-6 disabled:opacity-50"
          >
            <Tv className="w-3.5 h-3.5 mr-1.5" />
            <span>Презентація</span>
          </button>

          <button
            type="button"
            data-testid="admin-logout-button"
            onClick={handleLogout}
            className="btn-ghost-pill text-xs uppercase tracking-[0.15em] py-2.5 px-6 hover:bg-obsidian hover:text-paper"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            <span>Вийти</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-6 p-4 rounded-none border border-obsidian bg-obsidian/[0.03] text-obsidian text-xs font-mono flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-obsidian flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Помилка оновлення даних</p>
            <p className="mt-0.5 text-felt-gray">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => loadStats(true)}
            className="btn-ghost-pill text-xs uppercase tracking-wider py-1 px-3"
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
        <div className="space-y-8 mt-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Total Votes Card */}
            <div className="p-8 rounded-none border border-obsidian bg-paper">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-felt-gray block mb-3">
                01 · Всього голосів
              </span>
              <div className="text-4xl sm:text-6xl font-light font-mono text-obsidian tracking-tighter" data-testid="stats-total">
                {stats.total}
              </div>
              <span className="text-xs font-mono text-felt-gray mt-3 block">
                {stats.total === 0
                  ? 'Очікуємо перших відповідей'
                  : 'Зареєстровано в Upstash Redis'}
              </span>
            </div>

            {/* Stay Votes Card */}
            <div className="p-8 rounded-none border border-obsidian bg-paper">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-felt-gray block mb-3">
                02 · Не втручатися
              </span>
              <div className="flex items-baseline justify-between">
                <div className="text-4xl sm:text-6xl font-light font-mono text-obsidian tracking-tighter" data-testid="stats-stay-count">
                  {stats.stay}
                </div>
                <span className="text-2xl font-light font-mono text-obsidian" data-testid="stats-stay-percent">
                  {stats.stayPercent}%
                </span>
              </div>
              <span className="text-xs font-mono text-felt-gray mt-3 block">
                Пряма загроза 5 людям
              </span>
            </div>

            {/* Switch Votes Card */}
            <div className="p-8 rounded-none border border-obsidian bg-paper">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-felt-gray block mb-3">
                03 · Перевести стрілку
              </span>
              <div className="flex items-baseline justify-between">
                <div className="text-4xl sm:text-6xl font-light font-mono text-obsidian tracking-tighter" data-testid="stats-switch-count">
                  {stats.switch}
                </div>
                <span className="text-2xl font-light font-mono text-obsidian" data-testid="stats-switch-percent">
                  {stats.switchPercent}%
                </span>
              </div>
              <span className="text-xs font-mono text-felt-gray mt-3 block">
                Загроза 1 людині (порятунок 5)
              </span>
            </div>
          </div>

          {/* Visual Chart Card */}
          <div className="p-8 sm:p-12 rounded-none border border-obsidian bg-paper">
            <div className="flex items-center justify-between pb-6 border-b border-obsidian/10 mb-8">
              <h2 className="text-xl sm:text-2xl font-light text-obsidian tracking-tight">
                Графічний аналіз співвідношення
              </h2>
              {stats.total === 0 && (
                <span className="text-xs font-mono uppercase tracking-wider text-felt-gray">
                  Порожній стан
                </span>
              )}
            </div>

            {stats.total === 0 ? (
              <div className="py-16 text-center text-felt-gray font-light">
                <p className="text-lg text-obsidian">Голосів ще не зареєстровано</p>
                <p className="text-xs font-mono text-felt-gray mt-1">
                  Після першого голосу тут відобразиться розподіл відповідей.
                </p>
              </div>
            ) : (
              <StatsChart stats={stats} />
            )}
          </div>

          {/* Status & Last Updated */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-felt-gray pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-obsidian inline-block" />
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
