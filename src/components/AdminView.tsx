import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Vote,
  TrendingUp,
  RefreshCw,
  Trash2,
  Sliders,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Terminal,
  FileText,
  UserCheck,
  Key,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Download,
  Upload,
} from 'lucide-react';
import { BallotStats, Voter } from '../types';
import { VectorMatrixVisualizer } from './VectorMatrixVisualizer';
import { AdminVoterApprovalDesk } from './AdminVoterApprovalDesk';
import { AdminCandidateStudio } from './AdminCandidateStudio';
import { EnrollmentView } from './EnrollmentView';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { adminHeaders, setAdminPin, clearAdminPin } from '../services/adminAuth';
import { isDeviceMode } from '../services/deviceMode';

export type AdminTab = 'enrollment' | 'approvals' | 'candidates' | 'audit';

export interface AdminViewProps {
  initialSubTab?: AdminTab;
  onGoToKiosk?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ initialSubTab = 'enrollment', onGoToKiosk }) => {
  const { isLight } = useTheme();
  const { isUrdu } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<AdminTab>(initialSubTab);

  // Bottom navigation can ask for a different desk while Admin is already
  // open (e.g. tapping "Register") — follow the latest request.
  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);
  const [stats, setStats] = useState<BallotStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);
  const [thresholdInput, setThresholdInput] = useState<number>(0.82);
  const [thresholdSaved, setThresholdSaved] = useState<boolean>(false);

  // Security gate - Strictly locked by default to protect election integrity
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Vector Matrix modal for inspecting enrolled voters
  const [inspectedVoter, setInspectedVoter] = useState<{ name: string; embedding?: number[] } | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/stats', { headers: { ...adminHeaders() } });
      if (!res.ok) throw new Error('Failed to load admin stats');
      const data = await res.json();
      setStats(data);
      if (data.threshold !== undefined) {
        setThresholdInput(data.threshold);
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      setError(err.message || 'Error fetching statistics');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLocked) return; // stats are officer-only; don't poll while locked
    fetchStats();
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, [isLocked]);

  const handleUpdateThreshold = async (newVal: number) => {
    cyberSound.playClick();
    setThresholdInput(newVal);
    try {
      const res = await fetch('/api/admin/threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ threshold: newVal }),
      });
      if (res.ok) {
        setThresholdSaved(true);
        setTimeout(() => setThresholdSaved(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save threshold:', err);
    }
  };

  const handleReset = async (clearAll: boolean) => {
    cyberSound.playClick();
    const confirmMsg = clearAll
      ? (isUrdu
          ? 'اہم تنبیہ: کیا آپ تمام ووٹرز اور تمام بیلٹ ریکارڈز مکمل طور پر ختم کرنا چاہتے ہیں؟'
          : 'CRITICAL PROTOCOL: Are you sure you want to WIPE all voters and all ballots completely?')
      : (isUrdu
          ? 'کیا آپ پولنگ اسٹیشن کا آغاز کرنا چاہتے ہیں؟ اس سے تمام ووٹ دوبارہ فعال ہو جائیں گے۔'
          : 'Reset election state? This will clear all cast ballots and let all registered voters vote again.');

    if (!window.confirm(confirmMsg)) return;

    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ clearAll }),
      });
      if (!res.ok) throw new Error('Failed to reset');
      cyberSound.playAccessGranted();
      await fetchStats();
      setResetting(false);
    } catch (err: any) {
      cyberSound.playSecurityAlarm();
      alert('Reset failed: ' + err.message);
      setResetting(false);
    }
  };

  const handleExportBackup = async () => {
    cyberSound.playClick();
    try {
      const res = await fetch('/api/admin/export', { headers: { ...adminHeaders() } });
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facevote-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      cyberSound.playAccessGranted();
    } catch (err: any) {
      cyberSound.playSecurityAlarm();
      alert('Backup failed: ' + err.message);
    }
  };

  const handleImportBackup = async (file: File) => {
    if (
      !window.confirm(
        isUrdu
          ? 'بیک اپ بحال کرنے سے اس ڈیوائس کا موجودہ تمام ڈیٹا تبدیل ہو جائے گا۔ جاری رکھیں؟'
          : 'Restoring a backup REPLACES all data on this device. Continue?'
      )
    )
      return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ backup }),
      });
      if (!res.ok) throw new Error('Import failed');
      cyberSound.playAccessGranted();
      await fetchStats();
      alert(isUrdu ? 'بیک اپ بحال ہو گیا۔' : 'Backup restored on this device.');
    } catch (err: any) {
      cyberSound.playSecurityAlarm();
      alert('Restore failed: ' + err.message);
    }
  };

  const handleUnlockWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = enteredPin.trim();
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setAdminPin(pin);
        cyberSound.playAccessGranted();
        setIsLocked(false);
        setPinError(false);
        setEnteredPin('');
      } else {
        cyberSound.playSecurityAlarm();
        setPinError(true);
      }
    } catch {
      cyberSound.playSecurityAlarm();
      setPinError(true);
    }
  };

  if (isLocked) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16">
        <div className={`p-8 rounded-3xl border-2 shadow-2xl text-center space-y-6 relative overflow-hidden ${
          isLight
            ? 'bg-white border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.2)]'
            : 'bg-slate-950 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.4)]'
        }`}>
          <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center mx-auto shadow-md ${
            isLight
              ? 'bg-rose-100 border-rose-400 text-rose-600'
              : 'bg-rose-950 border-rose-400 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
          }`}>
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded border ${
              isLight
                ? 'bg-rose-100 text-rose-700 border-rose-300'
                : 'text-rose-400 bg-rose-950 border-rose-700'
            }`}>
              {isUrdu ? 'مخصوص سیکیورٹی زون' : 'RESTRICTED SECURITY ZONE'}
            </span>
            <h2 className={`text-xl font-bold tracking-wider uppercase font-display mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isUrdu ? 'پریذائیڈنگ آفیسر سیکیورٹی لاک' : 'Election Authority Lock'}
            </h2>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isUrdu
                ? 'ووٹر اندراج، امیدواران کی فہرست اور انتخابی گنتی کے لیے پریذائیڈنگ آفیسر کا پن کوڈ درج کریں۔'
                : 'Enter authorized Returning Officer PIN to access voter enrollment, candidate setup, and ballot audits.'}
            </p>
          </div>

          <form onSubmit={handleUnlockWithPin} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type="password"
                  maxLength={12}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(false);
                  }}
                  autoFocus
                  placeholder={isUrdu ? 'آفیسر پن درج کریں' : 'Enter Officer PIN'}
                  className={`w-full text-center tracking-widest text-lg font-black px-4 py-3.5 rounded-xl border focus:outline-none transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600 shadow-sm'
                      : 'bg-slate-900 border-slate-700 text-emerald-400 focus:border-emerald-500 shadow-inner'
                  }`}
                />
              </div>

              {pinError && (
                <div className="text-xs text-rose-500 mt-2 font-bold">
                  {isUrdu ? 'رسائی مسترد: غلط پن کوڈ۔' : 'ACCESS DENIED: Invalid Official PIN.'}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>{isUrdu ? 'پن تصدیق کریں اور انلاک کریں' : 'Verify Officer PIN & Unlock'}</span>
              </button>
            </div>
          </form>

          {onGoToKiosk && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  cyberSound.playClick();
                  onGoToKiosk();
                }}
                className={`text-xs font-mono font-bold transition flex items-center justify-center space-x-1.5 mx-auto cursor-pointer ${
                  isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{isUrdu ? '← عوامی ووٹنگ کیوسک پر واپس جائیں' : '← Return to Public Voting Kiosk'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Top Banner & Refresh */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b gap-4 ${isLight ? 'border-slate-300' : 'border-cyan-950'}`}>
        <div>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center ${
              isLight
                ? 'bg-white border-cyan-600 text-cyan-700 shadow-md'
                : 'bg-slate-900 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
            }`}>
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-black tracking-wider uppercase font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isUrdu ? 'الیکشن مینجمنٹ سسٹم (EMS)' : 'ELECTION MANAGEMENT SYSTEM (EMS)'}
              </h1>
              <div className={`flex items-center space-x-2 text-[10px] tracking-widest uppercase mt-0.5 font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-cyan-600' : 'bg-cyan-400'} animate-ping`} />
                <span>
                  {isUrdu
                    ? 'پریذائیڈنگ آفیسر ڈیسک • بائیو میٹرک تصدیق • بیلٹ اسٹوڈیو'
                    : 'RETURNING OFFICER SUITE • IDENTITY VERIFICATION • BALLOT STUDIO'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Quick Lock Button */}
          <button
            onClick={() => {
              cyberSound.playClick();
              clearAdminPin();
              setIsLocked(true);
            }}
            title="Lock admin panel"
            className={`px-3.5 min-h-[44px] rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-rose-600 border-slate-300 shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'ڈیسک لاک کریں' : 'LOCK DESK'}</span>
          </button>

          <button
            onClick={() => {
              cyberSound.playClick();
              fetchStats();
            }}
            className={`px-4 min-h-[44px] rounded-xl border font-bold text-xs flex items-center space-x-2 transition cursor-pointer shadow-md ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-cyan-800 border-cyan-400'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{isUrdu ? 'تازہ ترین گنتی' : 'POLL NETWORK'}</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-Navigation — app-style segmented bar (icon over label) */}
      <div className={`grid grid-cols-4 gap-1 p-1 rounded-2xl border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'}`}>
        {[
          { key: 'enrollment', icon: UserPlus, en: 'Enroll', ur: 'رجسٹریشن' },
          { key: 'approvals', icon: UserCheck, en: 'Voters', ur: 'ووٹر لسٹ' },
          { key: 'candidates', icon: FileText, en: 'Candidates', ur: 'امیدواران' },
          { key: 'audit', icon: BarChart3, en: 'Tallies', ur: 'گنتی' },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                cyberSound.playClick();
                setActiveSubTab(tab.key as AdminTab);
              }}
              className={`min-h-[56px] px-1 py-2 rounded-xl font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                active
                  ? 'bg-emerald-600 text-white shadow-md'
                  : isLight
                  ? 'text-slate-600 hover:bg-white'
                  : 'text-slate-400 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wide leading-none">
                {isUrdu ? tab.ur : tab.en}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950 border border-rose-600 text-rose-200 text-xs">
          {error}
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-VIEW 0: CITIZEN BIOMETRIC ENROLLMENT DESK */}
      {/* ============================================================ */}
      {activeSubTab === 'enrollment' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/40'
          }`}>
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className={`text-sm font-bold uppercase tracking-wider font-mono ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                  {isUrdu ? 'سرکاری شہری رجسٹریشن و بائیو میٹرک اندراج' : 'OFFICIAL CITIZEN REGISTRATION & BIOMETRIC ENROLLMENT'}
                </h2>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {isUrdu
                  ? 'نادرا تصدیق، کیمرہ اسکین یا تصویر اپلوڈ کے ذریعے 128-D بائیو میٹرک ویکٹر محفوظ کیا جاتا ہے۔'
                  : 'Presiding Officer Console: Registers eligible voter identity, captures 128-D neural vector, and enforces anti-duplicate screening.'}
              </p>
            </div>
            {onGoToKiosk && (
              <button
                onClick={onGoToKiosk}
                className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer shadow-sm ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-600/60'
                }`}
              >
                <span>{isUrdu ? 'ووٹنگ کیوسک پر جائیں' : 'Back to Voting Kiosk'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <EnrollmentView onGoToCheckIn={onGoToKiosk || (() => setActiveSubTab('approvals'))} />
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-VIEW 1: VOTER ROSTER DESK */}
      {/* ============================================================ */}
      {activeSubTab === 'approvals' && (
        <AdminVoterApprovalDesk
          voters={stats?.votersList || []}
          config={stats?.config || null}
          onRefresh={fetchStats}
          onGoToEnroll={() => setActiveSubTab('enrollment')}
          onInspectEmbedding={(voter) => setInspectedVoter({ name: voter.name, embedding: voter.embedding })}
        />
      )}

      {/* ============================================================ */}
      {/* SUB-VIEW 2: CANDIDATE STUDIO & BALLOT PAPER */}
      {/* ============================================================ */}
      {activeSubTab === 'candidates' && (
        <AdminCandidateStudio
          candidates={stats?.candidates || []}
          config={stats?.config || null}
          onRefresh={fetchStats}
        />
      )}

      {/* ============================================================ */}
      {/* SUB-VIEW 3: AUDIT LOGS, TALLIES & SECURITY TUNING */}
      {/* ============================================================ */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          {/* METRIC STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Total Enrolled */}
            <div className={`p-5 rounded-2xl border shadow-md flex items-center space-x-4 relative overflow-hidden ${
              isLight ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-cyan-900/60'
            }`}>
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                isLight ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'bg-cyan-950/80 border-cyan-500/80 text-cyan-400'
              }`}>
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className={`text-[10px] uppercase tracking-widest font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isUrdu ? 'کل رجسٹرڈ ووٹرز' : 'TOTAL REGISTERED'}
                </div>
                <div className={`text-2xl font-black mt-0.5 font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {stats ? stats.totalEnrolled : '--'}
                </div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-cyan-700 font-medium' : 'text-cyan-400/80'}`}>
                  {isUrdu ? '128-D بائیو میٹرک ویکٹرز' : 'Biometric signatures'}
                </div>
              </div>
            </div>

            {/* Approved & Eligible */}
            <div className={`p-5 rounded-2xl border shadow-md flex items-center space-x-4 relative overflow-hidden ${
              isLight ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-emerald-900/60'
            }`}>
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                isLight ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-emerald-950/80 border-emerald-500/80 text-emerald-400'
              }`}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className={`text-[10px] uppercase tracking-widest font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isUrdu ? 'نادرا تصدیق شدہ' : 'NADRA VERIFIED'}
                </div>
                <div className={`text-2xl font-black mt-0.5 font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {stats ? stats.totalApproved : '--'}
                </div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-emerald-700 font-medium' : 'text-emerald-400'}`}>
                  {isUrdu ? 'ووٹ ڈالنے کے مکمل اہل' : 'Cleared to cast ballots'}
                </div>
              </div>
            </div>

            {/* Total Votes Cast */}
            <div className={`p-5 rounded-2xl border shadow-md flex items-center space-x-4 relative overflow-hidden ${
              isLight ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-indigo-900/60'
            }`}>
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                isLight ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-indigo-950/80 border-indigo-500/80 text-indigo-400'
              }`}>
                <Vote className="w-6 h-6" />
              </div>
              <div>
                <div className={`text-[10px] uppercase tracking-widest font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isUrdu ? 'کاسٹ شدہ بیلٹ' : 'BALLOTS CAST'}
                </div>
                <div className={`text-2xl font-black mt-0.5 font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {stats ? stats.totalVoted : '--'}
                </div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-indigo-700 font-medium' : 'text-indigo-300'}`}>
                  {isUrdu ? 'ایک ووٹر ایک ووٹ لازمی' : '1-voter-1-vote enforced'}
                </div>
              </div>
            </div>

            {/* Turnout Percentage */}
            <div className={`p-5 rounded-2xl border shadow-md flex items-center space-x-4 relative overflow-hidden ${
              isLight ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-teal-900/60'
            }`}>
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                isLight ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-teal-950/80 border-teal-500/80 text-teal-400'
              }`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className={`text-[10px] uppercase tracking-widest font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isUrdu ? 'ٹرن آؤٹ تناسب' : 'TURNOUT RATIO'}
                </div>
                <div className={`text-2xl font-black mt-0.5 font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {stats ? `${stats.turnoutPercentage}%` : '--'}
                </div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-teal-700 font-medium' : 'text-teal-300'}`}>
                  {stats && stats.totalApproved > 0
                    ? `${stats.totalVoted} / ${stats.totalApproved} ${isUrdu ? 'ووٹرز' : 'voters'}`
                    : (isUrdu ? 'ووٹوں کا انتظار ہے' : 'Awaiting votes')}
                </div>
              </div>
            </div>
          </div>

          {/* LIVE TALLY BREAKDOWN */}
          <div className={`p-6 rounded-2xl border shadow-xl space-y-5 relative overflow-hidden ${
            isLight ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-cyan-900/60'
          }`}>
            <span className={`absolute top-1 right-1 w-2 h-2 ${isLight ? 'bg-cyan-600' : 'bg-cyan-400'}`} />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className={`text-lg font-bold tracking-wide uppercase font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isUrdu ? 'خفیہ اور غیر متبدل انتخابی نتائج کی تقسیم' : 'Anonymous Cryptographic Tally Distribution'}
                </h2>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isUrdu
                    ? 'خفیہ بیلٹ لیجر • ووٹر کا نام یا تصویر کسی ووٹ سے منسلک نہیں کی جاتی'
                    : 'Decoupled ballot table • Stored without voter ID, name, or facial descriptor linkages'}
                </p>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-lg border font-bold self-start ${
                isLight ? 'text-cyan-900 bg-cyan-100 border-cyan-300' : 'text-cyan-400 bg-cyan-950/80 border-cyan-700'
              }`}>
                {isUrdu ? `کل محفوظ شدہ ووٹ: ${stats?.totalVoted || 0}` : `SEALED BALLOTS: ${stats?.totalVoted || 0}`}
              </span>
            </div>

            {stats && stats.ballotsByChoice.length > 0 ? (
              <div className="space-y-3.5">
                {stats.ballotsByChoice.map((item, idx) => {
                  const pct =
                    stats.totalVoted > 0 ? ((item.count / stats.totalVoted) * 100).toFixed(1) : '0';
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border space-y-2 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className={`text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.choice}</span>
                        <span className={isLight ? 'text-cyan-700' : 'text-cyan-400'}>
                          {item.count} {isUrdu ? 'ووٹ' : `vote${item.count !== 1 ? 's' : ''}`} ({pct}%)
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className={`w-full h-3 rounded-full overflow-hidden border ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-900 border-slate-800'}`}>
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-10 rounded-xl border border-dashed text-xs ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <Vote className={`w-10 h-10 mx-auto mb-2 ${isLight ? 'text-slate-400' : 'text-slate-700'}`} />
                <p>{isUrdu ? 'اس پولنگ مرحلے میں کوئی ووٹ کاسٹ نہیں ہوا۔' : 'Zero ballots submitted in this election round.'}</p>
                <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isUrdu ? 'کیوسک پر ووٹ ڈالنے کے بعد یہاں گنتی خود بخود اپ ڈیٹ ہو جائے گی۔' : 'Cast ballots at the kiosk to see live tallies.'}
                </p>
              </div>
            )}
          </div>

          {/* TUNING & INITIALIZATION CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cosine Similarity Threshold Tuning */}
            <div className={`p-6 rounded-2xl border shadow-xl space-y-4 ${
              isLight ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-cyan-900/60'
            }`}>
              <div className="flex items-center space-x-2">
                <Sliders className={`w-5 h-5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
                <h3 className={`font-bold text-sm uppercase tracking-wider font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isUrdu ? 'بائیو میٹرک مطابقت کی حد (تھریش ہولڈ)' : 'Cosine Similarity Cutoff'}
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {isUrdu
                  ? 'ووٹر کی تصدیق کے لیے کم از کم بائیو میٹرک مماثلت کا معیار۔ 0.82 متوازن ترین معیار ہے۔'
                  : 'Minimum vector cosine similarity required to declare a biometric match. Higher values prevent imposters while lower values tolerate harsh lighting.'}
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}>
                    {isUrdu ? 'فیصلہ کن حد:' : 'Decision Boundary:'}
                  </span>
                  <span className={`text-lg font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
                    {thresholdInput.toFixed(2)} ({Math.round(thresholdInput * 100)}%)
                  </span>
                </div>

                <input
                  type="range"
                  min="0.65"
                  max="0.95"
                  step="0.01"
                  value={thresholdInput}
                  onChange={(e) => handleUpdateThreshold(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />

                <div className={`flex justify-between text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  <span>0.65 (High Tolerance)</span>
                  <span className={`font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>0.82 (Standard Balanced)</span>
                  <span>0.95 (Ultra-Strict)</span>
                </div>

                {thresholdSaved && (
                  <div className={`text-xs font-bold flex items-center space-x-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isUrdu ? 'تھریش ہولڈ سرور پر محفوظ ہو گیا!' : 'Threshold updated on server backend!'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Polling Station Morning Reset Ceremony */}
            <div className={`p-6 rounded-2xl border shadow-xl space-y-4 ${
              isLight ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-cyan-950'
            }`}>
              <div className="flex items-center space-x-2">
                <ShieldCheck className={`w-5 h-5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
                <h3 className={`font-bold text-sm uppercase tracking-wider font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isUrdu ? 'پولنگ اسٹیشن افتتاح و صفائی' : 'Polling Station Initialization'}
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {isUrdu
                  ? 'صبح 08:00 بجے پولنگ کے آغاز پر خالی بیلٹ باکس اور شفاف ریکارڈ کی تصدیق کا سرکاری پروٹوکول۔'
                  : 'Official 08:00 AM initialization ceremony to zero the ballot ledger before poll opening.'}
              </p>

              <div className="flex flex-col space-y-2.5 pt-2">
                <button
                  onClick={() => handleReset(false)}
                  disabled={resetting}
                  className={`w-full py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition shadow-md ${
                    isLight
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                      : 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border-amber-600/70'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
                  <span>{isUrdu ? 'نئے ووٹنگ مرحلے کا آغاز (ووٹرز برقرار رہیں)' : 'INITIALIZE EMPTY BALLOT BOX (KEEP VOTERS)'}</span>
                </button>

                <button
                  onClick={() => handleReset(true)}
                  disabled={resetting}
                  className={`w-full py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition shadow-md ${
                    isLight
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300'
                      : 'bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border-rose-600/70'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isUrdu ? 'مکمل ری سیٹ (تمام ریکارڈز صاف کریں)' : 'FULL FACTORY RESET (WIPE ALL DATA)'}</span>
                </button>

                {isDeviceMode() && (
                  <>
                    <button
                      onClick={handleExportBackup}
                      className={`w-full py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition shadow-md ${
                        isLight
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300'
                          : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 border-emerald-600/70'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      <span>{isUrdu ? 'ڈیوائس ڈیٹا کا بیک اپ ڈاؤن لوڈ کریں' : 'DOWNLOAD DEVICE BACKUP (ALL DATA)'}</span>
                    </button>

                    <label
                      className={`w-full py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition shadow-md ${
                        isLight
                          ? 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300'
                          : 'bg-blue-950/70 hover:bg-blue-900/80 text-blue-200 border-blue-600/70'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUrdu ? 'بیک اپ فائل سے بحال کریں' : 'RESTORE FROM BACKUP FILE'}</span>
                      <input
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImportBackup(f);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vector Matrix Modal for inspected voter */}
      <VectorMatrixVisualizer
        isOpen={!!inspectedVoter}
        onClose={() => setInspectedVoter(null)}
        embedding={inspectedVoter?.embedding || null}
        threshold={thresholdInput}
        voterName={inspectedVoter?.name}
      />
    </div>
  );
};
