import React from 'react';
import { SolveResult, MoveExplanation } from '../../types/cube';
import { 
  Bot, 
  Lightbulb, 
  Compass, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  BookOpen 
} from 'lucide-react';

interface ExplanationPanelProps {
  solution: SolveResult | null;
  currentStepIndex: number;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  solution,
  currentStepIndex,
}) => {
  if (!solution || !solution.success || solution.moves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-center backdrop-blur-xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
          <Bot className="w-6 h-6 text-indigo-400" />
        </div>
        <h4 className="font-semibold text-slate-200 text-sm">AI Solver Ready</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Click "Solve Cube" or scan faces with your webcam to generate optimal moves with intuitive AI explanations.
        </p>
      </div>
    );
  }

  const totalMoves = solution.moves.length;
  const isFinished = currentStepIndex >= totalMoves;
  const currentExplanation: MoveExplanation | undefined = 
    solution.explanations[Math.min(currentStepIndex, totalMoves - 1)];

  return (
    <div className="flex flex-col gap-4 p-5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">AI Step Intuition</h3>
            <span className="text-[11px] text-slate-400">{solution.algorithm}</span>
          </div>
        </div>
        
        {currentExplanation && !isFinished && (
          <div className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-semibold">
            {currentExplanation.phase}
          </div>
        )}
      </div>

      {isFinished ? (
        <div className="flex flex-col items-center py-6 text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-100 text-base">Cube Fully Solved!</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            All 54 facelets match their respective center faces in {totalMoves} moves and {solution.durationMs}ms compute time.
          </p>
        </div>
      ) : currentExplanation ? (
        <div className="flex flex-col gap-3.5">
          {/* Main Move Callout Card */}
          <div className="flex items-center gap-4 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-mono text-2xl font-bold shadow-lg shrink-0">
              {currentExplanation.move}
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                {currentExplanation.phaseName}
              </div>
              <div className="text-sm font-semibold text-slate-100 mt-0.5">
                {currentExplanation.explanation}
              </div>
            </div>
          </div>

          {/* Intuition / Strategic purpose */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-amber-300">Strategic Purpose: </span>
              {currentExplanation.intuition}
            </div>
          </div>

          {/* Quick Stage Context */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
            <span>Progress: Step {currentStepIndex + 1} of {totalMoves}</span>
            <span className="font-mono">{Math.round(((currentStepIndex + 1) / totalMoves) * 100)}% Complete</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
