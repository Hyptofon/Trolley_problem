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

      {/* Comic Speed and Wind Motion Lines streaming behind the moving or pausing trolley */}
      {(isMoving || isPaused) && !reducedMotion && (
        <g id="trolley-speed-wind" className="pointer-events-none">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes windTrailRush1 {
                  0% { transform: translateX(10px); opacity: 0; }
                  25% { opacity: 0.95; }
                  75% { opacity: 0.85; }
                  100% { transform: translateX(-50px); opacity: 0; }
                }
                @keyframes windTrailRush2 {
                  0% { transform: translateX(15px); opacity: 0; }
                  30% { opacity: 1; }
                  70% { opacity: 0.9; }
                  100% { transform: translateX(-65px); opacity: 0; }
                }
                @keyframes windTrailRush3 {
                  0% { transform: translateX(8px); opacity: 0; }
                  20% { opacity: 0.85; }
                  80% { opacity: 0.75; }
                  100% { transform: translateX(-40px); opacity: 0; }
                }
                @keyframes windPuffCurl {
                  0% { transform: translateX(5px) scale(0.85); opacity: 0; }
                  40% { opacity: 0.9; }
                  100% { transform: translateX(-55px) scale(1.2); opacity: 0; }
                }
                .wind-streak-1 {
                  animation: windTrailRush1 380ms linear infinite;
                }
                .wind-streak-2 {
                  animation: windTrailRush2 320ms linear infinite 60ms;
                }
                .wind-streak-3 {
                  animation: windTrailRush3 440ms linear infinite 120ms;
                }
                .wind-puff {
                  animation: windPuffCurl 460ms linear infinite 160ms;
                  transform-origin: 20px 250px;
                }
              `,
            }}
          />

          {/* Upper Roof Speed Line with dynamic comic dashes */}
          <path
            d="M 25,50 L -80,48"
            stroke="black"
            strokeWidth="5"
            strokeLinecap="round"
            className="wind-streak-1"
          />
          <path
            d="M -15,62 L -70,61"
            stroke="black"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="wind-streak-3"
          />

          {/* Mid Body Long Wind Gusts */}
          <path
            d="M 15,115 L -110,112"
            stroke="black"
            strokeWidth="5.5"
            strokeLinecap="round"
            className="wind-streak-2"
          />
          <path
            d="M 25,165 L -90,163"
            stroke="black"
            strokeWidth="4.5"
            strokeLinecap="round"
            className="wind-streak-1"
          />

          {/* Lower Body Wind Stream */}
          <path
            d="M 10,210 L -100,208"
            stroke="black"
            strokeWidth="4"
            strokeLinecap="round"
            className="wind-streak-3"
          />

          {/* Comic Wind Curl / Dust Puff near rear wheels */}
          <path
            d="M 20,250 C -15,250 -45,242 -70,250 C -82,254 -88,266 -78,274 C -68,280 -56,270 -62,260"
            fill="none"
            stroke="black"
            strokeWidth="4.5"
            strokeLinecap="round"
            className="wind-puff"
          />
        </g>
      )}

      {/* Authentic Neal.fun Trolley Vector Graphic */}
      <g dangerouslySetInnerHTML={{ __html: TROLLEY_SVG.body }} />
    </g>
  );
};
