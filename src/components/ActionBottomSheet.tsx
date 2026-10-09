import React from 'react';

interface ActionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: () => void;
  onSelectAbout: () => void;
  onCopyUsername: () => void;
  onShareProfile: () => void;
  theme?: 'dark' | 'light';
}

export const ActionBottomSheet: React.FC<ActionBottomSheetProps> = ({
  isOpen,
  onClose,
  onSelectReport,
  onSelectAbout,
  onCopyUsername,
  onShareProfile,
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet content */}
      <div
        className={`relative w-full max-w-[420px] rounded-t-[20px] pb-6 pt-3 px-4 z-10 flex flex-col gap-2.5 transition-transform animate-in slide-in-from-bottom duration-200 ease-out shadow-2xl ${
          isLight ? 'bg-[#f2f2f7]' : 'bg-[#1c1c1e]'
        }`}
      >
        {/* Grab bar */}
        <div
          className={`w-10 h-1 rounded-full mx-auto mb-2 ${
            isLight ? 'bg-neutral-300' : 'bg-neutral-600'
          }`}
        />

        {/* Action group */}
        <div
          className={`rounded-2xl overflow-hidden flex flex-col divide-y ${
            isLight
              ? 'bg-white divide-neutral-200 shadow-sm'
              : 'bg-[#2c2c2e] divide-neutral-700/60'
          }`}
        >
          <button
            onClick={() => {
              onClose();
              onSelectReport();
            }}
            className={`w-full py-3.5 px-4 text-center text-[15px] font-semibold text-red-500 transition-colors cursor-pointer ${
              isLight ? 'active:bg-neutral-100' : 'active:bg-neutral-700/40'
            }`}
          >
            Report
          </button>
          <button
            onClick={() => {
              onClose();
              onSelectAbout();
            }}
            className={`w-full py-3.5 px-4 text-center text-[15px] font-medium transition-colors cursor-pointer ${
              isLight
                ? 'text-neutral-900 active:bg-neutral-100'
                : 'text-neutral-100 active:bg-neutral-700/40'
            }`}
          >
            About this account
          </button>
          <button
            onClick={() => {
              onClose();
              onCopyUsername();
            }}
            className={`w-full py-3.5 px-4 text-center text-[15px] font-medium transition-colors cursor-pointer ${
              isLight
                ? 'text-neutral-900 active:bg-neutral-100'
                : 'text-neutral-100 active:bg-neutral-700/40'
            }`}
          >
            Copy username
          </button>
          <button
            onClick={() => {
              onClose();
              onShareProfile();
            }}
            className={`w-full py-3.5 px-4 text-center text-[15px] font-medium transition-colors cursor-pointer ${
              isLight
                ? 'text-neutral-900 active:bg-neutral-100'
                : 'text-neutral-100 active:bg-neutral-700/40'
            }`}
          >
            Share profile
          </button>
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className={`w-full py-3.5 px-4 text-center text-[15px] font-semibold rounded-2xl transition-colors mt-0.5 cursor-pointer ${
            isLight
              ? 'bg-white text-neutral-900 active:bg-neutral-100 shadow-sm'
              : 'bg-[#2c2c2e] text-neutral-100 active:bg-neutral-700/40'
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
