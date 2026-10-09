import React from 'react';
import { Move, SolveResult } from '../../types/cube';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  CheckCircle, 
  Zap, 
  Gauge,
  Sparkles
} from 'lucide-react';

interface PlaybackControlsProps {
  solution: SolveResult | null;
  currentStepIndex: number; // 0 to solution.moves.length
  isPlaying: boolean;
  playbackSpeed: number; // 0.5, 1, 2, 4
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJumpToStep: (stepIndex: number) => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
}

const SPEED_OPTIONS = [0.5, 1, 2, 3, 4];

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  solution,
  currentStepIndex,
  isPlaying,
  playbackSpeed,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onJumpToStep,
  onSpeedChange,
  onReset,
}) => {
  if (!solution || !solution.success || solution.moves.length === 0) {
    return null;
  }

  const totalMoves = solution.moves.length;
  const isFinished = currentStepIndex >= totalMoves;
  const progressPercent = Math.round((currentStepIndex / totalMoves) * 100);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-xl">
      {/* Top row: Progress info & Speed selectors */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-mono font-bold text-xs">
            {currentStepIndex}/{totalMoves}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">
              {isFinished ? 'Cube Solved 🎉' : `Executing Step ${currentStepIndex + 1}`}
            </div>
            <div className="text-[11px] text-slate-400">
              {progressPercent}% Complete • {solution.algorithm}
            </div>
          </div>
        </div>

        {/* Speed Multiplier Bar */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
          {SPEED_OPTIONS.map((spd) => (
            <button
              key={spd}
              onClick={() => onSpeedChange(spd)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                playbackSpeed === spd
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar scrubber */}
      <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <button
          onClick={onReset}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
          title="Jump to Start"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onStepBackward}
          disabled={currentStepIndex <= 0}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 hover:text-white border border-slate-700 transition-all"
          title="Step Backward"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Play / Pause Main CTA */}
        {isPlaying ? (
          <button
            onClick={onPause}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all scale-105"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={isFinished}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all scale-105"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{currentStepIndex === 0 ? 'Start Playback' : 'Resume'}</span>
          </button>
        )}

        <button
          onClick={onStepForward}
          disabled={isFinished}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 hover:text-white border border-slate-700 transition-all"
          title="Step Forward"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <button
          onClick={() => onJumpToStep(totalMoves)}
          disabled={isFinished}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 hover:text-white border border-slate-700 transition-all"
          title="Fast-forward to End"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* Move chips scrollable row */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-thin">
        {solution.moves.map((move: Move, idx: number) => {
          const isPassed = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <button
              key={idx}
              onClick={() => onJumpToStep(idx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold shrink-0 transition-all ${
                isCurrent
                  ? 'bg-indigo-500 text-white ring-2 ring-indigo-400 shadow-md scale-110 z-10'
                  : isPassed
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {move}
            </button>
          );
        })}
      </div>
    </div>
  );
};
