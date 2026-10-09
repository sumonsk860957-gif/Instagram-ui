import React from 'react';
import { X, Calendar, MapPin } from 'lucide-react';
import { ProfileData } from '../types';

interface AboutAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  isUnavailable: boolean;
  theme?: 'dark' | 'light';
}

export const AboutAccountModal: React.FC<AboutAccountModalProps> = ({
  isOpen,
  onClose,
  profile,
  isUnavailable,
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  // Section 11: For an unavailable account: Show ONLY "Content unavailable" - large and centered.
  if (isUnavailable) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />
        <div
          className={`relative w-full max-w-[420px] min-h-[260px] rounded-t-[20px] pt-3 pb-8 px-5 z-10 flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom duration-200 ${
            isLight ? 'bg-white text-neutral-900' : 'bg-[#1c1c1e] text-white'
          }`}
        >
          <div
            className={`w-10 h-1 rounded-full mx-auto mb-2 shrink-0 ${
              isLight ? 'bg-neutral-300' : 'bg-neutral-600'
            }`}
          />
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`p-1 transition-colors cursor-pointer ${
                isLight
                  ? 'text-neutral-500 hover:text-neutral-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center py-10">
            <h2
              className={`text-xl sm:text-2xl font-bold text-center tracking-tight ${
                isLight ? 'text-neutral-800' : 'text-neutral-200'
              }`}
            >
              Content unavailable
            </h2>
          </div>
          <div className="h-4" />
        </div>
      </div>
    );
  }

  // Normal Available Account
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-[420px] max-h-[85vh] rounded-t-[20px] pt-3 pb-8 px-5 z-10 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 ${
          isLight ? 'bg-white text-neutral-900' : 'bg-[#1c1c1e] text-white'
        }`}
      >
        <div
          className={`w-10 h-1 rounded-full mx-auto mb-2 shrink-0 ${
            isLight ? 'bg-neutral-300' : 'bg-neutral-600'
          }`}
        />

        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isLight ? 'border-neutral-200' : 'border-neutral-800'
          }`}
        >
          <h2
            className={`text-[17px] font-semibold ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}
          >
            About this account
          </h2>
          <button
            onClick={onClose}
            className={`p-1 transition-colors ${
              isLight
                ? 'text-neutral-500 hover:text-neutral-900'
                : 'text-neutral-400 hover:text-white'
            }`}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-6 flex flex-col items-center text-center">
          <img
            src={profile.profilePic}
            alt={profile.username}
            className={`w-20 h-20 rounded-full object-cover border mb-3 shadow-md ${
              isLight ? 'border-neutral-200' : 'border-neutral-700'
            }`}
          />
          <h3
            className={`text-base font-semibold ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}
          >
            {profile.username}
          </h3>
        </div>

        <div
          className={`rounded-2xl p-4 flex flex-col gap-4 text-sm ${
            isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-[#262628] text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Calendar
              size={18}
              className={`shrink-0 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}
            />
            <div className="flex flex-col text-left">
              <span
                className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}
              >
                Date joined
              </span>
              <span className={`font-medium ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                October 2022
              </span>
            </div>
          </div>

          <div
            className={`h-[1px] ${
              isLight ? 'bg-neutral-200' : 'bg-neutral-700/50'
            }`}
          />

          <div className="flex items-center gap-3">
            <MapPin
              size={18}
              className={`shrink-0 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}
            />
            <div className="flex flex-col text-left">
              <span
                className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}
              >
                Account based
              </span>
              <span className={`font-medium ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                Not shared
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
