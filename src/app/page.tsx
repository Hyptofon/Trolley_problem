'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Choice, VoteSubmissionState, VoteStatus } from '@/lib/shared/types';
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
import { Info } from 'lucide-react';

export default function HomePage() {
  const [submissionState, setSubmissionState] =
    useState<VoteSubmissionState>('idle');
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>('recorded');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState<boolean>(false);
  const [participantId, setParticipantId] = useState<string>('');

  const pendingVoteRef = useRef<{ id: string; choice: Choice } | null>(null);

  useEffect(() => {
    const id = getOrCreateParticipantId();
    setParticipantId(id);

    // Initial check from localStorage for fast perceived rendering
    const stored = getStoredVote();
    if (stored) {
      setSelectedChoice(stored.choice);
      setVoteStatus(stored.status);
      setSubmissionState(stored.status);
      setAnimationComplete(true);
    }

    // Verify with server as source of truth
    checkVoteStatus({ participantId: id })
      .then((res) => {
        if (res.voted && res.choice) {
          setSelectedChoice(res.choice);
          setVoteStatus('already_voted');
          setSubmissionState('already_voted');
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
        // If server check fails, fallback to stored vote
      });
  }, []);

  const handleSelectChoice = useCallback(
    async (choice: Choice) => {
      if (submissionState === 'submitting') return;

      const currentId = participantId || getOrCreateParticipantId();
      pendingVoteRef.current = { id: currentId, choice };

      setSelectedChoice(choice);
      setSubmissionState('submitting');
      setErrorMessage(null);
      setAnimationComplete(false);

      try {
        const response = await submitVote({
          participantId: currentId,
          choice,
        });

        const status = response.status;
        const confirmedChoice = response.choice || choice;

        saveStoredVote({
          participantId: currentId,
          choice: confirmedChoice,
          status,
          timestamp: new Date().toISOString(),
        });

        setVoteStatus(status);
        setSelectedChoice(confirmedChoice);
        setSubmissionState(status);
      } catch (err: unknown) {
        setSubmissionState('error');
        const message =
          err instanceof Error
            ? err.message
            : 'Не вдалося зберегти ваше рішення через збій звʼязку.';
        setErrorMessage(message);
      }
    },
    [participantId, submissionState]
  );

  const handleRetry = useCallback(() => {
    if (pendingVoteRef.current) {
      handleSelectChoice(pendingVoteRef.current.choice);
    }
  }, [handleSelectChoice]);

  const handleAnimationEnd = useCallback(() => {
    setAnimationComplete(true);
  }, []);

  const handleSkipAnimation = useCallback(() => {
    setAnimationComplete(true);
  }, []);

  const isCompleted =
    submissionState === 'recorded' || submissionState === 'already_voted';

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Title & Dilemma Statement */}
      <section className="text-center mb-6 sm:mb-8" aria-labelledby="dilemma-title">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-graphite-850 border border-graphite-700 text-xs font-mono text-trolley-amber mb-3">
          <Info className="w-3.5 h-3.5" />
          Класична дилема
        </span>
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

      {/* SVG Interactive Scene */}
      <TrolleyScene
        submissionState={submissionState}
        selectedChoice={selectedChoice}
        animationComplete={animationComplete}
        onAnimationEnd={handleAnimationEnd}
        onSkipAnimation={handleSkipAnimation}
      />

      {/* Status Live Notification for Screen Readers */}
      <div className="sr-only" role="status" aria-live="assertive">
        {submissionState === 'submitting' && 'Надсилання вашого вибору на сервер...'}
        {submissionState === 'recorded' && 'Ваш вибір успішно збережено.'}
        {submissionState === 'already_voted' && 'Ваш голос уже було враховано раніше.'}
        {submissionState === 'error' && `Помилка збереження: ${errorMessage}`}
      </div>

      {/* Error state with retry */}
      {submissionState === 'error' && errorMessage && (
        <ErrorAlert
          message={errorMessage}
          onRetry={handleRetry}
          isRetrying={false}
        />
      )}

      {/* Controls or Outcome */}
      {!isCompleted ? (
        <DecisionControls
          onSelect={handleSelectChoice}
          submissionState={submissionState}
          activeChoice={selectedChoice}
        />
      ) : (
        selectedChoice && (
          <OutcomeView
            choice={selectedChoice}
            status={voteStatus}
            participantId={participantId}
          />
        )
      )}
    </main>
  );
}
