import React from 'react';
import { Printer, X, ShieldCheck, CreditCard, Award, CheckCircle2 } from 'lucide-react';
import { Voter } from '../types';
import { cyberSound } from '../services/soundEffects';

interface PrintVoterCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  voter: Voter;
}

export const PrintVoterCardModal: React.FC<PrintVoterCardModalProps> = ({
  isOpen,
  onClose,
  voter,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    cyberSound.playClick();
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-300 font-mono">
        {/* Top bar controls */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold tracking-wide">
              Official Voter Registration Certificate
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT CERTIFICATE (پرنٹ)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="p-8 bg-white printable-area text-slate-900 space-y-6">
          <div className="border-4 border-double border-emerald-800 p-6 rounded-2xl relative bg-emerald-50/20">
            {/* Corner Badge */}
            <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-3">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🇵🇰</span>
                <div>
                  <h2 className="text-xs uppercase tracking-widest font-black text-emerald-950">
                    NATIONAL DATABASE & REGISTRATION AUTHORITY (NADRA)
                  </h2>
                  <h3 className="text-sm font-bold font-serif text-slate-900">
                    GOVERNMENT OF PAKISTAN • ELECTORAL ROLL REGISTRATION
                  </h3>
                </div>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-700" />
            </div>

            {/* Voter Details */}
            <div className="grid grid-cols-3 gap-4 pt-4 items-start">
              {/* Photo Box */}
              <div className="col-span-1">
                <div className="w-full h-36 rounded-xl border-2 border-slate-400 overflow-hidden bg-slate-100 flex items-center justify-center relative shadow-sm">
                  {voter.photo ? (
                    <img
                      src={voter.photo}
                      alt={voter.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <span className="text-2xl font-bold text-slate-400">{voter.name.charAt(0)}</span>
                      <span className="block text-[9px] text-slate-400">PHOTO ON RECORD</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-emerald-900/90 text-white text-[8px] text-center py-0.5 font-bold uppercase">
                    NADRA BIOMETRIC VERIFIED
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-[10px] font-bold text-emerald-900 block font-mono">
                    ID #{String(voter.id).padStart(4, '0')}
                  </span>
                </div>
              </div>

              {/* Data Fields */}
              <div className="col-span-2 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Full Name / نام</span>
                  <span className="font-bold text-slate-900 text-sm">{voter.name}</span>
                  {voter.name_urdu && <span className="block font-urdu text-xs text-emerald-900">{voter.name_urdu}</span>}
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">CNIC Number / قومی شناختی کارڈ نمبر</span>
                  <span className="font-black text-slate-900 tracking-wider font-mono text-sm">
                    {voter.cnic || '35201-9482715-3'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Gender</span>
                    <span className="font-bold text-slate-800">{voter.gender || 'Male'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Constituency</span>
                    <span className="font-bold text-slate-800">{voter.constituency || 'NA-127'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Electoral Block</span>
                    <span className="font-bold text-slate-800">{voter.electoral_block_code || '352010104'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Date of Enrollment</span>
                    <span className="font-bold text-slate-800">{currentDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Polling Station Assignment */}
            <div className="mt-4 p-2.5 bg-white rounded-lg border border-slate-300 text-[11px]">
              <span className="text-[9px] text-slate-500 uppercase block font-bold">Assigned Polling Station</span>
              <span className="font-bold text-slate-900">
                {voter.polling_station || 'Govt. Model High School, Booth #01, Lahore'}
              </span>
            </div>

            {/* Footer Barcode */}
            <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-400 flex items-center justify-between text-[9px] text-slate-500">
              <span>Security Stamp: NADRA-EVM-SEC-{voter.id}</span>
              <div className="flex items-center space-x-0.5 h-6">
                {[2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 3, 1, 2, 4, 1].map((w, i) => (
                  <div key={i} className="bg-slate-900 h-full" style={{ width: `${w * 1.5}px` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
