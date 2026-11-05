import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AdminStatsResponse } from '../../types';
import { fetchAdminStats, logoutAdmin } from '../../services/api';
import { StatsChart } from './StatsChart';
import { PresentationView } from './PresentationView';
import {
  LogOut,
  RefreshCw,
  Tv,
  Users,
  ShieldAlert,
  GitFork,
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
    <div className="w-full max-w-5xl mx-auto my-6 sm:my-10 px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-graphite-800">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-trolley-amber">
            Адміністративна панель
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Статистика дилеми вагонетки
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-testid="admin-refresh-button"
            onClick={() => loadStats(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-graphite-850 hover:bg-graphite-800 text-graphite-200 hover:text-white border border-graphite-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Оновити зараз"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Оновити</span>
          </button>

          <button
            type="button"
            data-testid="admin-presentation-button"
            onClick={() => setPresentationMode(true)}
            disabled={!stats}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-graphite-850 hover:bg-graphite-800 text-graphite-200 hover:text-white border border-graphite-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <Tv className="w-4 h-4 text-trolley-amber" />
            <span>Презентація</span>
          </button>

          <button
            type="button"
            data-testid="admin-logout-button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-red-100 border border-red-800/80 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Вийти</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-6 p-4 rounded-xl bg-red-950/50 border border-red-700 text-red-200 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-white">Помилка оновлення даних</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => loadStats(true)}
            className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs"
          >
            Спробувати знову
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !stats ? (
        <div className="my-16 flex flex-col items-center justify-center text-graphite-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-trolley-amber" />
          <p className="text-sm">Завантаження актуальних даних з таблиці...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6 mt-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Votes Card */}
            <div className="p-5 rounded-2xl bg-graphite-900 border border-graphite-800 shadow">
              <div className="flex items-center justify-between text-graphite-400 mb-2">
                <span className="text-xs uppercase font-semibold tracking-wider">
                  Всього голосів
                </span>
                <Users className="w-4 h-4 text-trolley-amber" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white" data-testid="stats-total">
                {stats.total}
              </div>
              <span className="text-xs text-graphite-400 mt-1 block">
                {stats.total === 0
                  ? 'Очікуємо перших відповідей'
                  : 'Зареєстровано у Google Sheet'}
              </span>
            </div>

            {/* Stay Votes Card */}
            <div className="p-5 rounded-2xl bg-graphite-900 border border-graphite-800 shadow">
              <div className="flex items-center justify-between text-red-400 mb-2">
                <span className="text-xs uppercase font-semibold tracking-wider">
                  Не втручатися
                </span>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white" data-testid="stats-stay-count">
                  {stats.stay}
                </div>
                <span className="text-xl font-bold font-mono text-red-400" data-testid="stats-stay-percent">
                  {stats.stayPercent}%
                </span>
              </div>
              <span className="text-xs text-graphite-400 mt-1 block">
                Пряма загроза 5 людям
              </span>
            </div>

            {/* Switch Votes Card */}
            <div className="p-5 rounded-2xl bg-graphite-900 border border-graphite-800 shadow">
              <div className="flex items-center justify-between text-sky-400 mb-2">
                <span className="text-xs uppercase font-semibold tracking-wider">
                  Перевести стрілку
                </span>
                <GitFork className="w-4 h-4" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white" data-testid="stats-switch-count">
                  {stats.switch}
                </div>
                <span className="text-xl font-bold font-mono text-sky-400" data-testid="stats-switch-percent">
                  {stats.switchPercent}%
                </span>
              </div>
              <span className="text-xs text-graphite-400 mt-1 block">
                Загроза 1 людині (порятунок 5)
              </span>
            </div>
          </div>

          {/* Visual Chart Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-graphite-900 border border-graphite-800 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
              <span>Графічний аналіз співвідношення</span>
              {stats.total === 0 && (
                <span className="text-xs font-normal text-graphite-400">
                  Порожній стан
                </span>
              )}
            </h2>

            {stats.total === 0 ? (
              <div className="py-12 text-center text-graphite-400">
                <p className="text-base font-medium text-graphite-300">
                  Голосів ще не зареєстровано
                </p>
                <p className="text-xs text-graphite-400 mt-1">
                  Коли перший учасник проголосує, тут зʼявиться розподіл відповідей.
                </p>
              </div>
            ) : (
              <StatsChart stats={stats} />
            )}
          </div>

          {/* Status & Last Updated */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-graphite-400 px-1 pt-2 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>Автооновлення кожні 15 с (коли сторінка активна)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-graphite-400" />
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

