import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { RubiksCube3D } from './RubiksCube3D';
import { FaceletState, Move } from '../../types/cube';
import { RotateCw, Play, Pause, Eye } from 'lucide-react';

interface CubeCanvasProps {
  faceletState: FaceletState;
  animatingMove: Move | null;
  animationProgress: number;
  onFaceClick?: (move: Move) => void;
  isAutoRotate?: boolean;
}

export const CubeCanvas: React.FC<CubeCanvasProps> = ({
  faceletState,
  animatingMove,
  animationProgress,
  onFaceClick,
  isAutoRotate: initialAutoRotate = false,
}) => {
  const controlsRef = useRef<OrbitControlsType>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(initialAutoRotate);

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] md:min-h-[480px] lg:min-h-[540px] flex items-center justify-center select-none overflow-hidden rounded-2xl glass-panel-glow bg-slate-950/60">
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,rgba(15,23,42,0.6)_70%,transparent_100%)] pointer-events-none" />

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [4.8, 3.8, 5.2], fov: 36 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Balanced Studio Photography Lighting */}
        <ambientLight intensity={0.75} />
        
        {/* Key Light with soft shadows */}
        <directionalLight
          position={[6, 9, 7]}
          intensity={1.35}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
        
        {/* Fill Light for subtle contrast on opposing faces */}
        <directionalLight
          position={[-7, 5, -5]}
          intensity={0.65}
          color="#f8fafc"
        />

        {/* Top-back rim light to catch beveled edges */}
        <directionalLight
          position={[-3, 8, 5]}
          intensity={0.4}
          color="#e2e8f0"
        />

        {/* Subtle ground bounce */}
        <directionalLight
          position={[0, -6, 0]}
          intensity={0.25}
          color="#cbd5e1"
        />

        {/* 3D Rubik's Cube Model */}
        <RubiksCube3D
          faceletState={faceletState}
          animatingMove={animatingMove}
          animationProgress={animationProgress}
          onFaceClick={onFaceClick}
        />

        {/* Realistic Floor Contact Shadow */}
        <ContactShadows
          position={[0, -2.25, 0]}
          opacity={0.65}
          scale={7.5}
          blur={2.2}
          far={4.5}
          color="#06080e"
        />

        {/* Natural Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={3.8}
          maxDistance={10.0}
          rotateSpeed={0.8}
          dampingFactor={0.06}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
        />
      </Canvas>

      {/* Floating Canvas Quick Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-lg text-xs flex items-center gap-1.5 ${
            autoRotate
              ? 'bg-indigo-600/40 text-white border-indigo-500/60'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
          }`}
          title={autoRotate ? 'Pause Auto-Rotation' : 'Auto-Rotate Cube'}
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{autoRotate ? 'Stop Spin' : 'Auto Spin'}</span>
        </button>

        <button
          onClick={resetView}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-700/60 hover:border-indigo-500/50 backdrop-blur-md transition-all shadow-lg text-xs flex items-center gap-1.5"
          title="Reset Camera View to Default Isometric Angle"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset View</span>
        </button>
      </div>

      {/* Orbit hint badge */}
      <div className="absolute bottom-3 left-4 text-[11px] text-slate-400/80 bg-slate-950/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5 pointer-events-none flex items-center gap-1.5">
        <Eye className="w-3 h-3 text-indigo-400" />
        <span>Drag to orbit 3D cube • Click face stickers or buttons to turn</span>
      </div>
    </div>
  );
};
