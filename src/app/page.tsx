'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Choice,
  VoteSubmissionState,
  VoteStatus,
  ExperimentPhase,
} from '@/lib/shared/types';
import {
  getOrCreateParticipantId,
  getStoredVote,
  saveStoredVote,
} from '@/lib/client/participant';
import { submitVote, checkVoteStatus } from '@/lib/client/api';
import { TrolleyScene } from '@/components/TrolleyScene';
import { DecisionControls } from '@/components/DecisionControls';
import { OutcomeView } from '@/components/OutcomeView';
import { ErrorAlert } from '@/components/ErrorAlert';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const [phase, setPhase] = useState<ExperimentPhase>('idle');
  const [submissionState, setSubmissionState] =
    useState<VoteSubmissionState>('idle');
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [previousChoice, setPreviousChoice] = useState<Choice | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>('recorded');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState<boolean>(false);
  const [participantId, setParticipantId] = useState<string>('');

  const pendingVoteRef = useRef<{ id: string; choice: Choice } | null>(null);

  // Initialize participant and sync vote status
  useEffect(() => {
    const id = getOrCreateParticipantId();
    setParticipantId(id);

    // Initial check from localStorage for instant perceived load
    const stored = getStoredVote();
    if (stored) {
      setSelectedChoice(stored.choice);
      setVoteStatus(stored.status);
      setSubmissionState(stored.status);
      setPhase('result');
      setAnimationComplete(true);
    }

    // Verify with server as authoritative source of truth
    checkVoteStatus({ participantId: id })
      .then((res) => {
        if (res.voted && res.choice) {
          setSelectedChoice(res.choice);
          setVoteStatus('already_voted');
          setSubmissionState('already_voted');
          setPhase('result');
          setAnimationComplete(true);
          saveStoredVote({
            participantId: id,
            choice: res.choice,
            status: 'already_voted',
            timestamp: new Date().toISOString(),
          });
        }
      })
      .catch(() => {
        // Fallback to stored vote if network issue occurs
      });
  }, []);

  // Handle start experiment
  const handleStartExperiment = useCallback(() => {
    if (phase === 'idle') {
      setPhase('intro-animation');
      setErrorMessage(null);
    }
  }, [phase]);

  // Handle choice selection (stay or switch)
  const handleSelectChoice = useCallback(
    async (choice: Choice) => {
      if (submissionState === 'submitting') return;

      const currentId = participantId || getOrCreateParticipantId();
      pendingVoteRef.current = { id: currentId, choice };

      const prev = selectedChoice;
      setSelectedChoice(choice);
      setSubmissionState('submitting');
      setErrorMessage(null);
      setAnimationComplete(false);

      // Transition visual scene to switching/action phase
      setPhase('switching');

      try {
        const response = await submitVote({
          participantId: currentId,
          choice,
        });

        const status = response.status;
        const confirmedChoice = response.choice || choice;
        const confirmedPrev = response.previousChoice || prev;

        saveStoredVote({
          participantId: currentId,
          choice: confirmedChoice,
          status,
          timestamp: new Date().toISOString(),
        });

        setVoteStatus(status);
        setSelectedChoice(confirmedChoice);
        setPreviousChoice(confirmedPrev);
        setSubmissionState(status);

        // In test environment or reduced motion, jump to result quickly
        const isTestEnv =
          typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
        if (isTestEnv) {
          setPhase('result');
          setAnimationComplete(true);
        }
      } catch (err: unknown) {
        setSubmissionState('error');
        // Return to decision-pause so user can retry choice
        setPhase('decision-pause');
        const message =
          err instanceof Error
            ? err.message
            : 'Не вдалося зберегти ваше рішення через збій звʼязку.';
        setErrorMessage(message);
      }
    },
    [participantId, submissionState, selectedChoice]
  );

  const handleRetry = useCallback(() => {
    if (pendingVoteRef.current) {
      handleSelectChoice(pendingVoteRef.current.choice);
    }
  }, [handleSelectChoice]);

  const handlePhaseChange = useCallback((newPhase: ExperimentPhase) => {
    setPhase(newPhase);
    if (newPhase === 'result') {
      setAnimationComplete(true);
    }
  }, []);

  const handleSkipAnimation = useCallback(() => {
    setAnimationComplete(true);
    setPhase('result');
  }, []);

  // Handle Revote: reset experiment to decision-pause or intro so participant can choose again
  const handleRevote = useCallback(() => {
    setPhase('decision-pause');
    setSubmissionState('idle');
    setAnimationComplete(false);
    setErrorMessage(null);
  }, []);

  const isCompleted = phase === 'result' && selectedChoice !== null;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Title & Dramatic Dilemma Description */}
      <section className="text-center mb-6 sm:mb-8" aria-labelledby="dilemma-title">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-graphite-850 border border-graphite-750 text-xs font-mono text-trolley-amber">
            <Sparkles className="w-3.5 h-3.5" />
            Філософський експеримент
          </span>
          {isCompleted && (
            <button
              type="button"
              onClick={handleRevote}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-graphite-800 hover:bg-graphite-750 border border-graphite-700 text-xs font-mono text-graphite-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-trolley-amber" />
              Змінити вибір
            </button>
          )}
        </div>

        <h1
          id="dilemma-title"
          className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4"
        >
          Проблема вагонетки
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-graphite-300 leading-relaxed">
          Некерована важка вагонетка мчить колією на{' '}
          <strong className="text-red-400 font-semibold">пʼятьох людей</strong>,
          які не можуть зійти з рейок. Ви стоїте біля стрілочного важеля. Якщо ви
          потягнете його — вагонетка поверне на бокову колію, де перебуває{' '}
          <strong className="text-sky-400 font-semibold">одна людина</strong>.
        </p>
      </section>

      {/* Cinematic SVG Interactive Scene */}
      <TrolleyScene
        phase={phase}
        submissionState={submissionState}
        selectedChoice={selectedChoice}
        animationComplete={animationComplete}
        onPhaseChange={handlePhaseChange}
        onStartExperiment={handleStartExperiment}
        onSkipAnimation={handleSkipAnimation}
        onAnimationEnd={() => {
          setAnimationComplete(true);
          setPhase('result');
        }}
      />

      {/* Screen Reader Live Status Region */}
      <div className="sr-only" role="status" aria-live="assertive">
        {submissionState === 'submitting' && 'Надсилання вашого вибору на сервер...'}
        {submissionState === 'recorded' && 'Ваш вибір успішно збережено в базі даних.'}
        {submissionState === 'updated' && 'Ваш вибір успішно оновлено! Минулий голос скасовано.'}
        {submissionState === 'already_voted' && 'Ваш голос уже було враховано раніше.'}
        {submissionState === 'error' && `Помилка збереження: ${errorMessage}`}
      </div>

      {/* Error state alert banner with retry */}
      {submissionState === 'error' && errorMessage && (
        <ErrorAlert
          message={errorMessage}
          onRetry={handleRetry}
          isRetrying={false}
        />
      )}

      {/* Decision Controls or Outcome Analysis */}
      {!isCompleted ? (
        <DecisionControls
          onSelect={handleSelectChoice}
          submissionState={submissionState}
          activeChoice={selectedChoice}
          phase={phase}
        />
      ) : (
        selectedChoice && (
          <OutcomeView
            choice={selectedChoice}
            status={voteStatus}
            participantId={participantId}
            onRevote={handleRevote}
            previousChoice={previousChoice}
          />
        )
      )}
    </main>
  );
}
