import React from 'react';
import { Face, Move } from '../../types/cube';
import { RotateCw, RotateCcw } from 'lucide-react';

interface FaceTurnControlsProps {
  onExecuteMove: (move: Move) => void;
  disabled?: boolean;
}

const FACES: { face: Face; name: string; colorClass: string; key: string }[] = [
  { face: 'U', name: 'Up', colorClass: 'border-slate-300 text-slate-200 hover:border-white', key: 'U' },
  { face: 'L', name: 'Left', colorClass: 'border-orange-500 text-orange-400 hover:border-orange-400', key: 'L' },
  { face: 'F', name: 'Front', colorClass: 'border-emerald-500 text-emerald-400 hover:border-emerald-400', key: 'F' },
  { face: 'R', name: 'Right', colorClass: 'border-red-500 text-red-400 hover:border-red-400', key: 'R' },
  { face: 'B', name: 'Back', colorClass: 'border-blue-500 text-blue-400 hover:border-blue-400', key: 'B' },
  { face: 'D', name: 'Down', colorClass: 'border-amber-400 text-amber-300 hover:border-amber-300', key: 'D' },
];

export const FaceTurnControls: React.FC<FaceTurnControlsProps> = ({
  onExecuteMove,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Face Controls (Click or Press Keys)
        </span>
        <span className="text-[10px] text-slate-500">Hold Shift for counter-clockwise (')</span>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {FACES.map(({ face, name, colorClass, key }) => (
          <div key={face} className="flex flex-col gap-1">
            {/* Clockwise button */}
            <button
              onClick={() => onExecuteMove(face as Move)}
              disabled={disabled}
              className={`py-2 px-1 rounded-xl bg-slate-950/70 border ${colorClass} font-mono font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-sm`}
              title={`Rotate ${name} face clockwise (${key})`}
            >
              <span>{face}</span>
              <RotateCw className="w-3 h-3 opacity-60" />
            </button>

            {/* Counter-Clockwise (Prime) button */}
            <button
              onClick={() => onExecuteMove(`${face}'` as Move)}
              disabled={disabled}
              className="py-1 px-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-mono text-[11px] flex items-center justify-center gap-0.5 transition-all disabled:opacity-40 disabled:pointer-events-none"
              title={`Rotate ${name} prime counter-clockwise (Shift+${key})`}
            >
              <span>{face}'</span>
              <RotateCcw className="w-2.5 h-2.5 opacity-60" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
