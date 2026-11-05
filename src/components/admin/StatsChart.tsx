import React from 'react';
import { AdminStatsResponse } from '../../types';

interface StatsChartProps {
  stats: AdminStatsResponse;
  large?: boolean;
}

export const StatsChart: React.FC<StatsChartProps> = ({ stats, large = false }) => {
  const { total, stay, switch: switchCount, stayPercent, switchPercent } = stats;

  const maxCount = Math.max(1, Math.max(stay, switchCount));
  const stayHeightPct = total > 0 ? (stay / maxCount) * 100 : 0;
  const switchHeightPct = total > 0 ? (switchCount / maxCount) * 100 : 0;

  return (
    <div className="w-full space-y-6">
      {/* Screen reader table fallback */}
      <table className="sr-only">
        <caption>Статистика відповідей на проблему вагонетки</caption>
        <thead>
          <tr>
            <th scope="col">Варіант</th>
            <th scope="col">Кількість голосів</th>
            <th scope="col">Відсоток</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Не втручатися</th>
            <td>{stay}</td>
            <td>{stayPercent}%</td>
          </tr>
          <tr>
            <th scope="row">Перевести стрілку</th>
            <td>{switchCount}</td>
            <td>{switchPercent}%</td>
          </tr>
          <tr>
            <th scope="row">Всього</th>
            <td>{total}</td>
            <td>100%</td>
          </tr>
        </tbody>
      </table>

      {/* Proportional Split Bar */}
      <div>
        <div className="flex justify-between items-center text-xs font-semibold text-graphite-300 mb-2">
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            Не втручатися: {stayPercent}% ({stay})
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            Перевести стрілку: {switchPercent}% ({switchCount})
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={stayPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Співвідношення виборів"
          className="w-full h-5 sm:h-7 bg-graphite-800 rounded-full overflow-hidden flex p-0.5 border border-graphite-700"
        >
          {total === 0 ? (
            <div className="w-full h-full bg-graphite-700/50 rounded-full flex items-center justify-center text-[10px] text-graphite-400">
              Немає голосів
            </div>
          ) : (
            <>
              <div
                style={{ width: `${stayPercent}%` }}
                className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-l-full transition-all duration-700"
                title={`Не втручатися: ${stayPercent}%`}
              />
              <div
                style={{ width: `${switchPercent}%` }}
                className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-r-full transition-all duration-700"
                title={`Перевести стрілку: ${switchPercent}%`}
              />
            </>
          )}
        </div>
      </div>

      {/* Comparative Column Visualizer */}
      <div
        className={`w-full rounded-xl bg-graphite-950/70 border border-graphite-800 p-4 sm:p-6 flex flex-col justify-end ${
          large ? 'h-72 sm:h-96' : 'h-52 sm:h-64'
        }`}
      >
        <div className="w-full h-full flex items-end justify-around gap-4 sm:gap-12 pt-6">
          {/* Stay Bar */}
          <div className="flex-1 max-w-[140px] flex flex-col items-center h-full justify-end group">
            <span
              className={`font-mono font-bold text-red-400 mb-2 transition-all ${
                large ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
              }`}
            >
              {stayPercent}%
            </span>
            <div className="w-full bg-graphite-850 rounded-t-lg overflow-hidden flex flex-col justify-end h-full max-h-[80%] border border-graphite-700/60">
              <div
                style={{ height: `${Math.max(4, stayHeightPct)}%` }}
                className="w-full bg-gradient-to-t from-red-700 to-red-500 rounded-t transition-all duration-700 group-hover:brightness-110 flex items-center justify-center"
              >
                <span className="text-white text-xs font-mono font-bold px-1 select-none">
                  {stay}
                </span>
              </div>
            </div>
            <span
              className={`mt-2 font-medium text-center text-graphite-300 ${
                large ? 'text-sm sm:text-base' : 'text-xs'
              }`}
            >
              Не втручатися
            </span>
            <span className="text-[11px] text-graphite-400 font-mono">
              ({stay} голосів)
            </span>
          </div>

          {/* Switch Bar */}
          <div className="flex-1 max-w-[140px] flex flex-col items-center h-full justify-end group">
            <span
              className={`font-mono font-bold text-sky-400 mb-2 transition-all ${
                large ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
              }`}
            >
              {switchPercent}%
            </span>
            <div className="w-full bg-graphite-850 rounded-t-lg overflow-hidden flex flex-col justify-end h-full max-h-[80%] border border-graphite-700/60">
              <div
                style={{ height: `${Math.max(4, switchHeightPct)}%` }}
                className="w-full bg-gradient-to-t from-sky-600 to-sky-400 rounded-t transition-all duration-700 group-hover:brightness-110 flex items-center justify-center"
              >
                <span className="text-white text-xs font-mono font-bold px-1 select-none">
                  {switchCount}
                </span>
              </div>
            </div>
            <span
              className={`mt-2 font-medium text-center text-graphite-300 ${
                large ? 'text-sm sm:text-base' : 'text-xs'
              }`}
            >
              Перевести стрілку
            </span>
            <span className="text-[11px] text-graphite-400 font-mono">
              ({switchCount} голосів)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

