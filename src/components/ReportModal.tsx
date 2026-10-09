import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronRight, X } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (category: string) => void;
  accountUnavailable: boolean;
  theme?: 'dark' | 'light';
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
  accountUnavailable,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Categories and exact notice text
  const categories = [
    'Inappropriate content',
    'Spam',
    'Harassment or bullying',
    'Fake account',
    'Copyright',
    'Something else',
  ];

  const reportNoticeText =
    "Your report is anonymous, except if you're reporting an intellectual property infringement. If someone is in immediate danger, call the local emergency services - don't wait.";

  // Internal Report loading state (approximately 2 seconds every time sheet opens)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [isOpen]);

  // Freeze and lock background page scrolling ONLY while Report sheet is open
  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevBodyTouchAction = document.body.style.touchAction;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevHtmlTouchAction = document.documentElement.style.touchAction;

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.body.style.touchAction = prevBodyTouchAction;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.documentElement.style.touchAction = prevHtmlTouchAction;
      };
    }
  }, [isOpen]);

  // DOM Refs
  const sheetPanelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Bottom Sheet gesture tracking
  const [sheetHeight, setSheetHeight] = useState<number>(0);
  const targetTopRef = useRef<number>(220);
  const currentTranslateYRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isDraggingSheetRef = useRef(false);
  const startTranslateYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  // AUTOMATIC REPORT SHEET POSITIONING:
  // Automatically smoothly rises upward until reaching the level of the "User not found" button.
  // Covers the entire "User not found" button area, settling at that exact position every time
  // both before and after account becomes banned/unavailable, without requiring manual dragging.
  useEffect(() => {
    if (!isOpen) return;

    const computeTargetHeight = () => {
      const btn = document.getElementById('profile-action-button-area');
      let targetTop = 0;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        if (rect.top > 0) {
          targetTop = Math.floor(rect.top);
        }
      }
      if (!targetTop) {
        // Fallback: ~28% from viewport top covers the action button area
        targetTop = Math.round(window.innerHeight * 0.28);
      }
      targetTopRef.current = targetTop;
      return Math.max(320, window.innerHeight - targetTop);
    };

    const calculatedHeight = computeTargetHeight();
    setSheetHeight(calculatedHeight);
    currentTranslateYRef.current = 0;

    // Start from offscreen bottom and automatically smoothly rise upward to target position
    if (sheetPanelRef.current) {
      sheetPanelRef.current.style.transition = 'none';
      sheetPanelRef.current.style.transform = 'translate3d(0, 100%, 0)';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (sheetPanelRef.current) {
            sheetPanelRef.current.style.transition = 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)';
            sheetPanelRef.current.style.transform = 'translate3d(0, 0px, 0)';
          }
        });
      });
    }

    const onResize = () => {
      if (!isDraggingSheetRef.current) {
        const h = computeTargetHeight();
        setSheetHeight(h);
        if (sheetPanelRef.current) {
          sheetPanelRef.current.style.transform = 'translate3d(0, 0px, 0)';
        }
      }
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isOpen, accountUnavailable]);

  // UNLIMITED DRAG HANDLERS:
  // Tracks finger continuously: UP -> DOWN -> UP -> DOWN without freezing or stopping.
  const handleDragStart = useCallback((clientY: number) => {
    if (!sheetPanelRef.current) return;
    isDraggingSheetRef.current = true;
    touchStartYRef.current = clientY;
    startTranslateYRef.current = currentTranslateYRef.current;

    // Direct 1:1 hardware tracking with zero transition delay
    sheetPanelRef.current.style.transition = 'none';
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDraggingSheetRef.current || !sheetPanelRef.current) return;
    const deltaY = clientY - touchStartYRef.current;
    const targetTop = targetTopRef.current || Math.round(window.innerHeight * 0.28);

    // Keep within valid screen bounds:
    // Upward bound: near top of screen (44px from top)
    const minY = -(targetTop - 44);
    // Downward bound: before disappearing off bottom
    const maxY = Math.max(250, (sheetHeight || (window.innerHeight - targetTop)) - 60);

    const newY = Math.max(minY, Math.min(maxY, startTranslateYRef.current + deltaY));
    currentTranslateYRef.current = newY;

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      if (sheetPanelRef.current) {
        sheetPanelRef.current.style.transform = `translate3d(0, ${newY}px, 0)`;
      }
    });
  }, [sheetHeight]);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingSheetRef.current || !sheetPanelRef.current) return;
    isDraggingSheetRef.current = false;

    // Apply smooth iOS-like spring/ease-out transition
    sheetPanelRef.current.style.transition = 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
    const currentY = currentTranslateYRef.current;
    const targetTop = targetTopRef.current || Math.round(window.innerHeight * 0.28);
    const expandedY = -(targetTop - 44);

    // If dragged downward past threshold (85px), dismiss sheet
    if (currentY > 85) {
      sheetPanelRef.current.style.transform = 'translate3d(0, 100%, 0)';
      setTimeout(() => {
        onClose();
      }, 220);
    } else if (!accountUnavailable && currentY < expandedY * 0.45) {
      // In normal state: if dragged closer to expanded upper position, settle at expanded position
      currentTranslateYRef.current = expandedY;
      sheetPanelRef.current.style.transform = `translate3d(0, ${expandedY}px, 0)`;
    } else {
      // Smoothly snap back to resting position covering the "User not found" button
      currentTranslateYRef.current = 0;
      sheetPanelRef.current.style.transform = 'translate3d(0, 0px, 0)';
    }
  }, [accountUnavailable, onClose]);

  // Window-level touch listeners during active drag to ensure uninterrupted 1:1 tracking
  useEffect(() => {
    if (!isOpen) return;

    const onWindowTouchMove = (e: TouchEvent) => {
      if (!isDraggingSheetRef.current) return;
      if (e.cancelable) e.preventDefault();
      handleDragMove(e.touches[0].clientY);
    };

    const onWindowTouchEnd = () => {
      if (!isDraggingSheetRef.current) return;
      handleDragEnd();
    };

    window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
    window.addEventListener('touchend', onWindowTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onWindowTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchend', onWindowTouchEnd);
      window.removeEventListener('touchcancel', onWindowTouchEnd);
    };
  }, [isOpen, handleDragMove, handleDragEnd]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center select-none"
      style={{ touchAction: 'none' }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        // Prevent underlying profile page from moving while Report sheet is open
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Dimmed backdrop - profile stays visible behind the sheet */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        style={{ touchAction: 'none' }}
        onClick={onClose}
        onTouchMove={(e) => {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Report Bottom Sheet Panel
          - If banned (accountUnavailable): Automatically rises and occupies approximately the LOWER HALF of the screen (~50vh).
          - If normal: Draggable bottom sheet with ~50% initial height, expandable up to ~84vh.
      */}
      <div
        ref={sheetPanelRef}
        className={`relative w-full max-w-[440px] rounded-t-[26px] z-10 flex flex-col shadow-2xl will-change-transform ${
          isLight ? 'bg-white text-neutral-900' : 'bg-[#1c1c1e] text-white'
        }`}
        style={{
          height: sheetHeight ? `${sheetHeight}px` : '72vh',
          maxHeight: sheetHeight ? `${sheetHeight}px` : '72vh',
          transform: 'translate3d(0, 100%, 0)',
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* DRAGGABLE TOP HANDLE & HEADER AREA (Touch + hold to drag sheet) */}
        <div
          className="w-full pt-3 pb-2.5 px-4 cursor-grab active:cursor-grabbing shrink-0 select-none touch-none border-b border-transparent"
          onTouchStart={(e) => {
            e.stopPropagation();
            handleDragStart(e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
            handleDragMove(e.touches[0].clientY);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            handleDragEnd();
          }}
          onTouchCancel={(e) => {
            e.stopPropagation();
            handleDragEnd();
          }}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            handleDragStart(e.clientY);
            const onMouseMove = (ev: MouseEvent) => handleDragMove(ev.clientY);
            const onMouseUp = () => {
              handleDragEnd();
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
        >
          {/* Small horizontal grab handle at top center */}
          <div
            className={`w-10 h-1.5 rounded-full mx-auto mb-2.5 shrink-0 ${
              isLight ? 'bg-neutral-300' : 'bg-neutral-600'
            }`}
          />

          {/* Centered "Report" title with close button */}
          <div className="relative flex items-center justify-center w-full py-0.5">
            <h2
              className={`text-[17px] font-semibold tracking-tight text-center ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}
            >
              Report
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={`absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors cursor-pointer ${
                isLight
                  ? 'text-neutral-500 hover:text-neutral-900 active:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white active:bg-neutral-800'
              }`}
              aria-label="Close report"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* INTERNAL 1.5-SECOND LOADING SPINNER */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-16 px-6 pointer-events-none select-none">
            <div
              className="w-[20px] h-[20px] flex items-center justify-center animate-spin"
              style={{ animationDuration: '1.1s', animationTimingFunction: 'linear' }}
            >
              <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] block">
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i * 360) / 8;
                  const trailOpacity = Math.max(0.18, 1 - (i / 8) * 0.82);
                  return (
                    <line
                      key={i}
                      x1="12"
                      y1="2.2"
                      x2="12"
                      y2="6.6"
                      stroke="currentColor"
                      strokeWidth="2.75"
                      strokeLinecap="round"
                      className={isLight ? 'text-neutral-700' : 'text-neutral-200'}
                      style={{
                        transformOrigin: '12px 12px',
                        transform: `rotate(${angle}deg)`,
                        opacity: trailOpacity,
                      }}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        ) : accountUnavailable ? (
          <div className="flex-1 px-6 pt-4 pb-6 flex flex-col justify-start">
            <p
              className={`text-[14px] leading-relaxed tracking-normal ${
                isLight ? 'text-neutral-600' : 'text-neutral-300'
              }`}
            >
              {reportNoticeText}
            </p>
          </div>
        ) : (
          /* NORMAL STATE:
             Full categories list with independent content scrolling
          */
          <div
            ref={scrollContainerRef}
            className={`flex-1 overflow-y-auto native-scroll overscroll-contain px-5 py-3 divide-y ${
              isLight ? 'divide-neutral-200' : 'divide-neutral-800/80'
            }`}
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
            }}
            onTouchMove={(e) => {
              // Keep Report content scrolling completely separate from sheet dragging
              e.stopPropagation();
            }}
          >
            {/* Exact Report Notice Text */}
            <div className="pb-4">
              <p
                className={`text-[13px] leading-relaxed ${
                  isLight ? 'text-neutral-500' : 'text-neutral-400'
                }`}
              >
                {reportNoticeText}
              </p>
            </div>

            {/* Subtitle */}
            <div className="py-3">
              <h3
                className={`text-[14px] font-semibold ${
                  isLight ? 'text-neutral-800' : 'text-neutral-200'
                }`}
              >
                Why are you reporting this account?
              </h3>
            </div>

            {/* Categories List */}
            <div className="py-1">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    onSubmitReport(category);
                  }}
                  className={`w-full py-3.5 flex items-center justify-between text-left text-[15px] font-medium transition-colors cursor-pointer ${
                    isLight
                      ? 'text-neutral-800 hover:text-neutral-950 active:bg-neutral-100'
                      : 'text-neutral-200 hover:text-white active:bg-neutral-800/40'
                  }`}
                >
                  <span>{category}</span>
                  <ChevronRight
                    size={18}
                    className={`shrink-0 ${
                      isLight ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
