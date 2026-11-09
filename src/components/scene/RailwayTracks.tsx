'use client';

import React from 'react';
import { SCENE_CONFIG, TRACK_SVG } from './nealAssets';

interface RailwayTracksProps {
  isDark?: boolean;
  leverSwitched?: boolean;
}

export const RailwayTracks: React.FC<RailwayTracksProps> = ({
  leverSwitched = false,
}) => {
  return (
    <g id="railway-tracks" className="select-none pointer-events-none">
      {/* Track SVG geometry at authentic scene coordinates */}
      <g
        transform={`translate(${SCENE_CONFIG.trackOffset.x}, ${SCENE_CONFIG.trackOffset.y})`}
      >
        {/* Infinite rail extensions running completely off-screen backwards and forwards */}
        <g transform="matrix(1,0,0,1,-222,-2045)">
          {/* 1. Left backwards extensions (behind approaching trolley, exiting off-screen left) */}
          <line
            x1="-700"
            y1="1782"
            x2="226"
            y2="2049"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <line
            x1="-700"
            y1="1838"
            x2="226"
            y2="2105"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* 2. Right straight extensions (past the 5 victims, exiting off-screen right) */}
          <line
            x1="1746"
            y1="2488"
            x2="2700"
            y2="2764"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <line
            x1="1706"
            y1="2624"
            x2="2700"
            y2="2972"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* 3. Right branch extensions (past the 1 victim, exiting off-screen right) */}
          <line
            x1="1792"
            y1="2136"
            x2="2700"
            y2="2300"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <line
            x1="1783"
            y1="2255"
            x2="2700"
            y2="2374"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Switch blade indicator at fork */}
          {leverSwitched && (
            <path
              d="M806,2310 L840,2290"
              stroke="#0284c7"
              strokeWidth="9"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* Neal.fun authentic unbroken track paths */}
        <g dangerouslySetInnerHTML={{ __html: TRACK_SVG.body }} />
      </g>
    </g>
  );
};
