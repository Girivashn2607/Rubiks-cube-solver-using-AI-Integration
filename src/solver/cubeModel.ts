import { Face, CubeColor, FaceletState, Move, FACE_DEFAULT_COLORS, ValidationResult } from '../types/cube';

// Create a pristine solved state
export function createSolvedFaceletState(): FaceletState {
  return {
    U: Array(9).fill(FACE_DEFAULT_COLORS.U),
    R: Array(9).fill(FACE_DEFAULT_COLORS.R),
    F: Array(9).fill(FACE_DEFAULT_COLORS.F),
    D: Array(9).fill(FACE_DEFAULT_COLORS.D),
    L: Array(9).fill(FACE_DEFAULT_COLORS.L),
    B: Array(9).fill(FACE_DEFAULT_COLORS.B),
  };
}

// Clone facelet state
export function cloneFaceletState(state: FaceletState): FaceletState {
  return {
    U: [...state.U],
    R: [...state.R],
    F: [...state.F],
    D: [...state.D],
    L: [...state.L],
    B: [...state.B],
  };
}

// Helper to rotate a single 3x3 face clockwise
// Index layout:
// 0 1 2       6 3 0
// 3 4 5  -->  7 4 1
// 6 7 8       8 5 2
function rotateFaceCW(face: CubeColor[]): CubeColor[] {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2],
  ];
}

function rotateFaceCCW(face: CubeColor[]): CubeColor[] {
  return [
    face[2], face[5], face[8],
    face[1], face[4], face[7],
    face[0], face[3], face[6],
  ];
}

function rotateFace180(face: CubeColor[]): CubeColor[] {
  return rotateFaceCW(rotateFaceCW(face));
}

// Apply single basic 90 deg clockwise move to state
function applyQuarterTurn(state: FaceletState, face: Face): FaceletState {
  const next = cloneFaceletState(state);
  next[face] = rotateFaceCW(next[face]);

  switch (face) {
    case 'U': {
      // Adjacent faces: F top, R top, B top, L top
      // Indices: 0, 1, 2 on all 4
      const f0 = next.F[0], f1 = next.F[1], f2 = next.F[2];
      next.F[0] = next.R[0]; next.F[1] = next.R[1]; next.F[2] = next.R[2];
      next.R[0] = next.B[0]; next.R[1] = next.B[1]; next.R[2] = next.B[2];
      next.B[0] = next.L[0]; next.B[1] = next.L[1]; next.B[2] = next.L[2];
      next.L[0] = f0;        next.L[1] = f1;        next.L[2] = f2;
      break;
    }
    case 'D': {
      // Adjacent faces: F bot, L bot, B bot, R bot
      // Indices: 6, 7, 8
      const f6 = next.F[6], f7 = next.F[7], f8 = next.F[8];
      next.F[6] = next.L[6]; next.F[7] = next.L[7]; next.F[8] = next.L[8];
      next.L[6] = next.B[6]; next.L[7] = next.B[7]; next.L[8] = next.B[8];
      next.B[6] = next.R[6]; next.B[7] = next.R[7]; next.B[8] = next.R[8];
      next.R[6] = f6;        next.R[7] = f7;        next.R[8] = f8;
      break;
    }
    case 'L': {
      // Adjacent: U left (0,3,6), F left (0,3,6), D left (0,3,6), B right (8,5,2) inverted
      const u0 = next.U[0], u3 = next.U[3], u6 = next.U[6];
      next.U[0] = next.B[8]; next.U[3] = next.B[5]; next.U[6] = next.B[2];
      next.B[8] = next.D[0]; next.B[5] = next.D[3]; next.B[2] = next.D[6];
      next.D[0] = next.F[0]; next.D[3] = next.F[3]; next.D[6] = next.F[6];
      next.F[0] = u0;        next.F[3] = u3;        next.F[6] = u6;
      break;
    }
    case 'R': {
      // Adjacent: U right (2,5,8), B left (6,3,0) inverted, D right (2,5,8), F right (2,5,8)
      const u2 = next.U[2], u5 = next.U[5], u8 = next.U[8];
      next.U[2] = next.F[2]; next.U[5] = next.F[5]; next.U[8] = next.F[8];
      next.F[2] = next.D[2]; next.F[5] = next.D[5]; next.F[8] = next.D[8];
      next.D[2] = next.B[6]; next.D[5] = next.B[3]; next.D[8] = next.B[0];
      next.B[6] = u2;        next.B[3] = u5;        next.B[0] = u8;
      break;
    }
    case 'F': {
      // Adjacent: U bot (6,7,8), R left (0,3,6), D top (2,1,0), L right (8,5,2)
      const u6 = next.U[6], u7 = next.U[7], u8 = next.U[8];
      next.U[6] = next.L[8]; next.U[7] = next.L[5]; next.U[8] = next.L[2];
      next.L[2] = next.D[0]; next.L[5] = next.D[1]; next.L[8] = next.D[2];
      next.D[0] = next.R[6]; next.D[1] = next.R[3]; next.D[2] = next.R[0];
      next.R[0] = u6;        next.R[3] = u7;        next.R[6] = u8;
      break;
    }
    case 'B': {
      // Adjacent: U top (2,1,0), L left (0,3,6), D bot (6,7,8), R right (8,5,2)
      const u0 = next.U[0], u1 = next.U[1], u2 = next.U[2];
      next.U[0] = next.R[2]; next.U[1] = next.R[5]; next.U[2] = next.R[8];
      next.R[2] = next.D[8]; next.R[5] = next.D[7]; next.R[8] = next.D[6];
      next.D[6] = next.L[0]; next.D[7] = next.L[3]; next.D[8] = next.L[6];
      next.L[0] = u2;        next.L[3] = u1;        next.L[6] = u0;
      break;
    }
  }

  return next;
}

export function applyMove(state: FaceletState, move: Move): FaceletState {
  const face = move[0] as Face;
  const isPrime = move.endsWith("'");
  const isDouble = move.endsWith("2");

  if (isDouble) {
    const s1 = applyQuarterTurn(state, face);
    return applyQuarterTurn(s1, face);
  } else if (isPrime) {
    const s1 = applyQuarterTurn(state, face);
    const s2 = applyQuarterTurn(s1, face);
    return applyQuarterTurn(s2, face);
  } else {
    return applyQuarterTurn(state, face);
  }
}

export function applyMoveSequence(state: FaceletState, sequence: Move[] | string): FaceletState {
  const moves: Move[] = Array.isArray(sequence) 
    ? sequence 
    : (sequence.trim().split(/\s+/).filter(Boolean) as Move[]);
  
  let current = cloneFaceletState(state);
  for (const m of moves) {
    current = applyMove(current, m);
  }
  return current;
}

export function isCubeSolved(state: FaceletState): boolean {
  const faces: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  for (const f of faces) {
    const color = state[f][4]; // Center color
    for (let i = 0; i < 9; i++) {
      if (state[f][i] !== color) return false;
    }
  }
  return true;
}

export function validateFaceletCounts(state: FaceletState): ValidationResult {
  const counts: Record<CubeColor, number> = {
    white: 0,
    red: 0,
    green: 0,
    yellow: 0,
    orange: 0,
    blue: 0,
  };

  const faces: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  for (const f of faces) {
    for (const c of state[f]) {
      if (counts[c] !== undefined) {
        counts[c]++;
      }
    }
  }

  const errors: string[] = [];
  (Object.keys(counts) as CubeColor[]).forEach((color) => {
    if (counts[color] !== 9) {
      errors.push(`Color ${color} has ${counts[color]}/9 stickers`);
    }
  });

  return {
    isValid: errors.length === 0,
    counts,
    errors,
  };
}

export function faceletStateToKociembaString(state: FaceletState): string {
  // Map center colors to their face identifier
  // U center -> 'U', R center -> 'R', etc.
  const colorToFace: Partial<Record<CubeColor, Face>> = {};
  const faces: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  
  for (const f of faces) {
    const centerColor = state[f][4];
    colorToFace[centerColor] = f;
  }

  // Build standard 54-char string: U1..U9, R1..R9, F1..F9, D1..D9, L1..L9, B1..B9
  let result = '';
  for (const f of faces) {
    for (let i = 0; i < 9; i++) {
      const color = state[f][i];
      const faceLetter = colorToFace[color] || f;
      result += faceLetter;
    }
  }
  return result;
}

// Generate random WCA scramble avoiding trivial consecutive cancellations
export function generateScramble(length: number = 20): Move[] {
  const faces: Face[] = ['U', 'D', 'L', 'R', 'F', 'B'];
  const modifiers: ('' | "'" | '2')[] = ['', "'", '2'];
  const opposites: Record<Face, Face> = {
    U: 'D', D: 'U',
    L: 'R', R: 'L',
    F: 'B', B: 'F',
  };

  const moves: Move[] = [];
  let lastFace: Face | null = null;
  let secondLastFace: Face | null = null;

  while (moves.length < length) {
    const availableFaces = faces.filter(f => {
      if (f === lastFace) return false;
      if (lastFace && opposites[lastFace] === f && secondLastFace === f) return false;
      return true;
    });

    const face = availableFaces[Math.floor(Math.random() * availableFaces.length)];
    const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
    moves.push(`${face}${mod}` as Move);

    secondLastFace = lastFace;
    lastFace = face;
  }

  return moves;
}

// Invert a move sequence
export function invertMove(move: Move): Move {
  const face = move[0] as Face;
  if (move.endsWith('2')) return move;
  if (move.endsWith("'")) return face as Move;
  return `${face}'` as Move;
}

export function invertMoves(moves: Move[]): Move[] {
  return [...moves].reverse().map(invertMove);
}
