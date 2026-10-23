import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Check,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Candidate } from '../types';
import {
  ELECTORAL_SYMBOLS,
  ElectoralSymbol,
  renderSymbolIcon,
  getSymbolById,
} from '../services/electoralSymbols';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { PORTRAIT_1, PORTRAIT_2, PORTRAIT_3, PORTRAIT_4, PORTRAIT_6, PORTRAIT_8 } from '../services/candidatePhotos';

interface CandidateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (candidate: Partial<Candidate>) => Promise<void>;
  candidate?: Candidate | null;
  isBallotLocked?: boolean;
}

const PRESET_PHOTOS = [
  PORTRAIT_3,
  PORTRAIT_2,
  PORTRAIT_8,
  PORTRAIT_4,
  PORTRAIT_6,
  PORTRAIT_1,
];

export const CandidateEditorModal: React.FC<CandidateEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  candidate,
  isBallotLocked,
}) => {
  const { isLight } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const signFileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState('');
  const [party, setParty] = useState('');
  const [tagline, setTagline] = useState('');
  const [signName, setSignName] = useState('Cricket Bat (بلہ)');
  const [signIcon, setSignIcon] = useState('bat');
  const [signImageUrl, setSignImageUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [education, setEducation] = useState('');
  const [profession, setProfession] = useState('');
  const [age, setAge] = useState('');
  const [hometown, setHometown] = useState('');
  const [experience, setExperience] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (candidate) {
      setName(candidate.name || '');
      setParty(candidate.party || '');
      setTagline(candidate.tagline || '');
      setSignName(candidate.sign_name || 'Cricket Bat (بلہ)');
      setSignIcon(candidate.sign_icon || 'bat');
      setSignImageUrl(candidate.sign_image_url || '');
      setPhotoUrl(candidate.photo_url || '');
      setEducation(candidate.education || '');
      setProfession(candidate.profession || '');
      setAge(candidate.age ? String(candidate.age) : '');
      setHometown(candidate.hometown || '');
      setExperience(candidate.experience || '');
    } else {
      setName('');
      setParty('');
      setTagline('');
      setSignName('Cricket Bat (بلہ)');
      setSignIcon('bat');
      setSignImageUrl('');
      setPhotoUrl(PRESET_PHOTOS[0]);
      setEducation('');
      setProfession('');
      setAge('');
      setHometown('');
      setExperience('');
    }
    setError(null);
  }, [candidate, isOpen]);

  if (!isOpen) return null;

  const handleSelectSymbol = (sym: ElectoralSymbol) => {
    cyberSound.playClick();
    setSignIcon(sym.id);
    setSignName(`${sym.name} (${sym.nameUrdu})`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
      cyberSound.playClick();
    };
    reader.readAsDataURL(file);
  };

  const handleSignFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file for candidate sign.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSignImageUrl(reader.result as string);
      cyberSound.playClick();
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Candidate Name is required.');
      return;
    }
    if (!signName.trim()) {
      setError('Electoral Symbol / Sign is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    cyberSound.playClick();

    try {
      await onSave({
        id: candidate ? candidate.id : `cand-${Date.now()}`,
        name: name.trim(),
        party: (party || 'Independent').trim(),
        tagline: tagline.trim(),
        sign_name: signName.trim(),
        sign_icon: signIcon,
        sign_image_url: signImageUrl.trim() || undefined,
        photo_url: photoUrl,
        education: education.trim() || undefined,
        profession: profession.trim() || undefined,
        age: age.trim() ? Number(age.trim()) : undefined,
        hometown: hometown.trim() || undefined,
        experience: experience.trim() || undefined,
      });
      cyberSound.playAccessGranted();
      onClose();
    } catch (err: any) {
      cyberSound.playSecurityAlarm();
      setError(err.message || 'Failed to save candidate profile');
    } finally {
      setIsSaving(false);
    }
  };

  const activeSymbol = getSymbolById(signIcon);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full max-w-2xl border-2 rounded-t-3xl sm:rounded-3xl shadow-2xl my-0 sm:my-8 overflow-hidden ${
        isLight
          ? 'bg-white border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.25)]'
          : 'bg-slate-900 border-blue-500/70 shadow-[0_0_50px_rgba(59,130,246,0.3)]'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-blue-950 bg-slate-950/60'
        }`}>
          <div>
            <span className={`text-[10px] uppercase tracking-widest font-bold ${
              isLight ? 'text-blue-700' : 'text-blue-400'
            }`}>
              BALLOT PAPER STUDIO &bull; CANDIDATE EDITOR
            </span>
            <h2 className={`text-xl font-bold tracking-wide font-display mt-0.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {candidate ? 'Edit Candidate Details' : 'Nominate New Candidate'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close editor"
            className={`w-11 h-11 flex items-center justify-center rounded-full transition cursor-pointer shrink-0 ${
              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isBallotLocked && (
          <div className="p-4 bg-rose-950/80 border-b border-rose-600 text-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Ballot paper is currently frozen for security. Unlock before saving changes.</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-950/80 border-b border-rose-600 text-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[calc(100dvh-64px)] sm:max-h-[75vh] overflow-y-auto">
          {/* Candidate Name & Party */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Candidate Legal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Barrister Muhammad Ali Khan"
                className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                    : 'bg-slate-950 border-slate-700 text-white focus:border-blue-400'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Political Party / Coalition
              </label>
              <input
                type="text"
                value={party}
                onChange={(e) => setParty(e.target.value)}
                placeholder="e.g. Pakistan Tehreek-e-Insaf (PTI)"
                className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                    : 'bg-slate-950 border-slate-700 text-white focus:border-blue-400'
                }`}
              />
            </div>
          </div>

          {/* Campaign Tagline */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Campaign Tagline / Manifesto Excerpt
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Empowering youth, judicial transparency, and digital governance."
              className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                  : 'bg-slate-950 border-slate-700 text-white focus:border-blue-400'
              }`}
            />
          </div>

          {/* Optional Candidate Details — shown on results/profile cards only */}
          <div className={`p-4 rounded-2xl border space-y-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <p className={`text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Optional Details <span className="normal-case font-semibold">(leave blank to hide — shown on the results screen, never on the ballot paper)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Education</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. LLB (Hons), University of the Punjab"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition ${isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-white focus:border-blue-400'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1.5 uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Profession</label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Advocate — Barrister-at-Law"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition ${isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-white focus:border-blue-400'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1.5 uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Age</label>
                <input
                  type="number"
                  min={18}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 47"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition ${isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-white focus:border-blue-400'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1.5 uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Hometown</label>
                <input
                  type="text"
                  value={hometown}
                  onChange={(e) => setHometown(e.target.value)}
                  placeholder="e.g. Lahore, Punjab"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition ${isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-white focus:border-blue-400'}`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1.5 uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Experience / Public Service</label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. Former MNA (2018–2023); chaired the Law & Justice Committee"
                className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition ${isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500' : 'bg-slate-900 border-slate-700 text-white focus:border-blue-400'}`}
              />
            </div>
          </div>

          {/* Candidate Photo Selector / Uploader */}
          <div className="space-y-3">
            <label className={`block text-xs font-bold uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Candidate Official Picture / Photo
            </label>

            <div className={`flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
            }`}>
              {/* Preview Avatar */}
              <div className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 shadow-lg flex items-center justify-center ${
                isLight ? 'bg-white border-blue-500' : 'bg-slate-900 border-blue-500/80'
              }`}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon className={`w-8 h-8 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
                )}
              </div>

              {/* Upload & Preset Options */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 border transition cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 text-blue-800 border-slate-300 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </button>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>or enter photo URL</span>
                </div>

                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://... photo link"
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none transition ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                      : 'bg-slate-900 border-slate-700 text-slate-300 focus:border-blue-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Electoral Symbol / Real Sign Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={`block text-xs font-bold uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Official Electoral Sign / Symbol *
              </label>
              <div className="flex items-center space-x-2">
                <span className={`text-[11px] font-bold ${isLight ? 'text-blue-800' : 'text-blue-400'}`}>Selected Sign:</span>
                <div className={`text-xs px-2.5 py-1 rounded-xl border flex items-center space-x-2 shadow-sm ${
                  isLight ? 'bg-white border-blue-400 text-slate-900' : 'bg-slate-950 text-white border-blue-800'
                }`}>
                  <div className="w-6 h-6 flex items-center justify-center">
                    {renderSymbolIcon(signIcon, 'w-5 h-5', signImageUrl)}
                  </div>
                  <span className="font-bold">{signName}</span>
                </div>
              </div>
            </div>

            {/* Custom sign name & sign image upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Sign Name / Title:</span>
                <input
                  type="text"
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs font-bold ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-blue-950'
                      : 'bg-slate-950 border-slate-700 text-blue-300'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Custom Sign Image (Optional):</span>
                  {signImageUrl && (
                    <button
                      type="button"
                      onClick={() => setSignImageUrl('')}
                      className="text-[10px] text-rose-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={signFileInputRef}
                    onChange={handleSignFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => signFileInputRef.current?.click()}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 border-slate-300 text-blue-900'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-blue-300'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Sign</span>
                  </button>
                  <input
                    type="text"
                    value={signImageUrl}
                    onChange={(e) => setSignImageUrl(e.target.value)}
                    placeholder="or image URL..."
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-800'
                        : 'bg-slate-950 border-slate-700 text-slate-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Grid of Real Electoral Symbols */}
            <div className={`grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-52 overflow-y-auto p-2.5 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
            }`}>
              {ELECTORAL_SYMBOLS.map((sym) => {
                const isSelected = signIcon === sym.id;
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => handleSelectSymbol(sym)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition cursor-pointer text-center ${
                      isSelected
                        ? `${sym.bgClass} ${sym.borderClass} ${sym.colorClass} shadow-lg scale-105 ring-2 ring-blue-500`
                        : isLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:text-slate-900 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      {renderSymbolIcon(sym.id, 'w-7 h-7')}
                    </div>
                    <span className="text-[10px] font-bold truncate max-w-[80px]">
                      {sym.name}
                    </span>
                    <span className="text-[9px] text-slate-500 truncate max-w-[80px]">
                      {sym.nameUrdu}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className={`flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t ${
            isLight ? 'border-slate-200' : 'border-blue-950'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 min-h-[48px] rounded-xl font-bold text-sm cursor-pointer ${
                isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isBallotLocked}
              className={`px-7 min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition cursor-pointer ${
                isSaving || isBallotLocked
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-blue-400'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : candidate ? 'Update Candidate' : 'Add to Ballot'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
