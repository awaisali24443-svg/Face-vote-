import React from 'react';
import { Activity, Radio } from 'lucide-react';

interface EarWaveformProps {
  history: number[];
  currentEAR: number | null;
  baselineEAR: number | null;
  thresholdEAR: number;
  blinkCount: number;
  requiredBlinks: number;
  isLivenessActive: boolean;
  recentBlink?: boolean;
}

export const EarWaveform: React.FC<EarWaveformProps> = ({
  history,
  currentEAR,
  baselineEAR,
  thresholdEAR,
  blinkCount,
  requiredBlinks,
  isLivenessActive,
  recentBlink = false,
}) => {
  // Graph dimensions
  const width = 320;
  const height = 94;
  const paddingY = 8;
  const maxEAR = 0.45;
  const minEAR = 0.05;

  const mapY = (val: number) => {
    const clamped = Math.max(minEAR, Math.min(maxEAR, val));
    const normalized = (clamped - minEAR) / (maxEAR - minEAR);
    return height - paddingY - normalized * (height - 2 * paddingY);
  };

  const points = history.slice(-30);
  const pathD =
    points.length > 1
      ? points
          .map((ear, idx) => {
            const x = (idx / (Math.max(points.length - 1, 1))) * width;
            const y = mapY(ear);
            return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join(' ')
      : '';

  const baselineY = baselineEAR ? mapY(baselineEAR) : null;
  const thresholdY = mapY(thresholdEAR);

  return (
    <div className="w-full bg-slate-950/90 rounded-xl p-3 border border-cyan-900/60 space-y-2 relative overflow-hidden font-mono shadow-inner">
      {/* Subtle sci-fi corner bracket */}
      <span className="absolute top-1 left-1 w-2 h-2 border-t border-l border-cyan-400" />
      <span className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-cyan-400" />

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] text-cyan-300 font-bold tracking-wider">
            EAR.OSCILLOSCOPE // 14Hz
          </span>
        </div>
        <div className="text-[11px] text-cyan-400 font-bold tracking-wider bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-800">
          {currentEAR !== null ? `${currentEAR.toFixed(3)} EAR` : 'SIGNAL: IDLE'}
        </div>
      </div>

      {/* SVG Waveform Chart with Sci-Fi Grid */}
      <div className="relative w-full h-[94px] bg-slate-950 rounded-lg overflow-hidden border border-cyan-950 flex items-center justify-center">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full relative z-10"
          preserveAspectRatio="none"
        >
          {/* Subtle horizontal grid lines */}
          <line
            x1="0"
            y1={mapY(0.35)}
            x2={width}
            y2={mapY(0.35)}
            stroke="#0e7490"
            strokeDasharray="4 4"
            strokeWidth="0.7"
            opacity="0.4"
          />
          <line
            x1="0"
            y1={mapY(0.20)}
            x2={width}
            y2={mapY(0.20)}
            stroke="#0e7490"
            strokeDasharray="4 4"
            strokeWidth="0.7"
            opacity="0.4"
          />

          {/* Baseline EAR Guide */}
          {baselineY !== null && (
            <line
              x1="0"
              y1={baselineY}
              x2={width}
              y2={baselineY}
              stroke="#38bdf8"
              strokeDasharray="3 3"
              strokeWidth="1.2"
              opacity="0.6"
            />
          )}

          {/* Blink Threshold Line */}
          <line
            x1="0"
            y1={thresholdY}
            x2={width}
            y2={thresholdY}
            stroke="#34d399"
            strokeDasharray="4 2"
            strokeWidth="1.2"
            opacity="0.8"
          />

          {/* EAR Waveform with Glow Filter Underlay */}
          {pathD && (
            <>
              {/* Wide neon glow trace */}
              <path
                d={pathD}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="5"
                opacity="0.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Core neon laser trace */}
              <path
                d={pathD}
                fill="none"
                stroke={isLivenessActive ? '#38bdf8' : '#22d3ee'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Current point highlight */}
          {points.length > 0 && (
            <circle
              cx={width - 2}
              cy={mapY(points[points.length - 1])}
              r="4"
              fill="#22d3ee"
              stroke="#082f49"
              strokeWidth="1.5"
            />
          )}
        </svg>

        {points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-cyan-700/80">
            [SYNCHRONIZING OPTICAL TELEMETRY...]
          </div>
        )}

        {recentBlink && (
          <div className="absolute top-2 right-2 px-2.5 py-1 rounded bg-emerald-500 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-bounce z-20">
            ✓ BLINK RECORDED
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-1 left-2 flex items-center space-x-3 text-[8px] font-mono text-slate-400 pointer-events-none z-10">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-0.5 bg-emerald-400 inline-block" />
            <span>CUTOFF (&le;{thresholdEAR.toFixed(2)})</span>
          </span>
          {baselineEAR && (
            <span className="flex items-center space-x-1">
              <span className="w-2 h-0.5 bg-sky-400 inline-block" />
              <span>BASE ({baselineEAR.toFixed(2)})</span>
            </span>
          )}
        </div>
      </div>

      {/* Real-time Blink Counter during verification */}
      <div className="flex items-center justify-between text-[11px] font-mono pt-1">
        <span className="text-slate-400 text-[10px] tracking-wider uppercase">VALIDATED PULSES:</span>
        <div className="flex items-center space-x-1.5">
          {Array.from({ length: requiredBlinks }).map((_, i) => (
            <span
              key={i}
              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${
                i < blinkCount
                  ? 'bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : 'bg-slate-900 text-slate-600 border border-slate-800'
              }`}
            >
              {i < blinkCount ? '✓' : i + 1}
            </span>
          ))}
          <span
            className={`font-bold ml-1 text-xs ${
              blinkCount >= requiredBlinks ? 'text-emerald-400' : 'text-cyan-300'
            }`}
          >
            [{blinkCount}/{requiredBlinks}]
          </span>
        </div>
      </div>
    </div>
  );
};
