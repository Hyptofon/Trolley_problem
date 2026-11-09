'use client';

import React from 'react';
import { TROLLEY_SVG } from './nealAssets';

interface TrolleyVehicleProps {
  x: number;
  y: number;
  angle?: number;
  transitionStyle?: string;
  isMoving?: boolean;
  isPaused?: boolean;
  isDark?: boolean;
  reducedMotion?: boolean;
  filterId?: string;
}

export const TrolleyVehicle: React.FC<TrolleyVehicleProps> = ({
  x,
  y,
  angle = 0,
  transitionStyle = 'none',
  isMoving = false,
  isPaused = false,
  isDark = false,
  reducedMotion = false,
  filterId = 'default',
}) => {
  return (
    <g
      id="trolley-vehicle"
      transform={`translate(${x}, ${y}) rotate(${angle}, 260, 200)`}
      style={{
        transition: transitionStyle,
        willChange: 'transform',
      }}
      className="select-none"
    >
      {/* Authentic Wheel Vibration & Rotation Keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: TROLLEY_SVG.style,
        }}
      />

      {/* Volumetric Headlight Cone projecting from front cowcatcher */}
      {(isMoving || isPaused) && !reducedMotion && (
        <polygon
          points="410,210 560,180 570,300 405,250"
          fill={`url(#headlight-${filterId})`}
          className="pointer-events-none transition-opacity duration-300"
          opacity={isMoving ? 0.75 : 0.5}
        />
      )}

      {/* Front Headlight Bulb */}
      {(isMoving || isPaused) && (
        <circle
          cx="405"
          cy="226"
          r="6"
          fill={isDark ? '#fef08a' : '#fde047'}
          className={isMoving ? 'animate-pulse' : ''}
        />
      )}

      {/* Authentic Neal.fun Trolley Vector Graphic */}
      <g dangerouslySetInnerHTML={{ __html: TROLLEY_SVG.body }} />
    </g>
  );
};
