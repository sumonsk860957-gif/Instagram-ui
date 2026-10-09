import React from 'react';

interface Spinner7Props {
  opacity?: number;
  className?: string;
  theme?: 'dark' | 'light';
}

/**
 * Clean 22pt (approx 29.33px) 7-segment refresh spinner
 * Exactly 7 segments with smooth rotation and trail opacity.
 * Native iOS style - no glow, no glass, no blur, no extra container circle.
 */
export const Spinner7: React.FC<Spinner7Props> = ({
  opacity = 1,
  className = '',
  theme = 'dark',
}) => {
  const segments = Array.from({ length: 7 });
  const strokeColorClass = theme === 'light' ? 'text-neutral-800' : 'text-neutral-200';

  return (
    <div
      style={{ opacity, width: '29.33px', height: '29.33px' }}
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
    >
      <svg
        viewBox="0 0 30 30"
        className="w-[29.33px] h-[29.33px] animate-spin-7"
        style={{
          transformOrigin: 'center center',
        }}
      >
        {segments.map((_, i) => {
          const angle = (i * 360) / 7;
          // Segment opacities descending from 1.0 down to ~0.22
          const segmentOpacity = Math.max(0.2, 1 - (i / 7) * 0.8);
          return (
            <line
              key={i}
              x1="15"
              y1="4.2"
              x2="15"
              y2="9.5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              className={strokeColorClass}
              style={{
                transformOrigin: '15px 15px',
                transform: `rotate(${angle}deg)`,
                opacity: segmentOpacity,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};
