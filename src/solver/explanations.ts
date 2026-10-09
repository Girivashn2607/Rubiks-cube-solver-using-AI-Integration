import { Move, MoveExplanation } from '../types/cube';

interface MoveBreakdown {
  action: string;
  axis: string;
  fingerTrick: string;
}

const MOVE_ACTION_DETAILS: Record<string, MoveBreakdown> = {
  U: {
    action: "Turn the Upper (White/top) face 90° clockwise.",
    axis: "Y-axis rotation",
    fingerTrick: "Index finger flick with right hand from back-right to front-right.",
  },
  "U'": {
    action: "Turn the Upper face 90° counter-clockwise (prime).",
    axis: "Y-axis reverse rotation",
    fingerTrick: "Left index finger flick from back-left towards front-left.",
  },
  U2: {
    action: "Turn the Upper face 180°.",
    axis: "Half turn on Y-axis",
    fingerTrick: "Double index-middle finger push ('U2 flick') across the top layer.",
  },
  D: {
    action: "Turn the Down (Yellow/bottom) face 90° clockwise.",
    axis: "Y-axis bottom rotation",
    fingerTrick: "Right ring finger push forward on bottom-right layer.",
  },
  "D'": {
    action: "Turn the Down face 90° counter-clockwise.",
    axis: "Y-axis bottom reverse rotation",
    fingerTrick: "Left ring finger push forward on bottom-left layer.",
  },
  D2: {
    action: "Turn the Down face 180°.",
    axis: "Half turn on bottom layer",
    fingerTrick: "Double ring-pinky finger pull along the bottom.",
  },
  R: {
    action: "Turn the Right (Red) face 90° clockwise (away from you).",
    axis: "X-axis right rotation",
    fingerTrick: "Firm upward wrist turn or right thumb pushing up.",
  },
  "R'": {
    action: "Turn the Right face 90° counter-clockwise (towards you).",
    axis: "X-axis right reverse rotation",
    fingerTrick: "Downward pull using right fingers on top-right edge.",
  },
  R2: {
    action: "Turn the Right face 180°.",
    axis: "Half turn on right side",
    fingerTrick: "Full 180° wrist rotation upward.",
  },
  L: {
    action: "Turn the Left (Orange) face 90° clockwise (towards you).",
    axis: "X-axis left rotation",
    fingerTrick: "Downward pull using left fingers on top-left edge.",
  },
  "L'": {
    action: "Turn the Left face 90° counter-clockwise (away from you).",
    axis: "X-axis left reverse rotation",
    fingerTrick: "Upward left wrist turn or left thumb push.",
  },
  L2: {
    action: "Turn the Left face 180°.",
    axis: "Half turn on left side",
    fingerTrick: "Full 180° left wrist rotation.",
  },
  F: {
    action: "Turn the Front (Green) face 90° clockwise.",
    axis: "Z-axis front rotation",
    fingerTrick: "Right index finger pushing down on top-right of front face.",
  },
  "F'": {
    action: "Turn the Front face 90° counter-clockwise.",
    axis: "Z-axis front reverse rotation",
    fingerTrick: "Right thumb pushing up on bottom-right front edge.",
  },
  F2: {
    action: "Turn the Front face 180°.",
    axis: "Half turn on front face",
    fingerTrick: "Two rapid quarter turns of front face using right hand fingers.",
  },
  B: {
    action: "Turn the Back (Blue) face 90° clockwise.",
    axis: "Z-axis back rotation",
    fingerTrick: "Left index finger pushing top of back face to the right.",
  },
  "B'": {
    action: "Turn the Back face 90° counter-clockwise.",
    axis: "Z-axis back reverse rotation",
    fingerTrick: "Right index finger pushing top of back face to the left.",
  },
  B2: {
    action: "Turn the Back face 180°.",
    axis: "Half turn on back face",
    fingerTrick: "Double push using index fingers across the back layer.",
  },
};

export function generateExplanationsForMoves(moves: Move[], mode: 'kociemba' | 'cfop_ai'): MoveExplanation[] {
  const total = moves.length;
  if (total === 0) return [];

  return moves.map((move, index) => {
    const stepNumber = index + 1;
    const progress = (index / Math.max(1, total - 1));
    const details = MOVE_ACTION_DETAILS[move] || {
      action: `Execute move ${move}`,
      axis: 'Standard face rotation',
      fingerTrick: 'Rotate face cleanly according to notation',
    };

    let phase = 'Phase 1';
    let phaseName = 'Edge & Corner Reduction';
    let intuition = 'Configuring edge orientations and slice group invariants.';

    if (mode === 'kociemba') {
      if (progress < 0.5) {
        phase = 'Phase 1';
        phaseName = 'Subgroup Reduction (G0 → G1)';
        intuition = `Orienting edges and positioning UD-slice pieces into the <U,D,L2,R2,F2,B2> subgroup. (${details.fingerTrick})`;
      } else {
        phase = 'Phase 2';
        phaseName = 'Permutation & Final Resolution (G1 → Solved)';
        intuition = `Permuting corners and edges within the restricted subgroup to reach the fully solved state. (${details.axis})`;
      }
    } else {
      // CFOP / Layer-by-Layer narrative decomposition
      if (progress <= 0.25) {
        phase = 'Stage 1';
        phaseName = 'Cross Alignment (Foundation)';
        intuition = `Aligning edge pieces with the matching center faces to secure the base layer. ${details.action}`;
      } else if (progress <= 0.55) {
        phase = 'Stage 2';
        phaseName = 'F2L: First Two Layers';
        intuition = `Pairing corner and middle edge pieces together to drop them cleanly into corner slots without breaking the cross.`;
      } else if (progress <= 0.8) {
        phase = 'Stage 3';
        phaseName = 'OLL: Orienting Last Layer';
        intuition = `Flipping all yellow top facelets upward so the entire top face becomes uniform yellow.`;
      } else {
        phase = 'Stage 4';
        phaseName = 'PLL: Permuting Last Layer';
        intuition = `Shuffling corners and edges along the top ring to lock every sticker into its final solved position!`;
      }
    }

    return {
      move,
      phase,
      phaseName,
      stepNumber,
      totalSteps: total,
      explanation: details.action,
      intuition,
    };
  });
}
