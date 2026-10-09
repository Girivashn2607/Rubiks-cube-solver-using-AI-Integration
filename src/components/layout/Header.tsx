import React from 'react';
import { SolverMode } from '../../types/cube';
import { 
  Box, 
  Camera, 
  Shuffle, 
  RotateCcw, 
  Play, 
  Sparkles, 
  Check, 
  Layers, 
  Cpu, 
  Zap,
  Grid
} from 'lucide-react';

interface HeaderProps {
  onOpenScanner: () => void;
  onOpenEditor: () => void;
  isEditorActive: boolean;
  onScramble: (length?: number) => void;
  onResetSolved: () => void;
  onSolve: () => void;
  solverMode: SolverMode;
  onSolverModeChange: (mode: SolverMode) => void;
  isSolving: boolean;
  isSolved: boolean;
  lastScramble: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenScanner,
  onOpenEditor,
  isEditorActive,
  onScramble,
  onResetSolved,
  onSolve,
  solverMode,
  onSolverModeChange,
  isSolving,
  isSolved,
  lastScramble,
}) => {
  return (
    <header className="w-full flex flex-col gap-3 py-4 px-4 sm:px-6 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Box className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-['Outfit']">
                <span>Rubik</span>
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Two-Phase + Vision
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Interactive 3D Rubik's Cube • Kociemba Optimal Solver • Webcam Vision AI
            </p>
          </div>
        </div>

        {/* Middle Mode Toggles */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => onSolverModeChange('kociemba')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              solverMode === 'kociemba'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Kociemba Two-Phase shortest move solver (~20 moves)"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Optimal (Kociemba)</span>
          </button>

          <button
            onClick={() => onSolverModeChange('cfop_ai')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              solverMode === 'cfop_ai'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="AI Step-by-Step with CFOP pedagogical explanations"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Assisted (CFOP)</span>
          </button>
        </div>

        {/* Action Button Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Webcam Scan */}
          <button
            onClick={onOpenScanner}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all hover:border-indigo-500/50 shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Webcam Scan</span>
          </button>

          {/* 2D Net Editor Toggle */}
          <button
            onClick={onOpenEditor}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isEditorActive
                ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-indigo-500/50'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-indigo-400" />
            <span>2D Palette</span>
          </button>

          {/* Scramble buttons */}
          <button
            onClick={() => onScramble(20)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all hover:border-indigo-500/50 shadow-sm"
            title="Generate standard WCA 20-move scramble"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>Scramble</span>
          </button>

          {/* Reset Solved */}
          <button
            onClick={onResetSolved}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-all"
            title="Reset to Solved"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Main Solve Button */}
          <button
            onClick={onSolve}
            disabled={isSolving || isSolved}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Cpu className="w-4 h-4" />
            <span>{isSolving ? 'Solving...' : isSolved ? 'Cube Solved' : 'Solve Cube'}</span>
          </button>
        </div>
      </div>

      {/* Active Scramble Marquee if scramble exists */}
      {lastScramble && (
        <div className="max-w-7xl w-full mx-auto flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 overflow-x-auto">
          <span className="font-semibold text-amber-400 shrink-0 uppercase tracking-wider text-[10px]">
            Scramble:
          </span>
          <span className="font-mono text-indigo-200 select-all whitespace-nowrap">
            {lastScramble}
          </span>
        </div>
      )}
    </header>
  );
};
