import React from 'react';

interface Spinner8Props {
  opacity?: number;
  className?: string;
  theme?: 'dark' | 'light';
  isSpinning?: boolean;
  isConverging?: boolean;
}

/**
  * Premium 8-segment iOS refresh spinner matching reference video size and line thickness.
  * Correct compact size with slightly thicker lines (2.75px).
  * Light pull = convergence only (no rotation).
  * Fast spin -> normal continuous rotation.
  * No dots, no background circle, no glow, no glass effect.
  */
export const Spinner8: React.FC<Spinner8Props> = ({
  opacity = 1,
  className = '',
  theme = 'dark',
  isSpinning = false,
  isConverging = false,
}) => {
  const segments = Array.from({ length: 8 });
  const strokeColorClass = theme === 'light' ? 'text-neutral-800' : 'text-neutral-200';
  const isActive = isSpinning || isConverging;

  return (
    <div
      style={{ opacity, width: '26px', height: '26px' }}
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
    >
      <div
        className={`w-[26px] h-[26px] flex items-center justify-center ${
          isActive ? 'spinner8-active' : ''
        }`}
        style={{
          transformOrigin: '50% 50%',
        }}
      >
        <div
          className="spinner8-intro-rotator w-[26px] h-[26px] flex items-center justify-center"
          style={{ transformOrigin: '50% 50%' }}
        >
          <div
            className="spinner8-continuous-rotator w-[26px] h-[26px] flex items-center justify-center"
            style={{ transformOrigin: '50% 50%' }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-[26px] h-[26px] block"
              style={{
                transformOrigin: '50% 50%',
              }}
            >
              <g className="spinner8-lines-group">
                {segments.map((_, i) => {
                  const angle = (i * 360) / 8; // 0, 45, 90, 135, 180, 225, 270, 315
                  // Natural iOS loading spinner fade trail:
                  // All 8 lines remain visibly present (no line is completely invisible / 0-5%).
                  // The weakest trailing line has a soft, clearly visible minimum opacity of ~0.22 (22%).
                  // Segments range smoothly from 1.00 down to 0.22 without disappearing or blinking.
                  const trailOpacity = +(1 - (i / 8) * 0.78).toFixed(2);

                  return (
                    <g
                      key={i}
                      style={{
                        transformOrigin: '12px 12px',
                        transform: `rotate(${angle}deg)`,
                      }}
                    >
                      <g className="spinner8-spoke">
                        <line
                          x1="12"
                          y1="2.2"
                          x2="12"
                          y2="6.6"
                          stroke="currentColor"
                          strokeWidth="2.75"
                          strokeLinecap="round"
                          className={`spinner8-line ${strokeColorClass}`}
                          style={{
                            opacity: trailOpacity,
                          }}
                        />
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
