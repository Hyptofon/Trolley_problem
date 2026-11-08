'use client';

import React from 'react';
import { Choice, VoteStatus } from '@/lib/shared/types';
import { ETHICAL_ANALYSES } from '@/lib/shared/ethicalAnalysis';
import { CheckCircle2, RotateCcw, Brain, Scale, Quote, Lock, Info } from 'lucide-react';

interface OutcomeViewProps {
  choice: Choice;
  status: VoteStatus;
  participantId: string;
  onRevote?: () => void;
  previousChoice?: Choice | null;
}

export const OutcomeView: React.FC<OutcomeViewProps> = ({
  choice,
  status,
  participantId,
  onRevote,
  previousChoice,
}) => {
  const isStay = choice === 'stay';
  const analysis = ETHICAL_ANALYSES[choice];

  return (
    <section
      aria-labelledby="outcome-heading"
      className="w-full max-w-4xl mx-auto my-6 p-6 sm:p-8 rounded-3xl bg-graphite-900 border border-graphite-750 shadow-2xl animate-fadeIn transition-all"
    >
      {/* Top Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-graphite-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                {status === 'updated'
                  ? 'Голос оновлено (минуле рішення скасовано)'
                  : status === 'already_voted'
                  ? 'Голос уже було враховано раніше'
                  : 'Рішення зафіксовано'}
              </span>
              {status === 'updated' && (
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-[10px] font-mono text-sky-400">
                  Змінено з {previousChoice === 'stay' ? '«Не втручатися»' : '«Перевести стрілку»'}
                </span>
              )}
            </div>
            <h2 id="outcome-heading" className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
              {isStay ? 'Ваш вибір: Не втручатися' : 'Ваш вибір: Перевести стрілку'}
            </h2>
          </div>
        </div>

        {/* Revote Button */}
        {onRevote && (
          <button
            type="button"
            data-testid="revote-button"
            onClick={onRevote}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-graphite-800 hover:bg-graphite-750 text-graphite-200 hover:text-white border border-graphite-600 font-semibold text-sm transition-all shadow-sm active:scale-95 flex-shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Пройти ще раз / Змінити рішення</span>
          </button>
        )}
      </div>

      {/* Narrative Consequence */}
      <div className="my-6 p-5 sm:p-6 rounded-2xl bg-graphite-850/80 border border-graphite-750">
        <h3 className="text-xs uppercase tracking-wider font-mono text-graphite-400 mb-2 flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-trolley-amber" />
          Наслідок вашого вчинку
        </h3>
        <p className="text-base sm:text-lg text-graphite-100 leading-relaxed">
          {isStay ? (
            <>
              Ви вирішили не здійснювати активного фізичного втручання. Вагонетка продовжила рух
              основною колією. Пʼятеро людей загинули, проте ви відмовилися стати
              безпосереднім творцем долі й не спрямували загрозу на людину, яка перебувала поза небезпекою.
            </>
          ) : (
            <>
              Ви взяли відповідальність на себе та перевели стрілку. Загроза була спрямована
              на бокову колію. Ціною життя однієї людини ви зберегли пʼятьох на основній колії,
              здійснивши активну дію заради мінімізації загальних втрат.
            </>
          )}
        </p>
      </div>

      {/* Philosophical & Psychological Deep Dive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
        {/* Ethical Framework */}
        <div className="p-5 rounded-2xl bg-graphite-950/60 border border-graphite-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
              <Scale className="w-4 h-4" />
              Етична традиція: {analysis.frameworkName}
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              {analysis.corePrinciple}
            </h4>
            <p className="text-sm text-graphite-300 leading-relaxed">
              {analysis.detailedAnalysis}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-graphite-800/80 text-xs text-graphite-400 italic flex items-start gap-2">
            <Quote className="w-4 h-4 text-amber-500/60 flex-shrink-0 mt-0.5" />
            <span>{analysis.quote}</span>
          </div>
        </div>

        {/* Psychological Insight (Omission Bias) */}
        <div className="p-5 rounded-2xl bg-graphite-950/60 border border-graphite-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-2">
              <Brain className="w-4 h-4" />
              Психологічний феномен
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              {isStay
                ? 'Упередження бездіяльності (Omission Bias)'
                : 'Когнітивний контроль та утилітарне зважування'}
            </h4>
            <p className="text-sm text-graphite-300 leading-relaxed">
              {analysis.omissionBiasExplanation}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-graphite-800/80 flex items-center justify-between text-xs text-graphite-400 font-mono">
            <span>Джерело даних: Upstash Redis</span>
            <span className="text-emerald-400">Синхронізовано</span>
          </div>
        </div>
      </div>

      {/* Footer Meta & Privacy Notice */}
      <div className="pt-4 border-t border-graphite-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-graphite-400">
        <div className="flex items-center gap-2 text-graphite-300">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>Дякуємо за вашу участь у дилемі!</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-graphite-400">
          <Lock className="w-3.5 h-3.5" />
          <span>Псевдонімний маркер: {participantId.slice(0, 8)}...</span>
        </div>
      </div>

      <aside
        aria-label="Інформація про конфіденційність"
        className="mt-4 p-3 rounded-xl bg-graphite-950/40 border border-graphite-800/60 text-xs text-graphite-400 flex items-start gap-2.5"
      >
        <Info className="w-4 h-4 text-graphite-400 flex-shrink-0 mt-0.5" />
        <p className="leading-normal">
          <strong>Анонімність та повторне голосування:</strong> Ви можете змінити своє рішення в будь-який момент.
          При зміні вибору лічильник попереднього рішення автоматично зменшується на 1, а нового — збільшується на 1.
          Жодних персональних даних не збирається.
        </p>
      </aside>
    </section>
  );
};
