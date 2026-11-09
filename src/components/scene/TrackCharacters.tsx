'use client';

import React from 'react';
import { Choice } from '@/lib/shared/types';
import {
  SCENE_CONFIG,
  FIVE_GUYS_SVG,
  ONE_GUY_SVG,
  SPLAT_SVG,
} from './nealAssets';

interface TrackCharactersProps {
  isDark?: boolean;
  hasImpacted?: boolean;
  selectedChoice?: Choice | null;
}

export const TrackCharacters: React.FC<TrackCharactersProps> = ({
  isDark = false,
  hasImpacted = false,
  selectedChoice = null,
}) => {
  const hitFive = hasImpacted && selectedChoice === 'stay';
  const hitOne = hasImpacted && selectedChoice === 'switch';

  const badgeBg = isDark ? 'rgba(20, 20, 24, 0.92)' : 'rgba(255, 255, 255, 0.92)';
  const badgeBorder = isDark ? '#3f3f46' : '#d4d4d8';
  const badgeText = isDark ? '#e4e4e7' : '#18181b';

  return (
    <g id="track-characters-group" className="select-none">
      {/* Dynamic Keyframes for Blinking Characters and Splat */}
      <style
        dangerouslySetInnerHTML={{
          __html: `${FIVE_GUYS_SVG.style}\n${ONE_GUY_SVG.style}\n${SPLAT_SVG.style}`,
        }}
      />

      {/* 1. Five Guys on Straight Track */}
      {!hitFive ? (
        <g
          id="five-guys"
          transform={`translate(${SCENE_CONFIG.fiveGuysOffset.x}, ${SCENE_CONFIG.fiveGuysOffset.y})`}
          className="transition-opacity duration-300"
        >
          <g dangerouslySetInnerHTML={{ __html: FIVE_GUYS_SVG.body }} />
        </g>
      ) : (
        <g
          id="splat-five"
          transform={`translate(${SCENE_CONFIG.splatFiveOffset.x}, ${SCENE_CONFIG.splatFiveOffset.y})`}
          className="transition-transform duration-200"
        >
          <g dangerouslySetInnerHTML={{ __html: SPLAT_SVG.body }} />
        </g>
      )}

      {/* Badge for 5 People */}
      <g transform="translate(1480, 835)" className="pointer-events-none">
        <rect
          x="-95"
          y="-20"
          width="190"
          height="30"
          rx="15"
          fill={badgeBg}
          stroke={badgeBorder}
          strokeWidth="1.5"
        />
        <text
          x="0"
          y="-1"
          fill={badgeText}
          fontSize="11"
          fontWeight="600"
          letterSpacing="0.08em"
          fontFamily="monospace"
          textAnchor="middle"
        >
          5 ОСІБ • ПАСИВНИЙ ШЛЯХ
        </text>
      </g>

      {/* 2. One Guy on Branch Track */}
      {!hitOne ? (
        <g
          id="one-guy"
          transform={`translate(${SCENE_CONFIG.oneGuyOffset.x}, ${SCENE_CONFIG.oneGuyOffset.y})`}
          className="transition-opacity duration-300"
        >
          <g dangerouslySetInnerHTML={{ __html: ONE_GUY_SVG.body }} />
        </g>
      ) : (
        <g
          id="splat-one"
          transform={`translate(${SCENE_CONFIG.splatOneOffset.x}, ${SCENE_CONFIG.splatOneOffset.y})`}
          className="transition-transform duration-200"
        >
          <g dangerouslySetInnerHTML={{ __html: SPLAT_SVG.body }} />
        </g>
      )}

      {/* Badge for 1 Person (Positioned above person's head for clear visibility) */}
      <g transform="translate(1620, 150)" className="pointer-events-none">
        <rect
          x="-95"
          y="-20"
          width="190"
          height="30"
          rx="15"
          fill={badgeBg}
          stroke={badgeBorder}
          strokeWidth="1.5"
        />
        <text
          x="0"
          y="-1"
          fill={badgeText}
          fontSize="11"
          fontWeight="600"
          letterSpacing="0.08em"
          fontFamily="monospace"
          textAnchor="middle"
        >
          1 ОСОБА • БОКОВА КОЛІЯ
        </text>
      </g>
    </g>
  );
};
