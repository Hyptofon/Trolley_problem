import React from 'react';
import { Choice, VoteSubmissionState } from '../types';
import { ShieldAlert, GitFork, Loader2 } from 'lucide-react';

interface DecisionControlsProps {
  onSelect: (choice: Choice) => void;
  submissionState: VoteSubmissionState;
  activeChoice: Choice | null;
}

export const DecisionControls: React.FC<DecisionControlsProps> = ({
  onSelect,
  submissionState,
  activeChoice,
}) => {
  const isSubmitting = submissionState === 'submitting';

  return (
    <section aria-labelledby="decisions-heading" className="w-full max-w-4xl mx-auto my-6">
      <h2 id="decisions-heading" className="sr-only">
        Варіанти вибору
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Option 1: Stay */}
        <button
          type="button"
          data-testid="choice-stay-button"
          onClick={() => onSelect('stay')}
          disabled={isSubmitting}
          aria-pressed={activeChoice === 'stay'}
          className={`group relative text-left p-5 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
            activeChoice === 'stay'
              ? 'bg-graphite-850 border-red-500/80 shadow-lg shadow-red-950/40 ring-2 ring-red-500/40'
              : 'bg-graphite-900/90 hover:bg-graphite-850 border-graphite-700 hover:border-red-500/60'
          } ${
            isSubmitting
              ? 'opacity-70 cursor-not-allowed'
              : 'cursor-pointer active:scale-[0.99]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                Рішення 1
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-red-200 transition-colors">
                Не втручатися
              </h3>
            </div>
            {isSubmitting && activeChoice === 'stay' ? (
              <Loader2 className="w-6 h-6 text-red-400 animate-spin flex-shrink-0" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-graphite-800 border border-graphite-700 flex items-center justify-center text-xs font-mono text-graphite-300 group-hover:border-red-500/50">
                1
              </span>
            )}
          </div>

          <p className="mt-3 text-sm text-graphite-300 leading-relaxed">
            Дозволити вагонетці продовжити рух основною колією. Під прямою загрозою залишаються{' '}
            <strong className="text-red-400 font-semibold">пʼятеро людей</strong>. Ви не здійснюєте фізичної дії.
          </p>

          <div className="mt-4 pt-3 border-t border-graphite-800 flex items-center justify-between text-xs text-graphite-400">
            <span>Наслідок: загроза 5 людям</span>
            <span className="text-graphite-400 font-medium group-hover:text-white transition-colors">
              Обрати →
            </span>
          </div>
        </button>

        {/* Option 2: Switch */}
        <button
          type="button"
          data-testid="choice-switch-button"
          onClick={() => onSelect('switch')}
          disabled={isSubmitting}
          aria-pressed={activeChoice === 'switch'}
          className={`group relative text-left p-5 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
            activeChoice === 'switch'
              ? 'bg-graphite-850 border-sky-400/80 shadow-lg shadow-sky-950/40 ring-2 ring-sky-400/40'
              : 'bg-graphite-900/90 hover:bg-graphite-850 border-graphite-700 hover:border-sky-400/60'
          } ${
            isSubmitting
              ? 'opacity-70 cursor-not-allowed'
              : 'cursor-pointer active:scale-[0.99]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
                <GitFork className="w-4 h-4" aria-hidden="true" />
                Рішення 2
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-sky-200 transition-colors">
                Перевести стрілку
              </h3>
            </div>
            {isSubmitting && activeChoice === 'switch' ? (
              <Loader2 className="w-6 h-6 text-sky-400 animate-spin flex-shrink-0" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-graphite-800 border border-graphite-700 flex items-center justify-center text-xs font-mono text-graphite-300 group-hover:border-sky-400/50">
                2
              </span>
            )}
          </div>

          <p className="mt-3 text-sm text-graphite-300 leading-relaxed">
            Потягнути важіль і направити вагонетку на бокову колію. Під загрозою опиняється{' '}
            <strong className="text-sky-400 font-semibold">одна людина</strong>, але рятуються пʼятеро.
          </p>

          <div className="mt-4 pt-3 border-t border-graphite-800 flex items-center justify-between text-xs text-graphite-400">
            <span>Наслідок: загроза 1 людині</span>
            <span className="text-graphite-400 font-medium group-hover:text-white transition-colors">
              Обрати →
            </span>
          </div>
        </button>
      </div>
    </section>
  );
};

