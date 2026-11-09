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
  const qMarkColor = isDark ? '#fbbf24' : '#000000';

  return (
    <g id="switch-operator-group" className="select-none">
      {/* Dynamic Keyframes for Operator Eyes */}
      <style
        dangerouslySetInnerHTML={{
          __html: YOU_SVG.style,
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

      {/* Interactive Bouncing Question Mark during decision-pause */}
      {isPaused && (
        <g
          transform="translate(1012, 10)"
          className="animate-bounce pointer-events-none"
        >
          <text
            x="0"
            y="0"
            fill={qMarkColor}
            fontSize="38"
            fontWeight="900"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            ?
          </text>
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
