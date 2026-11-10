'use client';

import React from 'react';
import { AdminStatsResponse } from '@/lib/shared/types';
import { GitCommit, ArrowRightLeft, TrendingUp, Users, Compass } from 'lucide-react';

interface StatsChartProps {
  stats: AdminStatsResponse;
  large?: boolean;
  slideMode?: 'dark' | 'light';
}

function formatVotesWord(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'голосів';
  if (mod10 === 1) return 'голос';
  if (mod10 >= 2 && mod10 <= 4) return 'голоси';
  return 'голосів';
}

export const StatsChart: React.FC<StatsChartProps> = ({
  stats,
  large = false,
  slideMode,
}) => {
  const { total, stay, switch: switchCount, stayPercent, switchPercent } = stats;

  // Donut geometry
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const gapPx = total > 0 && stay > 0 && switchCount > 0 ? 3 : 0;

  const stayArcRaw = (stayPercent / 100) * circumference;
  const switchArcRaw = (switchPercent / 100) * circumference;
  const stayArc = Math.max(0, stayArcRaw - gapPx);
  const switchArc = Math.max(0, switchArcRaw - gapPx);
  const switchOffset = -stayArcRaw;

  // Presenter metrics
  const diffPct = Math.abs(switchPercent - stayPercent);
  const majorityLabel =
    total === 0
      ? 'Очікування голосів'
      : stay === switchCount
      ? 'Паритет 50% / 50%'
      : switchCount > stay
      ? `Утилітаризм попереду (+${diffPct}%)`
      : `Деонтологія попереду (+${diffPct}%)`;

  const majorityDesc =
    total === 0
      ? 'Дані оновляться одразу після першої відповіді.'
      : stay === switchCount
      ? 'Аудиторія розділилася рівно навпіл між дією та бездіяльністю.'
      : switchCount > stay
      ? `${switchCount} з ${total} учасників взяли активну відповідальність, перевівши стрілку.`
      : `${stay} з ${total} учасників відмовилися втручатися, уникаючи прямої дії.`;

  const cumulativeSaved = stay * 1 + switchCount * 5;
  const cumulativeLost = stay * 5 + switchCount * 1;

  // Isolate Presentation slide colors from global site theme, or follow app CSS tokens when slideMode is omitted
  const isDarkSlide = slideMode === 'dark';
  const isLightSlide = slideMode === 'light';

  const cardBg = isDarkSlide
    ? 'bg-[#131722] border-white/15 text-slate-100'
    : isLightSlide
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-paper border-obsidian/15 text-obsidian';

  const subCardBg = isDarkSlide
    ? 'bg-white/[0.03] border-white/10 text-slate-100'
    : isLightSlide
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-obsidian/[0.02] border-obsidian/10 text-obsidian';

  const badgeBg = isDarkSlide
    ? 'bg-[#0B0D12] text-slate-200'
    : isLightSlide
    ? 'bg-white text-slate-900'
    : 'bg-paper text-obsidian';

  const mutedText = isDarkSlide
    ? 'text-slate-300'
    : isLightSlide
    ? 'text-slate-600'
    : 'text-felt-gray';

  const borderHairline = isDarkSlide
    ? 'border-white/10'
    : isLightSlide
    ? 'border-slate-200'
    : 'border-obsidian/10';

  const baselineBorder = isDarkSlide
    ? 'border-white/30'
    : isLightSlide
    ? 'border-slate-400'
    : 'border-obsidian/30';

  const majorityLineColor = isDarkSlide
    ? 'border-white/25'
    : isLightSlide
    ? 'border-slate-300'
    : 'border-obsidian/25';

  const progressTrackBg = isDarkSlide
    ? 'bg-[#0B0D12]'
    : isLightSlide
    ? 'bg-slate-200/70'
    : 'bg-obsidian/[0.04]';

  const tickColor = isDarkSlide
    ? 'bg-white/30'
    : isLightSlide
    ? 'bg-slate-400'
    : 'bg-obsidian/30';

  const zeroBarBg = isDarkSlide
    ? 'bg-white/15'
    : isLightSlide
    ? 'bg-slate-300'
    : 'bg-obsidian/15';

  const legendItemBg = isDarkSlide
    ? 'bg-white/[0.02]'
    : isLightSlide
    ? 'bg-slate-50'
    : 'bg-obsidian/[0.02]';

  const trackStroke = isDarkSlide ? 'rgba(255,255,255,0.08)' : 'rgba(128,128,128,0.16)';

  const yTicks = [100, 75, 50, 25, 0];

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* Screen reader table fallback wrapped in div.sr-only so display:table cannot expand scrollWidth on mobile */}
      <div className="sr-only">
        <table>
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
              <th scope="row">Не втручатися (Деонтологія)</th>
              <td>{stay}</td>
              <td>{stayPercent}%</td>
            </tr>
            <tr>
              <th scope="row">Перевести стрілку (Утилітаризм)</th>
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
      </div>

      {/* 1. Unified 100% Proportional Balance Strip */}
      <div className={`p-4 sm:p-5 rounded-xl border ${subCardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="w-3 h-3 rounded-sm bg-[#2563EB] inline-block flex-shrink-0" />
            <span>Не втручатися</span>
            <span className={`font-mono text-xs ${mutedText}`}>
              ({stay} {formatVotesWord(stay)} · {stayPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium sm:justify-end">
            <span className={`font-mono text-xs ${mutedText} order-2 sm:order-1`}>
              ({switchCount} {formatVotesWord(switchCount)} · {switchPercent}%)
            </span>
            <span className="order-1 sm:order-2">Перевести стрілку</span>
            <span className="w-3 h-3 rounded-sm bg-[#F59E0B] inline-block flex-shrink-0 order-3" />
          </div>
        </div>

        <div className="relative">
          <div
            role="progressbar"
            aria-valuenow={stayPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Співвідношення виборів"
            className={`w-full ${
              large ? 'h-10 sm:h-11' : 'h-9 sm:h-11'
            } rounded-xl overflow-hidden flex border ${borderHairline} ${progressTrackBg} p-1 gap-1`}
          >
            {total === 0 ? (
              <div
                className={`w-full h-full rounded-lg flex items-center justify-center text-xs font-mono uppercase tracking-widest ${mutedText}`}
              >
                Очікування перших голосів
              </div>
            ) : (
              <>
                {stayPercent > 0 && (
                  <div
                    style={{ width: `${stayPercent}%` }}
                    className="h-full bg-[#2563EB] text-white rounded-lg transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex items-center justify-center overflow-hidden shadow-sm"
                    title={`Не втручатися: ${stayPercent}% (${stay})`}
                  >
                    {stayPercent >= 10 && (
                      <span className="font-mono font-bold text-xs sm:text-sm px-2 whitespace-nowrap">
                        {stayPercent}%
                      </span>
                    )}
                  </div>
                )}

                {switchPercent > 0 && (
                  <div
                    style={{ width: `${switchPercent}%` }}
                    className="h-full bg-[#F59E0B] text-slate-950 rounded-lg transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex items-center justify-center overflow-hidden shadow-sm"
                    title={`Перевести стрілку: ${switchPercent}% (${switchCount})`}
                  >
                    {switchPercent >= 10 && (
                      <span className="font-mono font-bold text-xs sm:text-sm px-2 whitespace-nowrap">
                        {switchPercent}%
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 50% Center Reference Marker */}
          <div className="flex justify-center items-center mt-1.5">
            <div className="flex flex-col items-center">
              <div className={`w-px h-2 ${tickColor}`} />
              <span className={`text-[10px] font-mono uppercase tracking-widest ${mutedText}`}>
                50% (межа більшості)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Complementary Charts Grid: Donut Share Chart + Honest 0-100% Column Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Panel: SVG Donut Ring Chart */}
        <div
          className={`lg:col-span-5 p-4 sm:p-6 rounded-xl border flex flex-col justify-between ${cardBg}`}
        >
          <div className={`pb-3 border-b ${borderHairline} mb-4`}>
            <h3 className="text-sm sm:text-base font-medium tracking-tight">
              Кругова структура вибору
            </h3>
            <p className={`text-xs mt-0.5 ${mutedText}`}>
              Частка кожної філософської позиції від 100%
            </p>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-1">
            {/* Donut SVG */}
            <div
              className={`relative flex items-center justify-center ${
                large ? 'w-44 h-44 sm:w-48 sm:h-48' : 'w-44 h-44 sm:w-52 sm:h-52'
              }`}
            >
              <svg
                viewBox="0 0 220 220"
                className="w-full h-full overflow-visible"
                aria-hidden="true"
              >
                {/* Background Ring */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke={trackStroke}
                  strokeWidth="26"
                />

                {/* Stay Segment (Blue) */}
                {total > 0 && stay > 0 && (
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="26"
                    strokeDasharray={`${stayArc} ${circumference}`}
                    strokeDashoffset={0}
                    transform="rotate(-90 110 110)"
                    className="transition-all duration-700 ease-out"
                  />
                )}

                {/* Switch Segment (Amber) */}
                {total > 0 && switchCount > 0 && (
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="26"
                    strokeDasharray={`${switchArc} ${circumference}`}
                    strokeDashoffset={switchOffset}
                    transform="rotate(-90 110 110)"
                    className="transition-all duration-700 ease-out"
                  />
                )}
              </svg>

              {/* Center Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${mutedText}`}>
                  Усього
                </span>
                <span
                  className={`font-mono font-semibold leading-none my-1 ${
                    large ? 'text-3xl sm:text-4xl' : 'text-3xl sm:text-4xl'
                  }`}
                >
                  {total}
                </span>
                <span className={`text-[11px] font-mono ${mutedText}`}>
                  {formatVotesWord(total)}
                </span>
              </div>
            </div>

            {/* Crisp Legend Rows */}
            <div className="w-full grid grid-cols-1 gap-2 mt-4">
              <div
                className={`flex items-center justify-between p-2.5 rounded-lg border ${borderHairline} ${legendItemBg}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#2563EB] flex-shrink-0" />
                  <div>
                    <div className="text-xs sm:text-sm font-medium leading-tight">
                      Не втручатися
                    </div>
                    <div className={`text-[10px] font-mono ${mutedText}`}>
                      Деонтологія · 5 втрат
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm sm:text-base font-semibold">{stayPercent}%</div>
                  <div className={`text-[10px] ${mutedText}`}>{stay} гол.</div>
                </div>
              </div>

              <div
                className={`flex items-center justify-between p-2.5 rounded-lg border ${borderHairline} ${legendItemBg}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#F59E0B] flex-shrink-0" />
                  <div>
                    <div className="text-xs sm:text-sm font-medium leading-tight">
                      Перевести стрілку
                    </div>
                    <div className={`text-[10px] font-mono ${mutedText}`}>
                      Утилітаризм · 1 втрата
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm sm:text-base font-semibold">{switchPercent}%</div>
                  <div className={`text-[10px] ${mutedText}`}>{switchCount} гол.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Honest 0-100% Axis Column Chart */}
        <div
          className={`lg:col-span-7 p-4 sm:p-6 rounded-xl border flex flex-col justify-between ${cardBg}`}
        >
          <div className={`pb-3 border-b ${borderHairline} mb-4 flex items-center justify-between gap-2`}>
            <div>
              <h3 className="text-sm sm:text-base font-medium tracking-tight">
                Порівняльна діаграма (шкала 0% – 100%)
              </h3>
              <p className={`text-xs mt-0.5 ${mutedText}`}>
                Реальне співвідношення висоти стовпців без спотворення масштабу
              </p>
            </div>
            <span
              className={`hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded border ${borderHairline} ${mutedText}`}
            >
              Лінія 50% = більшість
            </span>
          </div>

          {/* Plot Canvas with Gridlines */}
          <div className="relative flex-1 flex flex-col justify-end pt-6">
            <div
              className={`relative w-full ${
                large ? 'h-52 sm:h-60' : 'h-56 sm:h-64'
              } flex items-end pl-10 sm:pl-12 pr-2 sm:pr-6`}
            >
              {/* Horizontal Gridlines & Y-Axis Ticks */}
              <div className="absolute inset-0 pl-10 sm:pl-12 pointer-events-none flex flex-col justify-between">
                {yTicks.map((tick) => (
                  <div key={tick} className="relative w-full flex items-center">
                    <span
                      className={`absolute -left-10 sm:-left-12 w-8 sm:w-10 text-right text-[10px] sm:text-xs font-mono ${mutedText}`}
                    >
                      {tick}%
                    </span>
                    <div
                      className={`w-full border-b ${
                        tick === 0
                          ? baselineBorder
                          : tick === 50
                          ? `border-dashed ${majorityLineColor}`
                          : `border-dashed ${borderHairline}`
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Two Columns Centered in Plot */}
              <div className="relative z-10 w-full h-full flex items-end justify-around gap-4 sm:gap-12">
                {/* Column 1: Stay */}
                <div className="flex-1 max-w-[170px] h-full flex flex-col items-center justify-end">
                  {/* Floating Data Callout Above Column */}
                  <div className="mb-2 text-center">
                    <div
                      className={`font-mono font-bold leading-none ${
                        large ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                      }`}
                    >
                      {stayPercent}%
                    </div>
                    <div
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-mono border ${borderHairline} ${badgeBg}`}
                    >
                      {stay} {formatVotesWord(stay)}
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    style={{
                      height: `${stayPercent}%`,
                      minHeight: stay > 0 ? '8px' : '2px',
                    }}
                    className={`w-full max-w-[110px] rounded-t-xl transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] shadow-md ${
                      stay > 0 ? 'bg-[#2563EB]' : zeroBarBg
                    }`}
                  />
                </div>

                {/* Column 2: Switch */}
                <div className="flex-1 max-w-[170px] h-full flex flex-col items-center justify-end">
                  {/* Floating Data Callout Above Column */}
                  <div className="mb-2 text-center">
                    <div
                      className={`font-mono font-bold leading-none ${
                        large ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                      }`}
                    >
                      {switchPercent}%
                    </div>
                    <div
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-mono border ${borderHairline} ${badgeBg}`}
                    >
                      {switchCount} {formatVotesWord(switchCount)}
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    style={{
                      height: `${switchPercent}%`,
                      minHeight: switchCount > 0 ? '8px' : '2px',
                    }}
                    className={`w-full max-w-[110px] rounded-t-xl transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] shadow-md ${
                      switchCount > 0 ? 'bg-[#F59E0B]' : zeroBarBg
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* X-Axis Category Labels Below Baseline */}
            <div className="pl-10 sm:pl-12 pr-2 sm:pr-6 pt-3 flex justify-around gap-4 sm:gap-12">
              <div className="flex-1 max-w-[170px] text-center">
                <div className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold">
                  <GitCommit className="w-3.5 h-3.5 text-[#3B82F6] flex-shrink-0" />
                  <span>Не втручатися</span>
                </div>
                <div className={`text-[10px] sm:text-[11px] font-mono mt-0.5 ${mutedText}`}>
                  Деонтологія · пасивність
                </div>
              </div>

              <div className="flex-1 max-w-[170px] text-center">
                <div className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#D97706] flex-shrink-0" />
                  <span>Перевести стрілку</span>
                </div>
                <div className={`text-[10px] sm:text-[11px] font-mono mt-0.5 ${mutedText}`}>
                  Утилітаризм · активна дія
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Presenter Insights & Key Discussion Points */}
      {total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 sm:p-5 rounded-xl border ${subCardBg}`}>
            <div className={`flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider mb-1.5 ${mutedText}`}>
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Домінуюча позиція</span>
            </div>
            <div className="text-sm sm:text-base font-semibold">{majorityLabel}</div>
            <p className={`text-xs mt-1 leading-relaxed ${mutedText}`}>{majorityDesc}</p>
          </div>

          <div className={`p-4 sm:p-5 rounded-xl border ${subCardBg}`}>
            <div className={`flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider mb-1.5 ${mutedText}`}>
              <Users className="w-3.5 h-3.5" />
              <span>Сумарний наслідок рішень</span>
            </div>
            <div className="text-sm sm:text-base font-semibold">
              {cumulativeSaved} врятовано · {cumulativeLost} втрат
            </div>
            <p className={`text-xs mt-1 leading-relaxed ${mutedText}`}>
              Якщо підсумувати кожен сценарій учасників (переведення рятує 5 і забирає 1, бездіяльність — навпаки).
            </p>
          </div>

          <div className={`p-4 sm:p-5 rounded-xl border ${subCardBg}`}>
            <div className={`flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider mb-1.5 ${mutedText}`}>
              <Compass className="w-3.5 h-3.5" />
              <span>Порівняння з дослідженнями</span>
            </div>
            <div className="text-sm sm:text-base font-semibold">
              У світі: ~80–90% за переведення
            </div>
            <p className={`text-xs mt-1 leading-relaxed ${mutedText}`}>
              У класичній версії з важелем більшість зазвичай тисне важіль (Hauser et al.; Moral Machine). Ваша група: {switchPercent}%.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
