import React, { useEffect, useState } from 'react';
import { SnackbarInfo } from '../types';

interface RefreshSnackbarProps {
  snackbar: SnackbarInfo | null;
  theme?: 'dark' | 'light';
}

export const RefreshSnackbar: React.FC<RefreshSnackbarProps> = ({
  snackbar,
  theme = 'dark',
}) => {
  const [current, setCurrent] = useState<SnackbarInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!snackbar) return;
    setCurrent(snackbar);
    setIsVisible(true);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3200);

    return () => {
      clearTimeout(hideTimer);
    };
  }, [snackbar?.id]);

  if (!current || !isVisible) return null;

  const isGreen = current.variant === 'green';

  return (
    <div
      className={`fixed bottom-6 left-4 right-4 z-50 pointer-events-none flex justify-center transition-all duration-300 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      {isGreen ? (
        /* Green Report Success Notification */
        <div
          className={`w-full max-w-[390px] backdrop-blur-md px-4 py-2.5 rounded-[14px] shadow-lg text-left text-[13px] font-medium leading-snug border transition-colors ${
            theme === 'light'
              ? 'bg-[#ecfdf5]/95 border-emerald-300 text-emerald-800'
              : 'bg-[#0f2d18]/95 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {current.message}
        </div>
      ) : (
        /* Native iOS Error Notification: White exclamation circle icon + "Something went wrong." */
        <div className="w-full max-w-[390px] bg-[#262626]/95 backdrop-blur-md border border-neutral-700/60 px-4 py-3 rounded-[14px] shadow-lg flex items-center gap-2.5 text-left transition-all">
          {/* White outlined circular error icon with white exclamation mark */}
          <svg
            viewBox="0 0 20 20"
            className="w-[18px] h-[18px] text-white shrink-0"
            fill="none"
          >
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" />
            <line
              x1="10"
              y1="6"
              x2="10"
              y2="10.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="10" cy="13.5" r="0.9" fill="currentColor" />
          </svg>
          <span className="text-[13.5px] font-medium text-white leading-tight">
            {current.message}
          </span>
        </div>
      )}
    </div>
  );
};
