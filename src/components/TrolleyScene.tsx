'use client';

import React, { useId, useEffect, useState, useMemo } from 'react';
import { Choice, ExperimentPhase, VoteSubmissionState } from '@/lib/shared/types';
import { Play, FastForward, AlertTriangle } from 'lucide-react';

export interface TrolleySceneProps {
  phase?: ExperimentPhase;
  submissionState?: VoteSubmissionState;
  selectedChoice: Choice | null;
  animationComplete?: boolean;
  onPhaseChange?: (phase: ExperimentPhase) => void;
  onStartExperiment?: () => void;
  onAnimationEnd?: () => void;
  onSkipAnimation?: () => void;
  reducedMotion?: boolean;
}

interface ShatterParticle {
  id: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
}

export const TrolleyScene: React.FC<TrolleySceneProps> = ({
  phase: explicitPhase,
  submissionState,
  selectedChoice,
  animationComplete = false,
  onPhaseChange,
  onStartExperiment,
  onSkipAnimation,
  onAnimationEnd,
  reducedMotion = false,
}) => {
  const filterId = useId();

  // Derive current effective phase
  const currentPhase: ExperimentPhase = useMemo(() => {
    if (explicitPhase) return explicitPhase;
    if (submissionState === 'recorded' || submissionState === 'already_voted' || submissionState === 'updated') {
      return animationComplete ? 'result' : 'outcome-animation';
    }
    if (submissionState === 'submitting') {
      return 'switching';
    }
    return 'idle';
  }, [explicitPhase, submissionState, animationComplete]);

  // Track impact state for particles
  const [hasImpacted, setHasImpacted] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Generate deterministic particles for geometric red cube shatter effect
  const particles: ShatterParticle[] = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * 2 * Math.PI + (i % 3) * 0.2;
      const speed = 40 + (i % 7) * 15;
      return {
        id: i,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed * 0.7 - 20, // slightly upwards
        size: 5 + (i % 4) * 3,
        delay: (i % 5) * 0.04,
        duration: 0.6 + (i % 3) * 0.2,
        rotation: (i * 45) % 360,
      };
    });
  }, []);

  // Internal state machine transitions for cinematic pacing
  useEffect(() => {
    if (reducedMotion) {
      if (currentPhase === 'outcome-animation') {
        setHasImpacted(true);
        if (onAnimationEnd) onAnimationEnd();
        if (onPhaseChange) onPhaseChange('result');
      }
      return;
    }

    if (currentPhase === 'intro-animation') {
      setHasImpacted(false);
      const timer = setTimeout(() => {
        if (onPhaseChange) onPhaseChange('decision-pause');
      }, 1800);
      return () => clearTimeout(timer);
    }

    if (currentPhase === 'switching') {
      const timer = setTimeout(() => {
        if (onPhaseChange) onPhaseChange('outcome-animation');
      }, 700);
      return () => clearTimeout(timer);
    }

    if (currentPhase === 'outcome-animation') {
      // Trolley travels to collision site (takes ~900ms)
      const impactTimer = setTimeout(() => {
        setHasImpacted(true);
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 350);
      }, 900);

      // Animation concludes past collision site (~1600ms)
      const completeTimer = setTimeout(() => {
        if (onAnimationEnd) onAnimationEnd();
        if (onPhaseChange) onPhaseChange('result');
      }, 1600);

      return () => {
        clearTimeout(impactTimer);
        clearTimeout(completeTimer);
      };
    }

    if (currentPhase === 'result') {
      setHasImpacted(true);
    } else if (currentPhase === 'idle' || currentPhase === 'decision-pause') {
      setHasImpacted(false);
    }
  }, [currentPhase, reducedMotion, onAnimationEnd, onPhaseChange]);

  // Trolley Position and Angle along the Track
  // Approach track angle: 21.8 deg (tan = 144 / 360 = 0.4)
  let trolleyX = 90;
  let trolleyY = 160;
  let trolleyAngle = 21.8;

  if (currentPhase === 'intro-animation') {
    trolleyX = 350;
    trolleyY = 264;
    trolleyAngle = 21.8;
  } else if (currentPhase === 'decision-pause' || currentPhase === 'switching') {
    trolleyX = 350;
    trolleyY = 264;
    trolleyAngle = 21.8;
  } else if (currentPhase === 'outcome-animation' || currentPhase === 'result') {
    if (selectedChoice === 'switch') {
      // Diverted track to 1 person
      trolleyX = currentPhase === 'result' ? 820 : 740;
      trolleyY = 220;
      trolleyAngle = 0; // runs horizontally on the spur
    } else {
      // Straight path to 5 people
      trolleyX = currentPhase === 'result' ? 820 : 740;
      trolleyY = currentPhase === 'result' ? 452 : 420;
      trolleyAngle = 21.8;
    }
  }

  // Animation transition speed depending on phase
  let transitionStyle = 'transform 1.8s cubic-bezier(0.4, 0, 0.2, 1)';
  if (currentPhase === 'outcome-animation') {
    transitionStyle = 'transform 1.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
  } else if (currentPhase === 'decision-pause' || currentPhase === 'switching') {
    transitionStyle = 'transform 0.4s ease-out';
  } else if (currentPhase === 'result') {
    transitionStyle = 'transform 0.5s ease-out';
  }
  if (reducedMotion) {
    transitionStyle = 'none';
  }

  const leverSwitched =
    (currentPhase === 'switching' ||
      currentPhase === 'outcome-animation' ||
      currentPhase === 'result') &&
    selectedChoice === 'switch';

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto rounded-3xl bg-graphite-950 border border-graphite-800 shadow-2xl p-3 sm:p-5 overflow-hidden transition-transform duration-100 ${
        screenShake && !reducedMotion ? 'animate-shake' : ''
      }`}
    >
      {/* Cinematic ambient background glow */}
      <div className="absolute inset-0 bg-radial-gradient from-graphite-900/60 via-graphite-950/90 to-graphite-950 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Screen reader live narration */}
      <div className="sr-only" aria-live="polite">
        {currentPhase === 'idle' &&
          'Сцена дилеми вагонетки. Вагонетка стоїть на початку колії. Натисніть кнопку "Почати експеримент".'}
        {currentPhase === 'intro-animation' &&
          'Вагонетка набирає швидкість і мчить колією до стрілочного переводу.'}
        {currentPhase === 'decision-pause' &&
          'УВАГА: Вагонетка зупинилася перед розвилкою! Час прийняти рішення: не втручатися чи перевести стрілку.'}
        {currentPhase === 'switching' &&
          (selectedChoice === 'switch'
            ? 'Стрілочник тягне важіль. Колія перемикається на бокову лінію.'
            : 'Стрілочник залишає важіль у спокої.')}
        {currentPhase === 'outcome-animation' &&
          (selectedChoice === 'switch'
            ? 'Вагонетка повертає на бокову колію до однієї людини.'
            : 'Вагонетка продовжує рух прямою колією до пʼяти людей.')}
        {currentPhase === 'result' &&
          (selectedChoice === 'switch'
            ? 'Зіткнення відбулося на боковій колії. Загинула 1 людина, врятовано 5.'
            : 'Зіткнення відбулося на основній колії. Загинуло 5 людей.')}
      </div>

      <svg
        viewBox="0 0 1000 560"
        className="w-full h-auto select-none"
        role="img"
        aria-label="Схема руху вагонетки та розгалуження колій"
      >
        <defs>
          {/* Volumetric Headlight Cone Gradient */}
          <linearGradient id={`headlight-${filterId}`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.85" />
            <stop offset="25%" stopColor="#fbbf24" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>

          {/* Danger zone glow for 5 people */}
          <radialGradient id={`glow5-${filterId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#dc2626" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>

          {/* Diverted track glow for 1 person */}
          <radialGradient id={`glow1-${filterId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>

          {/* Subtle Ground Vignette */}
          <linearGradient id={`ground-${filterId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#131922" />
            <stop offset="50%" stopColor="#0d1117" />
            <stop offset="100%" stopColor="#090d13" />
          </linearGradient>

          {/* Red Cube Particle Radial Shader */}
          <linearGradient id={`cube-red-${filterId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="40%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>

        {/* Ground Terrain */}
        <rect x="0" y="0" width="1000" height="560" rx="20" fill={`url(#ground-${filterId})`} />

        {/* Background perspective grid / ballast lines */}
        <g stroke="#1a2230" strokeWidth="1" opacity="0.6">
          <line x1="0" y1="200" x2="1000" y2="200" strokeDasharray="6 8" />
          <line x1="0" y1="360" x2="1000" y2="360" strokeDasharray="6 8" />
          <line x1="0" y1="500" x2="1000" y2="500" strokeDasharray="6 8" />
        </g>

        {/* Danger zone ambient halos */}
        <circle cx="760" cy="428" r="95" fill={`url(#glow5-${filterId})`} />
        <circle cx="760" cy="220" r="75" fill={`url(#glow1-${filterId})`} />

        {/* ============================================================== */}
        {/* SLEEPERS (Wooden Ties) - ISOMETRIC OBLIQUE LAYOUT               */}
        {/* ============================================================== */}
        {/* Main Approach: from X: 40 to X: 390 */}
        {Array.from({ length: 12 }, (_, i) => {
          const x = 50 + i * 29;
          const y = 144 + i * 11.6;
          return (
            <line
              key={`tie-app-${i}`}
              x1={x - 14}
              y1={y + 16}
              x2={x + 14}
              y2={y - 16}
              stroke="#273243"
              strokeWidth="6"
              strokeLinecap="round"
            />
          );
        })}

        {/* Main Straight Spur (to 5 people): from X: 400 to X: 950 */}
        {Array.from({ length: 19 }, (_, i) => {
          const x = 405 + i * 29;
          const y = 286 + i * 11.6;
          return (
            <line
              key={`tie-straight-${i}`}
              x1={x - 14}
              y1={y + 16}
              x2={x + 14}
              y2={y - 16}
              stroke={
                hasImpacted && selectedChoice === 'stay'
                  ? '#451a1a'
                  : '#273243'
              }
              strokeWidth="6"
              strokeLinecap="round"
            />
          );
        })}

        {/* Diverted Spur (curves to 1 person): from X: 400 to X: 950 */}
        {Array.from({ length: 19 }, (_, i) => {
          let x = 410 + i * 28;
          let y = 280 - Math.min(60, i * 8);
          if (i > 7) {
            y = 220; // parallel siding
          }
          return (
            <line
              key={`tie-divert-${i}`}
              x1={x - (i > 7 ? 0 : 12)}
              y1={y + (i > 7 ? 16 : 14)}
              x2={x + (i > 7 ? 0 : 12)}
              y2={y - (i > 7 ? 16 : 14)}
              stroke={
                hasImpacted && selectedChoice === 'switch'
                  ? '#13283a'
                  : '#273243'
              }
              strokeWidth="6"
              strokeLinecap="round"
            />
          );
        })}

        {/* ============================================================== */}
        {/* STEEL RAILS                                                    */}
        {/* ============================================================== */}
        {/* Approach track rails (dual lines) */}
        <path
          d="M 30 132 L 400 280"
          stroke="#475569"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 50 156 L 420 304"
          stroke="#475569"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Main straight rails (to 5 people) */}
        <path
          d="M 400 280 L 960 504"
          stroke={selectedChoice === 'stay' && currentPhase !== 'idle' ? '#ef4444' : '#475569'}
          strokeWidth={selectedChoice === 'stay' && currentPhase !== 'idle' ? '4.5' : '3.5'}
          fill="none"
          strokeLinecap="round"
          className="transition-colors duration-500"
        />
        <path
          d="M 420 304 L 980 528"
          stroke={selectedChoice === 'stay' && currentPhase !== 'idle' ? '#ef4444' : '#475569'}
          strokeWidth={selectedChoice === 'stay' && currentPhase !== 'idle' ? '4.5' : '3.5'}
          fill="none"
          strokeLinecap="round"
          className="transition-colors duration-500"
        />

        {/* Diverted branch rails (curves to 1 person) */}
        <path
          d="M 400 280 C 460 270, 520 208, 600 208 L 960 208"
          stroke={selectedChoice === 'switch' ? '#38bdf8' : '#475569'}
          strokeWidth={selectedChoice === 'switch' ? '4.5' : '3.5'}
          fill="none"
          strokeLinecap="round"
          className="transition-colors duration-500"
        />
        <path
          d="M 420 304 C 475 292, 530 232, 600 232 L 960 232"
          stroke={selectedChoice === 'switch' ? '#38bdf8' : '#475569'}
          strokeWidth={selectedChoice === 'switch' ? '4.5' : '3.5'}
          fill="none"
          strokeLinecap="round"
          className="transition-colors duration-500"
        />

        {/* Dynamic track switch point tongue */}
        <line
          x1="395"
          y1="278"
          x2={leverSwitched ? 440 : 435}
          y2={leverSwitched ? 260 : 294}
          stroke={leverSwitched ? '#38bdf8' : '#f59e0b'}
          strokeWidth="4"
          strokeLinecap="round"
          className="transition-all duration-500"
        />

        {/* ============================================================== */}
        {/* LEVER MECHANISM & OPERATOR (Beside the switch)                */}
        {/* ============================================================== */}
        <g transform="translate(370, 190)">
          {/* Base box */}
          <rect
            x="-18"
            y="26"
            width="36"
            height="18"
            rx="4"
            fill="#111827"
            stroke="#4b5563"
            strokeWidth="2"
          />
          <circle cx="0" cy="30" r="4" fill="#374151" />

          {/* Switch Lever Handle */}
          <line
            x1="0"
            y1="30"
            x2={leverSwitched ? 16 : -18}
            y2={leverSwitched ? 10 : 8}
            stroke={leverSwitched ? '#38bdf8' : '#f59e0b'}
            strokeWidth="4"
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          <circle
            cx={leverSwitched ? 16 : -18}
            cy={leverSwitched ? 10 : 8}
            r="5"
            fill={leverSwitched ? '#38bdf8' : '#f59e0b'}
            className="transition-all duration-500"
          />

          {/* Operator Figure (Stylized Stickman / Engineer from reference image) */}
          <g transform="translate(-16, -15)">
            {/* Operator Head */}
            <circle cx="0" cy="-22" r="7" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />

            {/* Thought / Dilemma indicator during decision pause */}
            {currentPhase === 'decision-pause' && (
              <g transform="translate(14, -30)" className="animate-bounce">
                <circle cx="0" cy="0" r="9" fill="#f59e0b" />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#000000"
                  fontSize="12"
                  fontWeight="bold"
                >
                  ?
                </text>
              </g>
            )}

            {/* Torso */}
            <line x1="0" y1="-15" x2="0" y2="12" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />

            {/* Legs */}
            <line x1="0" y1="12" x2="-8" y2="40" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="12" x2="8" y2="40" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />

            {/* Left Arm (neutral) */}
            <line x1="0" y1="-8" x2="-10" y2="6" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />

            {/* Right Arm (holding the lever handle) */}
            <line
              x1="0"
              y1="-8"
              x2={leverSwitched ? 32 : -2}
              y2={leverSwitched ? 25 : 23}
              stroke="#e2e8f0"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </g>

          {/* Operator Label Pill */}
          <g transform="translate(-16, -56)">
            <rect
              x="-42"
              y="-10"
              width="84"
              height="18"
              rx="4"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="1"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9"
              fontWeight="bold"
              letterSpacing="0.5"
            >
              СТРІЛОЧНИК
            </text>
          </g>
        </g>

        {/* ============================================================== */}
        {/* PEOPLE ON TRACKS & ABSTRACT SHATTER PARTICLES                  */}
        {/* ============================================================== */}
        {/* 5 People on Main Track (around X: 760, Y: 428) */}
        <g transform="translate(760, 428)">
          {/* Label */}
          <g transform="translate(0, -50)">
            <rect
              x="-65"
              y="-12"
              width="130"
              height="24"
              rx="6"
              fill="#181216"
              stroke="#ef4444"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#f87171"
              fontSize="11"
              fontWeight="bold"
              letterSpacing="0.5"
            >
              5 ЛЮДЕЙ (ОСНОВНА)
            </text>
          </g>

          {/* Figures (visible if not shattered by stay choice) */}
          {(!hasImpacted || selectedChoice !== 'stay') && (
            <g
              className="transition-opacity duration-300"
              style={{ opacity: hasImpacted && selectedChoice === 'stay' ? 0 : 1 }}
            >
              {[-36, -18, 0, 18, 36].map((offset, idx) => (
                <g key={`person-5-${idx}`} transform={`translate(${offset}, ${idx * 6})`}>
                  {/* Body lying horizontally across rails */}
                  <ellipse cx="0" cy="0" rx="6" ry="14" fill="#f87171" stroke="#7f1d1d" strokeWidth="1" />
                  {/* Head */}
                  <circle cx="0" cy="-18" r="5" fill="#fca5a5" />
                  {/* Bound tie marks */}
                  <line x1="-5" y1="-4" x2="5" y2="-4" stroke="#450a0a" strokeWidth="1.5" />
                  <line x1="-5" y1="4" x2="5" y2="4" stroke="#450a0a" strokeWidth="1.5" />
                </g>
              ))}
            </g>
          )}

          {/* Geometric Red Cube Shatter Effect for 5 People */}
          {hasImpacted && selectedChoice === 'stay' && (
            <g>
              {particles.map((p) => (
                <rect
                  key={`part-5-${p.id}`}
                  x={p.dx}
                  y={p.dy}
                  width={p.size}
                  height={p.size}
                  rx="1.5"
                  fill={`url(#cube-red-${filterId})`}
                  stroke="#ef4444"
                  strokeWidth="0.8"
                  transform={`rotate(${p.rotation} ${p.dx} ${p.dy})`}
                  className={reducedMotion ? '' : 'animate-shatterParticle'}
                  style={{
                    animationDuration: `${p.duration}s`,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              ))}
              <circle cx="0" cy="0" r="45" fill="#ef4444" opacity="0.25" className="animate-ping" />
            </g>
          )}
        </g>

        {/* 1 Person on Diverted Track (around X: 760, Y: 220) */}
        <g transform="translate(760, 220)">
          {/* Label */}
          <g transform="translate(0, -42)">
            <rect
              x="-65"
              y="-12"
              width="130"
              height="24"
              rx="6"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="11"
              fontWeight="bold"
              letterSpacing="0.5"
            >
              1 ЛЮДИНА (БОКОВА)
            </text>
          </g>

          {/* Figure (visible if not shattered by switch choice) */}
          {(!hasImpacted || selectedChoice !== 'switch') && (
            <g
              className="transition-opacity duration-300"
              style={{ opacity: hasImpacted && selectedChoice === 'switch' ? 0 : 1 }}
            >
              <ellipse cx="0" cy="0" rx="7" ry="16" fill="#38bdf8" stroke="#0369a1" strokeWidth="1" />
              <circle cx="0" cy="-20" r="5.5" fill="#bae6fd" />
              <line x1="-6" y1="-5" x2="6" y2="-5" stroke="#082f49" strokeWidth="1.5" />
              <line x1="-6" y1="5" x2="6" y2="5" stroke="#082f49" strokeWidth="1.5" />
            </g>
          )}

          {/* Geometric Red Cube Shatter Effect for 1 Person */}
          {hasImpacted && selectedChoice === 'switch' && (
            <g>
              {particles.map((p) => (
                <rect
                  key={`part-1-${p.id}`}
                  x={p.dx}
                  y={p.dy}
                  width={p.size}
                  height={p.size}
                  rx="1.5"
                  fill={`url(#cube-red-${filterId})`}
                  stroke="#ef4444"
                  strokeWidth="0.8"
                  transform={`rotate(${p.rotation} ${p.dx} ${p.dy})`}
                  className={reducedMotion ? '' : 'animate-shatterParticle'}
                  style={{
                    animationDuration: `${p.duration}s`,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              ))}
              <circle cx="0" cy="0" r="35" fill="#ef4444" opacity="0.25" className="animate-ping" />
            </g>
          )}
        </g>

        {/* ============================================================== */}
        {/* VINTAGE TROLLEY / TRAM (Based on user reference drawing)       */}
        {/* ============================================================== */}
        <g
          data-testid="trolley-carriage"
          transform={`translate(${trolleyX}, ${trolleyY}) rotate(${trolleyAngle})`}
          style={{ transition: transitionStyle }}
        >
          {/* Speed Lines trailing behind when moving */}
          {(currentPhase === 'intro-animation' || currentPhase === 'outcome-animation') &&
            !reducedMotion && (
              <g stroke="#ffffff" opacity="0.35" strokeWidth="2" strokeLinecap="round">
                <line x1="-70" y1="-20" x2="-110" y2="-20" />
                <line x1="-65" y1="0" x2="-125" y2="0" strokeWidth="2.5" />
                <line x1="-70" y1="20" x2="-105" y2="20" />
              </g>
            )}

          {/* Volumetric Headlight Cone */}
          <polygon
            points="52,-10 240,-45 240,45 52,10"
            fill={`url(#headlight-${filterId})`}
            opacity={currentPhase === 'decision-pause' ? 0.95 : 0.75}
          />

          {/* Steam / Smoke Puffs from Roof Exhaust */}
          {!reducedMotion && currentPhase !== 'result' && (
            <g transform="translate(-10, -42)">
              <circle
                cx="-10"
                cy="-12"
                r="7"
                fill="#ffffff"
                opacity="0.4"
                className="animate-steamPuff"
                style={{ animationDelay: '0s' }}
              />
              <circle
                cx="-20"
                cy="-22"
                r="11"
                fill="#ffffff"
                opacity="0.3"
                className="animate-steamPuff"
                style={{ animationDelay: '0.4s' }}
              />
              <circle
                cx="-32"
                cy="-34"
                r="15"
                fill="#ffffff"
                opacity="0.2"
                className="animate-steamPuff"
                style={{ animationDelay: '0.8s' }}
              />
            </g>
          )}

          {/* Undercarriage Shadow */}
          <rect x="-56" y="18" width="112" height="8" rx="4" fill="#000000" opacity="0.75" />

          {/* Wheels / Iron Trucks */}
          <g transform="translate(0, 16)">
            {/* Front wheel pair */}
            <circle cx="32" cy="0" r="8" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" />
            <circle cx="32" cy="0" r="3" fill="#f59e0b" />
            {/* Rear wheel pair */}
            <circle cx="-32" cy="0" r="8" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" />
            <circle cx="-32" cy="0" r="3" fill="#f59e0b" />
            {/* Connecting axle rod */}
            <line x1="-32" y1="0" x2="32" y2="0" stroke="#475569" strokeWidth="3" />
          </g>

          {/* Cowcatcher / Front V-grill */}
          <polygon points="50,14 62,18 62,22 46,22" fill="#334155" stroke="#f59e0b" strokeWidth="1" />

          {/* Trolley Main Carriage Body */}
          <rect
            x="-52"
            y="-26"
            width="104"
            height="42"
            rx="8"
            fill="#1e293b"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />

          {/* Lower accent stripe */}
          <rect x="-50" y="8" width="100" height="4" fill="#d97706" />

          {/* Curved Front Nose (vintage streetcar rounded front) */}
          <path
            d="M 52 -24 C 58 -18, 58 12, 52 16 Z"
            fill="#1e293b"
            stroke="#f59e0b"
            strokeWidth="2"
          />

          {/* Arched Roof with Cupola */}
          <path
            d="M -54 -26 Q 0 -36 54 -26 L 52 -22 L -52 -22 Z"
            fill="#0f172a"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />
          {/* Chimney / Funnel */}
          <rect x="-12" y="-38" width="8" height="10" rx="1.5" fill="#475569" stroke="#94a3b8" strokeWidth="1" />

          {/* Side Windows (with warm glowing interior) */}
          {[-38, -18, 2, 22].map((xOffset, i) => (
            <rect
              key={`win-${i}`}
              x={xOffset}
              y="-18"
              width="14"
              height="16"
              rx="3"
              fill="#fbbf24"
              opacity="0.85"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          ))}

          {/* Front Panoramic Windshield */}
          <rect
            x="39"
            y="-18"
            width="12"
            height="18"
            rx="3"
            fill="#fef08a"
            opacity="0.9"
            stroke="#0f172a"
            strokeWidth="1.5"
          />

          {/* Front Searchlight / Lantern */}
          <circle cx="53" cy="-1" r="5.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="53" cy="-1" r="2.5" fill="#ffffff" />
        </g>
      </svg>

      {/* Interactive Overlay for Idle State: "Почати експеримент" Button */}
      {currentPhase === 'idle' && (
        <div className="absolute inset-0 bg-graphite-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-10 transition-opacity">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-400 mb-3">
            <AlertTriangle className="w-3.5 h-3.5" />
            Інтерактивна симуляція
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Готові випробувати моральний вибір?
          </h2>
          <p className="text-xs sm:text-sm text-graphite-300 max-w-md mb-5 leading-relaxed">
            Вагонетка почне рух наближаючись до стрілки. Перед розвилкою вона
            зупиниться, і ви приймете доленосне рішення.
          </p>
          <button
            type="button"
            data-testid="start-experiment-button"
            onClick={onStartExperiment}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-graphite-950 font-bold text-sm sm:text-base shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            Почати експеримент
          </button>
        </div>
      )}

      {/* Decision Pause Alert Badge */}
      {currentPhase === 'decision-pause' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-amber-500/95 text-graphite-950 px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          <span>ВАГОНЕТКА ПЕРЕД РОЗВИЛКОЮ — ОБЕРІТЬ ДІЮ НИЖЧЕ!</span>
        </div>
      )}

      {/* Skip animation button for accessibility */}
      {(currentPhase === 'intro-animation' || currentPhase === 'outcome-animation') &&
        !reducedMotion && (
          <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-10">
            <button
              type="button"
              onClick={onSkipAnimation}
              className="inline-flex items-center gap-1.5 text-xs bg-graphite-900/90 hover:bg-graphite-800 text-graphite-300 hover:text-white px-3 py-1.5 rounded-lg border border-graphite-700 transition-colors shadow-lg"
              aria-label="Пропустити анімацію"
            >
              <FastForward className="w-3.5 h-3.5" />
              Пропустити анімацію
            </button>
          </div>
        )}
    </div>
  );
};
