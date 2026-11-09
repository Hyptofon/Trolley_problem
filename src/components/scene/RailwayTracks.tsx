'use client';

import React from 'react';
import { SCENE_CONFIG } from './nealAssets';

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
        <g transform="matrix(1,0,0,1,-222,-2045)">
          {/* 1. Left backwards extensions starting from beyond left edge of the site (X=-300) with uniform ~96px gauge */}
          <line
            x1="-300"
            y1="1897"
            x2="226"
            y2="2049"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <line
            x1="-300"
            y1="1993"
            x2="226"
            y2="2145"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Smooth transition from approach bottom rail into fork */}
          <path
            d="M226,2145 C450,2210 650,2270 806,2310"
            fill="none"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* 2. Authentic Straight main track (top rail straight line from 226 to 1746) */}
          <line
            x1="226"
            y1="2049"
            x2="1746"
            y2="2488"
            stroke="black"
            strokeWidth="7"
          />

          {/* Straight bottom rail past fork through 5 people (806 to 1706) */}
          <path
            d="M806,2310 C956,2364 1101.64,2414.34 1706,2624"
            fill="none"
            stroke="black"
            strokeWidth="7"
          />

          {/* 3. Authentic Branch track through 1 person */}
          {/* Branch bottom rail (806 to 1783) */}
          <path
            d="M806,2310 C946.787,2381.49 1093,2279.5 1440.23,2203.71 C1580,2180 1680,2220 1783,2254.99"
            fill="none"
            stroke="black"
            strokeWidth="7"
          />

          {/* Branch top rail (860 to 1792) */}
          <path
            d="M860,2225.29 C895.165,2234.92 991.496,2175.59 1132,2107 C1328.95,2010.86 1714.81,2120.85 1792,2136"
            fill="none"
            stroke="black"
            strokeWidth="7"
          />

          {/* 4. Right straight extensions (5 people): parallel at constant 147px gauge to X=2600 exiting off-screen right */}
          <line
            x1="1746"
            y1="2488"
            x2="2600"
            y2="2735"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <line
            x1="1706"
            y1="2624"
            x2="2600"
            y2="2882"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* 5. Right branch extensions (1 person): parallel at constant 119px gauge (slope 0.178) to X=2600 exiting off-screen right */}
          <line
            x1="1792"
            y1="2136"
            x2="2600"
            y2="2280"
            stroke="black"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <line
            x1="1783"
            y1="2255"
            x2="2600"
            y2="2400"
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
      </g>
    </g>
  );
};
