'use client';

import React, { useState } from 'react';
import { Choice, VoteStatus } from '@/lib/shared/types';
import { ETHICAL_ANALYSES } from '@/lib/shared/ethicalAnalysis';
import { RotateCcw, Brain, Scale, GitCommit, ArrowRightLeft, BookOpen, Activity } from 'lucide-react';

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
  const stayAnalysis = ETHICAL_ANALYSES['stay'];
  const switchAnalysis = ETHICAL_ANALYSES['switch'];

  // State to optionally toggle focused tab or view both side-by-side
  const [activeTab, setActiveTab] = useState<'both' | 'stay' | 'switch'>('both');

  return (
    <section
      aria-labelledby="outcome-heading"
      className="w-full px-4 sm:px-8 md:px-12 mx-auto my-6 sm:my-10 p-6 sm:p-10 md:p-12 rounded-2xl border border-obsidian/20 bg-paper shadow-xl transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]"
    >
      {/* Editorial Header Row — Pure Neutral Monopo Design */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 sm:pb-8 border-b border-obsidian/10">
        <div>
          {/* Status Badge */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-obsidian inline-block" />
            <span className="text-xs uppercase tracking-[0.2em] font-mono px-3 py-1 rounded-full font-semibold bg-obsidian/10 text-obsidian border border-obsidian/20">
              {status === 'updated'
                ? 'Голос оновлено · Минуле рішення скасовано'
                : status === 'already_voted'
                ? 'Голос уже враховано раніше'
                : 'Рішення зафіксовано'}
            </span>

            {status === 'updated' && (
              <span className="px-3 py-1 rounded-full border border-obsidian/20 text-[11px] font-mono uppercase tracking-wider text-felt-gray">
                Змінено з {previousChoice === 'stay' ? '«Не втручатися»' : '«Перевести стрілку»'}
              </span>
            )}
          </div>

          {/* Heading */}
          <h2
            id="outcome-heading"
            className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-obsidian leading-tight"
          >
            <span>Ваш вибір: </span>
            <span className="font-normal underline decoration-obsidian/30 decoration-2 underline-offset-8">
              {isStay ? 'Не втручатися' : 'Перевести стрілку'}
            </span>
          </h2>
        </div>

        {/* Refined Revote Action Button */}
        {onRevote && (
          <button
            type="button"
            data-testid="revote-button"
            onClick={onRevote}
            className="btn-ghost-pill text-xs sm:text-sm uppercase tracking-[0.18em] py-3.5 px-6 sm:px-8 flex-shrink-0 border border-obsidian/25 hover:border-obsidian text-obsidian hover:bg-obsidian hover:text-paper transition-all cursor-pointer shadow-sm hover:shadow-md self-start lg:self-center"
          >
            <RotateCcw className="w-4 h-4 mr-2.5" />
            <span>Змінити рішення / Запустити заново</span>
          </button>
        )}
      </div>

      {/* Immediate Outcome Narrative Card — Balanced & Strictly Neutral */}
      <div className="my-6 sm:my-8 p-6 sm:p-8 rounded-xl border border-obsidian/15 bg-obsidian/[0.03]">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="w-4 h-4 text-obsidian flex-shrink-0" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-mono text-felt-gray">
            [ Фактичний наслідок вашого вчинку ]
          </h3>
        </div>

        <p className="text-base sm:text-lg md:text-xl text-obsidian font-light leading-relaxed">
          {isStay ? (
            <>
              Ви вирішили не здійснювати активного фізичного втручання. Вагонетка продовжила рух основною
              колією:{' '}
              <strong className="font-semibold text-obsidian underline decoration-obsidian/40 decoration-1 underline-offset-4">
                пʼятеро людей загинули
              </strong>
              . Ви відмовилися стати безпосереднім творцем долі й не спрямували загрозу на людину, яка
              перебувала в безпеці на боковій колії.
            </>
          ) : (
            <>
              Ви взяли моральну відповідальність на себе та перевели стрілку. Вагонетка була спрямована на
              бокову колію:{' '}
              <strong className="font-semibold text-obsidian underline decoration-obsidian/40 decoration-1 underline-offset-4">
                ціною загибелі однієї людини ви врятували пʼятьох
              </strong>{' '}
              на основній колії, здійснивши усвідомлену дію заради мінімізації загальних втрат.
            </>
          )}
        </p>

        {/* Fact Summary Metrics */}
        <div className="mt-5 pt-4 border-t border-obsidian/10 flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono text-felt-gray">
          <div>
            <span className="uppercase tracking-wider">Людські втрати: </span>
            <strong className="text-obsidian font-semibold">{isStay ? '5 осіб' : '1 особа'}</strong>
          </div>
          <div>
            <span className="uppercase tracking-wider">Врятовано життів: </span>
            <strong className="text-obsidian font-semibold">{isStay ? '1 особа (бокова)' : '5 осіб (основна)'}</strong>
          </div>
          <div>
            <span className="uppercase tracking-wider">Тип відповідальності: </span>
            <strong className="text-obsidian font-semibold">{isStay ? 'Пасивне спостереження' : 'Пряме втручання'}</strong>
          </div>
        </div>
      </div>

      {/* Psychological & Ethical Comparative Deep Dive Header */}
      <div className="mt-10 sm:mt-12 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-obsidian/10">
          <div>
            <h3 className="text-lg sm:text-xl font-medium text-obsidian tracking-tight flex items-center gap-2">
              <Brain className="w-5 h-5 text-obsidian" />
              <span>Психологічний та філософський аналіз кожного вибору</span>
            </h3>
            <p className="text-xs sm:text-sm text-felt-gray mt-1">
              Як наука, когнітивна психологія (Джошуа Грін, 2001–2014) та моральна філософія пояснюють обидва рішення
            </p>
          </div>

          {/* View Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg border border-obsidian/15 bg-obsidian/[0.03] text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('both')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'both' ? 'bg-obsidian text-paper font-semibold shadow-sm' : 'text-felt-gray hover:text-obsidian'
              }`}
            >
              Обидва вибори
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stay')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'stay' ? 'bg-obsidian text-paper font-semibold shadow-sm' : 'text-felt-gray hover:text-obsidian'
              }`}
            >
              Не втручатися {isStay ? '✓' : ''}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('switch')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'switch' ? 'bg-obsidian text-paper font-semibold shadow-sm' : 'text-felt-gray hover:text-obsidian'
              }`}
            >
              Перевести стрілку {!isStay ? '✓' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Comparative Scientific & Ethical Analysis */}
      <div className={`grid gap-6 sm:gap-8 ${activeTab === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Choice 1 Analysis: Stay / Inaction / Deontology */}
        {(activeTab === 'both' || activeTab === 'stay') && (
          <div
            className={`p-6 sm:p-8 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
              isStay
                ? 'border-obsidian/30 bg-paper shadow-md ring-1 ring-obsidian/10'
                : 'border-obsidian/15 bg-obsidian/[0.02] opacity-90'
            }`}
          >
            <div>
              {/* Card Meta Badge */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.15em] font-medium text-obsidian">
                  <GitCommit className="w-3.5 h-3.5" />
                  Рішення 01 · Не втручатися
                </span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                    isStay
                      ? 'bg-obsidian text-paper font-bold'
                      : 'border border-obsidian/20 text-felt-gray'
                  }`}
                >
                  {isStay ? '● Ваш вибір' : '○ Альтернатива'}
                </span>
              </div>

              {/* Framework Title */}
              <h4 className="text-xl sm:text-2xl font-light text-obsidian mb-2">
                {stayAnalysis.frameworkName}
              </h4>
              <p className="text-xs sm:text-sm font-mono text-felt-gray mb-5 pb-3 border-b border-obsidian/10">
                {stayAnalysis.corePrinciple}
              </p>

              {/* 1. Psychological Mechanism */}
              <div className="mb-5">
                <h5 className="text-xs font-mono uppercase tracking-wider text-obsidian font-semibold mb-1.5 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-felt-gray" />
                  <span>1. Психологічний механізм: Упередження бездіяльності</span>
                </h5>
                <p className="text-xs sm:text-sm text-felt-gray leading-relaxed font-light">
                  {stayAnalysis.omissionBiasExplanation}
                </p>
                <p className="text-xs sm:text-sm text-felt-gray leading-relaxed font-light mt-2">
                  {stayAnalysis.psychologicalMechanism}
                </p>
              </div>

              {/* 2. Neurobiology */}
              <div className="mb-5">
                <h5 className="text-xs font-mono uppercase tracking-wider text-obsidian font-semibold mb-1.5 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-felt-gray" />
                  <span>2. Нейробіологія: Емоційна Система 1</span>
                </h5>
                <p className="text-xs sm:text-sm text-felt-gray leading-relaxed font-light">
                  {stayAnalysis.neurobiology}
                </p>
              </div>

              {/* 3. Ethical Argument */}
              <div className="mb-4">
                <h5 className="text-xs font-mono uppercase tracking-wider text-obsidian font-semibold mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-felt-gray" />
                  <span>3. Етична аргументація: Філіппа Фут та Іммануїл Кант</span>
                </h5>
                <p className="text-xs sm:text-sm text-felt-gray leading-relaxed font-light">
                  {stayAnalysis.detailedAnalysis}
                </p>
              </div>
            </div>

            {/* Quote Footer */}
            <div className="mt-6 pt-4 border-t border-obsidian/10 text-xs text-felt-gray italic">
              {stayAnalysis.quote}
            </div>
          </div>
        )}

        {/* Choice 2 Analysis: Switch / Action / Utilitarianism */}
        {(activeTab === 'both' || activeTab === 'switch') && (
          <div
            className={`p-6 sm:p-8 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
              !isStay
                ? 'border-obsidian/30 bg-paper shadow-md ring-1 ring-obsidian/10'
                : 'border-obsidian/15 bg-obsidian/[0.02] opacity-90'
            }`}
          >
            <div>
              {/* Card Meta Badge */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.15em] font-medium text-obsidian">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Рішення 02 · Перевести стрілку
                </span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                    !isStay
                      ? 'bg-obsidian text-paper font-bold'
                      : 'border border-obsidian/20 text-felt-gray'
                  }`}
                >
                  {!isStay ? '● Ваш вибір' : '○ Альтернатива'}
                </span>
              </div>

              {/* Framework Title */}
              <h4 className="text-xl sm:text-2xl font-light text-obsidian mb-2">
                {switchAnalysis.frameworkName}
              </h4>
              <p className="text-xs sm:text-sm font-mono text-felt-gray mb-5 pb-3 border-b border-obsidian/10">
                {switchAnalysis.corePrinciple}
              </p>

              {/* 1. Psychological Mechanism */}
              <div className="mb-5">
                <h5 className="text-xs font-mono uppercase tracking-wider text-obsidian font-semibold mb-1.5 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-felt-gray" />
                  <span>1. Психологічний механізм: Когнітивний контроль</span>
                </h5>
                <p className="text-xs sm:text-sm text-felt-gray leading-relaxed font-light">
                  {switchAnalysis.omissionBiasExplanation}
                </p>
                <p className="text-xs sm:text-sm text-felt-gray leading-relaxed font-light mt-2">
                  {switchAnalysis.psychologicalMechanism}
                </p>
              </div>

              {/* 2. Neurobiology */}
              <div className="mb-5">
                <h5 className="text-xs font-mono uppercase tracking-wider text-obsidian font-semibold mb-1.5 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-felt-gray" />
                  <span>2. Нейробіологія: Раціональна Система 2</span>
                </h5>
                <p className="text-xs sm:text-sm text-felt-gray leading-relaxed font-light">
                  {switchAnalysis.neurobiology}
                </p>
              </div>

              {/* 3. Ethical Argument */}
              <div className="mb-4">
                <h5 className="text-xs font-mono uppercase tracking-wider text-obsidian font-semibold mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-felt-gray" />
                  <span>3. Етична аргументація: Джеремі Бентам та Джон Стюарт Мілль</span>
                </h5>
                <p className="text-xs sm:text-sm text-felt-gray leading-relaxed font-light">
                  {switchAnalysis.detailedAnalysis}
                </p>
              </div>
            </div>

            {/* Quote Footer */}
            <div className="mt-6 pt-4 border-t border-obsidian/10 text-xs text-felt-gray italic">
              {switchAnalysis.quote}
            </div>
          </div>
        )}
      </div>

      {/* Footer Acknowledgement — Clean & Discarded DB Status */}
      <div className="mt-8 pt-6 border-t border-obsidian/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-felt-gray">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-obsidian inline-block" />
          <span className="text-obsidian font-medium">Дякуємо за вашу участь у дилемі!</span>
        </div>
        <div className="text-[11px] uppercase tracking-wider text-felt-gray">
          Ваше рішення анонімно зафіксовано в загальній вибірці експерименту
        </div>
      </div>
    </section>
  );
};
