import React from 'react';
import {
  Vote,
  UserPlus,
  CheckCircle2,
  ScanFace,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { usePWA } from '../hooks/usePWA';

interface CastVoteKioskProps {
  onStartCastVote: () => void;
  onGoToEnroll: () => void;
  lastVoteRecordedMessage?: string | null;
  onClearVoteMessage?: () => void;
}

export const CastVoteKiosk: React.FC<CastVoteKioskProps> = ({
  onStartCastVote,
  onGoToEnroll,
  lastVoteRecordedMessage,
  onClearVoteMessage,
}) => {
  const { isLight } = useTheme();
  const { isUrdu } = useLanguage();
  const { isOnline, cachedVotersCount, pendingVotesCount } = usePWA();

  const handleStart = () => {
    cyberSound.playClick();
    if (onClearVoteMessage) onClearVoteMessage();
    onStartCastVote();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-12 flex flex-col items-center justify-center min-h-[65vh]">
      {/* SUCCESS CONFIRMATION IF COMING FROM A JUST-SUBMITTED VOTE */}
      {lastVoteRecordedMessage && (
        <div
          id="last-vote-recorded-banner"
          className={`w-full max-w-md mb-6 p-5 rounded-3xl border-2 flex items-center space-x-3.5 animate-fade-in shadow-xl ${
            isLight
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
              : 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-[0_0_30px_rgba(52,211,153,0.3)]'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-md ${
              isLight
                ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                : 'bg-emerald-900 border-emerald-400 text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              {isUrdu ? 'ووٹ درج ہو چکا ہے' : 'Vote Successfully Recorded'}
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
                  ? 'آن لائن و آف لائن محفوظ موڈ'
                  : 'Online & 100% Offline Ready'
                : isUrdu
                ? 'مکمل آف لائن موڈ فعال'
                : 'Offline Mode Active'}
            </span>
          </span>
          {cachedVotersCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {cachedVotersCount} {isUrdu ? 'ووٹرز محفوظ' : 'Voters Registered'}
              </span>
            </span>
          )}
        </div>

        {/* PRIMARY CALL TO ACTION BUTTON: CAST VOTE */}
        <div className="my-8 w-full max-w-sm">
          <button
            id="start-cast-vote-btn"
            onClick={handleStart}
            className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 text-white font-black text-lg sm:text-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center space-x-3 transition duration-200 transform hover:scale-[1.02] active:scale-95 cursor-pointer border border-emerald-300"
          >
            <Vote className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
            <span>{isUrdu ? 'ووٹ ڈالیں' : 'Cast Vote'}</span>
          </button>
        </div>

        {/* SECONDARY CALL TO ACTION: REGISTER NEW VOTER */}
        <div className="pt-6 border-t w-full flex items-center justify-center border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              cyberSound.playClick();
              onGoToEnroll();
            }}
            className={`w-full max-w-sm py-3 px-5 rounded-2xl border-2 flex items-center justify-center space-x-2.5 font-bold text-sm sm:text-base cursor-pointer transition shadow-sm ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-400'
                : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-600/50'
            }`}
          >
            <UserPlus className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{isUrdu ? 'نیا ووٹر رجسٹر کریں' : 'Register New Voter'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
