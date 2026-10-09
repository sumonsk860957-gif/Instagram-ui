/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { ProfileData, FollowButtonState } from './types';
import { ProfileCreator } from './components/ProfileCreator';
import { ProfileView } from './components/ProfileView';
import { AndroidProjectModal } from './components/AndroidProjectModal';
import { Smartphone, RotateCcw } from 'lucide-react';

const DEFAULT_PROFILE: ProfileData = {
  username: 'sumon',
  displayName: 'Sumon',
  profilePic: '/src/assets/images/default_avatar_1790881138005.jpg',
  posts: 0,
  followers: '1,248',
  following: '320',
  bio: 'made by sumon',
  followedBy: 'sumon, toufik and bsdk nabir',
  isVerified: false,
  pronounType: '',
  customPronoun: '',
  accountPrivacy: 'Public',
};

const STORAGE_KEY = 'sumon_ui_profile_data_v1';
const SIM_STORAGE_KEY = 'sumon_ui_sim_state_v1';

const getInitialProfile = (): ProfileData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch {
    // fallback to default
  }
  return DEFAULT_PROFILE;
};

const initialSim = (() => {
  try {
    const saved = localStorage.getItem(SIM_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {
    reportCount: 0,
    accountUnavailable: false,
    visibleUnavailable: false,
    followButtonState: 'Follow' as FollowButtonState,
    currentScreen: 'creator' as 'creator' | 'profile',
  };
})();

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'creator' | 'profile'>(initialSim.currentScreen || 'creator');
  const [profile, setProfile] = useState<ProfileData>(getInitialProfile);

  // Simulation State
  const [reportCount, setReportCount] = useState<number>(initialSim.reportCount || 0);
  const [accountUnavailable, setAccountUnavailable] = useState<boolean>(initialSim.accountUnavailable || false);
  const [visibleUnavailable, setVisibleUnavailable] = useState<boolean>(initialSim.visibleUnavailable || false);
  const [followButtonState, setFollowButtonState] = useState<FollowButtonState>(initialSim.followButtonState || 'Follow');
  const [profileSessionId, setProfileSessionId] = useState<number>(1);

  // Android APK info modal
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);

  // Sync profile to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  // Sync simulation state to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(
        SIM_STORAGE_KEY,
        JSON.stringify({
          reportCount,
          accountUnavailable,
          visibleUnavailable,
          followButtonState,
          currentScreen,
        })
      );
    } catch {
      // ignore
    }
  }, [reportCount, accountUnavailable, visibleUnavailable, followButtonState, currentScreen]);

  // Partial profile updater
  const handleProfileChange = (updated: Partial<ProfileData>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  // Reset ALL state when creating a NEW profile (Section 15)
  const handleResetNewProfile = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SIM_STORAGE_KEY);
    } catch {
      // ignore
    }
    setReportCount(0);
    setAccountUnavailable(false);
    setVisibleUnavailable(false);
    setFollowButtonState('Follow');
    setProfileSessionId((id) => id + 1);

    // Reload default demo values for new profile
    setProfile({
      ...DEFAULT_PROFILE,
      // Fresh new profile picture
      profilePic: '/src/assets/images/default_avatar_1790881138005.jpg',
      pronounType: '',
      customPronoun: '',
    });
  }, []);

  // Back button from Profile View
  const handleBackToCreator = useCallback(() => {
    setCurrentScreen('creator');
  }, []);

  // Generate Full View
  const handleGenerateFullView = () => {
    setReportCount(0);
    setAccountUnavailable(false);
    setVisibleUnavailable(false);
    setFollowButtonState('Follow');
    setCurrentScreen('profile');
  };

  return (
    <main className="w-full min-h-screen bg-black text-white relative flex flex-col items-center justify-start">
      {/* Top Android APK & Reset Bar (Visible in Creator screen) */}
      {currentScreen === 'creator' && (
        <div className="w-full max-w-2xl px-4 pt-3 flex items-center justify-between text-xs text-neutral-400 z-20">
          <button
            type="button"
            onClick={handleResetNewProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>New Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAndroidModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 transition-colors cursor-pointer"
          >
            <Smartphone size={13} />
            <span>Android APK</span>
          </button>
        </div>
      )}

      {/* Screen Render */}
      {currentScreen === 'creator' ? (
        <ProfileCreator
          key={`creator-${profileSessionId}`}
          profile={profile}
          onChange={handleProfileChange}
          onGenerate={handleGenerateFullView}
        />
      ) : (
        <ProfileView
          key={`profile-${profileSessionId}`}
          profile={profile}
          onBack={handleBackToCreator}
          reportCount={reportCount}
          setReportCount={setReportCount}
          accountUnavailable={accountUnavailable}
          setAccountUnavailable={setAccountUnavailable}
          visibleUnavailable={visibleUnavailable}
          setVisibleUnavailable={setVisibleUnavailable}
          followButtonState={followButtonState}
          setFollowButtonState={setFollowButtonState}
        />
      )}

      {/* Android Project Info Modal */}
      <AndroidProjectModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />
    </main>
  );
}
