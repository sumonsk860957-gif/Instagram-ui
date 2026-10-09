import React, { useState } from 'react';
import { X, Smartphone, Download, Check, Terminal, FolderGit2 } from 'lucide-react';

interface AndroidProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidProjectModal: React.FC<AndroidProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const buildCommand = 'cd android && ./gradlew assembleDebug';

  const handleCopyCommand = () => {
    navigator.clipboard?.writeText(buildCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[440px] max-h-[90vh] bg-[#18181b] border border-neutral-800 rounded-3xl p-5 z-10 flex flex-col shadow-2xl text-left animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Android APK Project</h2>
              <span className="text-xs text-neutral-400">sumon_ui build configuration</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-sm text-neutral-300">
          {/* Direct Download Action */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-700/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Production Ready APK</h3>
                <p className="text-xs text-neutral-400">sumon_ui.apk (Signed release, 1.7 MB)</p>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                Ready
              </span>
            </div>
            <a
              href="./sumon_ui.apk"
              download="sumon_ui.apk"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              <Download size={16} />
              <span>Download sumon_ui.apk</span>
            </a>
          </div>

          {/* Identity Card */}
          <div className="bg-neutral-900/90 rounded-2xl p-4 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">App Name</span>
              <span className="text-sm font-semibold text-white font-mono">sumon_ui</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Package ID</span>
              <span className="text-xs font-medium text-neutral-300 font-mono">com.sumon.ui</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Embedded Launcher Icon</span>
              <span className="text-xs text-emerald-400 font-medium">Fixed at Build Time</span>
            </div>
          </div>

          {/* Project Structure notice */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Project Structure
            </h3>
            <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800 font-mono text-[11px] text-neutral-400 space-y-1">
              <div>📁 android/</div>
              <div className="pl-4">├── 📄 build.gradle.kts</div>
              <div className="pl-4">├── 📄 settings.gradle.kts</div>
              <div className="pl-4">└── 📁 app/</div>
              <div className="pl-8">├── 📄 build.gradle.kts</div>
              <div className="pl-8">└── 📁 src/main/</div>
              <div className="pl-12">├── 📄 AndroidManifest.xml (sumon_ui)</div>
              <div className="pl-12">├── 📁 java/com/sumon/ui/MainActivity.kt</div>
              <div className="pl-12">└── 📁 res/mipmap-*/ic_launcher.png</div>
            </div>
          </div>

          {/* How to build APK */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Building Your Personal APK
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Open the <code className="text-neutral-200">/android</code> folder in Android Studio and select{' '}
              <strong className="text-white">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>, or run:
            </p>
            <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-xl p-2.5">
              <code className="text-xs font-mono text-emerald-400 truncate mr-2">
                {buildCommand}
              </code>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="shrink-0 p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                title="Copy command"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Terminal size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
