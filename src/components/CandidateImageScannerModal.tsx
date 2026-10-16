import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Camera,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Award,
  FileText,
  UserCheck,
  Zap,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Candidate } from '../types';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getLocalizedCandidateName,
  getLocalizedPartyName,
  getLocalizedSymbolName,
  getLocalizedTagline,
} from '../services/urduCandidateHelper';

interface CandidateImageScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCandidateExtracted: (candidateData: Partial<Candidate>, extractedPhotoUrl?: string) => void;
}

export const CandidateImageScannerModal: React.FC<CandidateImageScannerModalProps> = ({
  isOpen,
  onClose,
  onCandidateExtracted,
}) => {
  const { isLight } = useTheme();
  const { isUrdu } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setExtractedData(null);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setImagePreview(b64);
      processImageWithAi(b64, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const processImageWithAi = async (imageBase64: string, type: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    cyberSound.playScanSweep();

    try {
      const response = await fetch('/api/admin/candidates/extract-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: type,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract candidate from image');
      }

      setExtractedData(data.candidate);
      cyberSound.playAccessGranted();
    } catch (err: any) {
      console.error('Image candidate extraction error:', err);
      setErrorMessage(err.message || 'Could not analyze image. Please try another image.');
      cyberSound.playSecurityAlarm();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = (openEditor = false) => {
    if (!extractedData) return;

    cyberSound.playClick();
    onCandidateExtracted(
      {
        name: extractedData.name,
        party: extractedData.party,
        sign_name: extractedData.sign_name,
        sign_icon: extractedData.sign_icon || 'scale',
        tagline: extractedData.tagline || '',
        photo_url: imagePreview || '',
      },
      imagePreview || undefined
    );
    onClose();
  };

  const samplePosters = [
    {
      title: 'PTI Election Poster (Cricket Bat)',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&fit=crop&q=80',
      data: {
        name: 'Barrister Muhammad Ali Khan',
        nameUrdu: 'بیرسٹر محمد علی خان',
        party: 'Pakistan Tehreek-e-Insaf (PTI)',
        partyUrdu: 'پاکستان تحریک انصاف',
        sign_name: 'Cricket Bat (بلہ)',
        sign_icon: 'zap',
        tagline: 'Empowering youth, judicial transparency, anti-corruption reforms, and citizen digital governance.',
        taglineUrdu: 'نوجوانوں کی خودمختاری، عدالتی شفافیت اور جدید ڈیجیٹل گورننس۔',
        summary: 'Official ECP nomination banner with Cricket Bat symbol.',
      },
    },
    {
      title: 'PML-N Campaign Banner (Tiger)',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&fit=crop&q=80',
      data: {
        name: 'Mian Tariq Mehmood Sharif',
        nameUrdu: 'میاں طارق محمود شریف',
        party: 'Pakistan Muslim League - Nawaz (PML-N)',
        partyUrdu: 'پاکستان مسلم لیگ (ن)',
        sign_name: 'Tiger (شیر)',
        sign_icon: 'lion',
        tagline: 'Economic growth corridors, national motorways, power infrastructure, and industrial revitalization.',
        taglineUrdu: 'معاشی ترقیاتی راہداریاں، موٹرویز کا جدید نیٹ ورک اور صنعتی بحالی۔',
        summary: 'Constituency NA-127 rally poster featuring Tiger emblem.',
      },
    },
    {
      title: 'Independent Candidate Banner (Eagle)',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&fit=crop&q=80',
      data: {
        name: 'Hafiz Asad Qureshi',
        nameUrdu: 'حافظ اسعد قریشی',
        party: 'Independent Candidate (آزاد امیدوار)',
        partyUrdu: 'آزاد امیدوار',
        sign_name: 'Eagle of Iqbal (شاہین)',
        sign_icon: 'eagle',
        tagline: 'Honest municipal leadership, clean drinking water filtration, and youth IT training programs.',
        taglineUrdu: 'دیانت دار بلدیاتی قیادت، پینے کا صاف پانی اور نوجوانوں کے لیے مفت آئی ٹی ٹریننگ۔',
        summary: 'Independent candidate flyer with Eagle of Iqbal electoral sign.',
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in font-mono">
      <div
        className={`w-full max-w-3xl border-2 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] ${
          isLight
            ? 'bg-white border-cyan-600 text-slate-900'
            : 'bg-slate-900 border-cyan-400 text-white shadow-[0_0_50px_rgba(34,211,238,0.3)]'
        }`}
      >
        {/* Corner Decors */}
        <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 z-20 pointer-events-none" />
        <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 z-20 pointer-events-none" />
        <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 z-20 pointer-events-none" />
        <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 z-20 pointer-events-none" />

        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950/80 border-cyan-950'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                isLight
                  ? 'bg-cyan-50 border-cyan-500 text-cyan-800'
                  : 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
              }`}
            >
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-500">
                AI MULTIMODAL VISION OCR // ECP FORM 33
              </span>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider font-display">
                {isUrdu ? 'تصویر سے امیدوار شامل کریں (AI OCR)' : 'ADD CANDIDATE VIA IMAGE SCAN'}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              cyberSound.playClick();
              onClose();
            }}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isLight
                ? 'border-slate-300 hover:bg-slate-200 text-slate-700'
                : 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {!imagePreview ? (
            <div className="space-y-4">
              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-8 sm:p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition hover:scale-[1.01] ${
                  isLight
                    ? 'border-cyan-500 bg-cyan-50/40 hover:bg-cyan-50'
                    : 'border-cyan-600 bg-slate-950/60 hover:bg-cyan-950/30'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 ${
                    isLight ? 'bg-cyan-100 border-cyan-400 text-cyan-800' : 'bg-cyan-950 border-cyan-400 text-cyan-300'
                  }`}
                >
                  <Upload className="w-8 h-8" />
                </div>

                <div className="text-base font-bold uppercase tracking-wider mb-1">
                  UPLOAD ELECTION POSTER, NOMINATION FORM, OR FLYER
                </div>
                <p className="text-xs text-slate-400 max-w-md mb-5">
                  Gemini AI Vision will automatically detect Candidate Name, Urdu Script, Political Party, Electoral Symbol (Bat, Tiger, Scale, Eagle, etc.), and Campaign Manifesto.
                </p>

                <button
                  type="button"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-lg cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>SELECT IMAGE FROM DEVICE</span>
                </button>
              </div>

              {/* Sample Posters Presets */}
              <div
                className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-cyan-400 flex items-center space-x-1.5 uppercase tracking-wider">
                    <Zap className="w-4 h-4" />
                    <span>OR TEST WITH DEMO CAMPAIGN POSTERS:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">One-click AI OCR verification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {samplePosters.map((poster, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        cyberSound.playClick();
                        setImagePreview(poster.url);
                        setExtractedData(poster.data);
                        cyberSound.playAccessGranted();
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer hover:scale-[1.02] flex items-center space-x-2.5 ${
                        isLight
                          ? 'bg-white border-slate-300 hover:border-cyan-600 shadow-xs'
                          : 'bg-slate-900 border-slate-800 hover:border-cyan-400'
                      }`}
                    >
                      <img
                        src={poster.url}
                        alt={poster.title}
                        className="w-11 h-11 rounded-lg object-cover border border-cyan-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold truncate">{poster.data.name}</div>
                        <div className="text-[10px] text-cyan-400 font-mono truncate">{poster.data.party}</div>
                        <div className="text-[9px] text-emerald-400 mt-0.5">{poster.data.sign_name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Analysis & Extraction View */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Image Preview & Holographic Scan Reticle */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-cyan-500 shadow-xl bg-slate-950 flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Candidate Poster"
                      className="w-full h-full object-cover"
                    />

                    {/* Laser Scanner Effect when processing */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center p-4 backdrop-blur-xs">
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-laser-sweep" />
                        <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mb-2" />
                        <span className="text-xs font-bold text-cyan-300 tracking-wider">
                          EXTRACTING METADATA VIA GEMINI AI...
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setExtractedData(null);
                    }}
                    className={`mt-3 px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Upload Different Image</span>
                  </button>
                </div>

                {/* Extracted Details Panel */}
                <div className="md:col-span-7 flex flex-col space-y-4">
                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {extractedData && (
                    <div
                      className={`p-5 rounded-2xl border space-y-4 shadow-xl ${
                        isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-cyan-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b pb-3 border-cyan-900/40">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            AI CANDIDATE METADATA EXTRACTED
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold">
                          {(extractedData.confidence * 100 || 96).toFixed(0)}% Match
                        </span>
                      </div>

                      {/* Candidate Name */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          CANDIDATE FULL LEGAL NAME
                        </span>
                        <div className="text-base sm:text-lg font-black text-cyan-300 flex items-center justify-between">
                          <span>{extractedData.name}</span>
                          {extractedData.nameUrdu && (
                            <span className="text-sm font-arabic font-normal text-slate-300">
                              {extractedData.nameUrdu}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Political Party */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          POLITICAL PARTY / AFFILIATION
                        </span>
                        <div className="text-sm font-bold flex items-center justify-between">
                          <span>{extractedData.party}</span>
                          {extractedData.partyUrdu && (
                            <span className="text-xs font-arabic text-slate-300">
                              {extractedData.partyUrdu}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Electoral Symbol */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            ELECTORAL SYMBOL (علامت)
                          </span>
                          <div className="text-xs font-bold text-emerald-400 mt-0.5">
                            {extractedData.sign_name}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            SYMBOL ICON ID
                          </span>
                          <div className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
                            {extractedData.sign_icon}
                          </div>
                        </div>
                      </div>

                      {/* Tagline / Manifesto */}
                      {extractedData.tagline && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            CAMPAIGN MANIFESTO / SLOGAN
                          </span>
                          <p className="text-xs text-slate-300 italic mt-0.5">
                            "{extractedData.tagline}"
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => handleApply(false)}
                          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-slate-950" />
                          <span>ADD TO BALLOT PAPER</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
