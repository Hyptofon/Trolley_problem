'use client';

import React from 'react';
import { Choice, VoteStatus } from '@/lib/shared/types';
import { ETHICAL_ANALYSES } from '@/lib/shared/ethicalAnalysis';
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface OutcomeViewProps {
  choice: Choice;
  status: VoteStatus;
  participantId?: string;
  onRevote?: () => void;
  previousChoice?: Choice | null;
}

export const OutcomeView: React.FC<OutcomeViewProps> = ({
  choice,
  status,
  onRevote,
  previousChoice,
}) => {
  const isStay = choice === 'stay';
  const analysis = ETHICAL_ANALYSES[choice];

  return (
    <section
      aria-labelledby="outcome-heading"
      className={`w-full px-4 sm:px-8 md:px-12 mx-auto my-8 p-6 sm:p-10 md:p-14 rounded-none border transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${
        isStay
          ? 'border-rose-500/40 bg-paper shadow-[0_0_50px_rgba(244,63,94,0.06)]'
          : 'border-emerald-500/40 bg-paper shadow-[0_0_50px_rgba(16,185,129,0.06)]'
      }`}
    >
      {/* Editorial Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-obsidian/10">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block ${
                isStay ? 'bg-rose-500 ring-4 ring-rose-500/20' : 'bg-emerald-500 ring-4 ring-emerald-500/20'
              }`}
            />
            <span
              className={`text-xs uppercase tracking-[0.2em] font-mono px-2.5 py-0.5 rounded-none font-semibold ${
                isStay
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}
            >
              {status === 'updated'
                ? 'Голос оновлено · Минуле рішення скасовано'
                : status === 'already_voted'
                ? 'Голос уже враховано раніше'
                : 'Рішення зафіксовано'}
            </span>
            {status === 'updated' && (
              <span className="px-3 py-1 rounded-[75px] border border-obsidian/20 text-[10px] uppercase font-mono tracking-wider text-obsidian">
                Змінено з {previousChoice === 'stay' ? '«Не втручатися»' : '«Перевести стрілку»'}
              </span>
            )}
          </div>

          <h2
            id="outcome-heading"
            className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-obsidian leading-[1.05]"
          >
            {isStay ? (
              <span>
                Ваш вибір:{' '}
                <span className="text-rose-600 dark:text-rose-400 font-normal">Не втручатися</span>
              </span>
            ) : (
              <span>
                Ваш вибір:{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-normal">Перевести стрілку</span>
              </span>
            )}
          </h2>
        </div>

        {/* Ghost Pill Revote Button */}
        {onRevote && (
          <button
            type="button"
            data-testid="revote-button"
            onClick={onRevote}
            className={`btn-ghost-pill text-xs uppercase tracking-[0.2em] py-3 px-8 flex-shrink-0 ${
              isStay
                ? 'hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-300'
                : 'hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-300'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            <span>Пройти ще раз / Змінити рішення</span>
          </button>
        )}
      </div>

      {/* Narrative Section with Colored Undertone */}
      <div
        className={`my-10 p-8 sm:p-10 rounded-none border ${
          isStay
            ? 'border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/10'
            : 'border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          {isStay ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
          <h3 className="text-xs uppercase tracking-[0.25em] font-mono text-felt-gray">
            [ Наслідок вашого вчинку ]
          </h3>
        </div>
        <p className="text-lg sm:text-xl md:text-2xl text-obsidian font-light leading-relaxed">
          {isStay ? (
            <>
              Ви вирішили не здійснювати активного фізичного втручання. Вагонетка продовжила рух
              основною колією.{' '}
              <strong className="text-rose-600 dark:text-rose-400 font-semibold">
                Пʼятеро людей загинули
              </strong>
              , проте ви відмовилися стати безпосереднім творцем долі й не спрямували загрозу на людину,
              яка перебувала поза первинною небезпекою.
            </>
          ) : (
            <>
              Ви взяли моральну відповідальність на себе та перевели стрілку. Загроза була спрямована на
              бокову колію.{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Ціною життя однієї людини ви врятували пʼятьох
              </strong>{' '}
              на основній колії, здійснивши усвідомлену дію заради мінімізації загальних втрат.
            </>
          )}
        </p>
      </div>

      {/* Two Column Philosophical & Psychological Deep Dive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
        {/* Ethical Framework */}
        <div
          className={`p-8 rounded-none border flex flex-col justify-between ${
            isStay
              ? 'border-rose-500/20 bg-paper'
              : 'border-emerald-500/20 bg-paper'
          }`}
        >
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-mono text-felt-gray block mb-3">
              01 · Філософська традиція: {analysis.frameworkName}
            </span>
            <h4 className="text-xl sm:text-2xl font-light text-obsidian mb-4">
              {analysis.corePrinciple}
            </h4>
            <p className="text-sm sm:text-base text-felt-gray leading-relaxed font-light">
              {analysis.detailedAnalysis}
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-obsidian/10 text-xs sm:text-sm text-felt-gray italic">
            <span>{analysis.quote}</span>
          </div>
        </div>

        {/* Psychological Insight */}
        <div
          className={`p-8 rounded-none border flex flex-col justify-between ${
            isStay
              ? 'border-rose-500/20 bg-paper'
              : 'border-emerald-500/20 bg-paper'
          }`}
        >
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-mono text-felt-gray block mb-3">
              02 · Психологічний феномен
            </span>
            <h4 className="text-xl sm:text-2xl font-light text-obsidian mb-4">
              {isStay
                ? 'Упередження бездіяльності (Omission Bias)'
                : 'Когнітивний контроль та утилітарне зважування'}
            </h4>
            <p className="text-sm sm:text-base text-felt-gray leading-relaxed font-light">
              {analysis.omissionBiasExplanation}
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-obsidian/10 flex items-center justify-between text-xs font-mono text-felt-gray uppercase tracking-wider">
            <span>Сховище: Upstash Redis</span>
            <span className="text-obsidian font-medium">Синхронізовано</span>
          </div>
        </div>
      </div>

      {/* Footer Acknowledgement */}
      <div className="pt-6 border-t border-obsidian/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-felt-gray">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              isStay ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
          />
          <span className="text-obsidian font-medium">Дякуємо за вашу участь у дилемі!</span>
        </div>
        <div className="text-[11px] uppercase tracking-wider text-felt-gray">
          Ваш голос враховано в загальній анонімній статистиці
        </div>
      </div>
    </section>
  );
};
