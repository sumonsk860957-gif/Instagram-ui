import React, { useRef } from 'react';
import { Camera, Sparkles, X, Globe, Lock } from 'lucide-react';
import { ProfileData, PronounOption } from '../types';

interface ProfileCreatorProps {
  profile: ProfileData;
  onChange: (updated: Partial<ProfileData>) => void;
  onGenerate: () => void;
}

const PRONOUN_PRESETS: PronounOption[] = [
  'He/Him',
  'He/His',
  'She/Her',
  'She/Hers',
  'They/Them',
  'They/Theirs',
  'Custom',
];

const DEFAULT_AVATAR_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23262626'/><circle cx='50' cy='38' r='18' fill='%23666'/><path d='M20,85 C20,68 34,62 50,62 C66,62 80,68 80,85 Z' fill='%23666'/></svg>";

export const ProfileCreator: React.FC<ProfileCreatorProps> = ({
  profile,
  onChange,
  onGenerate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) return;

        // Create an Image to resize and compress cleanly for reliable APK local persistence
        const img = new Image();
        img.onload = () => {
          const maxDim = 512;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            onChange({ profilePic: compressedDataUrl });
          } else {
            onChange({ profilePic: rawDataUrl });
          }
        };
        img.onerror = () => {
          onChange({ profilePic: rawDataUrl });
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPronoun = (opt: PronounOption) => {
    if (profile.pronounType === opt && opt !== 'Custom') {
      // Toggle off / clear if tapped again
      onChange({ pronounType: '', customPronoun: '' });
    } else {
      onChange({ pronounType: opt });
    }
  };

  const handleClearPronouns = () => {
    onChange({ pronounType: '', customPronoun: '' });
  };

  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen bg-black text-white flex flex-col items-center justify-start px-4 pt-4 pb-28">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between py-2 mb-4 border-b border-neutral-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>sumon_ui</span>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
              Profile Creator
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure profile simulation parameters
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden">
          <img
            src="/sukuna_icon.png"
            alt="sumon_ui launcher icon"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="w-full space-y-5">
        {/* 1. Profile Picture Picker */}
        <div className="flex flex-col items-center justify-center p-4 bg-neutral-900/60 rounded-2xl border border-neutral-800/80">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img
              src={profile.profilePic || DEFAULT_AVATAR_FALLBACK}
              alt=""
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_FALLBACK;
              }}
              className="w-24 h-24 rounded-full object-cover border-2 border-neutral-700 shadow-xl group-hover:opacity-85 transition-opacity"
            />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white" />
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full text-white shadow-lg border-2 border-black"
              aria-label="Upload photo"
            >
              <Camera size={14} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            Change Profile Photo
          </button>
        </div>

        {/* 2 & 3. Username and Display Name */}
        <div className="bg-neutral-900/60 rounded-2xl p-4 border border-neutral-800/80 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Username
            </label>
            <input
              type="text"
              value={profile.username}
              onChange={(e) => onChange({ username: e.target.value })}
              placeholder="e.g. sumon"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) => onChange({ displayName: e.target.value })}
              placeholder="e.g. Sumon"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* 4, 5, 6. Metric Fields: Posts, Followers, Following */}
        <div className="bg-neutral-900/60 rounded-2xl p-4 border border-neutral-800/80 space-y-3">
          <span className="block text-xs font-semibold text-neutral-400 mb-1">
            Metrics & Counters
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Posts</label>
              <input
                type="text"
                value={profile.posts !== undefined && profile.posts !== null ? profile.posts : ''}
                onChange={(e) => onChange({ posts: e.target.value })}
                placeholder="0"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-sm text-center text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Followers</label>
              <input
                type="text"
                value={profile.followers}
                onChange={(e) => onChange({ followers: e.target.value })}
                placeholder="1,248"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-sm text-center text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Following</label>
              <input
                type="text"
                value={profile.following}
                onChange={(e) => onChange({ following: e.target.value })}
                placeholder="320"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-sm text-center text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 7 & 8. Bio and Followed by */}
        <div className="bg-neutral-900/60 rounded-2xl p-4 border border-neutral-800/80 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Bio
            </label>
            <textarea
              rows={2}
              value={profile.bio}
              onChange={(e) => onChange({ bio: e.target.value })}
              placeholder="made by sumon"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Followed by
            </label>
            <input
              type="text"
              value={profile.followedBy}
              onChange={(e) => onChange({ followedBy: e.target.value })}
              placeholder="sumon, toufik and bsdk nabir"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* 9. Pronouns */}
        <div className="bg-neutral-900/60 rounded-2xl p-4 border border-neutral-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-white">Pronouns</label>
              <p className="text-[11px] text-neutral-400">
                Optional. Select, edit, or leave empty to hide.
              </p>
            </div>
            {(profile.pronounType || profile.customPronoun) && (
              <button
                type="button"
                onClick={handleClearPronouns}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/40 border border-red-900/50 cursor-pointer"
              >
                <X size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {PRONOUN_PRESETS.map((opt) => {
              const isSelected = profile.pronounType === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectPronoun(opt)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Custom Pronoun Input if "Custom" is selected */}
          {profile.pronounType === 'Custom' && (
            <div className="pt-2 animate-in fade-in duration-150">
              <label className="block text-[11px] text-neutral-400 mb-1">
                Enter Custom Pronouns
              </label>
              <input
                type="text"
                value={profile.customPronoun}
                onChange={(e) => onChange({ customPronoun: e.target.value })}
                placeholder="e.g. Ze/Zir"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* 10. Account Privacy (Public / Private) */}
        <div className="bg-neutral-900/60 rounded-2xl p-4 border border-neutral-800/80 space-y-3">
          <div>
            <label className="text-sm font-semibold text-white">Account Privacy</label>
            <p className="text-[11px] text-neutral-400">
              Choose whether the profile is public or private.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => onChange({ accountPrivacy: 'Public' })}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                profile.accountPrivacy === 'Public'
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  profile.accountPrivacy === 'Public' ? 'border-blue-500' : 'border-neutral-600'
                }`}
              >
                {profile.accountPrivacy === 'Public' && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Globe size={15} className="shrink-0 text-neutral-400" />
                <span>Public Account</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onChange({ accountPrivacy: 'Private' })}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                profile.accountPrivacy === 'Private'
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  profile.accountPrivacy === 'Private' ? 'border-blue-500' : 'border-neutral-600'
                }`}
              >
                {profile.accountPrivacy === 'Private' && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Lock size={15} className="shrink-0 text-neutral-400" />
                <span>Private Account</span>
              </div>
            </button>
          </div>
        </div>

        {/* Large "Generate Full View" Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onGenerate}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all rounded-2xl font-semibold text-base text-white shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Generate Full View</span>
            <Sparkles size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
