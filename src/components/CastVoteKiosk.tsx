import React, { useState } from 'react';
import {
  Vote,
  UserPlus,
  CheckCircle2,
  ScanFace,
  Trophy,
  RefreshCw,
  X,
  Info,
  Download,
  CloudDownload,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { usePWA } from '../hooks/usePWA';
import { getAppMode, setAppMode, isAppShell, type AppMode } from '../services/deviceMode';

interface CastVoteKioskProps {
  onStartCastVote: () => void;
  onGoToEnroll: () => void;
  onViewResults?: () => void;
  lastVoteRecordedMessage?: string | null;
  onClearVoteMessage?: () => void;
}

export const CastVoteKiosk: React.FC<CastVoteKioskProps> = ({
  onStartCastVote,
  onGoToEnroll,
  onViewResults,
  lastVoteRecordedMessage,
  onClearVoteMessage,
}) => {
  const { isLight } = useTheme();
  const { isUrdu } = useLanguage();
  const {
    isOnline,
    isInstallable,
    isInstalled,
    isAppCached,
    installApp,
    cachedVotersCount,
    cachedCandidatesCount,
    pendingVotesCount,
    isPreparingOffline,
    prepareOfflineData,
    lastSyncTime,
  } = usePWA();
  const [showInstallHelp, setShowInstallHelp] = useState<boolean>(false);
  const [showDevicePanel, setShowDevicePanel] = useState<boolean>(false);
  const [prepareMessage, setPrepareMessage] = useState<string | null>(null);
  const [appMode, setAppModeState] = useState<AppMode>(() => getAppMode());
  const inShell = isAppShell();

  const isOfflineSavedVote =
    !!lastVoteRecordedMessage &&
    (lastVoteRecordedMessage.startsWith('Offline saved') || lastVoteRecordedMessage.startsWith('آف لائن محفوظ'));
  const hasSavedData = cachedCandidatesCount > 0 || cachedVotersCount > 0;

  const handleStart = () => {
    cyberSound.playClick();
    if (onClearVoteMessage) onClearVoteMessage();
    onStartCastVote();
  };

  const handleInstall = async () => {
    cyberSound.playClick();
    if (isInstalled) return;
    if (isInstallable) {
      const accepted = await installApp();
      if (!accepted) setShowInstallHelp(true);
    } else {
      // Some browsers (especially iPhone Safari) never fire the install
      // prompt. Show the three simple manual steps instead of doing nothing.
      setShowInstallHelp(true);
    }
  };

  const handlePrepareOffline = async () => {
    cyberSound.playClick();
    setPrepareMessage(null);
    const result = await prepareOfflineData();
    if (!result) {
      setPrepareMessage(
        isUrdu
          ? 'پہلے انٹرنیٹ سے منسلک ہوں، پھر یہ بٹن دبائیں۔'
          : 'Connect to the internet first, then tap this button.'
      );
      return;
    }

    if (result.registryAuthorized) {
      setPrepareMessage(
        isUrdu
          ? `تیار ہے: ${result.candidates} امیدوار اور ${result.voters} ووٹر اس ڈیوائس میں محفوظ ہو گئے۔`
          : `Ready: ${result.candidates} candidates and ${result.voters} voters are saved on this device.`
      );
    } else {
      setPrepareMessage(
        isUrdu
          ? `بیلٹ لسٹ محفوظ ہو گئی (${result.candidates} امیدوار)۔ ووٹر لسٹ صرف افسر کے سائن ان کے بعد ڈاؤن لوڈ ہوگی تاکہ بائیو میٹرک ڈیٹا محفوظ رہے۔`
          : `Ballot list saved (${result.candidates} candidates). The voter list downloads only after officer sign-in, to protect biometric data.`
      );
    }
  };

  const handleSwitchMode = (mode: AppMode) => {
    cyberSound.playClick();
    setAppMode(mode);
    setAppModeState(mode);
    window.location.reload();
  };

  const statusText = isOnline
    ? isUrdu
      ? 'آن لائن — تیار ہے'
      : 'Online — Ready'
    : hasSavedData
    ? isUrdu
      ? 'آف لائن — محفوظ ڈیٹا سے تیار ہے'
      : 'Offline — Ready with saved data'
    : isUrdu
    ? 'آف لائن — ڈیوائس تیار نہیں'
    : 'Offline — Device not prepared yet';

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center min-h-[65vh]">
      {/* SUCCESS CONFIRMATION IF COMING FROM A JUST-SUBMITTED VOTE */}
      {lastVoteRecordedMessage && (
        <div
          id="last-vote-recorded-banner"
          className={`w-full mb-5 p-4 rounded-2xl border flex items-center gap-3 animate-fade-in ${
            isOfflineSavedVote
              ? isLight
                ? 'bg-amber-50 border-amber-400 text-amber-950'
                : 'bg-amber-950/90 border-amber-500/60 text-amber-100'
              : isLight
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
              : 'bg-emerald-950/90 border-emerald-500/60 text-emerald-100'
          }`}
        >
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
              {isOfflineSavedVote
                ? isUrdu
                  ? 'ووٹ اس ڈیوائس میں محفوظ ہے'
                  : 'Vote Saved on This Device'
                : isUrdu
                ? 'ووٹ درج ہو چکا ہے'
                : 'Vote Successfully Recorded'}
            </div>
            <div className="text-base font-black truncate">{lastVoteRecordedMessage}</div>
          </div>
        </div>
      )}

      {/* ONE CLEAN MAIN CARD */}
      <div
        className={`w-full rounded-3xl border p-6 sm:p-9 text-center flex flex-col items-center shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-950/95 border-slate-800'
        }`}
      >
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 ${
            isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-950/80 text-blue-300'
          }`}
        >
          <ScanFace className="w-8 h-8 sm:w-9 sm:h-9" />
        </div>

        <h1 className={`text-2xl sm:text-3xl font-black font-display tracking-tight ${isLight ? 'text-blue-950' : 'text-white'}`}>
          {isUrdu ? 'بائیو میٹرک ووٹنگ بوتھ' : 'Biometric Voting Kiosk'}
        </h1>

        <p className={`text-sm mt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {isUrdu
            ? 'چہرے کی تصدیق کریں اور اپنا ووٹ ڈالیں۔'
            : 'Verify your face and cast your vote.'}
        </p>

        {/* ONE quiet status line */}
        <div className={`mt-3 flex items-center gap-2 text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : hasSavedData ? 'bg-amber-500' : 'bg-rose-500'}`} />
          <span>{statusText}</span>
          {(cachedCandidatesCount > 0 || cachedVotersCount > 0) && (
            <span>
              • {cachedCandidatesCount} {isUrdu ? 'امیدوار' : 'candidates'} • {cachedVotersCount}{' '}
              {isUrdu ? 'ووٹر' : 'voters'}
            </span>
          )}
        </div>

        {/* PRIMARY ACTION */}
        <button
          id="start-cast-vote-btn"
          onClick={handleStart}
          className="mt-7 w-full max-w-sm py-4 sm:py-5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 transition active:scale-[0.98] cursor-pointer"
        >
          <Vote className="w-7 h-7 shrink-0" />
          <span>{isUrdu ? 'ووٹ ڈالیں' : 'Cast Vote'}</span>
        </button>

        {/* THREE SIMPLE STEPS */}
        <div className="mt-6 w-full max-w-md grid grid-cols-3 gap-2" aria-label="How to vote">
          {[
            { number: '1', en: 'Tap Cast Vote', ur: 'ووٹ ڈالیں دبائیں' },
            { number: '2', en: 'Face check', ur: 'چہرے کی تصدیق' },
            { number: '3', en: 'Pick & confirm', ur: 'منتخب کر کے تصدیق کریں' },
          ].map((step) => (
            <div key={step.number} className="flex flex-col items-center gap-1.5 py-1">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                {step.number}
              </div>
              <div className={`text-[11px] sm:text-xs font-bold leading-tight ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {isUrdu ? step.ur : step.en}
              </div>
            </div>
          ))}
        </div>

        {/* SECONDARY ACTIONS */}
        <div className="mt-6 pt-5 border-t w-full grid grid-cols-2 gap-3 border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              cyberSound.playClick();
              onGoToEnroll();
            }}
            className={`w-full py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-700'
            }`}
          >
            <UserPlus className="w-5 h-5 shrink-0" />
            <span>{isUrdu ? 'نیا ووٹر رجسٹر کریں' : 'Register New Voter'}</span>
          </button>

          <button
            onClick={() => {
              cyberSound.playClick();
              onViewResults?.();
            }}
            className={`w-full py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-700'
            }`}
          >
            <Trophy className="w-5 h-5 shrink-0" />
            <span>{isUrdu ? 'نتائج دیکھیں' : 'View Results'}</span>
          </button>
        </div>
      </div>

      {/* SAVED VOTES WAITING FOR OFFICER REVIEW — one slim line, only when it matters */}
      {pendingVotesCount > 0 && (
        <div className="w-full mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs sm:text-sm font-bold flex gap-2.5">
          <Info className="w-5 h-5 shrink-0" />
          <span>
            {isUrdu
              ? `${pendingVotesCount} ووٹ اس ڈیوائس میں محفوظ ہیں۔ انٹرنیٹ آنے پر افسر ان کا جائزہ لے گا۔`
              : `${pendingVotesCount} vote(s) are saved on this device. An officer must review them when the internet returns.`}
          </span>
        </div>
      )}

      {/* QUIET LINK TO APP & OFFLINE SETTINGS */}
      <button
        type="button"
        onClick={() => setShowDevicePanel((v) => !v)}
        className={`mt-5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer ${
          isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
        }`}
        aria-expanded={showDevicePanel}
      >
        <ShieldCheck className="w-4 h-4" />
        <span>{isUrdu ? 'ایپ اور آف لائن سیٹنگز' : 'App & Offline Settings'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDevicePanel ? 'rotate-180' : ''}`} />
      </button>

      {/* APP & OFFLINE SETTINGS — everything secondary lives here, out of the way */}
      {showDevicePanel && (
        <section
          aria-label="App and offline settings"
          className={`w-full mt-3 rounded-3xl border p-5 sm:p-6 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-950/95 border-slate-800'
          }`}
        >
          <div className={`space-y-1.5 text-xs sm:text-sm font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            <p>
              {inShell
                ? isUrdu
                  ? '✓ ایپ فائلیں ایپ کے اندر موجود ہیں — انٹرنیٹ کی ضرورت نہیں'
                  : '✓ App files are built into the app — no internet needed'
                : isAppCached || isInstalled
                ? isUrdu
                  ? '✓ ایپ فائلیں محفوظ ہیں'
                  : '✓ App files saved'
                : isUrdu
                ? 'ایپ فائلیں محفوظ ہو رہی ہیں…'
                : 'Saving app files…'}
            </p>
            <p>
              {cachedCandidatesCount} {isUrdu ? 'امیدوار محفوظ' : 'candidates saved'} • {cachedVotersCount}{' '}
              {isUrdu ? 'ووٹر محفوظ' : 'voters saved'}
              {appMode === 'device' &&
                (isUrdu ? ' — تمام ڈیٹا اسی ڈیوائس پر ہے' : ' — all data lives on this device')}
            </p>
            {lastSyncTime && (
              <p className="inline-flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                {isUrdu ? 'آخری تیاری: ' : 'Last prepared: '}
                {lastSyncTime.toLocaleDateString()} {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {!inShell && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleInstall}
              disabled={isInstalled}
              className={`py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition ${
                isInstalled
                  ? 'bg-emerald-600/15 border border-emerald-500/50 text-emerald-500 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-[0.98]'
              }`}
            >
              {isInstalled ? <CheckCircle2 className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              <span>{isInstalled ? (isUrdu ? 'ایپ انسٹال ہے' : 'App Installed') : isUrdu ? 'ایپ انسٹال کریں' : 'Install App'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrepareOffline}
              disabled={!isOnline || isPreparingOffline}
              className={`py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition border ${
                !isOnline || isPreparingOffline
                  ? isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white cursor-pointer active:scale-[0.98]'
              }`}
            >
              {isPreparingOffline ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CloudDownload className="w-5 h-5" />}
              <span>
                {isPreparingOffline
                  ? isUrdu
                    ? 'تیار ہو رہا ہے…'
                    : 'Preparing…'
                  : isUrdu
                  ? 'ڈیوائس تیار کریں'
                  : 'Prepare This Device'}
              </span>
            </button>
          </div>

          )}

          {!inShell && !isOnline && (
            <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs sm:text-sm font-bold flex gap-2.5">
              <Info className="w-5 h-5 shrink-0" />
              <span>
                {isUrdu
                  ? 'آپ آف لائن ہیں۔ تیاری صرف آن لائن رہتے ہوئے ہو سکتی ہے؛ پہلے سے محفوظ ڈیٹا اب بھی استعمال ہو سکتا ہے۔'
                  : 'You are offline. Preparation can only run online; data already saved on this device can still be used.'}
              </span>
            </div>
          )}

          {!inShell && prepareMessage && (
            <div className="mt-4 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold">
              {prepareMessage}
            </div>
          )}

          {/* MODE SWITCH — one quiet row (hidden in the app shells: the app always runs on-device) */}
          {inShell ? (
            <div className={`mt-4 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <p className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {isUrdu ? 'ایپ موڈ: سب کچھ اسی ڈیوائس پر چلتا ہے' : 'App mode: everything runs on this device'}
              </p>
            </div>
          ) : (
          <div className={`mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <p className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {appMode === 'device'
                ? isUrdu
                  ? 'موڈ: ڈیوائس (مکمل آف لائن ڈیمو)'
                  : 'Mode: Device — fully offline demo'
                : isUrdu
                ? 'موڈ: سرور (آن لائن)'
                : 'Mode: Server — online'}
            </p>
            <button
              type="button"
              onClick={() => handleSwitchMode(appMode === 'device' ? 'server' : 'device')}
              className={`py-2 px-3.5 rounded-xl font-black text-xs border cursor-pointer active:scale-95 ${
                isLight
                  ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                  : 'border-slate-600 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {appMode === 'device'
                ? isUrdu
                  ? 'سرور موڈ پر جائیں'
                  : 'Switch to Server Mode'
                : isUrdu
                ? 'ڈیوائس موڈ پر جائیں'
                : 'Switch to Device Mode'}
            </button>
          </div>
          )}

          <p className={`mt-3 text-[11px] sm:text-xs font-semibold leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {appMode === 'device'
              ? isUrdu
                ? 'ڈیوائس موڈ میں رجسٹریشن، منظوری، ووٹ اور نتائج سب اسی ڈیوائس پر مکمل ہوتے ہیں۔ ووٹر صرف افسر درج کرتا ہے۔'
                : 'In Device Mode, enrollment, voting and results all complete on this device. Voters are added only by the officer, and they can vote straight away.'
              : isUrdu
              ? 'سرور موڈ میں ڈیٹا آن لائن سرور پر محفوظ ہوتا ہے۔ آف لائن ووٹ اس ڈیوائس میں محفوظ رہتا ہے، خودکار طور پر گنا نہیں جاتا۔'
              : 'In Server Mode, data is stored on the online server. An offline vote stays saved on this device — it is not counted automatically.'}
          </p>
        </section>
      )}

      {/* SIMPLE INSTALL HELP — used when the browser gives no install prompt */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl ${isLight ? 'bg-white border-blue-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black">{isUrdu ? 'ایپ کیسے انسٹال کریں' : 'How to Install FaceVote'}</h3>
                <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isUrdu ? 'اپنے فون یا کمپیوٹر کے مطابق آسان طریقہ منتخب کریں۔' : 'Choose the simple steps for your phone or computer.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800 border-slate-700'}`}
                aria-label="Close install help"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm font-semibold">
              <div className={`p-4 rounded-2xl border ${isLight ? 'bg-blue-50 border-blue-100' : 'bg-slate-950 border-slate-800'}`}>
                <div className="font-black mb-1">Android / Chrome</div>
                <p>{isUrdu ? 'اوپر دائیں طرف ⋮ مینو دبائیں، پھر "Install app" یا "Add to Home screen" منتخب کریں۔' : 'Tap the ⋮ menu at the top right, then choose "Install app" or "Add to Home screen."'}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isLight ? 'bg-blue-50 border-blue-100' : 'bg-slate-950 border-slate-800'}`}>
                <div className="font-black mb-1">iPhone / Safari</div>
                <p>{isUrdu ? 'Share بٹن دبائیں، پھر "Add to Home Screen" منتخب کریں۔' : 'Tap the Share button, then choose "Add to Home Screen."'}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isLight ? 'bg-blue-50 border-blue-100' : 'bg-slate-950 border-slate-800'}`}>
                <div className="font-black mb-1">Computer / Chrome</div>
                <p>{isUrdu ? 'ایڈریس بار میں موجود انسٹال آئیکن پر کلک کریں۔' : 'Click the install icon in the address bar.'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallHelp(false)}
              className="mt-5 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black"
            >
              {isUrdu ? 'سمجھ گیا' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
