import React, { useState } from 'react';
import {
  Vote,
  UserPlus,
  CheckCircle2,
  ScanFace,
  ShieldCheck,
  Wifi,
  WifiOff,
  Download,
  CloudDownload,
  Trophy,
  RefreshCw,
  X,
  Info,
} from 'lucide-react';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { usePWA } from '../hooks/usePWA';

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
  const [prepareMessage, setPrepareMessage] = useState<string | null>(null);

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

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-12 flex flex-col items-center justify-center min-h-[65vh]">
      {/* SUCCESS CONFIRMATION IF COMING FROM A JUST-SUBMITTED VOTE */}
      {lastVoteRecordedMessage && (
        <div
          id="last-vote-recorded-banner"
          className={`w-full max-w-md mb-6 p-5 rounded-3xl border-2 flex items-center space-x-3.5 animate-fade-in shadow-xl ${
            isOfflineSavedVote
              ? isLight
                ? 'bg-amber-50 border-amber-500 text-amber-950'
                : 'bg-amber-950/90 border-amber-400 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
              : isLight
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
              : 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-[0_0_30px_rgba(52,211,153,0.3)]'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-md ${
              isOfflineSavedVote
                ? isLight
                  ? 'bg-amber-100 border-amber-500 text-amber-800'
                  : 'bg-amber-900 border-amber-400 text-amber-300'
                : isLight
                ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                : 'bg-emerald-900 border-emerald-400 text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div
              className={`text-xs font-bold uppercase tracking-wider ${
                isOfflineSavedVote ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {isOfflineSavedVote
                ? isUrdu
                  ? 'ووٹ اس ڈیوائس میں محفوظ ہے'
                  : 'Vote Saved on This Device'
                : isUrdu
                ? 'ووٹ درج ہو چکا ہے'
                : 'Vote Successfully Recorded'}
            </div>
            <div className="text-lg font-black truncate mt-0.5">
              {lastVoteRecordedMessage}
            </div>
          </div>
        </div>
      )}

      {/* MAIN KIOSK LAUNCH CARD */}
      <div
        className={`w-full max-w-xl rounded-3xl border-2 p-6 sm:p-10 text-center flex flex-col items-center transition-all shadow-xl ${
          isLight
            ? 'bg-white border-blue-200'
            : 'bg-slate-950/95 border-slate-800 shadow-2xl'
        }`}
      >
        {/* Kiosk Icon Header */}
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl border-2 flex items-center justify-center mb-4 shadow-lg ${
            isLight
              ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-blue-100'
              : 'bg-blue-950/90 border-blue-400 text-blue-300 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
          }`}
        >
          <ScanFace className="w-9 h-9 sm:w-11 sm:h-11" />
        </div>

        <h1
          className={`text-2xl sm:text-3xl font-black font-display tracking-tight ${
            isLight ? 'text-blue-950' : 'text-white'
          }`}
        >
          {isUrdu ? 'بائیو میٹرک ووٹنگ بوتھ' : 'Biometric Voting Kiosk'}
        </h1>

        <p
          className={`text-xs sm:text-sm font-medium mt-2 max-w-md ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          {isUrdu
            ? 'چہرے کی فوری بائیو میٹرک تصدیق سے اپنا ووٹ مکمل رازداری کے ساتھ کاسٹ کریں۔'
            : 'Instant facial biometric verification & secret ballot voting.'}
        </p>

        {/* Offline Readiness & Security Badge */}
        <div className="mt-3.5 flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>
              {isOnline
                ? isUrdu
                  ? 'آن لائن — آف لائن کے لیے تیار کیا جا سکتا ہے'
                  : 'Online — Can Be Prepared for Offline Use'
                : hasSavedData
                ? isUrdu
                  ? 'آف لائن — محفوظ ڈیٹا دستیاب ہے'
                  : 'Offline — Saved Data Available'
                : isUrdu
                ? 'آف لائن — ڈیوائس ابھی تیار نہیں'
                : 'Offline — Device Not Prepared Yet'}
            </span>
          </span>
          {cachedVotersCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {cachedVotersCount} {isUrdu ? 'ووٹرز محفوظ' : 'Voters Saved'}
              </span>
            </span>
          )}
          {cachedCandidatesCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Vote className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {cachedCandidatesCount} {isUrdu ? 'امیدوار محفوظ' : 'Candidates Saved'}
              </span>
            </span>
          )}
        </div>

        {/* PRIMARY CALL TO ACTION BUTTON: CAST VOTE */}
        <div className="mt-8 mb-5 w-full max-w-sm">
          <button
            id="start-cast-vote-btn"
            onClick={handleStart}
            className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 text-white font-black text-lg sm:text-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center space-x-3 transition duration-200 transform hover:scale-[1.02] active:scale-95 cursor-pointer border border-emerald-300"
          >
            <Vote className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
            <span>{isUrdu ? 'ووٹ ڈالیں' : 'Cast Vote'}</span>
          </button>
        </div>

        {/* THREE EASY STEPS — written for a first-time voter, not an officer */}
        <div className="w-full max-w-md grid grid-cols-3 gap-2 sm:gap-3" aria-label="How to vote">
          {[
            { number: '1', en: 'Tap Cast Vote', ur: 'ووٹ ڈالیں دبائیں' },
            { number: '2', en: 'Face check', ur: 'چہرے کی تصدیق' },
            { number: '3', en: 'Pick & confirm', ur: 'منتخب کر کے تصدیق کریں' },
          ].map((step) => (
            <div
              key={step.number}
              className={`rounded-2xl border px-2 py-3 ${isLight ? 'bg-blue-50/70 border-blue-100' : 'bg-slate-900 border-slate-800'}`}
            >
              <div className="w-7 h-7 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black">
                {step.number}
              </div>
              <div className={`mt-2 text-[11px] sm:text-xs font-black leading-tight ${isLight ? 'text-blue-950' : 'text-slate-100'}`}>
                {isUrdu ? step.ur : step.en}
              </div>
            </div>
          ))}
        </div>

        {/* OTHER MAIN ACTIONS */}
        <div className="mt-6 pt-6 border-t w-full grid grid-cols-1 sm:grid-cols-2 gap-3 border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              cyberSound.playClick();
              onGoToEnroll();
            }}
            className={`w-full py-3.5 px-5 rounded-2xl border-2 flex items-center justify-center space-x-2.5 font-bold text-sm sm:text-base cursor-pointer transition shadow-sm ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-400'
                : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-600/50'
            }`}
          >
            <UserPlus className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{isUrdu ? 'نیا ووٹر رجسٹر کریں' : 'Register New Voter'}</span>
          </button>

          <button
            onClick={() => {
              cyberSound.playClick();
              onViewResults?.();
            }}
            className={`w-full py-3.5 px-5 rounded-2xl border-2 flex items-center justify-center space-x-2.5 font-bold text-sm sm:text-base cursor-pointer transition shadow-sm ${
              isLight
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-400'
                : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-600/50'
            }`}
          >
            <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{isUrdu ? 'نتائج دیکھیں' : 'View Results'}</span>
          </button>
        </div>
      </div>

      {/* INSTALL + OFFLINE SETUP CARD */}
      <section
        aria-label="Install and offline setup"
        className={`w-full max-w-xl mt-6 rounded-3xl border-2 p-5 sm:p-7 shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-950/95 border-slate-800'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 ${
              isLight ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-blue-950 border-blue-400 text-blue-300'
            }`}
          >
            <CloudDownload className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className={`text-lg sm:text-xl font-black ${isLight ? 'text-blue-950' : 'text-white'}`}>
              {isUrdu ? 'ایپ ڈاؤن لوڈ کریں — آف لائن استعمال کریں' : 'Download the App — Use It Offline'}
            </h2>
            <p className={`text-xs sm:text-sm font-medium mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isUrdu
                ? 'ایک بار آن لائن رہتے ہوئے ایپ انسٹال کریں اور “ڈیوائس تیار کریں” دبائیں۔ اس کے بعد ایپ اسی ڈیوائس پر انٹرنیٹ کے بغیر کھل سکے گی۔'
                : 'While online once, install the app and tap “Prepare This Device.” After that, FaceVote can open and run on this device without internet.'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] sm:text-xs font-bold">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${isAppCached || isInstalled ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500' : 'bg-slate-500/10 border-slate-400/30 text-slate-400'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isAppCached || isInstalled
              ? isUrdu
                ? 'ایپ فائلیں محفوظ ہیں'
                : 'App Files Saved'
              : isUrdu
              ? 'ایپ فائلیں محفوظ ہو رہی ہیں'
              : 'Saving App Files…'}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${isLight ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-900 border-slate-700 text-slate-200'}`}>
            <Vote className="w-3.5 h-3.5" />
            {cachedCandidatesCount} {isUrdu ? 'امیدوار محفوظ' : 'Candidates Saved'}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${isLight ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-900 border-slate-700 text-slate-200'}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {cachedVotersCount} {isUrdu ? 'ووٹر محفوظ' : 'Voters Saved'}
          </span>
          {lastSyncTime && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-700 text-slate-300'}`}>
              <RefreshCw className="w-3.5 h-3.5" />
              {isUrdu ? 'آخری تیاری: ' : 'Last prepared: '}
              {lastSyncTime.toLocaleDateString()} {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleInstall}
            disabled={isInstalled}
            className={`py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition ${
              isInstalled
                ? 'bg-emerald-600/15 border-2 border-emerald-500/50 text-emerald-500 cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer active:scale-95'
            }`}
          >
            {isInstalled ? <CheckCircle2 className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            <span>{isInstalled ? (isUrdu ? 'ایپ انسٹال ہے' : 'App Installed') : isUrdu ? 'ایپ انسٹال کریں' : 'Install App'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrepareOffline}
            disabled={!isOnline || isPreparingOffline}
            className={`py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition border-2 ${
              !isOnline || isPreparingOffline
                ? isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-lg cursor-pointer active:scale-95'
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

        {!isOnline && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs sm:text-sm font-bold flex gap-2.5">
            <Info className="w-5 h-5 shrink-0" />
            <span>
              {isUrdu
                ? 'آپ آف لائن ہیں۔ تیاری صرف آن لائن رہتے ہوئے ہو سکتی ہے؛ پہلے سے محفوظ ڈیٹا اب بھی استعمال ہو سکتا ہے۔'
                : 'You are offline. Preparation can only run online; data already saved on this device can still be used.'}
            </span>
          </div>
        )}

        {prepareMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold">
            {prepareMessage}
          </div>
        )}

        {pendingVotesCount > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs sm:text-sm font-bold flex gap-2.5">
            <Info className="w-5 h-5 shrink-0" />
            <span>
              {isUrdu
                ? `${pendingVotesCount} ووٹ اس ڈیوائس میں محفوظ ہیں۔ انٹرنیٹ آنے پر افسر ان کا جائزہ لے گا۔`
                : `${pendingVotesCount} vote(s) are saved on this device. An officer must review them when the internet returns.`}
            </span>
          </div>
        )}

        <p className={`mt-4 text-[11px] sm:text-xs font-semibold leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {isUrdu
            ? 'نوٹ: نئی رجسٹریشن اور حتمی ووٹ گنتی کے لیے سرور ضروری ہے۔ آف لائن ووٹ اس ڈیوائس میں محفوظ رہتا ہے، خودکار طور پر گنا نہیں جاتا۔'
            : 'Note: New registration and final vote counting need the server. An offline vote stays saved on this device — it is not counted automatically.'}
        </p>
      </section>

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
                <p>{isUrdu ? 'اوپر دائیں طرف ⋮ مینو دبائیں، پھر “Install app” یا “Add to Home screen” منتخب کریں۔' : 'Tap the ⋮ menu at the top right, then choose “Install app” or “Add to Home screen.”'}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isLight ? 'bg-blue-50 border-blue-100' : 'bg-slate-950 border-slate-800'}`}>
                <div className="font-black mb-1">iPhone / Safari</div>
                <p>{isUrdu ? 'Share بٹن دبائیں، پھر “Add to Home Screen” منتخب کریں۔' : 'Tap the Share button, then choose “Add to Home Screen.”'}</p>
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
