import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download, Wifi, WifiOff, RefreshCw, Smartphone, CheckCircle, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const PWAInstallBanner: React.FC = () => {
  const {
    isOnline,
    isInstallable,
    isInstalled,
    installApp,
    pendingVotesCount,
    cachedVotersCount,
    isSyncing,
    syncOfflineData,
  } = usePWA();

  const { isUrdu } = useLanguage();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  return (
    <>
      {/* Network & Offline Status Banner */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        {/* Live Connectivity Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 ${
            isOnline
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse'
          }`}
          title={isOnline ? 'Online — Server synced' : 'Offline Mode Active — Operating locally'}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">{isUrdu ? 'آن لائن' : 'ONLINE'}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">{isUrdu ? 'آف لائن موڈ' : 'OFFLINE MODE'}</span>
            </>
          )}
        </div>

        {/* Cached Voters Count Badge */}
        {cachedVotersCount > 0 && (
          <div
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px]"
            title={`${cachedVotersCount} biometric records cached for offline verification`}
          >
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>{cachedVotersCount} {isUrdu ? 'ووٹرز محفوظ' : 'Voters Ready'}</span>
          </div>
        )}

        {/* Unsynced Offline Ballots Notification */}
        {pendingVotesCount > 0 && (
          <button
            onClick={syncOfflineData}
            disabled={!isOnline || isSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              isOnline
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 cursor-pointer'
                : 'bg-amber-950/40 border border-amber-800/50 text-amber-400 opacity-80 cursor-default'
            }`}
            title={
              isOnline
                ? 'Saved offline votes stay on this device for officer review. They cannot be auto-cast without a new live check-in token.'
                : 'Votes are stored on this device until an officer can review them online.'
            }
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {pendingVotesCount} {isUrdu ? 'محفوظ ووٹ' : 'Saved Votes'}
            </span>
          </button>
        )}

        {/* PWA Install Button for Chromium / Android / Desktop */}
        {isInstallable && !isInstalled && (
          <button
            onClick={installApp}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm hover:shadow transition-all text-xs cursor-pointer active:scale-95"
            title="Install FaceVote as standalone app for offline use"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'ایپ انسٹال کریں' : 'Install App'}</span>
          </button>
        )}

        {/* iOS PWA Guided Install Button */}
        {isIOS && !isInstalled && (
          <button
            onClick={() => setShowIOSModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isUrdu ? 'iOS انسٹال' : 'Install on iOS'}</span>
          </button>
        )}
      </div>

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Install FaceVote on iOS</h3>
                <p className="text-xs text-slate-400">Run completely offline on iPhone/iPad</p>
              </div>
            </div>

            <ol className="space-y-3 text-sm text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                <span>Tap the <strong>Share</strong> button in Safari's bottom toolbar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                <span>Scroll down and select <strong>"Add to Home Screen"</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                <span>Launch FaceVote from your home screen anytime, with or without internet.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
