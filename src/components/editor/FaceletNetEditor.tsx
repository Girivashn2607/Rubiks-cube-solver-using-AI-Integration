import React, { useState } from 'react';
import { 
  Face, 
  CubeColor, 
  FaceletState, 
  CUBE_COLORS, 
  FACE_DEFAULT_COLORS,
  ValidationResult 
} from '../../types/cube';
import { validateFaceletCounts } from '../../solver/cubeModel';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Palette, 
  Lock, 
  Sparkles,
  Layers
} from 'lucide-react';

interface FaceletNetEditorProps {
  faceletState: FaceletState;
  onChange: (newState: FaceletState) => void;
  onResetSolved: () => void;
}

const FACE_NAMES: Record<Face, string> = {
  U: 'Up (White)',
  L: 'Left (Orange)',
  F: 'Front (Green)',
  R: 'Right (Red)',
  B: 'Back (Blue)',
  D: 'Down (Yellow)',
};

export const FaceletNetEditor: React.FC<FaceletNetEditorProps> = ({
  faceletState,
  onChange,
  onResetSolved,
}) => {
  const [selectedColor, setSelectedColor] = useState<CubeColor>('white');
  const [lockCenters, setLockCenters] = useState<boolean>(true);

  const validation: ValidationResult = validateFaceletCounts(faceletState);

  const handleFaceletClick = (face: Face, index: number) => {
    // If center sticker and centers locked, do not allow altering
    if (index === 4 && lockCenters) {
      return;
    }

    const nextFace = [...faceletState[face]];
    nextFace[index] = selectedColor;

    onChange({
      ...faceletState,
      [face]: nextFace,
    });
  };

  // Render a 3x3 face grid for a specific face
  const renderFaceGrid = (face: Face) => {
    const stickers = faceletState[face];
    return (
      <div className="flex flex-col items-center">
        <div className="text-[11px] font-semibold text-slate-400 mb-1 tracking-wider uppercase flex items-center gap-1">
          <span>{face}</span>
          <span className="text-slate-500 font-normal">({FACE_NAMES[face].split(' ')[1].replace(/[()]/g, '')})</span>
        </div>
        <div className="grid grid-cols-3 gap-1 p-1.5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-md">
          {stickers.map((color, index) => {
            const isCenter = index === 4;
            const def = CUBE_COLORS[color] || CUBE_COLORS.white;

            return (
              <button
                key={index}
                onClick={() => handleFaceletClick(face, index)}
                style={{ backgroundColor: def.hex }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md transition-all duration-150 relative flex items-center justify-center shadow-inner group
                  hover:scale-105 hover:ring-2 hover:ring-indigo-400 active:scale-95
                  ${isCenter && lockCenters ? 'cursor-not-allowed opacity-95' : 'cursor-pointer'}
                `}
                title={`${face} sticker ${index + 1} (${color})${isCenter ? ' - Fixed Center' : ''}`}
              >
                {isCenter && (
                  <span className="text-[10px] font-bold text-slate-900 bg-white/70 px-1 rounded-sm shadow-sm">
                    {face}
                  </span>
                )}
                {!isCenter && (
                  <span className="text-[9px] opacity-0 group-hover:opacity-60 text-slate-900 font-mono font-bold">
                    {index + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 bg-slate-900/70 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
      {/* Top Header & Color Palette Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-base">2D Facelet Net Editor</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a palette color, then click facelets to paint the custom cube state.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setLockCenters(!lockCenters)}
            className={`px-3 py-1.5 text-xs rounded-xl border flex items-center gap-1.5 transition-all ${
              lockCenters 
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
            title="Keep Western color center scheme locked"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{lockCenters ? 'Centers Locked' : 'Centers Free'}</span>
          </button>

          <button
            onClick={onResetSolved}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Solved</span>
          </button>
        </div>
      </div>

      {/* Palette Picker & Count Monitor */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1">Brush:</span>
          {(Object.keys(CUBE_COLORS) as CubeColor[]).map((cKey) => {
            const def = CUBE_COLORS[cKey];
            const count = validation.counts[cKey];
            const isSelected = selectedColor === cKey;
            const isExact = count === 9;

            return (
              <button
                key={cKey}
                onClick={() => setSelectedColor(cKey)}
                className={`relative px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                  isSelected 
                    ? 'ring-2 ring-indigo-400 bg-slate-800 shadow-md scale-105' 
                    : 'bg-slate-900/80 hover:bg-slate-800'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-black/20 shadow-sm"
                  style={{ backgroundColor: def.hex }}
                />
                <span className="text-xs font-medium capitalize text-slate-200 hidden md:inline">
                  {def.name}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold ${
                    isExact 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {count}/9
                </span>
              </button>
            );
          })}
        </div>

        {/* Validation Status Badge */}
        <div>
          {validation.isValid ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-medium">Valid Count (54/54)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Unbalanced counts</span>
            </div>
          )}
        </div>
      </div>

      {/* Unfolded 2D Cube Net Layout */}
      <div className="flex flex-col items-center justify-center py-2 select-none overflow-x-auto">
        <div className="flex flex-col items-center gap-2 min-w-[320px]">
          {/* Top Row: Face U */}
          <div className="flex justify-center">
            {renderFaceGrid('U')}
          </div>

          {/* Middle Row: L, F, R, B */}
          <div className="flex items-center gap-2 sm:gap-3">
            {renderFaceGrid('L')}
            {renderFaceGrid('F')}
            {renderFaceGrid('R')}
            {renderFaceGrid('B')}
          </div>

          {/* Bottom Row: Face D */}
          <div className="flex justify-center">
            {renderFaceGrid('D')}
          </div>
        </div>
      </div>
    </div>
  );
};
