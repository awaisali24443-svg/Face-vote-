import React from 'react';
import { Printer, X, FileText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { Candidate } from '../types';
import { cyberSound } from '../services/soundEffects';
import { renderSymbolIcon } from '../services/electoralSymbols';

interface Form47Props {
  isOpen: boolean;
  onClose: () => void;
  candidates: (Candidate & { votes?: number; percentage?: number })[];
  totalVotes: number;
  totalRegisteredVoters?: number;
  constituency?: string;
  district?: string;
  pollingStationsCount?: number;
}

export const PrintForm47Modal: React.FC<Form47Props> = ({
  isOpen,
  onClose,
  candidates,
  totalVotes,
  totalRegisteredVoters = 0,
  constituency = '',
  district = '',
  pollingStationsCount = 0,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    cyberSound.playClick();
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const validVotes = totalVotes;
  const rejectedVotes = Math.round(totalVotes * 0.015);
  const totalVotesPolled = validVotes + rejectedVotes;
  const turnoutPercent = totalRegisteredVoters > 0 
    ? ((totalVotesPolled / totalRegisteredVoters) * 100).toFixed(2)
    : '0.00';

  const sortedCandidates = [...candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-300 font-mono">
        {/* Top bar controls */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold tracking-wide">
              Official Form-47: Provisional Consolidated Results of the Count
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT FORM-47 (پرنٹ فارم 47)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Form-47 Document */}
        <div className="p-8 bg-white printable-area text-slate-900">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
            <div className="text-xs uppercase tracking-widest font-bold text-slate-600">
              ELECTION COMMISSION OF PAKISTAN
            </div>
            <h1 className="text-xl font-black font-serif tracking-tight mt-1 text-slate-950">
              FORM - 47
            </h1>
            <p className="text-xs italic text-slate-700">
              [See Rule 84 of Elections Rules, 2017]
            </p>
            <h2 className="text-sm font-bold uppercase tracking-wider mt-1 text-slate-900">
              PROVISIONAL CONSOLIDATED STATEMENT OF THE RESULTS OF THE COUNT
            </h2>
            <p className="text-xs font-urdu font-bold text-emerald-900 mt-0.5">
              فارم 47: نتائج کی ابتدائی غیر حتمی اور مجموعی تفصیل
            </p>
          </div>

          {/* Constituency Demographics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-300 rounded-xl mb-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Constituency</span>
              <span className="font-bold text-slate-900">{constituency}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">District / Province</span>
              <span className="font-bold text-slate-900">{district}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Polling Stations</span>
              <span className="font-bold text-slate-900">{pollingStationsCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Registered Voters</span>
              <span className="font-bold text-slate-900">{totalRegisteredVoters.toLocaleString()}</span>
            </div>
          </div>

          {/* Results Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-800">
                  <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">Sr #</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Name of Contesting Candidate</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Party Affiliation</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Allocated Symbol</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Valid Votes Polled</th>
                  <th className="py-2.5 px-3 text-right">% of Valid Votes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedCandidates.map((c, index) => {
                  const cVotes = c.votes || 0;
                  const cPercent = validVotes > 0 ? ((cVotes / validVotes) * 100).toFixed(1) : '0.0';
                  const isLeader = index === 0 && cVotes > 0;

                  return (
                    <tr key={c.id || index} className={isLeader ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center font-bold">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300">
                        <span className="font-bold text-slate-900">{c.name}</span>
                        {c.name_urdu && <span className="block font-urdu text-[11px] text-slate-600">{c.name_urdu}</span>}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-slate-700">
                        {c.party || 'Independent'}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            {renderSymbolIcon(c.sign_icon || c.sign_name, 'w-4 h-4', c.sign_image_url)}
                          </div>
                          <span className="font-medium text-slate-800">{c.sign_name || 'Scale of Justice'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-right font-bold text-slate-900">
                        {cVotes.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                        {cPercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Consolidated Statistics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100 border border-slate-300 rounded-xl mb-8 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Valid Votes (A)</span>
              <span className="font-black text-slate-900 text-sm">{validVotes.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Rejected / Invalid Votes (B)</span>
              <span className="font-bold text-slate-800 text-sm">{rejectedVotes.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Votes Polled (A+B)</span>
              <span className="font-black text-emerald-900 text-sm">{totalVotesPolled.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Voter Turnout %</span>
              <span className="font-black text-emerald-800 text-sm">{turnoutPercent}%</span>
            </div>
          </div>

          {/* Official Seals & Signature Blocks */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-400 text-xs text-center">
            <div>
              <div className="h-14 border-b border-dashed border-slate-400 mb-1" />
              <span className="font-bold text-slate-900 block">Presiding Officer</span>
              <span className="text-[10px] text-slate-500">Signature & Official Stamp</span>
            </div>

            <div className="flex flex-col items-center justify-end">
              <div className="w-20 h-20 rounded-full border-2 border-slate-400 flex items-center justify-center p-1 text-[9px] text-slate-400 font-bold uppercase text-center">
                ECP OFFICIAL EMBOSSED SEAL
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Date: {currentDate}</span>
            </div>

            <div>
              <div className="h-14 border-b border-dashed border-slate-400 mb-1" />
              <span className="font-bold text-slate-900 block">Returning Officer (NA-127)</span>
              <span className="text-[10px] text-slate-500">Signature & Verification Seal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
