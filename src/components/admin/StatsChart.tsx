'use client';

import React from 'react';
import { AdminStatsResponse } from '@/lib/shared/types';

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
    <div className="w-full space-y-8">
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
        <div className="flex justify-between items-center text-xs font-mono uppercase tracking-[0.15em] text-felt-gray mb-3">
          <span className="flex items-center gap-2 text-obsidian">
            <span className="w-2.5 h-2.5 bg-obsidian inline-block" />
            Не втручатися: {stayPercent}% ({stay})
          </span>
          <span className="flex items-center gap-2 text-obsidian">
            Перевести стрілку: {switchPercent}% ({switchCount})
            <span className="w-2.5 h-2.5 border border-obsidian bg-paper inline-block" />
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={stayPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Співвідношення виборів"
          className="w-full h-6 sm:h-8 rounded-[75px] overflow-hidden flex border border-obsidian bg-paper p-0.5"
        >
          {total === 0 ? (
            <div className="w-full h-full rounded-[75px] flex items-center justify-center text-[10px] uppercase font-mono tracking-widest text-felt-gray">
              Немає голосів
            </div>
          ) : (
            <>
              <div
                style={{ width: `${stayPercent}%` }}
                className="h-full bg-obsidian rounded-l-[75px] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]"
                title={`Не втручатися: ${stayPercent}%`}
              />
              <div
                style={{ width: `${switchPercent}%` }}
                className="h-full bg-ash-mist/30 rounded-r-[75px] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]"
                title={`Перевести стрілку: ${switchPercent}%`}
              />
            </>
          )}
        </div>
      </div>

      {/* Comparative Column Visualizer */}
      <div
        className={`w-full rounded-none border border-obsidian/10 bg-obsidian/[0.02] p-6 sm:p-10 flex flex-col justify-end ${
          large ? 'h-80 sm:h-[420px]' : 'h-60 sm:h-72'
        }`}
      >
        <div className="w-full h-full flex items-end justify-around gap-6 sm:gap-16 pt-8">
          {/* Stay Bar */}
          <div className="flex-1 max-w-[160px] flex flex-col items-center h-full justify-end group">
            <span
              className={`font-mono font-light text-obsidian mb-3 transition-all ${
                large ? 'text-3xl sm:text-5xl' : 'text-xl sm:text-3xl'
              }`}
            >
              {stayPercent}%
            </span>
            <div className="w-full bg-paper rounded-none overflow-hidden flex flex-col justify-end h-full max-h-[75%] border border-obsidian">
              <div
                style={{ height: `${Math.max(4, stayHeightPct)}%` }}
                className="w-full bg-obsidian rounded-none transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex items-center justify-center"
              >
                <span className="text-paper text-xs font-mono font-medium px-1 select-none">
                  {stay}
                </span>
              </div>
            </div>
            <span
              className={`mt-4 font-light text-center text-obsidian ${
                large ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
              }`}
            >
              Не втручатися
            </span>
            <span className="text-[11px] text-felt-gray font-mono mt-0.5">
              ({stay} голосів)
            </span>
          </div>

          {/* Switch Bar */}
          <div className="flex-1 max-w-[160px] flex flex-col items-center h-full justify-end group">
            <span
              className={`font-mono font-light text-obsidian mb-3 transition-all ${
                large ? 'text-3xl sm:text-5xl' : 'text-xl sm:text-3xl'
              }`}
            >
              {switchPercent}%
            </span>
            <div className="w-full bg-paper rounded-none overflow-hidden flex flex-col justify-end h-full max-h-[75%] border border-obsidian">
              <div
                style={{ height: `${Math.max(4, switchHeightPct)}%` }}
                className="w-full bg-ash-mist/40 rounded-none transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex items-center justify-center border-t border-obsidian"
              >
                <span className="text-obsidian text-xs font-mono font-medium px-1 select-none">
                  {switchCount}
                </span>
              </div>
            </div>
            <span
              className={`mt-4 font-light text-center text-obsidian ${
                large ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
              }`}
            >
              Перевести стрілку
            </span>
            <span className="text-[11px] text-felt-gray font-mono mt-0.5">
              ({switchCount} голосів)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
