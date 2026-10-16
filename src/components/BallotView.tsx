import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Vote,
  ArrowLeft,
  RefreshCw,
  Stamp,
  X,
  User,
} from 'lucide-react';
import { Voter, Candidate } from '../types';
import { cyberSound } from '../services/soundEffects';
import { renderSymbolIcon, getSymbolById } from '../services/electoralSymbols';
import { getLocalizedCandidateName } from '../services/urduCandidateHelper';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { offlineStorage } from '../services/offlineStorage';

interface BallotViewProps {
  voter: Voter;
  ballotToken?: string | null;
  onVoteComplete: (message: string) => void;
  onCancel: () => void;
}

export const BallotView: React.FC<BallotViewProps> = ({
  voter,
  ballotToken,
  onVoteComplete,
  onCancel,
}) => {
  const { isLight } = useTheme();
  const { isUrdu } = useLanguage();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [voteSuccess, setVoteSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load candidates from backend or local cache
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      // First populate from local cache for instant zero-latency display
      const cached = offlineStorage.getLocalCandidates();
      if (cached.length > 0 && isMounted) {
        setCandidates(cached);
        setIsLoading(false);
      }

      try {
        const candRes = await fetch('/api/candidates');
        if (candRes.ok) {
          const candData = await candRes.json();
          if (isMounted) {
            const candList = Array.isArray(candData)
              ? candData
              : Array.isArray(candData?.candidates)
              ? candData.candidates
              : [];
            if (candList.length > 0) {
              setCandidates(candList);
              offlineStorage.saveCandidatesLocally(candList);
            }
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.warn('Network offline or failed, using cached candidates:', err);
        if (isMounted) {
          const localCands = offlineStorage.getLocalCandidates();
          if (localCands.length > 0) {
            setCandidates(localCands);
          }
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle choice selection with audio stamp
  const handleSelectChoice = (choiceName: string) => {
    cyberSound.playClick();
    cyberSound.playStampSound();
    setSelectedChoice(choiceName);
  };

  // Submit cast ballot securely (Online or Offline with encrypted local queue)
  const handleSubmitVote = async () => {
    if (!selectedChoice) {
      cyberSound.playSecurityAlarm();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Try online submission if connected
    if (navigator.onLine) {
      try {
        const response = await fetch('/api/ballots/cast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voterId: voter.id,
            candidateName: selectedChoice,
            ballotToken: ballotToken || undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Mark voted locally as well
            offlineStorage.markVoterAsVotedLocally(voter.id);
            cyberSound.playVoteSuccess();
            setVoteSuccess(true);
            setTimeout(() => {
              onVoteComplete(
                isUrdu
                  ? `${voter.name}`
                  : `${voter.name}`
              );
            }, 1800);
            return;
          }
        }

        // The server answered and REJECTED this ballot (already voted, not
        // approved, missing/expired check-in token, invalid choice). That is
        // final: show the real error. Never record it offline and never show
        // a fake success — the previous code did exactly that.
        const errData = await response.json().catch(() => ({}));
        setSubmitError(
          errData.error ||
            (isUrdu ? 'سرور نے ووٹ مسترد کر دیا۔' : 'The server rejected this ballot.')
        );
        cyberSound.playSecurityAlarm();
        setIsSubmitting(false);
        return;
      } catch (netErr) {
        console.warn('Network unreachable, recording in offline audit ledger:', netErr);
      }
    }

    // Offline mode recording: store in local encrypted queue and immediately mark voter as voted
    try {
      offlineStorage.recordOfflineVote(voter.id, selectedChoice);
      cyberSound.playVoteSuccess();
      setVoteSuccess(true);
      setTimeout(() => {
        onVoteComplete(
          isUrdu
            ? `${voter.name}`
            : `${voter.name}`
        );
      }, 1800);
    } catch {
      setIsSubmitting(false);
      cyberSound.playSecurityAlarm();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
      {voteSuccess ? (
        /* VOTE CAST SUCCESS CARD */
        <div
          id="vote-success-celebration"
          className={`p-8 sm:p-12 rounded-3xl border-4 text-center max-w-lg mx-auto shadow-2xl transition-all ${
            isLight
              ? 'bg-white border-emerald-500 shadow-emerald-200/80'
              : 'bg-slate-900 border-emerald-400 shadow-[0_0_50px_rgba(52,211,153,0.3)]'
          }`}
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 rounded-3xl bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xl">
            <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 animate-bounce" />
          </div>
          <h2
            className={`text-2xl sm:text-3xl md:text-4xl font-black font-display ${
              isLight ? 'text-blue-950' : 'text-white'
            }`}
          >
            {isUrdu ? 'ووٹ درج ہو گیا' : 'Vote Cast Successfully!'}
          </h2>
          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {voter.name}
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* TOP BAR: VOTER NAME & RETURN BUTTON */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border-2 transition-all shadow-md flex items-center justify-between ${
              isLight
                ? 'bg-white border-blue-200'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            {/* Voter Identification */}
            <div className="flex items-center space-x-3">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 ${
                  isLight
                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                    : 'bg-blue-950 border-blue-400 text-blue-300'
                }`}
              >
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {isUrdu ? 'ووٹر' : 'Voter'}
                </div>
                <h1
                  className={`text-lg sm:text-xl font-black tracking-tight font-display ${
                    isLight ? 'text-blue-950' : 'text-white'
                  }`}
                >
                  {voter.name}
                </h1>
              </div>
            </div>

            {/* Return / Cancel Button */}
            <button
              id="ballot-exit-btn"
              onClick={() => {
                cyberSound.playClick();
                onCancel();
              }}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl flex items-center space-x-2 cursor-pointer font-bold text-xs sm:text-sm transition border shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isUrdu ? 'واپس جائیں' : 'Back'}</span>
            </button>
          </div>

          {/* BALLOT PAPER GRID (CANDIDATE NAME & SYMBOL PICTURE) */}
          {isLoading ? (
            <div className="p-16 text-center text-blue-600 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="w-10 h-10 animate-spin" />
              <p className="font-bold text-sm">{isUrdu ? 'بیلٹ پیپر لوڈ ہو رہا ہے...' : 'Loading Ballot Paper...'}</p>
            </div>
          ) : (
            <div
              className={`p-4 sm:p-6 md:p-8 rounded-3xl border-4 transition-all shadow-xl ${
                isLight
                  ? 'bg-[#f7fbff] border-blue-600 shadow-blue-200/50'
                  : 'bg-slate-950 border-blue-500/80 shadow-[0_0_40px_rgba(37,99,235,0.25)]'
              }`}
            >
              {/* CANDIDATE GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {(Array.isArray(candidates) ? candidates : []).map((candidate) => {
                  const isSelected = selectedChoice === candidate.name;
                  const symbol = getSymbolById(candidate.sign_icon || candidate.sign_name);

                  return (
                    <div
                      key={candidate.id}
                      id={`ballot-candidate-${candidate.id}`}
                      onClick={() => handleSelectChoice(candidate.name)}
                      className={`p-5 sm:p-6 rounded-3xl border-3 transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 group relative overflow-hidden ${
                        isSelected
                          ? isLight
                            ? 'bg-white border-emerald-600 ring-4 ring-emerald-500/30 shadow-xl scale-[1.01]'
                            : 'bg-slate-900 border-emerald-400 ring-4 ring-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.35)] scale-[1.01]'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                          : 'bg-slate-900/80 border-slate-800 hover:border-blue-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Left: Picture of Symbol & Candidate Name */}
                      <div className="flex items-center space-x-4 sm:space-x-5 flex-1 min-w-0">
                        {/* PIC OF CANDIDATE'S ELECTORAL SYMBOL */}
                        <div
                          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-md transition-all group-hover:scale-105 ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                              : isLight
                              ? `${symbol.bgClass || 'bg-blue-50'} ${symbol.borderClass || 'border-blue-300'}`
                              : 'bg-slate-950 border-slate-700'
                          }`}
                        >
                          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                            {renderSymbolIcon(
                              candidate.sign_icon || candidate.sign_name,
                              'w-12 h-12 sm:w-14 sm:h-14 text-blue-600 dark:text-blue-400',
                              candidate.sign_image_url
                            )}
                          </div>
                        </div>

                        {/* Candidate Name */}
                        <div className="flex-1 truncate">
                          <h3
                            className={`text-xl sm:text-2xl font-black tracking-tight leading-snug truncate ${
                              isLight ? 'text-blue-950' : 'text-white'
                            }`}
                          >
                            {getLocalizedCandidateName(candidate.name, isUrdu)}
                          </h3>
                        </div>
                      </div>

                      {/* Right: Stamp Button / Target */}
                      <div
                        className={`px-3.5 py-3 rounded-2xl border-2 flex items-center space-x-1.5 transition-all shrink-0 ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg animate-pulse'
                            : isLight
                            ? 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
                            : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-blue-500'
                        }`}
                      >
                        <Stamp
                          className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            isSelected ? 'text-white animate-bounce' : 'text-blue-600 dark:text-blue-400'
                          }`}
                        />
                        <span className="text-xs sm:text-sm font-black">
                          {isSelected ? (isUrdu ? 'منتخب' : 'Stamped') : (isUrdu ? 'مہر لگائیں' : 'Stamp')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border-2 border-rose-500 text-rose-600 dark:text-rose-300 text-sm font-bold text-center">
              {submitError}
            </div>
          )}

          {/* BOTTOM ACTION BAR: SELECTED CANDIDATE & CAST VOTE BUTTON */}
          <div
            className={`p-4 sm:p-6 rounded-3xl border-2 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
              isLight ? 'bg-white border-blue-200' : 'bg-slate-900/95 border-slate-800'
            }`}
          >
            {/* Selected Choice Notice */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                {isUrdu ? 'منتخب امیدوار:' : 'Selected:'}
              </span>
              <div className="text-lg sm:text-xl font-black truncate">
                {selectedChoice ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {getLocalizedCandidateName(selectedChoice, isUrdu)}
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-600 italic">
                    {isUrdu ? 'کوئی انتخاب نہیں کیا گیا' : 'No candidate selected yet'}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons: Clear & Cast Vote */}
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              {selectedChoice && (
                <button
                  onClick={() => {
                    cyberSound.playClick();
                    setSelectedChoice(null);
                  }}
                  disabled={isSubmitting}
                  className={`px-4 py-3 rounded-2xl border flex items-center space-x-1.5 font-bold text-xs sm:text-sm cursor-pointer transition ${
                    isLight
                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800'
                      : 'bg-rose-950/60 hover:bg-rose-900/80 border-rose-800 text-rose-300'
                  }`}
                >
                  <X className="w-4 h-4" />
                  <span>{isUrdu ? 'منسوخ' : 'Clear'}</span>
                </button>
              )}

              <button
                id="submit-ballot-btn"
                onClick={handleSubmitVote}
                disabled={!selectedChoice || isSubmitting}
                className={`px-6 py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base flex items-center space-x-2.5 shadow-xl transition-all cursor-pointer ${
                  !selectedChoice || isSubmitting
                    ? isLight
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-300'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/40 hover:scale-105 active:scale-95'
                }`}
              >
                <Vote className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <span>
                  {isSubmitting
                    ? isUrdu
                      ? 'ووٹ درج ہو رہا ہے...'
                      : 'Casting Vote...'
                    : isUrdu
                    ? 'ووٹ ڈالیں'
                    : 'Cast Vote'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
