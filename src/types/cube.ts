export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export type CubeColor = 'white' | 'red' | 'green' | 'yellow' | 'orange' | 'blue';

export type FaceletColorLetter = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export interface ColorDefinition {
  id: CubeColor;
  letter: FaceletColorLetter;
  name: string;
  hex: string;
  threeColor: string;
  bgClass: string;
  textClass: string;
}

export const CUBE_COLORS: Record<CubeColor, ColorDefinition> = {
  white: {
    id: 'white',
    letter: 'U',
    name: 'White',
    hex: '#FDFCFA',
    threeColor: '#fdfcfa',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-900',
  },
  red: {
    id: 'red',
    letter: 'R',
    name: 'Red',
    hex: '#C41E3A',
    threeColor: '#c41e3a',
    bgClass: 'bg-red-600',
    textClass: 'text-white',
  },
  green: {
    id: 'green',
    letter: 'F',
    name: 'Green',
    hex: '#009E60',
    threeColor: '#009e60',
    bgClass: 'bg-emerald-600',
    textClass: 'text-white',
  },
  yellow: {
    id: 'yellow',
    letter: 'D',
    name: 'Yellow',
    hex: '#FFD500',
    threeColor: '#ffd500',
    bgClass: 'bg-amber-400',
    textClass: 'text-slate-900',
  },
  orange: {
    id: 'orange',
    letter: 'L',
    name: 'Orange',
    hex: '#FF5800',
    threeColor: '#ff5800',
    bgClass: 'bg-orange-600',
    textClass: 'text-white',
  },
  blue: {
    id: 'blue',
    letter: 'B',
    name: 'Blue',
    hex: '#0051BA',
    threeColor: '#0051ba',
    bgClass: 'bg-blue-600',
    textClass: 'text-white',
  },
};


export const FACE_DEFAULT_COLORS: Record<Face, CubeColor> = {
  U: 'white',
  R: 'red',
  F: 'green',
  D: 'yellow',
  L: 'orange',
  B: 'blue',
};

// 54 facelet representation: 9 per face in order U1..U9, R1..R9, F1..F9, D1..D9, L1..L9, B1..B9
export type FaceletState = Record<Face, CubeColor[]>;

export type Move = 
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'L' | "L'" | 'L2'
  | 'R' | "R'" | 'R2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2';

export interface MoveExplanation {
  move: Move;
  phase: string;
  phaseName: string;
  stepNumber: number;
  totalSteps: number;
  explanation: string;
  intuition: string;
}

export type SolverMode = 'kociemba' | 'cfop_ai';

export interface SolveResult {
  success: boolean;
  moves: Move[];
  moveCount: number;
  durationMs: number;
  algorithm: string;
  explanations: MoveExplanation[];
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  counts: Record<CubeColor, number>;
  errors: string[];
}
