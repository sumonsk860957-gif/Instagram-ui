import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  MoreHorizontal,
  Camera,
  UserPlus,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';
import {
  ProfileData,
  FollowButtonState,
  SnackbarInfo,
} from '../types';
import { Spinner8 } from './Spinner8';
import { RefreshSnackbar } from './RefreshSnackbar';
import { ActionBottomSheet } from './ActionBottomSheet';
import { ReportModal } from './ReportModal';
import { AboutAccountModal } from './AboutAccountModal';

const DEFAULT_AVATAR_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23262626'/><circle cx='50' cy='38' r='18' fill='%23666'/><path d='M20,85 C20,68 34,62 50,62 C66,62 80,68 80,85 Z' fill='%23666'/></svg>";

interface ProfileViewProps {
  profile: ProfileData;
  onBack: () => void;
  reportCount: number;
  setReportCount: React.Dispatch<React.SetStateAction<number>>;
  accountUnavailable: boolean;
  setAccountUnavailable: React.Dispatch<React.SetStateAction<boolean>>;
  visibleUnavailable: boolean;
  setVisibleUnavailable: React.Dispatch<React.SetStateAction<boolean>>;
  followButtonState: FollowButtonState;
  setFollowButtonState: React.Dispatch<React.SetStateAction<FollowButtonState>>;
}

const SAMPLE_POST_IMAGES = [
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onBack,
  reportCount,
  setReportCount,
  accountUnavailable,
  setAccountUnavailable,
  visibleUnavailable,
  setVisibleUnavailable,
  followButtonState,
  setFollowButtonState,
}) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Tabs state
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'tagged'>('posts');

  // Modals & bottom sheets
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<SnackbarInfo | null>(null);
  const snackbarCountRef = useRef(0);

  // Continuous Spinner Rotation state
  // Light pull = convergence only (no rotation).
  // Continued pull = FAST rotation -> continuous normal rotation.
  const [isSpinning, setIsSpinning] = useState(false);
  const [isConverging, setIsConverging] = useState(false);
  const isSpinningRef = useRef(false);
  const isConvergingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const hasSpinnerAppearedRef = useRef(false);

  // DOM Refs for GPU accelerated 60/90/120fps transforms without React render overhead
  const containerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const spinnerWrapperRef = useRef<HTMLDivElement>(null);

  // Single gesture controller state
  const touchStartYRef = useRef(0);
  const isTouchActiveRef = useRef(false);
  const isPullingRef = useRef(false);
  const currentPullYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  // Pull threshold for refresh commit (50px)
  const PULL_THRESHOLD = 50;

  // Track if ban action was already fired for this specific gesture
  const banFiredThisGestureRef = useRef(false);

  // Trigger error snackbar: "Something went wrong."
  const triggerErrorSnackbar = useCallback(() => {
    snackbarCountRef.current += 1;
    setSnackbar({
      id: snackbarCountRef.current,
      message: 'Something went wrong.',
      variant: 'default',
    });
  }, []);

  // Trigger green snackbar for report submission: "Thanks, we will review this account."
  const triggerReportSuccessSnackbar = useCallback(() => {
    snackbarCountRef.current += 1;
    setSnackbar({
      id: snackbarCountRef.current,
      message: 'Thanks, we will review this account.',
      variant: 'green',
    });
  }, []);

  // Direct DOM Transform during dragging (Zero React render overhead)
  // CRITICAL REQUIREMENT:
  // Layer 1: Profile/content receives pull translate3d movement.
  // Layer 2: Refresh spinner stays independently LOCKED at the original top position.
  // The spinner does NOT follow pullDistance. Its physical X/Y position is locked.
  const updateTransformDirect = useCallback((distance: number) => {
    if (contentWrapperRef.current) {
      contentWrapperRef.current.style.transform = `translate3d(0, ${distance}px, 0)`;
    }
    if (spinnerWrapperRef.current) {
      // Smoothly appear progressively with the pull (0px to 28px), no sudden pop-in
      if (!hasSpinnerAppearedRef.current) {
        const prog = Math.min(1, Math.max(0, distance / 28));
        spinnerWrapperRef.current.style.opacity = prog.toFixed(3);
        if (prog >= 1) {
          hasSpinnerAppearedRef.current = true;
        }
      } else {
        // While continuing to hold, keep smoothly visible
        spinnerWrapperRef.current.style.opacity = '1';
      }

      // CRITICAL BANNED REFRESH TIMING:
      // Spinner first appears -> IMMEDIATELY show "Something went wrong." snackbar + change Follow to "User not found"
      // while the finger is still held and pulling.
      if (distance > 0 && accountUnavailable && !banFiredThisGestureRef.current) {
        banFiredThisGestureRef.current = true;
        triggerErrorSnackbar();
        setVisibleUnavailable(true);
        setFollowButtonState((current) => {
          if (current === 'User not found') {
            return 'Follow';
          }
          return 'User not found';
        });
      }
    }
  }, [accountUnavailable, triggerErrorSnackbar, setVisibleUnavailable, setFollowButtonState]);

  // Commit valid pull-to-refresh
  // RELEASE AFTER THRESHOLD: Settle content first → continue rotating → perform refresh → ease back
  const commitRefresh = useCallback(() => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    // Settle profile content into 48px refresh resting gap
    if (contentWrapperRef.current) {
      contentWrapperRef.current.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
      contentWrapperRef.current.style.transform = 'translate3d(0, 48px, 0)';
    }
    if (spinnerWrapperRef.current) {
      spinnerWrapperRef.current.style.opacity = '1';
    }
    currentPullYRef.current = 48;

    // Spinner continues rotating smoothly at its locked top position during loading state (650ms)
    setTimeout(() => {
      // If not already fired on pull appearance, guarantee ban action here
      if (accountUnavailable && !banFiredThisGestureRef.current) {
        triggerErrorSnackbar();
        setVisibleUnavailable(true);
        setFollowButtonState((current) => {
          if (current === 'User not found') {
            return 'Follow';
          }
          return 'User not found';
        });
      }

      // Smoothly return content to original position and smoothly animate spinner out (no abrupt vanishing)
      if (contentWrapperRef.current) {
        contentWrapperRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
        contentWrapperRef.current.style.transform = 'translate3d(0, 0px, 0)';
      }
      if (spinnerWrapperRef.current) {
        spinnerWrapperRef.current.style.transition = 'opacity 0.25s ease-out';
        spinnerWrapperRef.current.style.opacity = '0';
      }
      currentPullYRef.current = 0;
      hasSpinnerAppearedRef.current = false;

      // Reset internal state cleanly after fade completes so next pull starts cleanly
      setTimeout(() => {
        isRefreshingRef.current = false;
        isPullingRef.current = false;
        isTouchActiveRef.current = false;
        isSpinningRef.current = false;
        setIsSpinning(false);
        isConvergingRef.current = false;
        setIsConverging(false);
        banFiredThisGestureRef.current = false;
        if (contentWrapperRef.current) {
          contentWrapperRef.current.style.transition = 'none';
        }
        if (spinnerWrapperRef.current) {
          spinnerWrapperRef.current.style.transition = 'none';
        }
      }, 300);
    }, 650);
  }, [
    accountUnavailable,
    triggerErrorSnackbar,
    setVisibleUnavailable,
    setFollowButtonState,
  ]);

  // Cancel pull smoothly on release without threshold
  const cancelPull = useCallback(() => {
    isPullingRef.current = false;
    currentPullYRef.current = 0;
    hasSpinnerAppearedRef.current = false;

    if (contentWrapperRef.current) {
      contentWrapperRef.current.style.transition = 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
      contentWrapperRef.current.style.transform = 'translate3d(0, 0px, 0)';
    }
    if (spinnerWrapperRef.current) {
      // Smoothly animate the spinner out / disappear without sudden snap or jump
      spinnerWrapperRef.current.style.transition = 'opacity 0.25s ease-out';
      spinnerWrapperRef.current.style.opacity = '0';
    }

    setTimeout(() => {
      if (!isPullingRef.current && !isRefreshingRef.current) {
        isSpinningRef.current = false;
        setIsSpinning(false);
        isConvergingRef.current = false;
        setIsConverging(false);
        banFiredThisGestureRef.current = false;
        if (contentWrapperRef.current) {
          contentWrapperRef.current.style.transition = 'none';
        }
        if (spinnerWrapperRef.current) {
          spinnerWrapperRef.current.style.transition = 'none';
        }
      }
    }, 280);
  }, []);

  // SINGLE GESTURE CONTROLLER: UNLIMITED HOLD + UNLIMITED UP/DOWN + CONTINUOUS SPINNER ROTATION
  // Reused identically for BOTH Public and Private accounts
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getScrollTop = () =>
      Math.max(
        window.pageYOffset || 0,
        window.scrollY || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0,
        containerRef.current?.scrollTop || 0
      );

    const handleStart = (clientY: number) => {
      if (isRefreshingRef.current || isReportModalOpen) return;
      touchStartYRef.current = clientY;
      isTouchActiveRef.current = true;
      isPullingRef.current = false;
      currentPullYRef.current = 0;
      isConvergingRef.current = false;
      setIsConverging(false);
      hasSpinnerAppearedRef.current = false;
      banFiredThisGestureRef.current = false;

      if (contentWrapperRef.current) {
        contentWrapperRef.current.style.transition = 'none';
      }
      if (spinnerWrapperRef.current) {
        spinnerWrapperRef.current.style.transition = 'none';
        spinnerWrapperRef.current.style.opacity = '0';
      }
    };

    const handleMove = (clientY: number, e: TouchEvent | MouseEvent) => {
      if (!isTouchActiveRef.current || isRefreshingRef.current || isReportModalOpen) return;
      const deltaY = clientY - touchStartYRef.current;

      if (!isPullingRef.current) {
        // If scrolled down the page (> 2px), or swiping up to scroll down: allow normal native scroll!
        if (getScrollTop() > 2 || deltaY <= 0) {
          return;
        }

        // Downward pull from absolute top initiates pull-to-refresh
        if (deltaY > 1) {
          isPullingRef.current = true;
          if (!isSpinningRef.current) {
            isSpinningRef.current = true;
            setIsSpinning(true);
          }
          if (e.cancelable) e.preventDefault();
        } else {
          return;
        }
      }

      // Actively pulling downward from top
      if (e.cancelable) {
        e.preventDefault();
      }

      // UNLIMITED UP/DOWN TRACKING WHILE HOLDING
      // deltaY controls profile pullDistance directly without clamping or freezing
      const pullDistance = Math.max(0, deltaY);
      currentPullYRef.current = pullDistance;

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        updateTransformDirect(pullDistance);
      });
    };

    const handleEnd = () => {
      if (!isTouchActiveRef.current || isRefreshingRef.current) return;
      isTouchActiveRef.current = false;

      // Only release ends the hold gesture!
      if (!isPullingRef.current) return;

      const finalPull = currentPullYRef.current;
      if (finalPull >= PULL_THRESHOLD) {
        commitRefresh();
      } else {
        cancelPull();
      }
    };

    // Touch events for mobile/Android
    const onTouchStart = (e: TouchEvent) => {
      if (isReportModalOpen) return;
      handleStart(e.touches[0].clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isReportModalOpen) return;
      handleMove(e.touches[0].clientY, e);
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    // Mouse events for desktop preview
    const onMouseDown = (e: MouseEvent) => {
      if (isReportModalOpen) return;
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('input') || target.closest('textarea')) return;
      handleStart(e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isReportModalOpen) return;
      handleMove(e.clientY, e);
    };

    const onMouseUp = () => {
      handleEnd();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);

      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [PULL_THRESHOLD, commitRefresh, cancelPull, updateTransformDirect, isReportModalOpen]);

  // Lock and cancel any background profile transform when Report modal is open
  useEffect(() => {
    if (isReportModalOpen) {
      if (contentWrapperRef.current) {
        contentWrapperRef.current.style.transform = 'translate3d(0, 0px, 0)';
      }
      isPullingRef.current = false;
      isTouchActiveRef.current = false;
      currentPullYRef.current = 0;
    }
  }, [isReportModalOpen]);

  // Follow button click handler
  const handleFollowClick = () => {
    if (accountUnavailable || followButtonState === 'User not found') {
      return;
    }
    setFollowButtonState((prev) => (prev === 'Follow' ? 'Following' : 'Follow'));
  };

  // Report submission handler
  const handleReportCategory = (category: string) => {
    setIsReportModalOpen(false);
    triggerReportSuccessSnackbar();

    if (category === 'Spam') {
      return;
    }

    const nextCount = reportCount + 1;
    setReportCount(nextCount);
    if (nextCount >= 2) {
      setAccountUnavailable(true);
    }
  };

  // Three-dot sheet actions
  const handleCopyUsername = () => {
    navigator.clipboard?.writeText(profile.username);
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: profile.username,
        text: `Check out @${profile.username}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  // Open Report bottom sheet
  const handleSelectReport = useCallback(() => {
    setIsActionSheetOpen(false);
    setIsReportModalOpen(true);
  }, []);

  // CRITICAL: Account Privacy is 100% independent from ban state
  const isPrivate = profile.accountPrivacy === 'Private';
  const isLight = theme === 'light';

  // Pronoun display formatting (optional - hidden if empty)
  const effectivePronoun =
    profile.pronounType === 'Custom'
      ? profile.customPronoun?.trim()
      : profile.pronounType;

  // Stat display helpers: blank/empty HIDES the stat, while 0 (or any number/text) STAYS VISIBLE
  const isStatVisible = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return false;
    const str = String(val).trim();
    return str !== '';
  };

  const showPostsStat = isStatVisible(profile.posts);
  const showFollowersStat = isStatVisible(profile.followers);
  const showFollowingStat = isStatVisible(profile.following);
  const anyStatsVisible = showPostsStat || showFollowersStat || showFollowingStat;
  const visibleStatsCount =
    (showPostsStat ? 1 : 0) + (showFollowersStat ? 1 : 0) + (showFollowingStat ? 1 : 0);

  // Display posts value exactly as entered (numbers, commas, etc.)
  const displayPosts =
    profile.posts !== undefined && profile.posts !== null
      ? String(profile.posts)
      : '';

  // Numeric count for post grid rendering
  const parsedPostsNum = parseInt(displayPosts.replace(/,/g, ''), 10);
  const effectivePostsCount = isNaN(parsedPostsNum) ? 0 : Math.max(0, parsedPostsNum);

  // Format followedBy string to highlight user handles
  const renderFollowedBy = (followedByText: string) => {
    if (!followedByText) return null;
    return (
      <p
        className={`text-[12px] leading-snug pt-1 ${
          isLight ? 'text-neutral-500' : 'text-neutral-400'
        }`}
      >
        <span>Followed by </span>
        <span
          className={`font-semibold ${
            isLight ? 'text-neutral-900' : 'text-neutral-200'
          }`}
        >
          {followedByText}
        </span>
      </p>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        overscrollBehaviorY: 'contain',
        ...(isReportModalOpen ? { overflow: 'hidden', touchAction: 'none' } : {}),
      }}
      className={`w-full min-h-screen relative font-sans select-none pb-16 transition-colors duration-200 ${
        isLight ? 'bg-white text-black' : 'bg-black text-white'
      }`}
    >
      {/* 1. TOP NAVIGATION HEADER (Sticky at the top, never clips scrolling) */}
      <header
        className={`sticky top-0 left-0 right-0 z-30 px-3 h-[48px] flex items-center justify-between transition-colors duration-200 ${
          isLight
            ? 'bg-white/95 text-black backdrop-blur-md'
            : 'bg-black/95 text-white backdrop-blur-md'
        }`}
      >
        {/* Left: Back icon + Username */}
        <div className="flex items-center min-w-0 max-w-[70%]">
          <button
            type="button"
            onClick={onBack}
            className={`p-1.5 -ml-1 rounded-full transition-colors cursor-pointer shrink-0 flex items-center justify-center mr-1.5 ${
              isLight
                ? 'text-black hover:bg-neutral-100 active:opacity-60'
                : 'text-white hover:bg-neutral-800 active:opacity-60'
            }`}
            aria-label="Back to profile creator"
          >
            <ChevronLeft size={26} strokeWidth={2.4} />
          </button>

          {/* Clean iOS-style username without lock icon in both Public and Private accounts */}
          <div className="flex items-center min-w-0">
            <span
              className={`text-[18px] sm:text-[18.5px] font-bold tracking-tight truncate leading-none ${
                isLight ? 'text-black' : 'text-white'
              }`}
            >
              {profile.username || 'username'}
            </span>
          </div>
        </div>

        {/* Right: Three-dot menu */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsActionSheetOpen(true)}
            className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center ${
              isLight
                ? 'text-black hover:bg-neutral-100 active:opacity-60'
                : 'text-white hover:bg-neutral-800 active:opacity-60'
            }`}
            aria-label="More options"
          >
            <MoreHorizontal size={22} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* 2. REFRESH SPINNER: LOCKED AT ORIGINAL TOP POSITION */}
      {/* Physical X/Y screen position is LOCKED. Never receives pull translateY/translate3d. */}
      {/* Layer 2: Refresh spinner stays independently anchored at the original top position */}
      <div
        ref={spinnerWrapperRef}
        className="w-full flex items-center justify-center pointer-events-none select-none z-20"
        style={{
          position: 'absolute',
          top: '56px',
          left: 0,
          right: 0,
          height: '24px',
          opacity: 0,
          willChange: 'opacity',
        }}
      >
        {/* EXACTLY 8-LINE INNER SPINNER: Rotates continuously while holding & loading */}
        <Spinner8 theme={theme} isSpinning={isSpinning} isConverging={isConverging} />
      </div>

      {/* 3. PULL-TO-REFRESH MAIN CONTENT WRAPPER */}
      {/* Layer 1: Profile/content receives pull translate3d movement */}
      <div
        ref={contentWrapperRef}
        className="w-full flex flex-col will-change-transform"
      >
        {/* Main Profile Info Section */}
        <div className="w-full max-w-xl mx-auto px-4 pt-3 pb-2">
          {/* Top Profile Header: [Profile Picture] on left | [Display Name + Pronouns ABOVE Statistics] on right */}
          <div className="flex items-start gap-5 sm:gap-7">
            {/* Circular Profile Picture on the left */}
            <div className="relative shrink-0 pt-0.5">
              <div
                className={`w-[80px] h-[80px] sm:w-[84px] sm:h-[84px] rounded-full p-[1.5px] ${
                  isLight
                    ? 'bg-neutral-200 border border-neutral-300'
                    : 'bg-neutral-800 border border-neutral-700/60'
                }`}
              >
                <img
                  src={profile.profilePic || DEFAULT_AVATAR_FALLBACK}
                  alt=""
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_FALLBACK;
                  }}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>

            {/* Right Column: Display Name + Pronouns ABOVE Statistics */}
            <div className="flex-1 flex flex-col justify-start min-w-0">
              {/* 1. Display Name + Pronouns (Pronouns on the RIGHT SIDE of Display Name, horizontally aligned) */}
              <div className="flex items-baseline gap-2 mb-3 min-w-0">
                {profile.displayName && (
                  <h2
                    className={`text-[15px] sm:text-[16px] font-semibold tracking-tight leading-tight truncate ${
                      isLight ? 'text-black' : 'text-white'
                    }`}
                  >
                    {profile.displayName}
                  </h2>
                )}
                {effectivePronoun ? (
                  <span
                    className={`text-[12px] sm:text-[13px] font-normal tracking-tight leading-tight shrink-0 ${
                      isLight ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  >
                    {effectivePronoun}
                  </span>
                ) : null}
              </div>

              {/* 2. Statistics: Posts | Followers | Following (Entire group moved slightly toward the left) */}
              {/* Optional Stats: Hide any stat that is blank OR 0. If all 3 are blank/0, hide the entire row */}
              {anyStatsVisible && (
                <div
                  className={`w-full max-w-[260px] grid text-center -ml-4 sm:-ml-4.5 ${
                    visibleStatsCount === 3
                      ? 'grid-cols-3'
                      : visibleStatsCount === 2
                      ? 'grid-cols-2 max-w-[200px]'
                      : 'grid-cols-1 max-w-[100px]'
                  }`}
                >
                  {/* Posts Column */}
                  {showPostsStat && (
                    <div className="flex flex-col items-center justify-center min-w-0">
                      <span
                        className={`text-[17px] font-bold tabular-nums leading-tight block truncate ${
                          isLight ? 'text-black' : 'text-white'
                        }`}
                      >
                        {displayPosts}
                      </span>
                      <span
                        className={`text-[12px] font-normal pt-0.5 leading-tight block truncate ${
                          isLight ? 'text-neutral-500' : 'text-neutral-400'
                        }`}
                      >
                        Posts
                      </span>
                    </div>
                  )}

                  {/* Followers Column */}
                  {showFollowersStat && (
                    <div className="flex flex-col items-center justify-center min-w-0">
                      <span
                        className={`text-[17px] font-bold tabular-nums leading-tight block truncate ${
                          isLight ? 'text-black' : 'text-white'
                        }`}
                      >
                        {profile.followers}
                      </span>
                      <span
                        className={`text-[12px] font-normal pt-0.5 leading-tight block truncate ${
                          isLight ? 'text-neutral-500' : 'text-neutral-400'
                        }`}
                      >
                        Followers
                      </span>
                    </div>
                  )}

                  {/* Following Column */}
                  {showFollowingStat && (
                    <div className="flex flex-col items-center justify-center min-w-0">
                      <span
                        className={`text-[17px] font-bold tabular-nums leading-tight block truncate ${
                          isLight ? 'text-black' : 'text-white'
                        }`}
                      >
                        {profile.following}
                      </span>
                      <span
                        className={`text-[12px] font-normal pt-0.5 leading-tight block truncate ${
                          isLight ? 'text-neutral-500' : 'text-neutral-400'
                        }`}
                      >
                        Following
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio & Followed By */}
          {(profile.bio || profile.followedBy) && (
            <div className="mt-3.5 space-y-0.5">
              {profile.bio && (
                <p
                  className={`text-[13.5px] sm:text-[14px] whitespace-pre-line leading-[1.38] pt-0.5 ${
                    isLight ? 'text-neutral-800' : 'text-neutral-200'
                  }`}
                >
                  {profile.bio}
                </p>
              )}

              {renderFollowedBy(profile.followedBy)}
            </div>
          )}

          {/* 3. ACTION BUTTONS:
              - Private Account: Single full-width Follow / "User not found" button (ALWAYS vivid iOS blue for Follow).
              - Public Account:
                - Active: [Follow / Following] [Message] [UserPlus] (ALWAYS vivid iOS blue for Follow).
                - Banned / Unavailable: [User not found] [Message] (Message remains visible!)
          */}
          {isPrivate ? (
            <div id="profile-action-button-area" className="mt-3.5 flex items-center">
              <button
                type="button"
                onClick={handleFollowClick}
                className={`w-full h-[34px] px-4 rounded-[8px] text-[13.5px] font-semibold transition-all flex items-center justify-center cursor-pointer active:scale-[0.98] select-none tracking-tight ${
                  followButtonState === 'User not found'
                    ? isLight
                      ? 'bg-neutral-200 text-neutral-500 cursor-default'
                      : 'bg-[#262626] text-neutral-400 cursor-default'
                    : followButtonState === 'Following'
                    ? isLight
                      ? 'bg-[#efefef] hover:bg-[#e4e4e4] text-black'
                      : 'bg-[#262626] hover:bg-[#333333] text-white'
                    : 'bg-[#0095f6] hover:bg-[#1877f2] active:bg-[#0081d6] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                }`}
              >
                <span>{followButtonState}</span>
              </button>
            </div>
          ) : (
            <div id="profile-action-button-area" className="mt-3.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleFollowClick}
                className={`flex-1 h-[34px] px-3 rounded-[8px] text-[13.5px] font-semibold transition-all flex items-center justify-center cursor-pointer active:scale-[0.98] select-none tracking-tight ${
                  followButtonState === 'User not found'
                    ? isLight
                      ? 'bg-neutral-200 text-neutral-500 cursor-default'
                      : 'bg-[#262626] text-neutral-400 cursor-default'
                    : followButtonState === 'Following'
                    ? isLight
                      ? 'bg-[#efefef] hover:bg-[#e4e4e4] text-black'
                      : 'bg-[#262626] hover:bg-[#333333] text-white'
                    : 'bg-[#0095f6] hover:bg-[#1877f2] active:bg-[#0081d6] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                }`}
              >
                <span>{followButtonState}</span>
              </button>

              <button
                type="button"
                className={`flex-1 h-[34px] px-3 rounded-[8px] text-[13.5px] font-semibold transition-all flex items-center justify-center cursor-pointer active:scale-[0.98] select-none tracking-tight ${
                  isLight
                    ? 'bg-[#efefef] hover:bg-[#e4e4e4] text-black'
                    : 'bg-[#262626] hover:bg-[#333333] active:bg-[#202020] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                }`}
              >
                <span>Message</span>
              </button>

              {followButtonState !== 'User not found' && (
                <button
                  type="button"
                  className={`w-[34px] h-[34px] rounded-[8px] transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-[0.98] select-none ${
                    isLight
                      ? 'bg-[#efefef] hover:bg-[#e4e4e4] text-black'
                      : 'bg-[#262626] hover:bg-[#333333] active:bg-[#202020] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  }`}
                  aria-label="Suggested users"
                >
                  <UserPlus size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. PROFILE CONTENT AREA:
            - If Private: centered lock icon + "This profile is private" + "Follow this profile to see their photos and videos."
            - If Public: Shows tabs + posts grid (even after ban!)
        */}
        {isPrivate ? (
          <div className="flex-1 flex flex-col items-center justify-center pt-16 pb-12 px-6 text-center">
            <div
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-4 ${
                isLight
                  ? 'border-neutral-300 bg-neutral-100 text-black'
                  : 'border-neutral-700 bg-neutral-900 text-white'
              }`}
            >
              <Lock size={28} strokeWidth={1.8} />
            </div>
            <h3
              className={`text-[16px] font-bold tracking-tight mb-1 ${
                isLight ? 'text-black' : 'text-white'
              }`}
            >
              This profile is private
            </h3>
            <p
              className={`text-[13px] leading-relaxed max-w-[280px] ${
                isLight ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            >
              Follow this profile to see their photos and videos.
            </p>
          </div>
        ) : (
          <>
            {/* Profile Tabs */}
            <div
              className={`mt-2.5 border-t w-full transition-colors duration-200 ${
                isLight ? 'border-neutral-200' : 'border-[#262626]'
              }`}
            >
              <div className="w-full max-w-xl mx-auto flex items-center justify-around">
                {/* Posts Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 py-3 flex items-center justify-center transition-colors relative cursor-pointer ${
                    activeTab === 'posts'
                      ? isLight
                        ? 'text-black'
                        : 'text-white'
                      : isLight
                      ? 'text-neutral-400 hover:text-neutral-600'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  aria-label="Posts tab"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[22px] h-[22px] fill-current"
                  >
                    <rect x="2.5" y="2.5" width="5.2" height="5.2" rx="0.6" />
                    <rect x="9.4" y="2.5" width="5.2" height="5.2" rx="0.6" />
                    <rect x="16.3" y="2.5" width="5.2" height="5.2" rx="0.6" />
                    <rect x="2.5" y="9.4" width="5.2" height="5.2" rx="0.6" />
                    <rect x="9.4" y="9.4" width="5.2" height="5.2" rx="0.6" />
                    <rect x="16.3" y="9.4" width="5.2" height="5.2" rx="0.6" />
                    <rect x="2.5" y="16.3" width="5.2" height="5.2" rx="0.6" />
                    <rect x="9.4" y="16.3" width="5.2" height="5.2" rx="0.6" />
                    <rect x="16.3" y="16.3" width="5.2" height="5.2" rx="0.6" />
                  </svg>
                  {activeTab === 'posts' && (
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-[1.5px] ${
                        isLight ? 'bg-black' : 'bg-white'
                      }`}
                    />
                  )}
                </button>

                {/* Repost Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('reposts')}
                  className={`flex-1 py-3 flex items-center justify-center transition-colors relative cursor-pointer ${
                    activeTab === 'reposts'
                      ? isLight
                        ? 'text-black'
                        : 'text-white'
                      : isLight
                      ? 'text-neutral-400 hover:text-neutral-600'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  aria-label="Reposts tab"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[22px] h-[22px] fill-none stroke-current"
                    strokeWidth="2"
                  >
                    <path d="M17 1l4 4-4 4" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <path d="M7 23l-4-4 4-4" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                  {activeTab === 'reposts' && (
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-[1.5px] ${
                        isLight ? 'bg-black' : 'bg-white'
                      }`}
                    />
                  )}
                </button>

                {/* Tagged Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('tagged')}
                  className={`flex-1 py-3 flex items-center justify-center transition-colors relative cursor-pointer ${
                    activeTab === 'tagged'
                      ? isLight
                        ? 'text-black'
                        : 'text-white'
                      : isLight
                      ? 'text-neutral-400 hover:text-neutral-600'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  aria-label="Tagged tab"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[22px] h-[22px] fill-none stroke-current"
                    strokeWidth="2"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  {activeTab === 'tagged' && (
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-[1.5px] ${
                        isLight ? 'bg-black' : 'bg-white'
                      }`}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* 5. POSTS GRID (Naturally scrolls with the page to the bottom) */}
            <div className="w-full max-w-xl mx-auto">
              {effectivePostsCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div
                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-3 ${
                      isLight ? 'border-neutral-300' : 'border-neutral-700'
                    }`}
                  >
                    <Camera
                      size={28}
                      className={isLight ? 'text-neutral-400' : 'text-neutral-500'}
                    />
                  </div>
                  <h3
                    className={`text-lg font-bold tracking-tight mb-1 ${
                      isLight ? 'text-black' : 'text-white'
                    }`}
                  >
                    No Posts Yet
                  </h3>
                  <p
                    className={`text-xs ${
                      isLight ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  >
                    When {profile.username || 'this user'} shares photos, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-[1.5px] w-full">
                  {SAMPLE_POST_IMAGES.slice(0, effectivePostsCount).map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square w-full relative overflow-hidden ${
                        isLight ? 'bg-neutral-200' : 'bg-neutral-900'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Action Bottom Sheet (Three-dot options) */}
      <ActionBottomSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onSelectReport={handleSelectReport}
        onSelectAbout={() => setIsAboutModalOpen(true)}
        onCopyUsername={handleCopyUsername}
        onShareProfile={handleShareProfile}
        theme={theme}
      />

      {/* Report Bottom Sheet (True draggable half-screen bottom sheet) */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={handleReportCategory}
        accountUnavailable={accountUnavailable}
        theme={theme}
      />

      {/* About Account Modal */}
      <AboutAccountModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        profile={profile}
        isUnavailable={accountUnavailable}
        theme={theme}
      />

      {/* Feedback Snackbars */}
      <RefreshSnackbar snackbar={snackbar} theme={theme} />
    </div>
  );
};
