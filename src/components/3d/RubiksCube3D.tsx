import React, { useMemo, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Face, CubeColor, FaceletState, Move, CUBE_COLORS } from '../../types/cube';

interface RubiksCube3DProps {
  faceletState: FaceletState;
  animatingMove: Move | null;
  animationProgress: number; // 0 to 1
  onFaceClick?: (move: Move) => void;
}

const PLASTIC_BODY_COLOR = '#0e1014';
const GAP = 1.00;
const CUBELET_SIZE = 0.96;
const STICKER_WIDTH = 0.835;
const STICKER_RADIUS = 0.075;
const STICKER_OFFSET = CUBELET_SIZE / 2 + 0.001;

// Hermite cubic ease-in-out for smooth layer turns
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Helper to determine sticker color for a cubelet at (x,y,z) on face direction
function getStickerColor(
  x: number,
  y: number,
  z: number,
  faceDirection: 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz',
  state: FaceletState
): { hex: string; face: Face; colorKey: CubeColor; isCenter: boolean } {
  // px = +X (Right / R face)
  if (faceDirection === 'px' && x === 1) {
    const row = 1 - y;
    const col = 1 - z;
    const index = row * 3 + col;
    const colorKey = state.R[index] || 'red';
    return {
      hex: CUBE_COLORS[colorKey]?.hex || '#C41E3A',
      face: 'R',
      colorKey,
      isCenter: y === 0 && z === 0,
    };
  }

  // nx = -X (Left / L face)
  if (faceDirection === 'nx' && x === -1) {
    const row = 1 - y;
    const col = z + 1;
    const index = row * 3 + col;
    const colorKey = state.L[index] || 'orange';
    return {
      hex: CUBE_COLORS[colorKey]?.hex || '#FF5800',
      face: 'L',
      colorKey,
      isCenter: y === 0 && z === 0,
    };
  }

  // py = +Y (Up / U face)
  if (faceDirection === 'py' && y === 1) {
    const row = z + 1;
    const col = x + 1;
    const index = row * 3 + col;
    const colorKey = state.U[index] || 'white';
    return {
      hex: CUBE_COLORS[colorKey]?.hex || '#FDFCFA',
      face: 'U',
      colorKey,
      isCenter: x === 0 && z === 0,
    };
  }

  // ny = -Y (Down / D face)
  if (faceDirection === 'ny' && y === -1) {
    const row = 1 - z;
    const col = x + 1;
    const index = row * 3 + col;
    const colorKey = state.D[index] || 'yellow';
    return {
      hex: CUBE_COLORS[colorKey]?.hex || '#FFD500',
      face: 'D',
      colorKey,
      isCenter: x === 0 && z === 0,
    };
  }

  // pz = +Z (Front / F face)
  if (faceDirection === 'pz' && z === 1) {
    const row = 1 - y;
    const col = x + 1;
    const index = row * 3 + col;
    const colorKey = state.F[index] || 'green';
    return {
      hex: CUBE_COLORS[colorKey]?.hex || '#009E60',
      face: 'F',
      colorKey,
      isCenter: x === 0 && y === 0,
    };
  }

  // nz = -Z (Back / B face)
  if (faceDirection === 'nz' && z === -1) {
    const row = 1 - y;
    const col = 1 - x;
    const index = row * 3 + col;
    const colorKey = state.B[index] || 'blue';
    return {
      hex: CUBE_COLORS[colorKey]?.hex || '#0051BA',
      face: 'B',
      colorKey,
      isCenter: x === 0 && y === 0,
    };
  }

  return { hex: PLASTIC_BODY_COLOR, face: 'U', colorKey: 'white', isCenter: false };
}

// Generate the 27 coordinates
const CUBELET_COORDS: [number, number, number][] = [];
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      CUBELET_COORDS.push([x, y, z]);
    }
  }
}

// Create rounded rectangle sticker geometry with subtle bevel
function createStickerGeometry(w: number, r: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -w / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + w - r);
  shape.quadraticCurveTo(x + w, y + w, x + w - r, y + w);
  shape.lineTo(x + r, y + w);
  shape.quadraticCurveTo(x, y + w, x, y + w - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.006,
    bevelThickness: 0.005,
  });
}

// Create sleek center logo canvas texture
function createCenterLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Crisp white background
    ctx.fillStyle = '#FDFCFA';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle outer badge ring
    ctx.beginPath();
    ctx.arc(256, 256, 175, 0, Math.PI * 2);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Inner hairline ring
    ctx.beginPath();
    ctx.arc(256, 256, 155, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#6366f1';
    ctx.stroke();

    // Stylized 3D Cube Icon in center
    ctx.fillStyle = '#4f46e5';
    // Top isometric diamond
    ctx.beginPath();
    ctx.moveTo(256, 170);
    ctx.lineTo(315, 205);
    ctx.lineTo(256, 240);
    ctx.lineTo(197, 205);
    ctx.closePath();
    ctx.fill();

    // Left isometric diamond
    ctx.fillStyle = '#3730a3';
    ctx.beginPath();
    ctx.moveTo(197, 205);
    ctx.lineTo(256, 240);
    ctx.lineTo(256, 310);
    ctx.lineTo(197, 275);
    ctx.closePath();
    ctx.fill();

    // Right isometric diamond
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.moveTo(256, 240);
    ctx.lineTo(315, 205);
    ctx.lineTo(315, 275);
    ctx.lineTo(256, 310);
    ctx.closePath();
    ctx.fill();

    // Typography
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RubikAI', 256, 360);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

export const RubiksCube3D: React.FC<RubiksCube3DProps> = ({
  faceletState,
  animatingMove,
  animationProgress,
  onFaceClick,
}) => {
  const [hoveredFace, setHoveredFace] = useState<Face | null>(null);

  // Shared extruded rounded-rectangle sticker geometry
  const stickerGeo = useMemo(() => {
    return createStickerGeometry(STICKER_WIDTH, STICKER_RADIUS);
  }, []);

  // Shared center logo texture
  const centerLogoTexture = useMemo(() => {
    return createCenterLogoTexture();
  }, []);

  // Check if cubelet at (x, y, z) is part of animating face
  const isCubeletInTurn = (x: number, y: number, z: number, move: Move | null): boolean => {
    if (!move) return false;
    const face = move[0] as Face;
    switch (face) {
      case 'U': return y === 1;
      case 'D': return y === -1;
      case 'R': return x === 1;
      case 'L': return x === -1;
      case 'F': return z === 1;
      case 'B': return z === -1;
      default: return false;
    }
  };

  // Get rotation transform for animating cubelet
  const getTurnTransform = (move: Move | null, progress: number): [number, number, number] => {
    if (!move) return [0, 0, 0];
    const face = move[0] as Face;
    const isPrime = move.endsWith("'");
    const isDouble = move.endsWith("2");

    let angle = isDouble ? Math.PI : Math.PI / 2;
    if (isPrime) angle = -angle;

    // Apply smooth cubic ease
    const easedAngle = angle * easeInOutCubic(progress);

    switch (face) {
      case 'U': return [0, -easedAngle, 0];
      case 'D': return [0, easedAngle, 0];
      case 'R': return [-easedAngle, 0, 0];
      case 'L': return [easedAngle, 0, 0];
      case 'F': return [0, 0, -easedAngle];
      case 'B': return [0, 0, easedAngle];
      default: return [0, 0, 0];
    }
  };

  const currentRotation = getTurnTransform(animatingMove, animationProgress);

  const handleStickerClick = (face: Face, e: THREE.Event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e as any).stopPropagation();
    if (!onFaceClick) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nativeEvent = (e as any).nativeEvent as MouseEvent | undefined;
    const isShift = nativeEvent?.shiftKey ?? false;
    const move = isShift ? (`${face}'` as Move) : (face as Move);
    onFaceClick(move);
  };

  return (
    <group>
      {/* Central Black Plastic Core so interior mechanism is solid */}
      <mesh>
        <sphereGeometry args={[0.88, 16, 16]} />
        <meshStandardMaterial
          color="#08090b"
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* 27 Cubies */}
      {CUBELET_COORDS.map(([x, y, z]) => {
        const inTurn = isCubeletInTurn(x, y, z, animatingMove);
        const rot = inTurn ? currentRotation : [0, 0, 0];

        // Determine stickers for exposed faces
        const hasRight = x === 1;
        const hasLeft = x === -1;
        const hasTop = y === 1;
        const hasBottom = y === -1;
        const hasFront = z === 1;
        const hasBack = z === -1;

        const rightSticker = hasRight ? getStickerColor(x, y, z, 'px', faceletState) : null;
        const leftSticker = hasLeft ? getStickerColor(x, y, z, 'nx', faceletState) : null;
        const topSticker = hasTop ? getStickerColor(x, y, z, 'py', faceletState) : null;
        const bottomSticker = hasBottom ? getStickerColor(x, y, z, 'ny', faceletState) : null;
        const frontSticker = hasFront ? getStickerColor(x, y, z, 'pz', faceletState) : null;
        const backSticker = hasBack ? getStickerColor(x, y, z, 'nz', faceletState) : null;

        return (
          <group
            key={`${x}-${y}-${z}`}
            position={inTurn ? [0, 0, 0] : [x * GAP, y * GAP, z * GAP]}
            rotation={new THREE.Euler(rot[0], rot[1], rot[2])}
          >
            <group position={inTurn ? [x * GAP, y * GAP, z * GAP] : [0, 0, 0]}>
              {/* Black Plastic Cubie Body with rounded edges */}
              <RoundedBox
                args={[CUBELET_SIZE, CUBELET_SIZE, CUBELET_SIZE]}
                radius={0.045}
                smoothness={4}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  color={PLASTIC_BODY_COLOR}
                  roughness={0.62}
                  metalness={0.06}
                />
              </RoundedBox>

              {/* +X Right Sticker */}
              {rightSticker && (
                <mesh
                  geometry={stickerGeo}
                  position={[STICKER_OFFSET, 0, 0]}
                  rotation={[0, Math.PI / 2, 0]}
                  castShadow
                  receiveShadow
                  onClick={(e) => handleStickerClick('R', e)}
                  onPointerOver={(e) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (e as any).stopPropagation();
                    setHoveredFace('R');
                  }}
                  onPointerOut={() => setHoveredFace(null)}
                >
                  <meshPhysicalMaterial
                    color={rightSticker.hex}
                    roughness={0.2}
                    metalness={0.02}
                    clearcoat={0.35}
                    clearcoatRoughness={0.15}
                    emissive={hoveredFace === 'R' ? '#c41e3a' : '#000000'}
                    emissiveIntensity={hoveredFace === 'R' ? 0.08 : 0}
                  />
                </mesh>
              )}

              {/* -X Left Sticker */}
              {leftSticker && (
                <mesh
                  geometry={stickerGeo}
                  position={[-STICKER_OFFSET, 0, 0]}
                  rotation={[0, -Math.PI / 2, 0]}
                  castShadow
                  receiveShadow
                  onClick={(e) => handleStickerClick('L', e)}
                  onPointerOver={(e) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (e as any).stopPropagation();
                    setHoveredFace('L');
                  }}
                  onPointerOut={() => setHoveredFace(null)}
                >
                  <meshPhysicalMaterial
                    color={leftSticker.hex}
                    roughness={0.2}
                    metalness={0.02}
                    clearcoat={0.35}
                    clearcoatRoughness={0.15}
                    emissive={hoveredFace === 'L' ? '#ff5800' : '#000000'}
                    emissiveIntensity={hoveredFace === 'L' ? 0.08 : 0}
                  />
                </mesh>
              )}

              {/* +Y Up Sticker (White Face) */}
              {topSticker && (
                <mesh
                  geometry={stickerGeo}
                  position={[0, STICKER_OFFSET, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  castShadow
                  receiveShadow
                  onClick={(e) => handleStickerClick('U', e)}
                  onPointerOver={(e) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (e as any).stopPropagation();
                    setHoveredFace('U');
                  }}
                  onPointerOut={() => setHoveredFace(null)}
                >
                  <meshPhysicalMaterial
                    color={topSticker.hex}
                    map={topSticker.isCenter && topSticker.colorKey === 'white' ? centerLogoTexture : null}
                    roughness={0.18}
                    metalness={0.02}
                    clearcoat={0.35}
                    clearcoatRoughness={0.15}
                    emissive={hoveredFace === 'U' ? '#e2e8f0' : '#000000'}
                    emissiveIntensity={hoveredFace === 'U' ? 0.08 : 0}
                  />
                </mesh>
              )}

              {/* -Y Down Sticker (Yellow Face) */}
              {bottomSticker && (
                <mesh
                  geometry={stickerGeo}
                  position={[0, -STICKER_OFFSET, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  castShadow
                  receiveShadow
                  onClick={(e) => handleStickerClick('D', e)}
                  onPointerOver={(e) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (e as any).stopPropagation();
                    setHoveredFace('D');
                  }}
                  onPointerOut={() => setHoveredFace(null)}
                >
                  <meshPhysicalMaterial
                    color={bottomSticker.hex}
                    roughness={0.2}
                    metalness={0.02}
                    clearcoat={0.35}
                    clearcoatRoughness={0.15}
                    emissive={hoveredFace === 'D' ? '#ffd500' : '#000000'}
                    emissiveIntensity={hoveredFace === 'D' ? 0.08 : 0}
                  />
                </mesh>
              )}

              {/* +Z Front Sticker (Green Face) */}
              {frontSticker && (
                <mesh
                  geometry={stickerGeo}
                  position={[0, 0, STICKER_OFFSET]}
                  rotation={[0, 0, 0]}
                  castShadow
                  receiveShadow
                  onClick={(e) => handleStickerClick('F', e)}
                  onPointerOver={(e) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (e as any).stopPropagation();
                    setHoveredFace('F');
                  }}
                  onPointerOut={() => setHoveredFace(null)}
                >
                  <meshPhysicalMaterial
                    color={frontSticker.hex}
                    roughness={0.2}
                    metalness={0.02}
                    clearcoat={0.35}
                    clearcoatRoughness={0.15}
                    emissive={hoveredFace === 'F' ? '#009e60' : '#000000'}
                    emissiveIntensity={hoveredFace === 'F' ? 0.08 : 0}
                  />
                </mesh>
              )}

              {/* -Z Back Sticker (Blue Face) */}
              {backSticker && (
                <mesh
                  geometry={stickerGeo}
                  position={[0, 0, -STICKER_OFFSET]}
                  rotation={[0, Math.PI, 0]}
                  castShadow
                  receiveShadow
                  onClick={(e) => handleStickerClick('B', e)}
                  onPointerOver={(e) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (e as any).stopPropagation();
                    setHoveredFace('B');
                  }}
                  onPointerOut={() => setHoveredFace(null)}
                >
                  <meshPhysicalMaterial
                    color={backSticker.hex}
                    roughness={0.2}
                    metalness={0.02}
                    clearcoat={0.35}
                    clearcoatRoughness={0.15}
                    emissive={hoveredFace === 'B' ? '#0051ba' : '#000000'}
                    emissiveIntensity={hoveredFace === 'B' ? 0.08 : 0}
                  />
                </mesh>
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
};
