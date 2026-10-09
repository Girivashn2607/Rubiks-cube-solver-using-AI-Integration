import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Face, 
  CubeColor, 
  FaceletState, 
  CUBE_COLORS, 
  FACE_DEFAULT_COLORS 
} from '../../types/cube';
import { validateFaceletCounts } from '../../solver/cubeModel';
import { 
  Camera, 
  Upload, 
  Check, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sliders, 
  Sparkles, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface WebcamScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyState: (scannedState: FaceletState) => void;
}

// Ordered faces for the guided scanner
const SCAN_ORDER: { face: Face; centerColor: CubeColor; label: string; orientationHint: string }[] = [
  { face: 'U', centerColor: 'white', label: 'Face 1: Up (White)', orientationHint: 'Hold White on Top, Green facing toward you' },
  { face: 'R', centerColor: 'red', label: 'Face 2: Right (Red)', orientationHint: 'Rotate cube left to show Red face (White still on top)' },
  { face: 'F', centerColor: 'green', label: 'Face 3: Front (Green)', orientationHint: 'Rotate cube right to show Green face (White on top)' },
  { face: 'D', centerColor: 'yellow', label: 'Face 4: Down (Yellow)', orientationHint: 'Tilt cube up to show Yellow face (Green on top)' },
  { face: 'L', centerColor: 'orange', label: 'Face 5: Left (Orange)', orientationHint: 'Show Orange face (White on top)' },
  { face: 'B', centerColor: 'blue', label: 'Face 6: Back (Blue)', orientationHint: 'Show Blue face (White on top)' },
];

// Color classification using HSV distance
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, v];
}

function classifyColor(r: number, g: number, b: number, sBoost: number = 0): CubeColor {
  const [h, s, v] = rgbToHsv(r, g, b);
  const adjustedS = Math.min(1, Math.max(0, s + sBoost));

  // 1. Check for White: low saturation, moderate to high brightness
  if (adjustedS < 0.25 && v > 0.40) {
    return 'white';
  }

  // 2. Classify by hue degrees
  if (h >= 45 && h <= 75) {
    return 'yellow';
  }
  if (h > 75 && h <= 165) {
    return 'green';
  }
  if (h > 165 && h <= 265) {
    return 'blue';
  }
  if (h > 12 && h < 45) {
    return 'orange';
  }
  // Red wraps around 345..360 and 0..12
  return 'red';
}

export const WebcamScanner: React.FC<WebcamScannerProps> = ({
  isOpen,
  onClose,
  onApplyState,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [scannedFaces, setScannedFaces] = useState<Record<Face, CubeColor[]>>({
    U: Array(9).fill('white'),
    R: Array(9).fill('red'),
    F: Array(9).fill('green'),
    D: Array(9).fill('yellow'),
    L: Array(9).fill('orange'),
    B: Array(9).fill('blue'),
  });

  const [liveStickers, setLiveStickers] = useState<CubeColor[]>(Array(9).fill('white'));
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [saturationBoost, setSaturationBoost] = useState<number>(0.05);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentStep = SCAN_ORDER[currentStepIndex];

  // Start webcam
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: unknown) {
      console.warn('Camera stream error:', err);
      setCameraError('Camera access unavailable. You can upload photo files below.');
      setCameraActive(false);
    }
  };

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  // Sample the 9 points from video frame or canvas image
  const sampleFrameColors = useCallback((source: HTMLVideoElement | HTMLImageElement): CubeColor[] => {
    const canvas = canvasRef.current;
    if (!canvas) return Array(9).fill('white');
    const ctx = canvas.getContext('2d');
    if (!ctx) return Array(9).fill('white');

    const width = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
    const height = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;

    if (!width || !height) return Array(9).fill('white');

    canvas.width = 300;
    canvas.height = 300;

    // Draw source scaled to 300x300 center square
    const minDim = Math.min(width, height);
    const sx = (width - minDim) / 2;
    const sy = (height - minDim) / 2;
    ctx.drawImage(source, sx, sy, minDim, minDim, 0, 0, 300, 300);

    // 9 sampling coordinates (centers of 3x3 grid)
    // Grid spans x: [50, 250], y: [50, 250]
    const detected: CubeColor[] = [];
    const cellStep = 70;
    const startOffset = 80;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Center sticker locked to current step face color
        if (row === 1 && col === 1) {
          detected.push(currentStep.centerColor);
          continue;
        }

        const cx = startOffset + col * cellStep;
        const cy = startOffset + row * cellStep;

        // Sample 9-pixel neighborhood average to cancel noise
        let sumR = 0, sumG = 0, sumB = 0;
        let samples = 0;
        for (let dx = -4; dx <= 4; dx += 2) {
          for (let dy = -4; dy <= 4; dy += 2) {
            const pixel = ctx.getImageData(cx + dx, cy + dy, 1, 1).data;
            sumR += pixel[0];
            sumG += pixel[1];
            sumB += pixel[2];
            samples++;
          }
        }

        const avgR = Math.round(sumR / samples);
        const avgG = Math.round(sumG / samples);
        const avgB = Math.round(sumB / samples);

        detected.push(classifyColor(avgR, avgG, avgB, saturationBoost));
      }
    }

    return detected;
  }, [currentStep.centerColor, saturationBoost]);

  // Periodic frame sampling loop
  useEffect(() => {
    if (!cameraActive) return;
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const colors = sampleFrameColors(videoRef.current);
        setLiveStickers(colors);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [cameraActive, sampleFrameColors]);

  // Capture current step
  const handleCaptureCurrentFace = () => {
    setScannedFaces(prev => ({
      ...prev,
      [currentStep.face]: [...liveStickers],
    }));

    if (currentStepIndex < SCAN_ORDER.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  // Handle photo file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const colors = sampleFrameColors(img);
      setLiveStickers(colors);
      setScannedFaces(prev => ({
        ...prev,
        [currentStep.face]: colors,
      }));
    };
    img.src = URL.createObjectURL(file);
  };

  // Quick manual adjustment of a sticker on current preview
  const cycleStickerColor = (index: number) => {
    if (index === 4) return; // keep center fixed
    const colors: CubeColor[] = ['white', 'red', 'green', 'yellow', 'orange', 'blue'];
    const current = liveStickers[index];
    const nextIdx = (colors.indexOf(current) + 1) % colors.length;
    const updated = [...liveStickers];
    updated[index] = colors[nextIdx];
    setLiveStickers(updated);
    setScannedFaces(prev => ({
      ...prev,
      [currentStep.face]: updated,
    }));
  };

  const validation = validateFaceletCounts(scannedFaces);

  const handleFinishAndApply = () => {
    onApplyState(scannedFaces);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Camera className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">AI Vision Face Scanner</h2>
              <p className="text-xs text-slate-400">Step {currentStepIndex + 1} of 6: {currentStep.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
          {/* Step orientation instructions */}
          <div className="flex items-start gap-3 p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <div 
                className="w-4 h-4 rounded-full border border-black/20" 
                style={{ backgroundColor: CUBE_COLORS[currentStep.centerColor].hex }}
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-indigo-200">
                Target: {CUBE_COLORS[currentStep.centerColor].name} Center Face
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {currentStep.orientationHint}
              </div>
            </div>
          </div>

          {/* Camera Viewport & 3x3 Overlay */}
          <div className="relative w-full aspect-square max-w-[340px] mx-auto bg-black rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-xl flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <Camera className="w-12 h-12 mb-3 text-slate-600" />
                <p className="text-xs">{cameraError || 'Camera inactive. Click button below to start or upload photo.'}</p>
              </div>
            )}

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* 3x3 Optical Grid Overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-6 pointer-events-none gap-2">
              {liveStickers.map((color, idx) => {
                const isCenter = idx === 4;
                const def = CUBE_COLORS[color] || CUBE_COLORS.white;

                return (
                  <div
                    key={idx}
                    className="border-2 border-dashed border-white/60 rounded-xl flex items-center justify-center backdrop-blur-[2px] transition-all"
                  >
                    <div
                      className="w-6 h-6 rounded-lg shadow-md border border-white/80 flex items-center justify-center text-[10px] font-bold text-slate-900"
                      style={{ backgroundColor: def.hex }}
                    >
                      {isCenter ? currentStep.face : idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Preview & Manual Correction Chips */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-slate-400">
              Detected Facelets (click to toggle if color misread):
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
              {liveStickers.map((color, idx) => {
                const def = CUBE_COLORS[color] || CUBE_COLORS.white;
                const isCenter = idx === 4;

                return (
                  <button
                    key={idx}
                    onClick={() => cycleStickerColor(idx)}
                    style={{ backgroundColor: def.hex }}
                    className={`w-9 h-9 rounded-lg font-mono text-[10px] font-bold text-slate-900 shadow transition-transform hover:scale-105 active:scale-95 ${
                      isCenter ? 'ring-2 ring-indigo-400' : ''
                    }`}
                    title={isCenter ? 'Locked Center' : 'Click to cycle detected color'}
                  >
                    {isCenter ? currentStep.face : idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calibration & Alternate Upload Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Saturation Sensitivity:</span>
              <input
                type="range"
                min="-0.15"
                max="0.25"
                step="0.02"
                value={saturationBoost}
                onChange={(e) => setSaturationBoost(parseFloat(e.target.value))}
                className="w-24 accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>
              {!cameraActive && (
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Start Camera</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
            disabled={currentStepIndex === 0}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Face</span>
          </button>

          {/* Stepper dots */}
          <div className="flex items-center gap-1.5">
            {SCAN_ORDER.map((step, idx) => (
              <button
                key={step.face}
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentStepIndex 
                    ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-125' 
                    : 'opacity-50 hover:opacity-100'
                }`}
                style={{ backgroundColor: CUBE_COLORS[step.centerColor].hex }}
                title={step.label}
              />
            ))}
          </div>

          {currentStepIndex < SCAN_ORDER.length - 1 ? (
            <button
              onClick={handleCaptureCurrentFace}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/30"
            >
              <span>Save & Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishAndApply}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/30"
            >
              <Check className="w-4 h-4" />
              <span>Apply State</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
