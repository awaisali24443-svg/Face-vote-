import React, { useState, useEffect } from 'react';
import {
  Vote,
  RefreshCw,
  Trophy,
  Printer,
  TrendingUp,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { PublicElectionResults } from '../types';
import { offlineStorage } from '../services/offlineStorage';
import { renderSymbolIcon, getSymbolById } from '../services/electoralSymbols';
import {
  getLocalizedCandidateName,
  getLocalizedPartyName,
  getLocalizedTagline,
} from '../services/urduCandidateHelper';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { PrintForm47Modal } from './PrintForm47Modal';

interface PublicResultsBallotViewProps {
  onGoToKiosk?: () => void;
}

export const PublicResultsBallotView: React.FC<PublicResultsBallotViewProps> = ({ onGoToKiosk }) => {
  const { isLight } = useTheme();
  const { isUrdu } = useLanguage();
  const [results, setResults] = useState<PublicElectionResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isForm47PrintOpen, setIsForm47PrintOpen] = useState<boolean>(false);
  const [isShowingSavedResults, setIsShowingSavedResults] = useState<boolean>(false);

  // Fetch live election results from backend. Every successful response is
  // saved on this device; if the network is unavailable, show that saved
  // copy and label it clearly instead of leaving a blank results screen.
  const fetchResults = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await fetch('/api/public/results');
      if (res.ok) {
        const data: PublicElectionResults = await res.json();
        setResults(data);
        setIsShowingSavedResults(false);
        offlineStorage.saveResultsLocally(data);
        return;
      }
      throw new Error(`Results request failed: ${res.status}`);
    } catch (err) {
      console.warn('Failed to fetch public results, using saved copy if available:', err);
      const saved = offlineStorage.getLocalResults();
      if (saved) {
        setResults(saved);
        setIsShowingSavedResults(true);
      }
    } finally {
      setIsLoading(false);
      if (showSpinner) setIsRefreshing(false);
    }
  };

  // Initial load and periodic polling every 3 seconds for real-time live update
  useEffect(() => {
    fetchResults();
    const interval = setInterval(() => {
      fetchResults(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !results) {
    return (
      <div className="w-full max-w-6xl mx-auto py-16 text-center flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="font-bold text-base text-slate-700 dark:text-slate-300">
          {isUrdu ? 'انتخابی نتائج لوڈ ہو رہے ہیں...' : 'Loading Election Results...'}
        </p>
      </div>
    );
  }

  const candidatesList = results?.candidates || [];

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6 flex flex-col space-y-4 sm:space-y-6">
      {/* TOP HEADER & ACTION BAR */}
      <div
        className={`w-full p-4 sm:p-5 rounded-3xl border-2 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isLight
            ? 'bg-white border-blue-200'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-sm ${
              isLight
                ? 'bg-blue-50 border-blue-600 text-blue-700'
                : 'bg-blue-950/90 border-blue-400 text-blue-300'
            }`}
          >
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1
              className={`text-lg sm:text-xl font-black tracking-tight font-display ${
                isLight ? 'text-blue-950' : 'text-white'
              }`}
            >
              {isUrdu ? 'سرکاری انتخابی نتائج' : 'Live Election Results'}
            </h1>
            <div
              className={`flex items-center space-x-2 text-xs font-semibold ${
                isShowingSavedResults ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isShowingSavedResults ? (
                <WifiOff className="w-3.5 h-3.5" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
              <span>
                {isShowingSavedResults
                  ? isUrdu
                    ? 'محفوظ شدہ نتائج — آف لائن کاپی'
                    : 'Saved Results — Offline Copy'
                  : isUrdu
                  ? 'براہ راست اپ ڈیٹ'
                  : 'Live Feed Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons with clear labels */}
        <div className="flex items-center space-x-2 sm:space-x-3 self-end sm:self-auto">
          <button
            onClick={() => {
              cyberSound.playClick();
              setIsForm47PrintOpen(true);
            }}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 transition cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>{isUrdu ? 'پرنٹ فارم 47' : 'Print Form-47'}</span>
          </button>

          <button
            onClick={() => {
              cyberSound.playClick();
              fetchResults(true);
            }}
            disabled={isRefreshing}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border flex items-center space-x-2 font-bold text-xs sm:text-sm transition cursor-pointer shadow-sm ${
              isLight
                ? 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-900'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden md:inline">{isUrdu ? 'تازہ کریں' : 'Refresh'}</span>
          </button>

          {onGoToKiosk && (
            <button
              onClick={onGoToKiosk}
              className="px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md cursor-pointer"
            >
              <Vote className="w-4 h-4" />
              <span>{isUrdu ? 'ووٹ ڈالیں' : 'Cast Vote'}</span>
            </button>
          )}
        </div>
      </div>

      {/* CANDIDATE RESULTS GRID (SYMBOL PICTURE & CANDIDATE NAME) */}
      <div
        className={`w-full rounded-3xl border p-4 sm:p-6 md:p-8 relative overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-slate-950 border-slate-800'
        }`}
      >
        {/* CANDIDATE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {candidatesList.length === 0 && (
            <div className={`md:col-span-2 p-6 rounded-3xl border-2 text-center font-bold ${isLight ? 'bg-white border-blue-200 text-blue-950' : 'bg-slate-900 border-slate-700 text-slate-100'}`}>
              {isUrdu
                ? 'اس ڈیوائس پر ابھی کوئی نتیجہ محفوظ نہیں۔ ایک بار انٹرنیٹ سے منسلک ہو کر تازہ کریں۔'
                : 'No results are saved on this device yet. Connect to the internet once and tap Refresh.'}
            </div>
          )}
          {candidatesList.map((cand) => {
            const symbol = getSymbolById(cand.sign_icon || cand.sign_name);
            const isLeading = cand.isLeading;

            return (
              <div
                key={cand.id}
                id={`ballot-result-card-${cand.id}`}
                className={`p-5 sm:p-6 rounded-3xl border-3 transition-all duration-300 relative overflow-hidden flex flex-col justify-between gap-4 ${
                  isLeading
                    ? isLight
                      ? 'bg-white border-blue-500 shadow-xl ring-4 ring-blue-400/20'
                      : 'bg-slate-900 border-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.3)] ring-4 ring-blue-500/30'
                    : isLight
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                {/* Symbol Image & Candidate Name */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 sm:space-x-5 flex-1 min-w-0">
                    {/* PIC OF CANDIDATE'S ELECTORAL SYMBOL */}
                    <div
                      className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-md ${
                        isLeading
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : isLight
                          ? `${symbol.bgClass || 'bg-blue-50'} ${symbol.borderClass || 'border-blue-300'}`
                          : 'bg-slate-950 border-slate-700'
                      }`}
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                        {renderSymbolIcon(
                          cand.sign_icon || cand.sign_name,
                          'w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400',
                          cand.sign_image_url
                        )}
                      </div>
                    </div>

                    {/* Candidate Name */}
                    <div className="flex-1 truncate">
                      <h3
                        className={`text-lg sm:text-xl font-black tracking-tight leading-snug truncate ${
                          isLight ? 'text-blue-950' : 'text-white'
                        }`}
                      >
                        {getLocalizedCandidateName(cand.name, isUrdu)}
                      </h3>
                    </div>
                  </div>

                  {/* Leading Banner / Trophy */}
                  {isLeading && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center space-x-1 shrink-0 shadow-md">
                      <Trophy className="w-4 h-4" />
                      <span>{isUrdu ? 'سب سے آگے' : 'Leading'}</span>
                    </div>
                  )}
                </div>

                {/* Party, tagline & optional candidate details */}
                <div className="space-y-1.5">
                  <p className={`text-xs sm:text-sm font-bold ${isLight ? 'text-blue-800' : 'text-blue-300'}`}>
                    {getLocalizedPartyName(cand.party, isUrdu)}
                  </p>
                  {cand.tagline && (
                    <p className={`text-[11px] sm:text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {getLocalizedTagline(cand.tagline, isUrdu)}
                    </p>
                  )}
                  {(cand.profession || cand.age || cand.hometown) && (
                    <p className={`text-[11px] sm:text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {[cand.profession, cand.age ? `${cand.age} yrs` : null, cand.hometown]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  )}
                  {cand.education && (
                    <p className={`text-[11px] sm:text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span className="font-bold">{isUrdu ? 'تعلیم: ' : 'Education: '}</span>
                      {cand.education}
                    </p>
                  )}
                  {cand.experience && (
                    <p className={`text-[11px] sm:text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span className="font-bold">{isUrdu ? 'تجربہ: ' : 'Experience: '}</span>
                      {cand.experience}
                    </p>
                  )}
                </div>

                {/* Live Vote Count & Progress Bar */}
                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                    <span className="text-slate-600 dark:text-slate-400">
                      {isUrdu ? 'کل ووٹ:' : 'Total Votes:'}
                    </span>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className={`text-base font-black ${isLight ? 'text-blue-950' : 'text-white'}`}>
                        {cand.votes.toLocaleString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-black ${
                        isLeading
                          ? 'bg-emerald-600 text-white'
                          : isLight ? 'bg-blue-100 text-blue-900' : 'bg-slate-800 text-blue-300'
                      }`}>
                        {cand.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isLeading
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                      }`}
                      style={{ width: `${Math.max(cand.percentage, 3)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PRINT FORM 47 MODAL */}
      <PrintForm47Modal
        isOpen={isForm47PrintOpen}
        onClose={() => setIsForm47PrintOpen(false)}
        candidates={candidatesList}
        totalVotes={results?.totalVotesCast || 0}
        totalRegisteredVoters={results?.totalRegistered || 0}
        constituency={results?.constituency || ''}
        district=""
        pollingStationsCount={0}
      />
    </div>
  );
};
