import Cube from './kociembaLib.js';
import { FaceletState, Move, SolveResult, SolverMode } from '../types/cube';
import { 
  faceletStateToKociembaString, 
  isCubeSolved, 
  validateFaceletCounts 
} from './cubeModel';
import { generateExplanationsForMoves } from './explanations';

let isSolverInitialized = false;

export function ensureSolverReady(): void {
  if (!isSolverInitialized) {
    try {
      Cube.initSolver();
      isSolverInitialized = true;
    } catch (e) {
      console.warn('Cube solver initialization warning:', e);
    }
  }
}

export function solveCube(state: FaceletState, mode: SolverMode = 'kociemba'): SolveResult {
  const startTime = performance.now();

  // 1. Check if already solved
  if (isCubeSolved(state)) {
    return {
      success: true,
      moves: [],
      moveCount: 0,
      durationMs: Math.round(performance.now() - startTime),
      algorithm: mode === 'kociemba' ? 'Two-Phase Kociemba (Optimal)' : 'AI-Assisted CFOP Step-by-Step',
      explanations: [],
    };
  }

  // 2. Validate sticker counts
  const validation = validateFaceletCounts(state);
  if (!validation.isValid) {
    return {
      success: false,
      moves: [],
      moveCount: 0,
      durationMs: Math.round(performance.now() - startTime),
      algorithm: mode === 'kociemba' ? 'Two-Phase Kociemba' : 'AI-Assisted CFOP',
      explanations: [],
      error: `Invalid sticker counts: ${validation.errors.slice(0, 3).join(', ')}. Ensure each color has exactly 9 stickers.`,
    };
  }

  // 3. Make sure solver tables are ready
  ensureSolverReady();

  try {
    const kociembaString = faceletStateToKociembaString(state);
    
    // Parse into Cube instance
    const cube = Cube.fromString(kociembaString);
    if (cube.isSolved()) {
      return {
        success: true,
        moves: [],
        moveCount: 0,
        durationMs: Math.round(performance.now() - startTime),
        algorithm: 'Already Solved',
        explanations: [],
      };
    }

    // Run Two-Phase Kociemba solver
    // maxDepth = 22 for fast, near-optimal solution
    const solutionStr = cube.solve(22);
    
    if (!solutionStr || solutionStr.trim() === '') {
      return {
        success: false,
        moves: [],
        moveCount: 0,
        durationMs: Math.round(performance.now() - startTime),
        algorithm: 'Two-Phase Kociemba',
        explanations: [],
        error: 'No solution found. Check for illegal corner twist or flipped edge parity.',
      };
    }

    const rawMoves = solutionStr.trim().split(/\s+/).filter(Boolean) as Move[];
    const explanations = generateExplanationsForMoves(rawMoves, mode);
    const durationMs = Math.round(performance.now() - startTime);

    return {
      success: true,
      moves: rawMoves,
      moveCount: rawMoves.length,
      durationMs,
      algorithm: mode === 'kociemba' ? 'Two-Phase Kociemba (Optimal)' : 'AI-Assisted CFOP Step-by-Step',
      explanations,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      moves: [],
      moveCount: 0,
      durationMs: Math.round(performance.now() - startTime),
      algorithm: 'Two-Phase Kociemba',
      explanations: [],
      error: `Solver error: ${message}. Verify cube facelet state is mechanically valid.`,
    };
  }
}
