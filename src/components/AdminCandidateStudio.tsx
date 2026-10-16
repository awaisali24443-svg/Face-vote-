import React, { useState } from 'react';
import {
  UserPlus,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  MoveUp,
  MoveDown,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  Stamp,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Candidate, ElectionConfig } from '../types';
import { CandidateEditorModal } from './CandidateEditorModal';
import { CandidateImageScannerModal } from './CandidateImageScannerModal';
import { renderSymbolIcon, getSymbolById } from '../services/electoralSymbols';
import {
  getLocalizedCandidateName,
  getLocalizedPartyName,
  getLocalizedSymbolName,
  getLocalizedTagline,
} from '../services/urduCandidateHelper';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface AdminCandidateStudioProps {
  candidates: Candidate[];
  config: ElectionConfig | null;
  onRefresh: () => void;
}

export const AdminCandidateStudio: React.FC<AdminCandidateStudioProps> = ({
  candidates = [],
  config,
  onRefresh,
}) => {
  const candidateList = Array.isArray(candidates) ? candidates : [];
  const { isLight } = useTheme();
  const { isUrdu } = useLanguage();
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageScannerOpen, setIsImageScannerOpen] = useState(false);
  const [isBallotLocked, setIsBallotLocked] = useState<boolean>(config?.isBallotLocked || false);
  const [showBallotPreview, setShowBallotPreview] = useState<boolean>(false);

  // Editable election metadata
  const [electionTitle, setElectionTitle] = useState<string>(
    config?.title || 'TECH EXPO 2026 GENERAL ELECTION'
  );
  const [electionSubtitle, setElectionSubtitle] = useState<string>(
    config?.subtitle || 'Official Biometric Polling Station #01'
  );
  const [configSaved, setConfigSaved] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  const handleSaveConfig = async () => {
    cyberSound.playClick();
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: electionTitle.trim(),
          subtitle: electionSubtitle.trim(),
        }),
      });
      if (res.ok) {
        cyberSound.playAccessGranted();
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 2500);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to save election configuration:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleToggleBallotLock = async () => {
    const newLockState = !isBallotLocked;
    cyberSound.playClick();
    setIsBallotLocked(newLockState);
    try {
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBallotLocked: newLockState }),
      });
      if (newLockState) cyberSound.playAccessGranted();
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle ballot lock:', err);
    }
  };

  const handleSaveCandidate = async (candidateData: Partial<Candidate>) => {
    const res = await fetch('/api/admin/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save candidate');
    }

    onRefresh();
  };

  const handleDeleteCandidate = async (id: string, name: string) => {
    cyberSound.playClick();
    if (isBallotLocked) {
      alert('Ballot paper is locked. Unlock to delete candidate.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove candidate "${name}" from the ballot paper?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/candidates/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        cyberSound.playAccessGranted();
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete candidate:', err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (isBallotLocked) {
      alert('Ballot paper is locked against reordering.');
      return;
    }
    cyberSound.playClick();
    const newOrder = [...candidateList];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    const candidateIds = newOrder.map((c) => c.id);
    try {
      await fetch('/api/admin/candidates/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds }),
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to reorder candidates:', err);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner & Ballot Security Status */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        isLight ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-cyan-900/60'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-cyan-600' : 'bg-cyan-400'} animate-ping`} />
              <span className={`text-[10px] uppercase tracking-widest font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                ELECTION COMMISSION &bull; BALLOT PAPER COMPOSER
              </span>
            </div>
            <h2 className={`text-xl font-black tracking-wide uppercase font-display mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Ballot Paper & Candidate Studio
            </h2>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Configure ballot paper title, add candidates, assign official electoral signs, upload photos, and freeze ballot paper.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Ballot Lock Toggle */}
            <button
              onClick={handleToggleBallotLock}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer border shadow-md ${
                isBallotLocked
                  ? isLight
                    ? 'bg-rose-100 border-rose-400 text-rose-800'
                    : 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : isLight
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-850'
                  : 'bg-slate-950 border-emerald-500 text-emerald-300'
              }`}
            >
              {isBallotLocked ? <Lock className={`w-4 h-4 ${isLight ? 'text-rose-700' : 'text-rose-400'}`} /> : <Unlock className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />}
              <span>{isBallotLocked ? 'BALLOT FROZEN [LOCKED]' : 'BALLOT UNLOCKED [EDITABLE]'}</span>
            </button>

            {/* WYSIWYG Preview Switch */}
            <button
              onClick={() => {
                cyberSound.playClick();
                setShowBallotPreview(!showBallotPreview);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer border ${
                showBallotPreview
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                  : isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{showBallotPreview ? 'HIDE BALLOT SHEET' : 'VIEW BALLOT SHEET'}</span>
            </button>

            {/* Add Candidate via Image (AI) */}
            <button
              onClick={() => {
                if (isBallotLocked) {
                  alert('Unlock the ballot paper first to add new candidates.');
                  return;
                }
                cyberSound.playClick();
                setIsImageScannerOpen(true);
              }}
              disabled={isBallotLocked}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer border shadow-md ${
                isBallotLocked
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
                  : isLight
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-400'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>{isUrdu ? 'تصویر سے امیدوار شامل کریں' : 'ADD VIA IMAGE (AI)'}</span>
            </button>

            {/* Add Candidate Button */}
            <button
              onClick={() => {
                if (isBallotLocked) {
                  alert('Unlock the ballot paper first to add new candidates.');
                  return;
                }
                cyberSound.playClick();
                setEditingCandidate(null);
                setIsModalOpen(true);
              }}
              disabled={isBallotLocked}
              className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 transition cursor-pointer ${
                isBallotLocked
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] border border-cyan-300'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>NOMINATE CANDIDATE</span>
            </button>
          </div>
        </div>

        {/* Election Metadata Customization Bar */}
        <div className={`pt-4 border-t grid grid-cols-1 md:grid-cols-12 gap-3 items-end ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="md:col-span-6">
            <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Election Paper Title (Header)
            </label>
            <input
              type="text"
              value={electionTitle}
              onChange={(e) => setElectionTitle(e.target.value)}
              placeholder="e.g. TECH EXPO 2026 GENERAL ELECTION"
              className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-500'
                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
              }`}
            />
          </div>

          <div className="md:col-span-4">
            <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Polling Station / Constituency Subtitle
            </label>
            <input
              type="text"
              value={electionSubtitle}
              onChange={(e) => setElectionSubtitle(e.target.value)}
              placeholder="e.g. Polling Station #01 // Zero-Impersonation Ledger"
              className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-500'
                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
              }`}
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                isLight
                  ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-600/50'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingConfig ? 'Saving...' : 'Save Title'}</span>
            </button>
          </div>
        </div>

        {configSaved && (
          <div className={`text-xs font-bold flex items-center space-x-1.5 pt-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            <CheckCircle2 className="w-4 h-4" />
            <span>Ballot title and station header updated across entire voting network!</span>
          </div>
        )}
      </div>

      {/* WYSIWYG BALLOT PAPER PREVIEW (If toggled) */}
      {showBallotPreview && (
        <div className={`p-8 rounded-3xl border-2 space-y-6 relative overflow-hidden shadow-2xl ${
          isLight
            ? 'bg-white border-cyan-500 shadow-[0_0_40px_rgba(34,211,238,0.2)]'
            : 'bg-slate-950 border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.25)]'
        }`}>
          <div className={`text-center pb-4 border-b ${isLight ? 'border-slate-200' : 'border-cyan-900/60'}`}>
            <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded border ${
              isLight ? 'text-cyan-800 bg-cyan-100 border-cyan-300' : 'text-cyan-400 bg-cyan-950 border-cyan-800'
            }`}>
              OFFICIAL BALLOT SHEET PREVIEW &bull; BOOTH VIEWPORT
            </span>
            <h2 className={`text-2xl font-black tracking-wider uppercase font-display mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {electionTitle}
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{electionSubtitle}</p>
          </div>

          {/* Candidates Rows */}
          <div className="space-y-3">
            {candidateList.map((cand, idx) => {
              const sym = getSymbolById(cand.sign_icon);
              return (
                <div
                  key={cand.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <span className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs ${
                      isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className={`w-12 h-12 rounded-xl overflow-hidden border shrink-0 ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}>
                      {cand.photo_url ? (
                        <img
                          src={cand.photo_url}
                          alt={cand.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                          {cand.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>{cand.name}</h4>
                      <p className={`text-xs ${isLight ? 'text-cyan-700 font-medium' : 'text-cyan-400'}`}>{cand.party}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl border ${sym.bgClass} ${sym.borderClass} ${sym.colorClass}`}
                    >
                      <div className="w-6 h-6 flex items-center justify-center">
                        {renderSymbolIcon(cand.sign_icon, 'w-5 h-5', cand.sign_image_url)}
                      </div>
                      <span className="text-xs font-bold">{cand.sign_name}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-xl border border-dashed flex items-center justify-center text-[9px] font-bold ${
                      isLight ? 'border-slate-400 bg-white text-slate-500' : 'border-slate-600 bg-slate-950 text-slate-600'
                    }`}>
                      STAMP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Candidate Management Grid */}
      <div className="space-y-3">
        <div className={`flex items-center justify-between text-xs px-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <span>{candidateList.length} Official Nominees on Ballot Paper</span>
          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Order reflects position on physical/digital ballot sheet</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {candidateList.map((candidate, idx) => {
            const sym = getSymbolById(candidate.sign_icon || candidate.sign_name);
            const isFirst = idx === 0;
            const isLast = idx === candidateList.length - 1;

            return (
              <div
                key={candidate.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                  isLight
                    ? 'bg-white border-slate-300 hover:border-cyan-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-cyan-900/80'
                }`}
              >
                {/* Left Profile */}
                <div className="flex items-center space-x-4">
                  {/* Order reordering buttons */}
                  <div className="flex flex-col items-center space-y-1">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={isFirst || isBallotLocked}
                      className={`p-1 rounded border disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-600 hover:text-cyan-700'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-cyan-300'
                      }`}
                      title="Move candidate up on ballot"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <span className={`text-xs font-black font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={isLast || isBallotLocked}
                      className={`p-1 rounded border disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-600 hover:text-cyan-700'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-cyan-300'
                      }`}
                      title="Move candidate down on ballot"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Candidate Photo */}
                  <div className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 shadow-md ${
                    isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-700'
                  }`}>
                    {candidate.photo_url ? (
                      <img
                        src={candidate.photo_url}
                        alt={candidate.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center font-bold text-lg absolute inset-0 -z-10 ${
                      isLight ? 'text-cyan-700 bg-slate-100' : 'text-cyan-400 bg-gradient-to-tr from-slate-900 to-slate-800'
                    }`}>
                      {candidate.name.charAt(0)}
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-base sm:text-lg font-bold tracking-wide font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {getLocalizedCandidateName(candidate.name, isUrdu)}
                      </h3>
                      {isUrdu && (
                        <span className="text-xs text-slate-500 font-sans">
                          ({candidate.name})
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-semibold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                      {getLocalizedPartyName(candidate.party, isUrdu)}
                    </div>
                    {candidate.tagline && (
                      <p className={`text-[11px] mt-1 max-w-lg leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {getLocalizedTagline(candidate.tagline, isUrdu)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Electoral Sign & Action Buttons */}
                <div className={`flex items-center justify-between md:justify-end w-full md:w-auto space-x-3 pt-3 md:pt-0 border-t md:border-t-0 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  {/* Electoral Symbol / Sign Badge */}
                  <div
                    className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-xl border ${sym.bgClass} ${sym.borderClass} ${sym.colorClass}`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      {renderSymbolIcon(candidate.sign_icon, 'w-7 h-7', candidate.sign_image_url)}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[9px] uppercase tracking-wider font-bold leading-tight ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {isUrdu ? 'انتخابی نشان' : 'ELECTORAL SIGN'}
                      </span>
                      <span className="text-xs font-bold font-mono tracking-tight leading-tight">
                        {getLocalizedSymbolName(candidate.sign_name || sym.name, isUrdu)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (isBallotLocked) {
                          alert('Unlock the ballot paper to edit candidate details.');
                          return;
                        }
                        cyberSound.playClick();
                        setEditingCandidate(candidate);
                        setIsModalOpen(true);
                      }}
                      disabled={isBallotLocked}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-cyan-800 border-slate-300 shadow-sm'
                          : 'bg-slate-950 hover:bg-slate-800 text-cyan-300 border-slate-700'
                      }`}
                      title="Edit candidate details, sign, or photo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                      disabled={isBallotLocked}
                      className={`p-2 rounded-xl border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isLight
                          ? 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 border-slate-300'
                          : 'bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border-slate-800'
                      }`}
                      title="Remove candidate from ballot paper"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Add / Edit Modal */}
      <CandidateEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCandidate(null);
        }}
        onSave={handleSaveCandidate}
        candidate={editingCandidate}
        isBallotLocked={isBallotLocked}
      />

      {/* Candidate Image AI Scanner Modal */}
      <CandidateImageScannerModal
        isOpen={isImageScannerOpen}
        onClose={() => setIsImageScannerOpen(false)}
        onCandidateExtracted={async (extractedCandidate) => {
          try {
            await handleSaveCandidate(extractedCandidate);
            cyberSound.playAccessGranted();
          } catch (err: any) {
            console.error('Failed to auto-save extracted candidate:', err);
            // Fallback: Open editor modal with preloaded candidate data
            setEditingCandidate(extractedCandidate as Candidate);
            setIsModalOpen(true);
          }
        }}
      />
    </div>
  );
};
