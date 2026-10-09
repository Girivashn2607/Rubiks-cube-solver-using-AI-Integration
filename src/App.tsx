import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Face, 
  Move, 
  FaceletState, 
  SolveResult, 
  SolverMode 
} from './types/cube';
import { 
  createSolvedFaceletState, 
  applyMove, 
  applyMoveSequence, 
  generateScramble, 
  isCubeSolved, 
  cloneFaceletState 
} from './solver/cubeModel';
import { solveCube, ensureSolverReady } from './solver/solverService';
import { CubeCanvas } from './components/3d/CubeCanvas';
import { FaceTurnControls } from './components/3d/FaceTurnControls';
import { FaceletNetEditor } from './components/editor/FaceletNetEditor';
import { WebcamScanner } from './components/scanner/WebcamScanner';
import { PlaybackControls } from './components/solver/PlaybackControls';
import { ExplanationPanel } from './components/solver/ExplanationPanel';
import { Header } from './components/layout/Header';
import { AlertCircle, CheckCircle, Info, Sparkles, HelpCircle } from 'lucide-react';

export function App() {
  // Primary cube state
  const [faceletState, setFaceletState] = useState<FaceletState>(createSolvedFaceletState);
  
  // Animation state for 3D rotations
  const [animatingMove, setAnimatingMove] = useState<Move | null>(null);
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const isAnimatingRef = useRef<boolean>(false);
  const moveQueueRef = useRef<Move[]>([]);

  // Solver and Playback state
  const [solverMode, setSolverMode] = useState<SolverMode>('kociemba');
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [playbackStates, setPlaybackStates] = useState<FaceletState[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [solverError, setSolverError] = useState<string | null>(null);

  // Modals & panels
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isEditorActive, setIsEditorActive] = useState<boolean>(false);
  const [lastScramble, setLastScramble] = useState<string>('');

  const solved = isCubeSolved(faceletState);

  // Pre-initialize solver lookup tables in background
  useEffect(() => {
    ensureSolverReady();
  }, []);

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ffffff'],
    });
  }, []);

  // Execute a single animated move
  const executeAnimatedMove = useCallback((move: Move, onComplete?: () => void) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setAnimatingMove(move);
    setAnimationProgress(0);

    const baseDuration = 220; // ms
    const duration = Math.max(60, baseDuration / playbackSpeed);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      setAnimationProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Complete the move
        setFaceletState(prev => {
          const next = applyMove(prev, move);
          if (isCubeSolved(next)) {
            triggerConfetti();
          }
          return next;
        });
        setAnimatingMove(null);
        setAnimationProgress(0);
        isAnimatingRef.current = false;
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animate);
  }, [playbackSpeed, triggerConfetti]);

  // Handle manual face clicks or toolbar buttons
  const handleManualMove = useCallback((move: Move) => {
    if (isPlaying) {
      setIsPlaying(false);
    }
    // Invalidate prior solution if cube moves manually
    setSolveResult(null);
    executeAnimatedMove(move);
  }, [isPlaying, executeAnimatedMove]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in an input field or scanner modal is open
      if (
        isScannerOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      const isShift = e.shiftKey;

      if (['U', 'D', 'L', 'R', 'F', 'B'].includes(key)) {
        e.preventDefault();
        const move: Move = isShift ? (`${key}'` as Move) : (key as Move);
        handleManualMove(move);
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (solveResult && solveResult.success && solveResult.moves.length > 0) {
          setIsPlaying(prev => !prev);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleStepForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleStepBackward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScannerOpen, solveResult, handleManualMove]);

  // Generate Scramble
  const handleScramble = (length: number = 20) => {
    setIsPlaying(false);
    setSolveResult(null);
    setSolverError(null);

    const moves = generateScramble(length);
    const scrambleStr = moves.join(' ');
    setLastScramble(scrambleStr);

    // Apply instantaneously to model
    const scrambled = applyMoveSequence(createSolvedFaceletState(), moves);
    setFaceletState(scrambled);
  };

  // Reset to solved state
  const handleResetSolved = () => {
    setIsPlaying(false);
    setSolveResult(null);
    setSolverError(null);
    setLastScramble('');
    setFaceletState(createSolvedFaceletState());
  };

  // Calculate Solution
  const handleSolve = () => {
    setIsPlaying(false);
    setIsSolving(true);
    setSolverError(null);

    setTimeout(() => {
      const result = solveCube(faceletState, solverMode);
      setIsSolving(false);

      if (!result.success) {
        setSolverError(result.error || 'Failed to solve cube state.');
        setSolveResult(null);
        return;
      }

      setSolveResult(result);
      setCurrentStepIndex(0);

      // Precalculate playback snapshot states for instant scrubber jumping
      const states: FaceletState[] = [cloneFaceletState(faceletState)];
      let curr = cloneFaceletState(faceletState);
      for (const m of result.moves) {
        curr = applyMove(curr, m);
        states.push(cloneFaceletState(curr));
      }
      setPlaybackStates(states);

      if (result.moves.length > 0) {
        setIsPlaying(true);
      } else {
        triggerConfetti();
      }
    }, 50);
  };

  // Playback Auto-Stepper
  useEffect(() => {
    if (!isPlaying || !solveResult || isAnimatingRef.current) return;

    if (currentStepIndex >= solveResult.moves.length) {
      setIsPlaying(false);
      triggerConfetti();
      return;
    }

    const nextMove = solveResult.moves[currentStepIndex];
    executeAnimatedMove(nextMove, () => {
      setCurrentStepIndex(prev => prev + 1);
    });
  }, [isPlaying, currentStepIndex, solveResult, executeAnimatedMove, triggerConfetti]);

  // Step Forward
  const handleStepForward = () => {
    if (!solveResult || currentStepIndex >= solveResult.moves.length) return;
    setIsPlaying(false);
    const nextMove = solveResult.moves[currentStepIndex];
    executeAnimatedMove(nextMove, () => {
      setCurrentStepIndex(prev => prev + 1);
    });
  };

  // Step Backward
  const handleStepBackward = () => {
    if (!solveResult || currentStepIndex <= 0) return;
    setIsPlaying(false);
    const targetIdx = currentStepIndex - 1;
    if (playbackStates[targetIdx]) {
      setFaceletState(cloneFaceletState(playbackStates[targetIdx]));
      setCurrentStepIndex(targetIdx);
    }
  };

  // Jump to Step Index
  const handleJumpToStep = (targetIndex: number) => {
    if (!solveResult) return;
    setIsPlaying(false);
    const bounded = Math.max(0, Math.min(targetIndex, solveResult.moves.length));
    if (playbackStates[bounded]) {
      setFaceletState(cloneFaceletState(playbackStates[bounded]));
      setCurrentStepIndex(bounded);
      if (bounded === solveResult.moves.length) {
        triggerConfetti();
      }
    }
  };

  // Handle scanned state from AI Webcam
  const handleApplyScannedState = (scanned: FaceletState) => {
    setFaceletState(scanned);
    setSolveResult(null);
    setSolverError(null);
    setLastScramble('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090f] text-slate-100 font-['Outfit']">
      {/* Top Navigation */}
      <Header
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenEditor={() => setIsEditorActive(prev => !prev)}
        isEditorActive={isEditorActive}
        onScramble={handleScramble}
        onResetSolved={handleResetSolved}
        onSolve={handleSolve}
        solverMode={solverMode}
        onSolverModeChange={setSolverMode}
        isSolving={isSolving}
        isSolved={solved}
        lastScramble={lastScramble}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3D Cube Canvas & Face Controls */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* 3D Canvas Box */}
          <div className="w-full aspect-[4/3] sm:aspect-[16/11] max-h-[560px]">
            <CubeCanvas
              faceletState={faceletState}
              animatingMove={animatingMove}
              animationProgress={animationProgress}
              onFaceClick={handleManualMove}
            />
          </div>

          {/* Quick Face Buttons Bar */}
          <FaceTurnControls
            onExecuteMove={handleManualMove}
            disabled={isPlaying || isAnimatingRef.current}
          />

          {/* Error Banner if any */}
          {solverError && (
            <div className="flex items-start gap-3 p-4 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-200 text-xs">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Solver Error: </span>
                <span>{solverError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Explanation, Playback Controls, 2D Net Editor */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Playback Controls when solution is ready */}
          {solveResult && solveResult.moves.length > 0 && (
            <PlaybackControls
              solution={solveResult}
              currentStepIndex={currentStepIndex}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              onJumpToStep={handleJumpToStep}
              onSpeedChange={setPlaybackSpeed}
              onReset={() => handleJumpToStep(0)}
            />
          )}

          {/* AI Explanation Pane */}
          <ExplanationPanel
            solution={solveResult}
            currentStepIndex={currentStepIndex}
          />

          {/* 2D Facelet Editor (collapsible or toggled) */}
          {isEditorActive && (
            <div className="transition-all animate-fadeIn">
              <FaceletNetEditor
                faceletState={faceletState}
                onChange={(newState) => {
                  setFaceletState(newState);
                  setSolveResult(null);
                }}
                onResetSolved={handleResetSolved}
              />
            </div>
          )}

          {/* Quick Guide Card */}
          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-xs text-slate-400 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Keyboard & Interaction Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">U D L R F B</kbd> Rotate face CW</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">Shift</kbd> + Face Rotate CCW (')</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">Space</kbd> Play / Pause solver</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">← →</kbd> Step prev / next</div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Webcam Scanner Modal */}
      <WebcamScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyState={handleApplyScannedState}
      />
    </div>
  );
}

export default App;
