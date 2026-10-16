import React from 'react';
import {
  Printer,
  X,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Calendar,
  MapPin,
  FileText,
  User,
  Hash,
} from 'lucide-react';
import { Voter } from '../types';
import { cyberSound } from '../services/soundEffects';

interface PrintVoterSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  voter: Voter;
  tokenNumber?: string;
  pollingBooth?: string;
  constituency?: string;
}

export const PrintVoterSlipModal: React.FC<PrintVoterSlipModalProps> = ({
  isOpen,
  onClose,
  voter,
  tokenNumber = `ECP-${new Date().getFullYear()}-${String(voter.id).padStart(4, '0')}`,
  pollingBooth = voter.polling_station || 'Govt. Model High School, Booth #01',
  constituency = voter.constituency || 'NA-127 (Lahore-XI)',
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
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const maskedCnic = voter.cnic
    ? voter.cnic.replace(/^(\d{5})-?\d{7}-?(\d)$/, '$1-*******-$2')
    : '35201-*******-3';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-300 font-mono">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold tracking-wide">ECP Official Voter Slip Preview</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT SLIP (پرنٹ)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Slip Document */}
        <div className="p-6 bg-white printable-area">
          {/* Official ECP Header */}
          <div className="text-center border-b-2 border-dashed border-slate-400 pb-4">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <span className="text-2xl">🇵🇰</span>
              <span className="text-xs uppercase font-bold tracking-widest text-slate-600">
                ELECTION COMMISSION OF PAKISTAN
              </span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-950 font-serif uppercase">
              BIOMETRIC VOTER VERIFICATION SLIP
            </h1>
            <p className="text-[12px] font-urdu text-emerald-800 font-bold mt-0.5">
              الیکشن کمیشن آف پاکستان • بائیو میٹرک ووٹر تصدیقی پرچی
            </p>
            <div className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-bold">
              TOKEN / SLIP #: <span className="text-emerald-950 font-black tracking-wider">{tokenNumber}</span>
            </div>
          </div>

          {/* Citizen & Polling Metadata Grid */}
          <div className="py-4 space-y-3 border-b border-slate-200 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Voter Name / ووٹر کا نام</span>
                <span className="font-bold text-slate-900 text-sm">{voter.name}</span>
                {voter.name_urdu && (
                  <span className="block font-urdu text-xs text-slate-700 font-bold">{voter.name_urdu}</span>
                )}
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Father / Husband Name</span>
                <span className="font-bold text-slate-800">{voter.father_name || 'Muhammad Ali Khan'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">CNIC Number / شناختی کارڈ</span>
                <span className="font-black text-slate-900 tracking-wider font-mono">{maskedCnic}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Voter Serial / انتخابی شمار</span>
                <span className="font-bold text-emerald-800">#{String(voter.id).padStart(4, '0')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Constituency / حلقہ</span>
                <span className="font-bold text-slate-900">{constituency}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Block Code / شماریاتی بلاک</span>
                <span className="font-bold text-slate-800">{voter.electoral_block_code || '352010104'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Polling Station / پولنگ اسٹیشن</span>
              <span className="font-bold text-slate-900 text-[11px]">{pollingBooth}</span>
            </div>
          </div>

          {/* Biometric Verification Seal */}
          <div className="py-3 bg-emerald-50/80 rounded-xl border border-emerald-200 px-3 my-3 text-[11px] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-950 block">BIOMETRIC 128-D FACE MATCH: PASS</span>
                <span className="text-[9px] text-emerald-800">Liveness & Identity Confirmed by EVM Kiosk</span>
              </div>
            </div>
            <span className="font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
              VERIFIED
            </span>
          </div>

          {/* Timestamp & Barcode Visualizer */}
          <div className="pt-2 flex items-end justify-between text-[10px] text-slate-500 border-t border-dashed border-slate-300">
            <div>
              <p className="font-mono">Date: <span className="font-bold text-slate-800">{currentDate}</span></p>
              <p className="font-mono">Time: <span className="font-bold text-slate-800">{currentTime}</span></p>
              <p className="text-[9px] text-slate-400 mt-1">EVM Security Hash: {tokenNumber}-SEC7X</p>
            </div>

            <div className="text-right">
              {/* Simulated high-density barcode */}
              <div className="flex items-center space-x-0.5 h-7 mb-1 justify-end">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 2, 1, 3, 2, 4, 1, 2].map((w, i) => (
                  <div
                    key={i}
                    className="bg-slate-950 h-full"
                    style={{ width: `${w * 1.5}px` }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-mono tracking-widest text-slate-700">*{tokenNumber}*</span>
            </div>
          </div>

          {/* Footer Notice */}
          <p className="text-[9px] text-center text-slate-500 mt-4 border-t border-slate-200 pt-2">
            Hand over this verification slip to the Presiding Officer before proceeding to the Secret Ballot booth.
          </p>
        </div>
      </div>
    </div>
  );
};
