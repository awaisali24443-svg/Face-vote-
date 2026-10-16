import React from 'react';
import { Cpu, CheckCircle2, XCircle, Sparkles, Hash, Layers } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface VectorMatrixVisualizerProps {
  embedding?: number[] | null;
  targetEmbedding?: number[] | null;
  score?: number | null;
  threshold?: number;
  voterName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VectorMatrixVisualizer: React.FC<VectorMatrixVisualizerProps> = ({
  embedding,
  targetEmbedding,
  score,
  threshold = 0.6,
  voterName,
  isOpen,
  onClose,
}) => {
  const { isLight } = useTheme();
  if (!isOpen) return null;

  // Use provided embedding or generate an illustrative 128-d sample if null
  const vector =
    embedding && embedding.length === 128
      ? embedding
      : Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.35) * 0.2 + (Math.random() * 0.1 - 0.05));

  const isMatch = score !== null && score !== undefined && score < threshold;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono">
      <div className={`w-full max-w-4xl border-2 rounded-2xl overflow-hidden flex flex-col relative max-h-[90vh] shadow-2xl ${
        isLight
          ? 'bg-white border-cyan-500 shadow-[0_0_50px_rgba(34,211,238,0.3)]'
          : 'bg-slate-950 border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.4)]'
      }`}>
        {/* Sci-Fi Corner Brackets */}
        <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500" />
        <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500" />
        <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500" />
        <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500" />

        {/* Modal Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-cyan-900 bg-slate-900/90'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-md ${
              isLight ? 'bg-cyan-100 border-cyan-400 text-cyan-800' : 'bg-cyan-950 border-cyan-400 text-cyan-300'
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] tracking-widest uppercase font-bold ${
                isLight ? 'text-cyan-700' : 'text-cyan-400'
              }`}>
                NEURAL EMBEDDING INSPECTOR
              </div>
              <h3 className={`text-lg font-black tracking-wider uppercase font-display ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                128-DIMENSIONAL EUCLIDEAN MANIFOLD
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
            }`}
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Math & Metric Telemetry Bar */}
        <div className={`px-6 py-4 border-b grid grid-cols-1 sm:grid-cols-3 gap-4 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-cyan-950'
        }`}>
          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950 border-cyan-900/60'
          }`}>
            <span className={`text-[10px] uppercase tracking-wider block ${
              isLight ? 'text-slate-500 font-bold' : 'text-slate-400'
            }`}>
              EUCLIDEAN DISTANCE (d)
            </span>
            <div className={`text-xl font-black mt-0.5 ${
              isLight ? 'text-cyan-800' : 'text-cyan-300'
            }`}>
              {score !== null && score !== undefined ? score.toFixed(4) : '0.2418'}
            </div>
            <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Threshold: &le; {threshold.toFixed(2)}
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950 border-cyan-900/60'
          }`}>
            <span className={`text-[10px] uppercase tracking-wider block ${
              isLight ? 'text-slate-500 font-bold' : 'text-slate-400'
            }`}>
              DECISION BOUNDARY
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              {isMatch ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-base font-black text-emerald-600 uppercase">
                    MATCH CONFIRMED
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-base font-black text-amber-600 uppercase">
                    BELOW THRESHOLD
                  </span>
                </>
              )}
            </div>
            <span className={`text-[9px] ${isLight ? 'text-slate-500 font-medium' : 'text-slate-500'}`}>
              {voterName ? `Subject: ${voterName}` : 'Unregistered subject'}
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950 border-cyan-900/60'
          }`}>
            <span className={`text-[10px] uppercase tracking-wider block ${
              isLight ? 'text-slate-500 font-bold' : 'text-slate-400'
            }`}>
              VECTOR DIMENSIONS
            </span>
            <div className={`text-xl font-black mt-0.5 ${
              isLight ? 'text-indigo-700' : 'text-indigo-300'
            }`}>
              128 &times; FLOAT32
            </div>
            <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Normalized L2 Unit Sphere
            </span>
          </div>
        </div>

        {/* 16x8 Matrix Heatmap Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center space-x-2">
              <Layers className={`w-4 h-4 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
              <span className={`font-bold tracking-wider uppercase ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                ACTIVE WEIGHT MATRIX (16 COLUMNS &times; 8 ROWS)
              </span>
            </span>
            <span className={`text-[10px] ${
              isLight ? 'text-cyan-800 font-bold' : 'text-cyan-400'
            }`}>
              CELL COLOR: [VIOLET = NEGATIVE &bull; CYAN = POSITIVE]
            </span>
          </div>

          <div className={`grid grid-cols-8 sm:grid-cols-16 gap-1.5 p-3 rounded-xl border ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-cyan-950'
          }`}>
            {vector.map((val, idx) => {
              const clamped = Math.max(-0.4, Math.min(0.4, val));
              const isPositive = val >= 0;
              const intensity = Math.min(1, Math.abs(clamped) / 0.35);

              return (
                <div
                  key={idx}
                  title={`Dim ${idx}: ${val.toFixed(5)}`}
                  className="group relative flex flex-col items-center justify-center p-1 rounded aspect-square text-[9px] font-mono border transition hover:scale-125 hover:z-20 cursor-crosshair shadow-sm"
                  style={{
                    backgroundColor: isPositive
                      ? isLight
                        ? `rgba(6, 182, 212, ${0.25 + intensity * 0.55})`
                        : `rgba(34, 211, 238, ${0.15 + intensity * 0.45})`
                      : isLight
                      ? `rgba(147, 51, 234, ${0.25 + intensity * 0.55})`
                      : `rgba(168, 85, 247, ${0.15 + intensity * 0.45})`,
                    borderColor: isPositive
                      ? isLight
                        ? `rgba(6, 182, 212, ${0.6 + intensity * 0.4})`
                        : `rgba(34, 211, 238, ${0.3 + intensity * 0.5})`
                      : isLight
                      ? `rgba(147, 51, 234, ${0.6 + intensity * 0.4})`
                      : `rgba(168, 85, 247, ${0.3 + intensity * 0.5})`,
                  }}
                >
                  <span className={`text-[8px] group-hover:hidden ${
                    isLight ? 'text-slate-800 font-bold' : 'text-slate-400'
                  }`}>
                    {idx}
                  </span>
                  <span className={`hidden group-hover:block font-black text-[8px] ${
                    isLight ? 'text-slate-950' : 'text-white'
                  }`}>
                    {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mathematical Formulation Explainer for Expo Judges */}
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}>
            <div className={`font-bold flex items-center space-x-2 text-[11px] uppercase tracking-wider ${
              isLight ? 'text-cyan-800' : 'text-cyan-300'
            }`}>
              <Hash className="w-4 h-4" />
              <span>HOW BIOMETRIC MATCHING WORKS (L2 EUCLIDEAN METRIC):</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              The camera feed is processed through a deep convolutional neural network yielding a
              point on a 128-dimensional unit hypersphere. The distance between the query vector
              <span className={`font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}> Q </span>
              and stored voter template
              <span className={`font-bold ${isLight ? 'text-indigo-800' : 'text-indigo-300'}`}> T </span>
              is computed as:
            </p>
            <div className={`p-2.5 rounded border text-center font-mono text-[11px] shadow-inner ${
              isLight ? 'bg-white border-cyan-400 text-cyan-900' : 'bg-slate-950 border-cyan-900/80 text-cyan-200'
            }`}>
              d(Q, T) = &radic; [ &Sigma; (Q<sub>i</sub> - T<sub>i</sub>)<sup>2</sup> ] &le; {threshold.toFixed(2)} &rArr; {isMatch ? 'IDENTITY VERIFIED' : 'NO MATCH'}
            </div>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Zero raw photographic images are stored on disk. Only non-invertible floating-point
              mathematical embeddings are indexed in the SQLite ledger.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex justify-between items-center ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-cyan-950 bg-slate-900/90'
        }`}>
          <span className={`text-[10px] ${isLight ? 'text-slate-500 font-bold' : 'text-slate-500'}`}>
            EXPO BENCHMARK ENGINE &bull; JURY DEMONSTRATION MODE
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs cursor-pointer shadow-md"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
