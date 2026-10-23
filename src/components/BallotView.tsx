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
import { renderSymbolIcon } from '../services/electoralSymbols';
import {
  getLocalizedCandidateName,
  getLocalizedPartyName,
  getLocalizedSymbolName,
} from '../services/urduCandidateHelper';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { offlineStorage } from '../services/offlineStorage';
import { isDeviceMode } from '../services/deviceMode';

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
  const [submissionMode, setSubmissionMode] = useState<'online' | 'offline'>('online');
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

  // Submit a ballot online, or save it in this device's local offline queue.
  const handleSubmitVote = async () => {
    if (!selectedChoice) {
      cyberSound.playSecurityAlarm();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Submit via the API — in Device Mode the API is on this device,
    // so casting works with no internet at all.
    if (navigator.onLine || isDeviceMode()) {
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
            setSubmissionMode('online');
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
            (isUrdu
              ? 'ووٹ مسترد کر دیا گیا۔'
              : isDeviceMode()
              ? 'This device rejected this ballot.'
              : 'The server rejected this ballot.')
        );
        cyberSound.playSecurityAlarm();
        setIsSubmitting(false);
        return;
      } catch (netErr) {
        console.warn('Network unreachable, recording in offline audit ledger:', netErr);
      }
    }

    // Offline mode: store the ballot in this device's local queue and mark
    // the voter as voted on THIS device. It is not a server-counted vote
    // yet — an officer must review the saved queue when a connection returns,
    // because final casting requires the live check-in token.
    try {
      setSubmissionMode('offline');
      offlineStorage.recordOfflineVote(voter.id, selectedChoice);
      cyberSound.playVoteSuccess();
      setVoteSuccess(true);
      setTimeout(() => {
        onVoteComplete(
          isUrdu ? `آف لائن محفوظ — ${voter.name}` : `Offline saved — ${voter.name}`
        );
      }, 2600);
    } catch {
      setIsSubmitting(false);
      cyberSound.playSecurityAlarm();
    }
  };

  const constituencyLabel = voter.constituency || 'NA-127 (Lahore-XI)';
  const pollingStationLabel =
    voter.polling_station || 'Polling Station #42, Govt. Model High School';

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
            {submissionMode === 'offline'
              ? (isUrdu ? 'ووٹ اس ڈیوائس میں محفوظ ہو گیا' : 'Vote Saved on This Device')
              : isUrdu
              ? 'ووٹ درج ہو گیا'
              : 'Vote Cast Successfully!'}
          </h2>
          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {voter.name}
          </p>
          <p className={`text-sm sm:text-base font-semibold mt-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {submissionMode === 'offline'
              ? (isUrdu
                  ? 'انٹرنیٹ واپس آنے پر افسر اس محفوظ ووٹ کا جائزہ لے گا۔'
                  : 'When the internet returns, an officer must review this saved vote before it can be counted.')
              : isUrdu
              ? isDeviceMode()
                ? 'آپ کا ووٹ اسی ڈیوائس میں درج ہو چکا ہے۔'
                : 'آپ کا ووٹ سرور میں درج ہو چکا ہے۔'
              : isDeviceMode()
              ? 'Your vote has been recorded on this device.'
              : 'Your vote has been recorded by the server.'}
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
              className={`px-4 min-h-[44px] py-2 rounded-2xl flex items-center space-x-2 cursor-pointer font-bold text-xs sm:text-sm transition border shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isUrdu ? 'واپس جائیں' : 'Back'}</span>
            </button>
          </div>

          {/* REALISTIC ECP NATIONAL ASSEMBLY BALLOT PAPER (green paper) */}
          {isLoading ? (
            <div className="p-16 text-center text-emerald-900 flex flex-col items-center justify-center space-y-4 bg-[#dcefd9] rounded-md border-2 border-emerald-900/60">
              <RefreshCw className="w-10 h-10 animate-spin" />
              <p className="font-bold text-sm">{isUrdu ? 'بیلٹ پیپر لوڈ ہو رہا ہے...' : 'Loading Ballot Paper...'}</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[4px] border-[3px] border-emerald-950/80 bg-[#dcefd9] text-slate-950 shadow-2xl">
              {/* faint printed-dot texture + watermark */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.35]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(20,83,45,0.13) 1px, transparent 0)',
                  backgroundSize: '22px 22px',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[9rem] sm:text-[13rem] font-black tracking-tighter text-emerald-900/[0.05] select-none">
                  ECP
                </span>
              </div>

              <div className="relative flex">
                {/* COUNTERFOIL (perforated stub, as on a real ballot book) */}
                <div className="hidden md:flex w-16 shrink-0 flex-col items-center justify-between border-r-2 border-dashed border-emerald-950/60 py-4">
                  <span
                    className="text-[10px] font-black tracking-[0.3em] text-emerald-950/80"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    COUNTERFOIL — قومی اسمبلی
                  </span>
                  <div className="w-10 space-y-3">
                    <div>
                      <div className="h-8 border border-emerald-950/60 bg-white/40" />
                      <p className="mt-1 text-[7px] font-bold text-center leading-tight">Elector No.</p>
                    </div>
                    <div>
                      <div className="h-10 border border-emerald-950/60 bg-white/40" />
                      <p className="mt-1 text-[7px] font-bold text-center leading-tight">Thumb Impression</p>
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-bold text-emerald-950/70"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    No. 042127
                  </span>
                </div>

                {/* MAIN PAPER */}
                <div className="flex-1 min-w-0 p-4 sm:p-6">
                  {/* HEADER */}
                  <div className="text-center border-b-2 border-emerald-950/80 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-20 text-left">
                        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wide">Serial No.</p>
                        <p className="text-xs sm:text-sm font-black border border-emerald-950/70 bg-white/50 px-1.5 py-0.5 inline-block">
                          042127
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="mx-auto w-12 h-12 rounded-full border-2 border-emerald-950 flex items-center justify-center font-black text-sm tracking-widest">
                          ECP
                        </div>
                        <h2 className="mt-1.5 text-sm sm:text-lg font-black tracking-wide uppercase">
                          Election Commission of Pakistan
                        </h2>
                        <p className="text-base sm:text-xl font-black leading-tight">الیکشن کمیشن آف پاکستان</p>
                      </div>
                      <div className="w-20 text-right">
                        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wide">Nine-Matrix Seal</p>
                        <div className="inline-grid grid-cols-3 gap-1 border border-emerald-950/70 bg-white/50 p-1.5">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-950" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 bg-emerald-950 text-[#dcefd9] py-1.5 px-3">
                      <p className="text-lg sm:text-2xl font-black tracking-[0.2em]">BALLOT PAPER</p>
                      <p className="text-sm sm:text-lg font-black leading-tight">بیلٹ پیپر — قومی اسمبلی</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] sm:text-xs font-black uppercase">
                      <span>Constituency: {constituencyLabel}</span>
                      <span>{pollingStationLabel}</span>
                    </div>
                    <p className="mt-1 text-[10px] sm:text-[11px] font-bold">
                      Stamp ONE box only — صرف ایک خانے میں مہر لگائیں
                    </p>
                  </div>

                  {/* OFFICIAL MARKS */}
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[9px] sm:text-[10px] font-bold">
                    <div className="border border-emerald-950/60 bg-white/40 px-2 py-1.5">
                      Official Code Mark: <span className="font-black">ECP-NA127-42</span>
                    </div>
                    <div className="border border-emerald-950/60 bg-white/40 px-2 py-1.5 flex items-end justify-between gap-2">
                      <span>Assistant Presiding Officer</span>
                      <span className="font-serif italic text-xs sm:text-sm border-b border-emerald-950/60 px-2">
                        A. Presiding Officer
                      </span>
                    </div>
                  </div>

                  {/* COLUMN HEADINGS */}
                  <div className="mt-4 grid grid-cols-[2.2rem_minmax(0,1fr)_4.8rem_4.8rem] sm:grid-cols-[3rem_minmax(0,1fr)_7rem_7rem] border-2 border-emerald-950/90 bg-emerald-950/[0.08] text-[9px] sm:text-[11px] font-black uppercase">
                    <div className="px-1 py-2 text-center border-r border-emerald-950/60">S. No.</div>
                    <div className="px-2 py-2 border-r border-emerald-950/60">Candidate — امیدوار</div>
                    <div className="px-1 py-2 text-center border-r border-emerald-950/60">Symbol — نشان</div>
                    <div className="px-1 py-2 text-center">Stamp — مہر</div>
                  </div>

                  {/* CANDIDATE ROWS — name + symbol only, as printed on a real paper */}
                  <div className="border-2 border-t-0 border-emerald-950/90">
                    {(Array.isArray(candidates) ? candidates : []).map((candidate, index) => {
                      const isSelected = selectedChoice === candidate.name;
                      const urduName = getLocalizedCandidateName(candidate.name, true);
                      const urduParty = getLocalizedPartyName(candidate.party, true);
                      const urduSymbol = getLocalizedSymbolName(candidate.sign_name, true);
                      const symbolHasUrdu = /[؀-ۿ]/.test(candidate.sign_name);

                      return (
                        <div
                          key={candidate.id}
                          id={`ballot-candidate-${candidate.id}`}
                          onClick={() => handleSelectChoice(candidate.name)}
                          className={`grid grid-cols-[2.2rem_minmax(0,1fr)_4.8rem_4.8rem] sm:grid-cols-[3rem_minmax(0,1fr)_7rem_7rem] items-stretch cursor-pointer transition-colors ${
                            index > 0 ? 'border-t border-emerald-950/70' : ''
                          } ${isSelected ? 'bg-emerald-200/80' : 'bg-white/35 hover:bg-white/60'}`}
                        >
                          <div className="flex items-center justify-center border-r border-emerald-950/60 font-black text-sm sm:text-base">
                            {index + 1}
                          </div>

                          <div className="px-2 sm:px-3 py-2.5 border-r border-emerald-950/60 min-w-0">
                            <h3 className="text-base sm:text-xl font-black leading-snug truncate">
                              {candidate.name}
                            </h3>
                            {urduName !== candidate.name && (
                              <p className="text-sm sm:text-lg font-bold leading-snug truncate">{urduName}</p>
                            )}
                            <p className="text-[10px] sm:text-xs font-bold text-slate-700 truncate">
                              {candidate.party}
                              {urduParty !== candidate.party ? ` — ${urduParty}` : ''}
                            </p>
                          </div>

                          <div className="flex flex-col items-center justify-center border-r border-emerald-950/60 px-1 py-2">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">
                              {renderSymbolIcon(
                                candidate.sign_icon || candidate.sign_name,
                                'w-9 h-9 sm:w-12 sm:h-12 text-slate-950',
                                candidate.sign_image_url
                              )}
                            </div>
                            <p className="text-[8px] sm:text-[10px] font-black text-center leading-tight">
                              {candidate.sign_name}
                            </p>
                            {!symbolHasUrdu && urduSymbol !== candidate.sign_name && (
                              <p className="text-[8px] sm:text-[10px] font-bold text-center leading-tight">
                                {urduSymbol}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-center p-1.5 sm:p-2">
                            <div
                              className={`w-full h-full min-h-[3.8rem] border-2 border-dashed flex flex-col items-center justify-center gap-0.5 ${
                                isSelected
                                  ? 'border-blue-900 bg-blue-100/50'
                                  : 'border-emerald-950/50'
                              }`}
                            >
                              {isSelected ? (
                                <div className="flex flex-col items-center justify-center border-[3px] border-blue-900 text-blue-900 rounded-full w-14 h-14 sm:w-[4.2rem] sm:h-[4.2rem] -rotate-12 bg-white/60">
                                  <Stamp className="w-5 h-5 sm:w-6 sm:h-6" />
                                  <span className="text-[8px] sm:text-[9px] font-black tracking-widest">VOTED</span>
                                </div>
                              ) : (
                                <>
                                  <Stamp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-950/40" />
                                  <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-emerald-950/50 text-center leading-tight">
                                    STAMP HERE
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {candidates.length === 0 && (
                      <p className="py-8 text-center text-sm font-black">
                        No candidates on this ballot paper yet — the officer adds them in Admin.
                      </p>
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="mt-3 border-t-2 border-dashed border-emerald-950/60 pt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] sm:text-[10px] font-bold">
                    <span>After stamping, fold the paper vertically and put it in the ballot box.</span>
                    <span className="uppercase tracking-widest">Specimen for demonstration</span>
                  </div>
                </div>
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
                  className={`px-4 min-h-[48px] py-3 rounded-2xl border flex items-center space-x-1.5 font-bold text-xs sm:text-sm cursor-pointer transition ${
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
