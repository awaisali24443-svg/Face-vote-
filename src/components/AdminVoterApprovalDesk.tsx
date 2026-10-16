import React, { useState } from 'react';
import {
  CheckCircle2,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Cpu,
  Eye,
  RefreshCw,
  Printer,
  FileText,
  MapPin,
  Fingerprint,
} from 'lucide-react';
import { Voter, ElectionConfig } from '../types';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { PrintVoterCardModal } from './PrintVoterCardModal';

interface AdminVoterApprovalDeskProps {
  voters: Voter[];
  config: ElectionConfig | null;
  onRefresh: () => void;
  onInspectEmbedding: (voter: Voter) => void;
}

export const AdminVoterApprovalDesk: React.FC<AdminVoterApprovalDeskProps> = ({
  voters,
  onRefresh,
  onInspectEmbedding,
}) => {
  const { isLight } = useTheme();
  const { isUrdu } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'voted' | 'eligible'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPhoto, setExpandedPhoto] = useState<{ name: string; photo: string; id: number } | null>(null);
  const [printVoterModal, setPrintVoterModal] = useState<Voter | null>(null);

  // Counts
  const totalVoters = voters.length;
  const totalVoted = voters.filter((v) => v.has_voted).length;
  const totalEligible = totalVoters - totalVoted;

  // Filtered list
  const filteredVoters = voters.filter((voter) => {
    if (filter === 'voted' && !voter.has_voted) return false;
    if (filter === 'eligible' && voter.has_voted) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = voter.name.toLowerCase().includes(query);
      const matchesId = String(voter.id).includes(query);
      const matchesCnic = voter.cnic ? voter.cnic.toLowerCase().includes(query) : false;
      const matchesDistrict = voter.district ? voter.district.toLowerCase().includes(query) : false;
      const matchesStation = voter.polling_station ? voter.polling_station.toLowerCase().includes(query) : false;
      return matchesName || matchesId || matchesCnic || matchesDistrict || matchesStation;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-mono">
      {/* Top Controls Bar */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        isLight ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-cyan-900/60'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-cyan-600' : 'bg-cyan-400'} animate-ping`} />
              <span className={`text-[10px] uppercase tracking-widest font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                {isUrdu
                  ? 'الیکشن کمیشن آف پاکستان • نادرا تصدیق شدہ ووٹر رجسٹر'
                  : 'ELECTION COMMISSION OF PAKISTAN • NADRA VERIFIED ELECTORAL REGISTER'}
              </span>
            </div>
            <h2 className={`text-xl font-black tracking-wide uppercase font-display mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isUrdu ? 'سرکاری انتخابی ووٹر لسٹ و بائیو میٹرک ریکارڈ' : 'Official Electoral Roll & Biometric Roster'}
            </h2>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isUrdu
                ? 'تمام رجسٹرڈ شہری آئینی طور پر ووٹ کے اہل ہیں۔ ووٹنگ کے بعد ریکارڈ شفاف اور غیر متبدل رہتا ہے۔'
                : 'All registered citizens are sovereign, verified voters. Ballots are cryptographically sealed upon casting.'}
            </p>
          </div>

          {/* Refresh & Integrity Badge */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs ${
              isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
            }`}>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-[11px]">
                {isUrdu ? 'غیر متبدل انتخابی لیجر' : 'IMMUTABLE ELECTORAL ROLL'}
              </span>
            </div>

            <button
              onClick={() => {
                cyberSound.playClick();
                onRefresh();
              }}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-cyan-800 border-slate-300 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
              }`}
              title={isUrdu ? 'فہرست تازہ کریں' : 'Refresh roster'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                cyberSound.playClick();
                setFilter('all');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {isUrdu ? `کل رجسٹرڈ ووٹرز (${totalVoters})` : `All Registered (${totalVoters})`}
            </button>

            <button
              onClick={() => {
                cyberSound.playClick();
                setFilter('eligible');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                filter === 'eligible'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isUrdu ? `اہل ووٹرز (${totalEligible})` : `Eligible to Vote (${totalEligible})`}</span>
            </button>

            <button
              onClick={() => {
                cyberSound.playClick();
                setFilter('voted');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                filter === 'voted'
                  ? 'bg-indigo-500 text-white font-black shadow-md'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isUrdu ? `ووٹ کاسٹ شدہ (${totalVoted})` : `Ballot Cast (${totalVoted})`}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUrdu ? 'نام، شناختی کارڈ یا پولنگ اسٹیشن...' : 'Search by name, CNIC or Station...'}
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-500'
                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Voter Cards / Roster */}
      {filteredVoters.length === 0 ? (
        <div className={`p-12 rounded-3xl border border-dashed text-center text-xs ${
          isLight ? 'bg-white border-slate-300 text-slate-500' : 'bg-slate-900/60 border-slate-800 text-slate-500'
        }`}>
          <UserX className={`w-10 h-10 mx-auto mb-3 ${isLight ? 'text-slate-400' : 'text-slate-700'}`} />
          <p className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
            {isUrdu ? 'کوئی ووٹر نہیں ملا۔' : 'No voters found in this category.'}
          </p>
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            {isUrdu ? 'نئے شہری کے اندراج کے لیے رجسٹریشن ٹیب پر جائیں۔' : 'Enroll voters in the registration tab or adjust filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVoters.map((voter) => {
            const hasVoted = Boolean(voter.has_voted);

            return (
              <div
                key={voter.id}
                className={`p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between space-y-4 shadow-sm ${
                  hasVoted
                    ? isLight
                      ? 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-400'
                      : 'bg-slate-900/80 border-indigo-900/50 hover:border-indigo-600/60'
                    : isLight
                    ? 'bg-white border-slate-300 hover:border-cyan-500'
                    : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/50'
                }`}
              >
                {/* Header Row: Photo, ID, Name, Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    {/* Face Photo Thumbnail */}
                    <div
                      onClick={() => {
                        if (voter.photo) {
                          cyberSound.playClick();
                          setExpandedPhoto({
                            name: voter.name,
                            photo: voter.photo,
                            id: voter.id,
                          });
                        }
                      }}
                      className={`relative w-14 h-14 rounded-2xl overflow-hidden border-2 shrink-0 ${
                        isLight ? 'bg-slate-100' : 'bg-slate-950'
                      } ${
                        voter.photo ? 'cursor-pointer hover:scale-105 transition' : ''
                      } ${
                        hasVoted ? 'border-indigo-500/80' : 'border-emerald-500/80'
                      }`}
                    >
                      {voter.photo ? (
                        <>
                          <img
                            src={voter.photo}
                            alt={voter.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transform -scale-x-100"
                          />
                          <div className="absolute inset-0 bg-cyan-500/10 hover:bg-transparent transition" />
                          <div className={`absolute bottom-0 right-0 p-0.5 rounded-tl ${isLight ? 'bg-white/90 text-cyan-700' : 'bg-slate-950/80 text-cyan-400'}`}>
                            <Eye className="w-2.5 h-2.5" />
                          </div>
                        </>
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-bold text-base ${isLight ? 'text-cyan-700 bg-slate-100' : 'text-cyan-400 bg-slate-950'}`}>
                          {voter.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Name & ID */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold font-mono text-sm ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                          #{voter.id}
                        </span>
                        <h3 className={`font-bold text-base tracking-wide font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {voter.name}
                        </h3>
                      </div>
                      <div className={`text-[11px] mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {voter.cnic && (
                          <span className={`font-mono font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                            CNIC: {voter.cnic}
                          </span>
                        )}
                        {voter.district && (
                          <span className={`text-[10px] flex items-center space-x-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{voter.district}</span>
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {voter.polling_station || 'Polling Station #42 (Lahore)'}
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div>
                    {hasVoted ? (
                      <span className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 ${
                        isLight
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                          : 'bg-indigo-950 border-indigo-700 text-indigo-300'
                      }`}>
                        <UserCheck className="w-3 h-3" />
                        <span>{isUrdu ? 'ووٹ کاسٹ شدہ' : 'BALLOT CAST'}</span>
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 ${
                        isLight
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : 'bg-emerald-950 border-emerald-600 text-emerald-300'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isUrdu ? 'اہل ووٹر' : 'ELIGIBLE'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Controls / Actions */}
                <div className={`flex items-center justify-between pt-3 border-t text-xs ${
                  isLight ? 'border-slate-200' : 'border-slate-800/80'
                }`}>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        cyberSound.playClick();
                        onInspectEmbedding(voter);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center space-x-1.5 cursor-pointer transition ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-cyan-800'
                          : 'bg-slate-950 border-cyan-700/60 hover:border-cyan-400 text-cyan-300'
                      }`}
                    >
                      <Fingerprint className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
                      <span>{isUrdu ? '128-D ویکٹر' : '128-D VECTOR'}</span>
                    </button>

                    <button
                      onClick={() => {
                        cyberSound.playClick();
                        setPrintVoterModal(voter);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center space-x-1.5 cursor-pointer transition ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                          : 'bg-slate-950 border-slate-700 hover:border-slate-500 text-slate-200'
                      }`}
                      title={isUrdu ? 'سرکاری ووٹر پرچہ پرنٹ کریں' : 'Print Official Voter Card'}
                    >
                      <Printer className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{isUrdu ? 'پرچہ پرنٹ' : 'PRINT CARD'}</span>
                    </button>
                  </div>

                  {/* NADRA Authenticated Badge */}
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{isUrdu ? 'نادرا تصدیق شدہ' : 'NADRA VERIFIED'}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Face Photo Modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`relative w-full max-w-md border-2 rounded-3xl p-6 shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-cyan-500' : 'bg-slate-900 border-cyan-500'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isLight ? 'border-slate-200' : 'border-cyan-950'
            }`}>
              <div>
                <span className={`text-[10px] font-bold tracking-widest uppercase ${
                  isLight ? 'text-cyan-700' : 'text-cyan-400'
                }`}>
                  BIOMETRIC RECORD // ID #{expandedPhoto.id}
                </span>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{expandedPhoto.name}</h3>
              </div>
              <button
                onClick={() => setExpandedPhoto(null)}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                ✕
              </button>
            </div>

            <div className={`relative w-full aspect-square rounded-2xl overflow-hidden border-2 shadow-lg ${
              isLight ? 'bg-slate-100 border-cyan-400' : 'bg-slate-950 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]'
            }`}>
              <img
                src={expandedPhoto.photo}
                alt={expandedPhoto.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className={`absolute top-2 left-2 px-2 py-0.5 rounded border text-[10px] font-bold ${
                isLight ? 'bg-white/90 border-cyan-400 text-cyan-800' : 'bg-slate-950/80 border-cyan-500 text-cyan-300'
              }`}>
                {isUrdu ? 'اعلیٰ کوالٹی بائیو میٹرک تصویر' : 'HIGH-RESOLUTION OPTICAL SAMPLE'}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setExpandedPhoto(null)}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                {isUrdu ? 'بند کریں' : 'Close Inspection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Voter Registration Card Modal */}
      {printVoterModal && (
        <PrintVoterCardModal
          voter={printVoterModal}
          onClose={() => setPrintVoterModal(null)}
        />
      )}
    </div>
  );
};
