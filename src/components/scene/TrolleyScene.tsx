'use client';

import React, { useId, useEffect, useState, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin';
import { Choice, ExperimentPhase, VoteSubmissionState } from '@/lib/shared/types';
import { useTheme } from '../ThemeProvider';
import { useSound } from '../SoundProvider';
import { RailwayTracks } from './RailwayTracks';
import { SwitchOperator } from './SwitchOperator';
import { TrackCharacters } from './TrackCharacters';
import { TrolleyVehicle } from './TrolleyVehicle';
import { SCENE_CONFIG } from './nealAssets';
import { Play, AlertTriangle } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(MotionPathPlugin);
}

export interface TrolleySceneProps {
  phase?: ExperimentPhase;
  submissionState?: VoteSubmissionState;
  selectedChoice: Choice | null;
  animationComplete?: boolean;
  onPhaseChange?: (phase: ExperimentPhase) => void;
  onStartExperiment?: () => void;
  onAnimationEnd?: () => void;
  reducedMotion?: boolean;
}

export const TrolleyScene: React.FC<TrolleySceneProps> = ({
  phase: explicitPhase,
  submissionState,
  selectedChoice,
  animationComplete = false,
  onPhaseChange,
  onStartExperiment,
  onAnimationEnd,
  reducedMotion = false,
}) => {
  const filterId = useId();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    playImpact,
    playLeverPull,
    startTicking,
    stopTicking,
    startAmbientMusic,
  } = useSound();

  // Derive current effective phase
  const currentPhase: ExperimentPhase = useMemo(() => {
    if (explicitPhase) return explicitPhase;
    if (
      submissionState === 'recorded' ||
      submissionState === 'already_voted' ||
      submissionState === 'updated'
    ) {
      return animationComplete ? 'result' : 'outcome-animation';
    }
    if (submissionState === 'submitting') {
      return 'switching';
    }
    return 'idle';
  }, [explicitPhase, submissionState, animationComplete]);

  // Track collision impact and screen vibration
  const [hasImpacted, setHasImpacted] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Precise sub-pixel coordinates for Trolley
  const [trolleyPos, setTrolleyPos] = useState<{ x: number; y: number; angle: number }>({
    x: SCENE_CONFIG.trolleyPositions.idle.x,
    y: SCENE_CONFIG.trolleyPositions.idle.y,
    angle: 0,
  });

  // Track active animation tween to allow clean cancellation
  const activeTweenRef = useRef<gsap.core.Tween | null>(null);

  // Manage continuous ticking sound lifecycle:
  // Active constantly during intro approach and decision pause to create a tense scene,
  // and stops as soon as a choice is made (switching / outcome / result / idle).
  useEffect(() => {
    if (currentPhase === 'intro-animation' || currentPhase === 'decision-pause') {
      startAmbientMusic();
      startTicking();
    } else {
      stopTicking();
    }

    return () => {
      if (currentPhase === 'intro-animation' || currentPhase === 'decision-pause') {
        stopTicking();
      }
    };
  }, [currentPhase, startAmbientMusic, startTicking, stopTicking]);

  // Unified GSAP MotionPath animation coordinator
  useEffect(() => {
    if (activeTweenRef.current) {
      activeTweenRef.current.kill();
      activeTweenRef.current = null;
    }

    if (reducedMotion) {
      if (currentPhase === 'idle') {
        setTrolleyPos({
          x: SCENE_CONFIG.trolleyPositions.idle.x,
          y: SCENE_CONFIG.trolleyPositions.idle.y,
          angle: 0,
        });
        setHasImpacted(false);
      } else if (currentPhase === 'intro-animation' || currentPhase === 'decision-pause') {
        setTrolleyPos({
          x: SCENE_CONFIG.trolleyPositions.forkPause.x,
          y: SCENE_CONFIG.trolleyPositions.forkPause.y,
          angle: 0,
        });
        setHasImpacted(false);
        if (currentPhase === 'intro-animation' && onPhaseChange) {
          onPhaseChange('decision-pause');
        }
      } else if (currentPhase === 'switching') {
        setTrolleyPos({
          x: SCENE_CONFIG.trolleyPositions.forkPause.x,
          y: SCENE_CONFIG.trolleyPositions.forkPause.y,
          angle: 0,
        });
        const timer = setTimeout(() => {
          if (onPhaseChange) onPhaseChange('outcome-animation');
        }, 500);
        return () => clearTimeout(timer);
      } else if (currentPhase === 'outcome-animation' || currentPhase === 'result') {
        setHasImpacted(true);
        if (selectedChoice === 'switch') {
          setTrolleyPos({
            x: SCENE_CONFIG.trolleyPositions.divertedExit.x,
            y: SCENE_CONFIG.trolleyPositions.divertedExit.y,
            angle: -5,
          });
        } else {
          setTrolleyPos({
            x: SCENE_CONFIG.trolleyPositions.straightExit.x,
            y: SCENE_CONFIG.trolleyPositions.straightExit.y,
            angle: 0,
          });
        }
        if (currentPhase === 'outcome-animation') {
          if (onAnimationEnd) onAnimationEnd();
          if (onPhaseChange) onPhaseChange('result');
        }
      }
      return;
    }

    // 1. Idle Phase: Stationary at start of approach track
    if (currentPhase === 'idle') {
      setTrolleyPos({
        x: SCENE_CONFIG.trolleyPositions.idle.x,
        y: SCENE_CONFIG.trolleyPositions.idle.y,
        angle: 0,
      });
      setHasImpacted(false);
      return;
    }

    // 2. Intro Animation Phase: Glides along approach path to fork pause point
    if (currentPhase === 'intro-animation') {
      setHasImpacted(false);
      const rawPath = MotionPathPlugin.stringToRawPath(SCENE_CONFIG.motionPaths.approach);
      const progressObj = { progress: 0 };

      activeTweenRef.current = gsap.to(progressObj, {
        progress: 1,
        duration: 2.3,
        ease: 'power2.out',
        onUpdate: () => {
          const pt = MotionPathPlugin.getPositionOnPath(rawPath, progressObj.progress, true);
          setTrolleyPos({ x: pt.x, y: pt.y, angle: 0 });
        },
        onComplete: () => {
          // Keep ticking continuous into decision pause
          setTrolleyPos({
            x: SCENE_CONFIG.trolleyPositions.forkPause.x,
            y: SCENE_CONFIG.trolleyPositions.forkPause.y,
            angle: 0,
          });
          if (onPhaseChange) onPhaseChange('decision-pause');
        },
      });

      return () => {
        if (activeTweenRef.current) activeTweenRef.current.kill();
      };
    }

    // 3. Decision Pause: Trolley holds steady at fork pause position
    if (currentPhase === 'decision-pause') {
      setTrolleyPos({
        x: SCENE_CONFIG.trolleyPositions.forkPause.x,
        y: SCENE_CONFIG.trolleyPositions.forkPause.y,
        angle: 0,
      });
      setHasImpacted(false);
      return;
    }

    // 4. Switching Phase: Operator moves lever, switch blade shifts
    if (currentPhase === 'switching') {
      if (selectedChoice === 'switch') {
        playLeverPull();
      }
      setTrolleyPos({
        x: SCENE_CONFIG.trolleyPositions.forkPause.x,
        y: SCENE_CONFIG.trolleyPositions.forkPause.y,
        angle: 0,
      });
      const timer = setTimeout(() => {
        if (onPhaseChange) onPhaseChange('outcome-animation');
      }, 650);
      return () => clearTimeout(timer);
    }

    // 5. Outcome Animation Phase: GSAP MotionPath travel along chosen route with authentic collision
    if (currentPhase === 'outcome-animation') {
      const isSwitch = selectedChoice === 'switch';
      const pathStr = isSwitch
        ? SCENE_CONFIG.motionPaths.diverted
        : SCENE_CONFIG.motionPaths.straight;
      const rawPath = MotionPathPlugin.stringToRawPath(pathStr);
      const progressObj = { progress: 0 };
      let impacted = false;

      // Collision occurs at ~0.29 along straight path and ~0.34 along diverted curve
      const impactThreshold = isSwitch ? 0.34 : 0.29;

      activeTweenRef.current = gsap.to(progressObj, {
        progress: 1,
        duration: isSwitch ? 2.8 : 2.6,
        ease: 'power1.inOut',
        onUpdate: () => {
          const pt = MotionPathPlugin.getPositionOnPath(rawPath, progressObj.progress, true) as {
            x: number;
            y: number;
            angle?: number;
          };
          const angleVal = pt.angle ?? 18.2;
          const relAngle = isSwitch ? (angleVal - 18.2) * 0.45 : 0;
          setTrolleyPos({ x: pt.x, y: pt.y, angle: relAngle });

          // Trigger comic impact when trolley hits the victims, then continue speeding offscreen
          if (!impacted && progressObj.progress >= impactThreshold) {
            impacted = true;
            setHasImpacted(true);
            setScreenShake(true);
            playImpact();
            setTimeout(() => setScreenShake(false), 380);
          }
        },
        onComplete: () => {
          if (onAnimationEnd) onAnimationEnd();
          if (onPhaseChange) onPhaseChange('result');
        },
      });

      return () => {
        if (activeTweenRef.current) activeTweenRef.current.kill();
      };
    }

    // 6. Result Phase: Trolley has rolled off screen; stays at exit position
    if (currentPhase === 'result') {
      setHasImpacted(true);
      if (selectedChoice === 'switch') {
        setTrolleyPos({
          x: SCENE_CONFIG.trolleyPositions.divertedExit.x,
          y: SCENE_CONFIG.trolleyPositions.divertedExit.y,
          angle: -5,
        });
      } else {
        setTrolleyPos({
          x: SCENE_CONFIG.trolleyPositions.straightExit.x,
          y: SCENE_CONFIG.trolleyPositions.straightExit.y,
          angle: 0,
        });
      }
    }
  }, [
    currentPhase,
    selectedChoice,
    reducedMotion,
    onAnimationEnd,
    onPhaseChange,
    playImpact,
    playLeverPull,
  ]);

  const isMoving =
    currentPhase === 'intro-animation' || currentPhase === 'outcome-animation';
  const isPaused = currentPhase === 'decision-pause';
  const leverSwitched =
    (currentPhase === 'switching' ||
      currentPhase === 'outcome-animation' ||
      currentPhase === 'result') &&
    selectedChoice === 'switch';

  return (
    <div
      className={`relative w-full border-none shadow-none bg-transparent overflow-visible select-none transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${
        screenShake && !reducedMotion ? 'animate-shake' : ''
      }`}
      style={{ aspectRatio: SCENE_CONFIG.aspectRatio }}
    >
      {/* Screen reader narration */}
      <div className="sr-only" aria-live="polite">
        {currentPhase === 'idle' &&
          'Сцена дилеми вагонетки. Вагонетка готова до руху. Натисніть кнопку "Почати експеримент".'}
        {currentPhase === 'intro-animation' &&
          'Вагонетка набирає швидкість і рухається колією до розгалуження.'}
        {currentPhase === 'decision-pause' &&
          'Вагонетка зупинилася перед розвилкою. Зробіть моральний вибір: не втручатися чи перевести стрілку.'}
        {currentPhase === 'switching' &&
          (selectedChoice === 'switch'
            ? 'Стрілочник переводить важіль на бокову колію.'
            : 'Стрілочник відмовляється торкатися важеля.')}
        {currentPhase === 'outcome-animation' &&
          (selectedChoice === 'switch'
            ? 'Вагонетка повертає на бокову колію до однієї людини.'
            : 'Вагонетка мчить прямою колією до пʼяти людей.')}
        {currentPhase === 'result' &&
          (selectedChoice === 'switch'
            ? 'Зіткнення на боковій колії: 1 людина загинула, 5 врятовано.'
            : 'Зіткнення на прямій колії: 5 людей загинуло.')}
      </div>

      {/* Pure SVG Vector Scene */}
      <svg
        viewBox={SCENE_CONFIG.viewBox}
        className="w-full h-full block overflow-visible"
        role="img"
        aria-label="Схема руху вагонетки та розгалуження колій"
      >
        <defs>
          {/* Volumetric Headlight Wash */}
          <linearGradient id={`headlight-${filterId}`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop
              offset="0%"
              stopColor={isDark ? '#fde047' : '#000000'}
              stopOpacity={isDark ? 0.35 : 0.12}
            />
            <stop
              offset="100%"
              stopColor={isDark ? '#fde047' : '#000000'}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* Master Theme Adaptor Group: inverts black line-art to crisp white in dark theme */}
        <g filter={isDark ? 'invert(1) hue-rotate(180deg)' : undefined}>
          {/* 1. Authentic Unbroken Track Geometry */}
          <RailwayTracks isDark={isDark} leverSwitched={leverSwitched} />

          {/* 2. Switch Operator & Lever */}
          <SwitchOperator
            isDark={isDark}
            isPaused={isPaused}
            leverSwitched={leverSwitched}
          />

          {/* 3. Characters on Tracks (5 People / 1 Person or Splat impact) */}
          <TrackCharacters
            isDark={isDark}
            hasImpacted={hasImpacted}
            selectedChoice={selectedChoice}
          />

          {/* 4. Comic Trolley Vehicle */}
          <TrolleyVehicle
            x={trolleyPos.x}
            y={trolleyPos.y}
            angle={trolleyPos.angle}
            transitionStyle="none"
            isMoving={isMoving}
            isPaused={isPaused}
            isDark={isDark}
            reducedMotion={reducedMotion}
            filterId={filterId}
          />
        </g>
      </svg>

      {/* Floating Button for Idle State: "Почати експеримент" */}
      {currentPhase === 'idle' && (
        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center justify-center p-4 text-center z-20 pointer-events-none transition-opacity">
          <button
            type="button"
            data-testid="start-experiment-button"
            onClick={onStartExperiment}
            className="pointer-events-auto btn-ghost-pill text-sm uppercase tracking-[0.2em] font-medium py-3.5 px-10 shadow-lg bg-paper/90 backdrop-blur-md border border-obsidian/20 hover:bg-obsidian hover:text-paper transition-all transform hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current mr-2" />
            Почати експеримент
          </button>
        </div>
      )}

      {/* Dramatic Decision Pause Banner (Positioned in lower-left clear space without obscuring vehicle or operator) */}
      {currentPhase === 'decision-pause' && (
        <div className="absolute bottom-4 left-4 sm:left-6 z-20 bg-obsidian text-paper px-5 py-2.5 rounded-full font-sans text-xs sm:text-sm tracking-wide flex items-center gap-2.5 animate-pulse shadow-xl border border-obsidian/20 max-w-[90%] sm:max-w-md text-left">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="font-medium">
            Попереду пʼятеро людей. Ви можете перевести стрілку, але тоді під загрозою опиниться одна людина.
          </span>
        </div>
      )}


    </div>
  );
};
