'use client';

import React, { useEffect, useCallback } from 'react';
import { Choice, VoteSubmissionState, ExperimentPhase } from '@/lib/shared/types';
import { Loader2, GitCommit, ArrowRightLeft } from 'lucide-react';

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
      className="w-full px-2 sm:px-4 md:px-8 mx-auto my-3 sm:my-5 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-4 border-b border-obsidian/10 pb-3">
        <div>
          <h2
            id="decisions-heading"
            className="text-sm sm:text-base font-medium text-obsidian tracking-tight flex items-center gap-2"
          >
            <span>Два незворотні рішення</span>
            {isHighlighted && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-obsidian/10 text-obsidian border border-obsidian/20 animate-pulse">
                Ваш вибір вирішує долю
              </span>
            )}
          </h2>
          <p className="text-xs text-felt-gray mt-0.5">
            {isHighlighted
              ? "Попереду пʼятеро людей. Ви можете перевести стрілку, але тоді під загрозою опиниться одна людина."
              : 'Оберіть один із варіантів для запуску наслідку експерименту'}
          </p>
        </div>

        <span className="inline-flex items-center gap-2 text-xs font-mono text-felt-gray uppercase tracking-wider">
          <span>Гарячі клавіші:</span>
          <kbd className="px-2 py-0.5 rounded-none border border-obsidian/30 text-obsidian bg-obsidian/5 text-[10px] font-mono font-semibold">
            1
          </kbd>
          <span>/</span>
          <kbd className="px-2 py-0.5 rounded-none border border-obsidian/30 text-obsidian bg-obsidian/5 text-[10px] font-mono font-semibold">
            2
          </kbd>
        </span>
      </div>

      {/* Completely Neutral, Balanced Decision Cards (Zero Color Bias) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Option 1: Stay (Не втручатися) */}
        <button
          type="button"
          data-testid="choice-stay-button"
          onClick={() => onSelect('stay')}
          disabled={isSubmitting}
          aria-pressed={activeChoice === 'stay'}
          className={`group relative text-left rounded-xl border-2 transition-all duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl ${
            activeChoice === 'stay'
              ? 'bg-obsidian text-paper border-obsidian ring-4 ring-obsidian/20'
              : 'bg-paper text-obsidian border-obsidian/20 hover:border-obsidian'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Top Neutral Decorative Border Line */}
          <div
            className={`h-1.5 w-full transition-colors ${
              activeChoice === 'stay'
                ? 'bg-paper/80'
                : 'bg-obsidian/20 group-hover:bg-obsidian'
            }`}
          />

          <div className="p-4 sm:p-7 flex flex-col justify-between h-[calc(100%-6px)]">
            <div>
              {/* Badge & Key Indicator */}
              <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.12em] sm:tracking-[0.15em] font-semibold border rounded-md ${
                    activeChoice === 'stay'
                      ? 'bg-paper/20 text-paper border-paper/40'
                      : 'bg-obsidian/5 text-obsidian border-obsidian/20'
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  Рішення 01 · Бездіяльність
                </span>

                {isSubmitting && activeChoice === 'stay' ? (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-current flex-shrink-0" />
                ) : (
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 transition-transform group-hover:scale-110 ${
                      activeChoice === 'stay'
                        ? 'border-current bg-transparent text-current'
                        : 'border-obsidian/30 bg-obsidian/5 text-obsidian'
                    }`}
                  >
                    1
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-3xl md:text-4xl font-semibold tracking-tight transition-colors">
                Не втручатися
              </h3>

              {/* Consequence Neutral Pill */}
              <div
                className={`mt-3 inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full border ${
                  activeChoice === 'stay'
                    ? 'bg-paper/10 text-paper border-paper/30'
                    : 'bg-obsidian/5 text-obsidian border-obsidian/15'
                }`}
              >
                <span>Наслідок: загине 5 людей на основній колії</span>
              </div>

              {/* Description Body */}
              <p
                className={`mt-5 text-sm sm:text-base leading-relaxed font-normal ${
                  activeChoice === 'stay'
                    ? 'text-paper/90'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                Дозволити вагонетці продовжити прямий рух. Під ударом залишаються{' '}
                <strong className="font-semibold text-current">
                  пʼятеро людей
                </strong>
                . Ви свідомо не торкаєтеся стрілки, уникаючи прямої фізичної дії та перекладання загибелі на
                іншу людину.
              </p>
            </div>

            {/* Bottom Meta & Action Call */}
            <div
              className={`mt-8 pt-4 border-t flex items-center justify-between text-xs font-mono uppercase tracking-wider ${
                activeChoice === 'stay'
                  ? 'border-paper/20 text-paper/80'
                  : 'border-obsidian/10 text-felt-gray'
              }`}
            >
              <span className="text-[11px]">Кантіанська деонтологія</span>
              <span className="inline-flex items-center gap-1.5 font-bold transition-transform group-hover:translate-x-1">
                Обрати [1] →
              </span>
            </div>
          </div>
        </button>

        {/* Option 2: Switch (Перевести стрілку) */}
        <button
          type="button"
          data-testid="choice-switch-button"
          onClick={() => onSelect('switch')}
          disabled={isSubmitting}
          aria-pressed={activeChoice === 'switch'}
          className={`group relative text-left rounded-xl border-2 transition-all duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl ${
            activeChoice === 'switch'
              ? 'bg-obsidian text-paper border-obsidian ring-4 ring-obsidian/20'
              : 'bg-paper text-obsidian border-obsidian/20 hover:border-obsidian'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Top Neutral Decorative Border Line */}
          <div
            className={`h-1.5 w-full transition-colors ${
              activeChoice === 'switch'
                ? 'bg-paper/80'
                : 'bg-obsidian/20 group-hover:bg-obsidian'
            }`}
          />

          <div className="p-4 sm:p-7 flex flex-col justify-between h-[calc(100%-6px)]">
            <div>
              {/* Badge & Key Indicator */}
              <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.12em] sm:tracking-[0.15em] font-semibold border rounded-md ${
                    activeChoice === 'switch'
                      ? 'bg-paper/20 text-paper border-paper/40'
                      : 'bg-obsidian/5 text-obsidian border-obsidian/20'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Рішення 02 · Переведення стрілки
                </span>

                {isSubmitting && activeChoice === 'switch' ? (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-current flex-shrink-0" />
                ) : (
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 transition-transform group-hover:scale-110 ${
                      activeChoice === 'switch'
                        ? 'border-current bg-transparent text-current'
                        : 'border-obsidian/30 bg-obsidian/5 text-obsidian'
                    }`}
                  >
                    2
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-3xl md:text-4xl font-semibold tracking-tight transition-colors">
                Перевести стрілку
              </h3>

              {/* Consequence Neutral Pill */}
              <div
                className={`mt-3 inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full border ${
                  activeChoice === 'switch'
                    ? 'bg-paper/10 text-paper border-paper/30'
                    : 'bg-obsidian/5 text-obsidian border-obsidian/15'
                }`}
              >
                <span>Наслідок: 5 людей врятовано · 1 загине</span>
              </div>

              {/* Description Body */}
              <p
                className={`mt-5 text-sm sm:text-base leading-relaxed font-normal ${
                  activeChoice === 'switch'
                    ? 'text-paper/90'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                Потягнути важіль і спрямувати вагонетку на бічну колію.{' '}
                <strong className="font-semibold text-current">
                  Пʼятьох людей буде врятовано
                </strong>
                , проте загине одна людина. Ви берете активну відповідальність заради
                мінімізації загальних втрат.
              </p>
            </div>

            {/* Bottom Meta & Action Call */}
            <div
              className={`mt-8 pt-4 border-t flex items-center justify-between text-xs font-mono uppercase tracking-wider ${
                activeChoice === 'switch'
                  ? 'border-paper/20 text-paper/80'
                  : 'border-obsidian/10 text-felt-gray'
              }`}
            >
              <span className="text-[11px]">Утилітаризм Бентама</span>
              <span className="inline-flex items-center gap-1.5 font-bold transition-transform group-hover:translate-x-1">
                Обрати [2] →
              </span>
            </div>
          </div>
        </button>
      </div>
    </section>
  );
};
