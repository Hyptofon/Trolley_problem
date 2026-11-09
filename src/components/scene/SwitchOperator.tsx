'use client';

import React from 'react';
import { SCENE_CONFIG, YOU_SVG, YOU_PULL_SVG } from './nealAssets';

interface SwitchOperatorProps {
  isDark?: boolean;
  isPaused?: boolean;
  leverSwitched?: boolean;
}

export const SwitchOperator: React.FC<SwitchOperatorProps> = ({
  isDark = false,
  isPaused = false,
  leverSwitched = false,
}) => {
  return (
    <g id="switch-operator-group" className="select-none">
      {/* Dynamic Keyframes for Operator Eyes & Subtle Question Mark Float */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            ${YOU_SVG.style}
            @keyframes subtleQuestionBounce {
              0%, 100% {
                transform: translateY(0px);
                animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
              }
              50% {
                transform: translateY(-6px);
                animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
              }
            }
            .subtle-qmark-bounce {
              animation: subtleQuestionBounce 1400ms infinite;
            }
          `,
        }}
      />

      {/* Operator Vector Graphic */}
      <g
        transform={`translate(${SCENE_CONFIG.youOffset.x}, ${SCENE_CONFIG.youOffset.y})`}
        className="transition-all duration-300"
      >
        {!leverSwitched ? (
          <g
            id="operator-idle"
            dangerouslySetInnerHTML={{ __html: YOU_SVG.body }}
          />
        ) : (
          <g
            id="operator-pulling"
            dangerouslySetInnerHTML={{ __html: YOU_PULL_SVG.body }}
          />
        )}
      </g>

      {/* Interactive Gentle Bouncing Question Mark directly above operator during decision-pause */}
      {isPaused && (
        <g
          transform="translate(1010, -32)"
          className="pointer-events-none"
        >
          <g className="subtle-qmark-bounce">
            <text
              x="0"
              y="0"
              fill="black"
              fontSize="44"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
            >
              ?
            </text>
          </g>
        </g>
      )}

      {/* Micro Label */}
      <text
        x="1008"
        y="262"
        textAnchor="middle"
        fill={isDark ? '#a1a1aa' : '#71717a'}
        fontSize="11"
        letterSpacing="0.16em"
        className="uppercase font-mono font-medium pointer-events-none"
      >
        Стрілочник (Ви)
      </text>
    </g>
  );
};
