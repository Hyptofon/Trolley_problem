'use client';

import React from 'react';
import { Choice, VoteStatus } from '@/lib/shared/types';
import { CheckCircle2, Info, Lock } from 'lucide-react';

interface OutcomeViewProps {
  choice: Choice;
  status: VoteStatus;
  participantId: string;
}

export const OutcomeView: React.FC<OutcomeViewProps> = ({
  choice,
  status,
  participantId,
}) => {
  const isStay = choice === 'stay';

  return (
    <section
      aria-labelledby="outcome-heading"
      className="w-full max-w-4xl mx-auto my-6 p-6 sm:p-8 rounded-2xl bg-graphite-900 border border-graphite-700/80 shadow-2xl animate-fadeIn"
    >
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
            {status === 'already_voted'
              ? 'Голос уже було враховано раніше'
              : 'Рішення успішно збережено'}
          </span>
          <h2 id="outcome-heading" className="text-2xl sm:text-3xl font-extrabold text-white">
            {isStay ? 'Ваш вибір: Не втручатися' : 'Ваш вибір: Перевести стрілку'}
          </h2>
        </div>
      </div>

      <div className="p-4 sm:p-5 rounded-xl bg-graphite-850 border border-graphite-750 my-5">
        <p className="text-base sm:text-lg text-graphite-100 leading-relaxed">
          {isStay ? (
            <>
              Ви вирішили не здійснювати активного втручання. Вагонетка залишається на
              основній колії. Пʼятеро людей перебувають під загрозою, проте ви не
              стали безпосередньою причиною переведення небезпеки на іншу особу.
            </>
          ) : (
            <>
              Ви вирішили діяти активно та перевели стрілку на бокову колію.
              Загроза перенаправлена на одну людину заради збереження життя пʼяти
              осіб на основній колії.
            </>
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-t border-graphite-800 text-sm text-graphite-300">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-medium">✓</span>
          <span>Дякуємо за вашу участь у дилемі!</span>
        </div>
        <div className="text-xs text-graphite-400 flex items-center gap-1.5 font-mono">
          <Lock className="w-3.5 h-3.5 text-graphite-400" />
          <span>Маркер: {participantId.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Honest Privacy Notice */}
      <aside
        aria-label="Інформація про конфіденційність"
        className="mt-4 p-3.5 rounded-lg bg-graphite-950/70 border border-graphite-800 text-xs text-graphite-400 flex items-start gap-2.5"
      >
        <Info className="w-4 h-4 text-graphite-400 flex-shrink-0 mt-0.5" />
        <p className="leading-normal">
          <strong>Анонімність:</strong> Голосування не вимагає облікового запису та не збирає персональні дані
          чи геолокацію. Унікальність забезпечується псевдонімним маркером браузера.
          Очищення кешу чи інший пристрій створюють новий маркер.
        </p>
      </aside>
    </section>
  );
};

