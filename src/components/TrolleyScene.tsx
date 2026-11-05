import React, { useId } from 'react';
import { Choice, VoteSubmissionState } from '../types';

interface TrolleySceneProps {
  submissionState: VoteSubmissionState;
  selectedChoice: Choice | null;
  animationComplete: boolean;
  onAnimationEnd?: () => void;
  onSkipAnimation?: () => void;
  reducedMotion?: boolean;
}

export const TrolleyScene: React.FC<TrolleySceneProps> = ({
  submissionState,
  selectedChoice,
  animationComplete,
  onAnimationEnd,
  onSkipAnimation,
  reducedMotion = false,
}) => {
  const filterId = useId();

  const isResolved =
    (submissionState === 'recorded' || submissionState === 'already_voted') &&
    selectedChoice !== null;

  // Track coordinates
  // Start: (50, 160) -> Fork: (280, 160)
  // Straight path: (280, 160) -> (780, 90) [5 people]
  // Diverted path: (280, 160) -> (360, 220) -> (780, 230) [1 person]

  // Calculate trolley target position
  let trolleyX = 90;
  let trolleyY = 160;
  let trolleyAngle = 0;

  if (isResolved) {
    if (selectedChoice === 'stay') {
      trolleyX = animationComplete ? 520 : 520;
      trolleyY = animationComplete ? 108 : 108;
      trolleyAngle = -8;
    } else if (selectedChoice === 'switch') {
      trolleyX = animationComplete ? 520 : 520;
      trolleyY = animationComplete ? 228 : 228;
      trolleyAngle = 10;
    }
  }

  const leverSwitched = isResolved && selectedChoice === 'switch';

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-2xl bg-graphite-900 border border-graphite-700/60 shadow-2xl p-3 sm:p-5 overflow-hidden">
      {/* Visual background atmospheric gradient */}
      <div className="absolute inset-0 bg-radial-gradient from-graphite-800/40 via-graphite-900/90 to-graphite-950 pointer-events-none" />

      {/* Screen reader text describing scene */}
      <div className="sr-only" aria-live="polite">
        {isResolved
          ? selectedChoice === 'stay'
            ? 'Вагонетка рухається прямою колією до пʼяти людей.'
            : 'Стрілку переведено. Вагонетка повертає на бокову колію до однієї людини.'
          : 'Сцена: залізниця з розгалуженням. Основна колія веде до групи з 5 людей, бокова стрілка веде до 1 людини. Вагонетка наближається до стрілки.'}
      </div>

      <svg
        viewBox="0 0 840 320"
        className="w-full h-auto select-none"
        role="img"
        aria-label="Схема руху вагонетки та розгалуження колій"
      >
        <defs>
          {/* Headlight gradient */}
          <linearGradient id={`light-${filterId}`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>

          {/* Danger zone glow for 5 people */}
          <radialGradient id={`glow5-${filterId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>

          {/* Diverted track glow for 1 person */}
          <radialGradient id={`glow1-${filterId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Danger zone backgrounds */}
        <circle cx="700" cy="90" r="85" fill={`url(#glow5-${filterId})`} />
        <circle cx="720" cy="230" r="70" fill={`url(#glow1-${filterId})`} />

        {/* Sleepers (ties) - main approach */}
        {[60, 95, 130, 165, 200, 235, 270].map((x) => (
          <line
            key={`tie-main-${x}`}
            x1={x}
            y1={148}
            x2={x}
            y2={172}
            stroke="#2c3747"
            strokeWidth="5"
            strokeLinecap="round"
          />
        ))}

        {/* Sleepers - upper track (5 people) */}
        {[305, 345, 385, 425, 465, 505, 545, 585, 625, 665, 705, 745].map((x, idx) => {
          const y = 160 - (idx + 1) * 5.8;
          return (
            <line
              key={`tie-upper-${x}`}
              x1={x - 2}
              y1={y - 12}
              x2={x + 2}
              y2={y + 12}
              stroke="#2c3747"
              strokeWidth="5"
              strokeLinecap="round"
            />
          );
        })}

        {/* Sleepers - lower diverted track (1 person) */}
        {[315, 355, 395, 435, 475, 515, 555, 595, 635, 675, 715, 755].map((x, idx) => {
          const progress = Math.min(1, (idx + 1) / 4);
          const y = 160 + progress * 60 + Math.max(0, (idx - 3) * 2.5);
          return (
            <line
              key={`tie-lower-${x}`}
              x1={x - 2}
              y1={y - 12}
              x2={x + 2}
              y2={y + 12}
              stroke="#2c3747"
              strokeWidth="5"
              strokeLinecap="round"
            />
          );
        })}

        {/* Rails: Approach track */}
        <path
          d="M 40 154 L 280 154"
          stroke="#414e63"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 40 166 L 280 166"
          stroke="#414e63"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Upper branch rails (straight / 5 people) */}
        <path
          d="M 280 154 L 780 84"
          stroke={isResolved && selectedChoice === 'stay' ? '#ef4444' : '#414e63'}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          className="transition-colors duration-700"
        />
        <path
          d="M 280 166 L 780 96"
          stroke={isResolved && selectedChoice === 'stay' ? '#ef4444' : '#414e63'}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          className="transition-colors duration-700"
        />

        {/* Lower branch rails (diverted / 1 person) */}
        <path
          d="M 280 154 C 330 154, 380 216, 450 224 L 780 224"
          stroke={isResolved && selectedChoice === 'switch' ? '#38bdf8' : '#414e63'}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          className="transition-colors duration-700"
        />
        <path
          d="M 280 166 C 330 166, 380 228, 450 236 L 780 236"
          stroke={isResolved && selectedChoice === 'switch' ? '#38bdf8' : '#414e63'}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          className="transition-colors duration-700"
        />

        {/* Track switch point visual mechanism */}
        <g transform="translate(280, 160)">
          {/* Lever base */}
          <circle cx="0" cy="22" r="7" fill="#1c2430" stroke="#414e63" strokeWidth="2" />
          {/* Lever handle */}
          <line
            x1="0"
            y1="22"
            x2={leverSwitched ? 14 : -14}
            y2={leverSwitched ? 6 : 8}
            stroke={leverSwitched ? '#38bdf8' : '#f59e0b'}
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          <circle
            cx={leverSwitched ? 14 : -14}
            cy={leverSwitched ? 6 : 8}
            r="4.5"
            fill={leverSwitched ? '#38bdf8' : '#f59e0b'}
            className="transition-all duration-500"
          />
        </g>

        {/* Track Labels */}
        <g transform="translate(680, 48)">
          <rect
            x="-60"
            y="-14"
            width="120"
            height="22"
            rx="4"
            fill="#161c26"
            stroke="#ef4444"
            strokeWidth="1.2"
          />
          <text
            x="0"
            y="1"
            textAnchor="middle"
            fill="#f87171"
            fontSize="11"
            fontWeight="bold"
            letterSpacing="0.5"
          >
            5 ЛЮДЕЙ (ОСНОВНА)
          </text>
        </g>

        <g transform="translate(710, 274)">
          <rect
            x="-60"
            y="-14"
            width="120"
            height="22"
            rx="4"
            fill="#161c26"
            stroke="#38bdf8"
            strokeWidth="1.2"
          />
          <text
            x="0"
            y="1"
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="11"
            fontWeight="bold"
            letterSpacing="0.5"
          >
            1 ЛЮДИНА (БОКОВА)
          </text>
        </g>

        {/* 5 Human Silhouettes on Straight Track */}
        <g transform="translate(650, 90)">
          {[-32, -16, 0, 16, 32].map((offset, i) => (
            <g
              key={`person-5-${i}`}
              transform={`translate(${offset}, ${i % 2 === 0 ? -4 : 2})`}
              className="text-graphite-300"
            >
              {/* Head */}
              <circle cx="0" cy="-22" r="5" fill="#f87171" />
              {/* Torso & arms */}
              <path
                d="M -4 -16 C -4 -17, 4 -17, 4 -16 L 5 -5 L -5 -5 Z"
                fill="#f87171"
              />
              {/* Legs */}
              <line x1="-2.5" y1="-5" x2="-2.5" y2="4" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="2.5" y1="-5" x2="2.5" y2="4" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ))}
        </g>

        {/* 1 Human Silhouette on Diverted Track */}
        <g transform="translate(710, 230)">
          <g>
            <circle cx="0" cy="-22" r="5.5" fill="#38bdf8" />
            <path
              d="M -4.5 -16 C -4.5 -17, 4.5 -17, 4.5 -16 L 5.5 -5 L -5.5 -5 Z"
              fill="#38bdf8"
            />
            <line x1="-3" y1="-5" x2="-3" y2="4" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="3" y1="-5" x2="3" y2="4" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>

        {/* Trolley (Carriage) */}
        <g
          data-testid="trolley-carriage"
          transform={`translate(${trolleyX}, ${trolleyY}) rotate(${trolleyAngle})`}
          style={{
            transition: reducedMotion
              ? 'none'
              : 'transform 1.4s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
          onTransitionEnd={() => {
            if (isResolved && onAnimationEnd) {
              onAnimationEnd();
            }
          }}
        >
          {/* Headlight beam */}
          <polygon points="35,-8 140,-35 140,35 35,8" fill={`url(#light-${filterId})`} />

          {/* Trolley chassis shadow */}
          <rect x="-38" y="10" width="76" height="5" rx="2" fill="#000000" opacity="0.6" />

          {/* Trolley main body */}
          <rect
            x="-36"
            y="-22"
            width="72"
            height="32"
            rx="5"
            fill="#1c2430"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />

          {/* Roof line */}
          <rect x="-38" y="-25" width="76" height="4" rx="2" fill="#f59e0b" />

          {/* Windows */}
          <rect x="-28" y="-16" width="14" height="12" rx="2" fill="#0a0d12" stroke="#414e63" strokeWidth="1" />
          <rect x="-8" y="-16" width="14" height="12" rx="2" fill="#0a0d12" stroke="#414e63" strokeWidth="1" />
          <rect x="12" y="-16" width="14" height="12" rx="2" fill="#0a0d12" stroke="#414e63" strokeWidth="1" />

          {/* Front Headlight */}
          <circle cx="36" cy="0" r="3.5" fill="#fbbf24" />
          <circle cx="36" cy="0" r="1.5" fill="#ffffff" />

          {/* Wheels */}
          <g transform="translate(0, 10)">
            {/* Front wheel set */}
            <circle cx="22" cy="0" r="6" fill="#11151c" stroke="#8b9bb4" strokeWidth="2.5" />
            <circle cx="22" cy="0" r="2" fill="#f59e0b" />

            {/* Back wheel set */}
            <circle cx="-22" cy="0" r="6" fill="#11151c" stroke="#8b9bb4" strokeWidth="2.5" />
            <circle cx="-22" cy="0" r="2" fill="#f59e0b" />

            {/* Connecting axle */}
            <line x1="-22" y1="0" x2="22" y2="0" stroke="#414e63" strokeWidth="2" />
          </g>
        </g>
      </svg>

      {/* Animation skip button for accessibility */}
      {isResolved && !animationComplete && !reducedMotion && (
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4">
          <button
            type="button"
            onClick={onSkipAnimation}
            className="text-xs bg-graphite-800/80 hover:bg-graphite-700 text-graphite-300 hover:text-white px-2.5 py-1 rounded border border-graphite-600 transition-colors"
            aria-label="Пропустити анімацію руху"
          >
            Пропустити анімацію →
          </button>
        </div>
      )}
    </div>
  );
};

