'use client';

import React, { useEffect, useCallback } from 'react';
import { Choice, VoteSubmissionState, ExperimentPhase } from '@/lib/shared/types';
import { Loader2, AlertTriangle, ArrowRightLeft, ShieldAlert, Sparkles } from 'lucide-react';

interface DecisionControlsProps {
  onSelect: (choice: Choice) => void;
  submissionState: VoteSubmissionState;
  activeChoice: Choice | null;
  phase?: ExperimentPhase;
}

export const DecisionControls: React.FC<DecisionControlsProps> = ({
  onSelect,
  submissionState,
  activeChoice,
  phase = 'decision-pause',
}) => {
  const isSubmitting = submissionState === 'submitting';

  // Global hotkeys [1] / [A] for stay, [2] / [B] for switch
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (isSubmitting) return;

      if (e.key === '1' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onSelect('stay');
      } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        onSelect('switch');
      }
    },
    [isSubmitting, onSelect]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isHighlighted = phase === 'decision-pause';

  return (
    <section
      aria-labelledby="decisions-heading"
      className="w-full px-2 sm:px-4 md:px-8 mx-auto my-8 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-obsidian/10 pb-4">
        <div>
          <h2
            id="decisions-heading"
            className="text-base sm:text-lg font-medium text-obsidian tracking-tight flex items-center gap-2"
          >
            <span>Два незворотні рішення</span>
            {isHighlighted && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse">
                Ваш вибір вирішує долю
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-felt-gray mt-0.5">
            {isHighlighted
              ? "Попереду пʼятеро людей. Ви можете перевести стрілку, але тоді під загрозою опиниться одна людина."
              : 'Оберіть один із варіантів для запуску наслідку експерименту'}
          </p>
        </div>

        <span className="inline-flex items-center gap-2 text-xs font-mono text-felt-gray uppercase tracking-wider">
          <span>Гарячі клавіші:</span>
          <kbd className="px-2 py-0.5 rounded-none border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 text-[10px] font-mono font-semibold">
            1
          </kbd>
          <span>/</span>
          <kbd className="px-2 py-0.5 rounded-none border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 text-[10px] font-mono font-semibold">
            2
          </kbd>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Option 1: Stay (Не втручатися) - Crimson / Rose Palette */}
        <button
          type="button"
          data-testid="choice-stay-button"
          onClick={() => onSelect('stay')}
          disabled={isSubmitting}
          aria-pressed={activeChoice === 'stay'}
          className={`group relative text-left rounded-none border-2 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden cursor-pointer ${
            activeChoice === 'stay'
              ? 'bg-gradient-to-br from-rose-950 via-red-950 to-neutral-950 text-white border-rose-500 ring-4 ring-rose-500/30 shadow-[0_12px_40px_rgba(244,63,94,0.25)]'
              : 'bg-white dark:bg-[#161214] text-obsidian border-rose-200 dark:border-rose-900/60 hover:border-rose-500 hover:shadow-[0_10px_35px_rgba(244,63,94,0.15)]'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Top Decorative Gradient Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600" />

          <div className="p-7 sm:p-9 flex flex-col justify-between h-[calc(100%-8px)]">
            <div>
              {/* Badge & Key Indicator */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.15em] font-semibold border ${
                    activeChoice === 'stay'
                      ? 'bg-rose-900/80 text-rose-200 border-rose-600'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  Рішення 01 · Бездіяльність
                </span>

                {isSubmitting && activeChoice === 'stay' ? (
                  <Loader2 className="w-6 h-6 animate-spin text-rose-400 flex-shrink-0" />
                ) : (
                  <span
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 transition-transform group-hover:scale-110 ${
                      activeChoice === 'stay'
                        ? 'border-white bg-rose-600 text-white'
                        : 'border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-300'
                    }`}
                  >
                    1
                  </span>
                )}
              </div>

              {/* Title */}
              <h3
                className={`text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight transition-colors ${
                  activeChoice === 'stay'
                    ? 'text-white'
                    : 'text-neutral-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400'
                }`}
              >
                Не втручатися
              </h3>

              {/* Consequence Alert Pill */}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-200 border border-red-300 dark:border-red-800">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Наслідок: загине 5 людей на основній колії</span>
              </div>

              {/* Description Body */}
              <p
                className={`mt-5 text-sm sm:text-base leading-relaxed font-normal ${
                  activeChoice === 'stay'
                    ? 'text-rose-100/90'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                Дозволити вагонетці продовжити прямий рух. Під фатальним ударом залишаються{' '}
                <strong
                  className={`font-semibold ${
                    activeChoice === 'stay'
                      ? 'text-white underline decoration-rose-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  пʼятеро людей
                </strong>
                . Ви свідомо не торкаєтеся стрілки, уникаючи прямої дії та перекладання шкоди на
                іншу людину.
              </p>
            </div>

            {/* Bottom Meta & Action Call */}
            <div
              className={`mt-8 pt-4 border-t flex items-center justify-between text-xs font-mono uppercase tracking-wider ${
                activeChoice === 'stay'
                  ? 'border-rose-800 text-rose-200'
                  : 'border-rose-100 dark:border-rose-950 text-felt-gray'
              }`}
            >
              <span className="text-[11px]">Кантіанська деонтологія</span>
              <span
                className={`inline-flex items-center gap-1.5 font-bold transition-transform group-hover:translate-x-1 ${
                  activeChoice === 'stay'
                    ? 'text-white'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                Обрати [1] →
              </span>
            </div>
          </div>
        </button>

        {/* Option 2: Switch (Перевести стрілку) - Emerald / Teal Palette */}
        <button
          type="button"
          data-testid="choice-switch-button"
          onClick={() => onSelect('switch')}
          disabled={isSubmitting}
          aria-pressed={activeChoice === 'switch'}
          className={`group relative text-left rounded-none border-2 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden cursor-pointer ${
            activeChoice === 'switch'
              ? 'bg-gradient-to-br from-emerald-950 via-teal-950 to-neutral-950 text-white border-emerald-500 ring-4 ring-emerald-500/30 shadow-[0_12px_40px_rgba(16,185,129,0.25)]'
              : 'bg-white dark:bg-[#101614] text-obsidian border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-500 hover:shadow-[0_10px_35px_rgba(16,185,129,0.15)]'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Top Decorative Gradient Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

          <div className="p-7 sm:p-9 flex flex-col justify-between h-[calc(100%-8px)]">
            <div>
              {/* Badge & Key Indicator */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.15em] font-semibold border ${
                    activeChoice === 'switch'
                      ? 'bg-emerald-900/80 text-emerald-200 border-emerald-600'
                      : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-500" />
                  Рішення 02 · Переведення стрілки
                </span>

                {isSubmitting && activeChoice === 'switch' ? (
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400 flex-shrink-0" />
                ) : (
                  <span
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 transition-transform group-hover:scale-110 ${
                      activeChoice === 'switch'
                        ? 'border-white bg-emerald-600 text-white'
                        : 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    2
                  </span>
                )}
              </div>

              {/* Title */}
              <h3
                className={`text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight transition-colors ${
                  activeChoice === 'switch'
                    ? 'text-white'
                    : 'text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                }`}
              >
                Перевести стрілку
              </h3>

              {/* Consequence Alert Pill */}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Наслідок: 5 людей врятовано · 1 загине</span>
              </div>

              {/* Description Body */}
              <p
                className={`mt-5 text-sm sm:text-base leading-relaxed font-normal ${
                  activeChoice === 'switch'
                    ? 'text-emerald-100/90'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                Потягнути важіль і повернути вагонетку на бічну колію.{' '}
                <strong
                  className={`font-semibold ${
                    activeChoice === 'switch'
                      ? 'text-white underline decoration-emerald-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  Пʼятьох людей буде врятовано
                </strong>
                , проте загине одна людина. Ви берете активну моральну відповідальність заради
                мінімізації загальних людських втрат.
              </p>
            </div>

            {/* Bottom Meta & Action Call */}
            <div
              className={`mt-8 pt-4 border-t flex items-center justify-between text-xs font-mono uppercase tracking-wider ${
                activeChoice === 'switch'
                  ? 'border-emerald-800 text-emerald-200'
                  : 'border-emerald-100 dark:border-emerald-950 text-felt-gray'
              }`}
            >
              <span className="text-[11px]">Утилітаризм Бентама</span>
              <span
                className={`inline-flex items-center gap-1.5 font-bold transition-transform group-hover:translate-x-1 ${
                  activeChoice === 'switch'
                    ? 'text-white'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                Обрати [2] →
              </span>
            </div>
          </div>
        </button>
      </div>
    </section>
  );
};
