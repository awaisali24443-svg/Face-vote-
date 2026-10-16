import React, { useEffect, useRef } from 'react';
import { CheckInStatus } from '../types';
import { FullFaceValidation } from '../services/faceApi';

interface BiometricMeshCanvasProps {
  landmarks: any | null;
  box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  status: CheckInStatus | string;
  isLivenessActive: boolean;
  blinkFlash: boolean;
  leftEar?: number | null;
  rightEar?: number | null;
  ear?: number | null;
  headTilt?: number;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  showCallouts?: boolean;
  fullFaceValidation?: FullFaceValidation | null;
  activeScanZone?: string;
}

/**
 * Sci-Fi Movie Facial Measurement HUD Canvas.
 * Renders authentic movie-style biometric measuring lines, dimension calipers,
 * neoclassical facial thirds, dynamic laser ruler sweep, and coordinate crosshairs.
 * Completely free of spider-webs and polygon meshes.
 */
export const BiometricMeshCanvas: React.FC<BiometricMeshCanvasProps> = ({
  landmarks,
  box,
  status,
  isLivenessActive,
  blinkFlash,
  leftEar,
  rightEar,
  ear,
  headTilt = 0,
  videoRef,
  showCallouts = true,
  fullFaceValidation,
  activeScanZone,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const tickRef = useRef<number>(0);
  const faceDetectedTimestampRef = useRef<number>(0);
  const lastHadFaceRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isSubscribed = true;

    const render = () => {
      if (!isSubscribed) return;
      tickRef.current += 1;
      const tick = tickRef.current;

      // Ensure canvas pixel buffer matches video intrinsic resolution
      if (videoRef?.current && videoRef.current.videoWidth > 0) {
        if (
          canvas.width !== videoRef.current.videoWidth ||
          canvas.height !== videoRef.current.videoHeight
        ) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
        }
      } else if (landmarks?.imageWidth && landmarks?.imageHeight) {
        if (canvas.width !== landmarks.imageWidth || canvas.height !== landmarks.imageHeight) {
          canvas.width = landmarks.imageWidth;
          canvas.height = landmarks.imageHeight;
        }
      }

      const width = canvas.width;
      const height = canvas.height;

      // Clear previous frame
      ctx.clearRect(0, 0, width, height);

      const hasFace = Boolean(landmarks && landmarks.positions && landmarks.positions.length >= 68);

      if (hasFace && !lastHadFaceRef.current) {
        faceDetectedTimestampRef.current = performance.now();
      }
      lastHadFaceRef.current = hasFace;

      if (!hasFace) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const points: Array<{ x: number; y: number }> = landmarks.positions;

      // Animate measurement lines snapping into place over 600ms
      const now = performance.now();
      const elapsed = Math.max(0, now - faceDetectedTimestampRef.current);
      const snapProgress = Math.min(1.0, elapsed / 600);
      const easeSnap = 1 - Math.pow(1 - snapProgress, 3);

      // Color theme based on current security/match status
      let primaryColor = '#22d3ee'; // Electric cyan
      let secondaryColor = '#06b6d4'; // Cyan 500
      let dimColor = 'rgba(34, 211, 238, 0.35)';
      let glowColor = 'rgba(34, 211, 238, 0.85)';
      let eyeColor = '#38bdf8';
      let accentColor = '#67e8f9';

      if (status === 'already_voted') {
        primaryColor = '#f43f5e';
        secondaryColor = '#be123c';
        dimColor = 'rgba(244, 63, 94, 0.4)';
        glowColor = 'rgba(244, 63, 94, 0.95)';
        eyeColor = '#fb7185';
        accentColor = '#fda4af';
      } else if (status === 'match_found' || blinkFlash) {
        primaryColor = '#34d399';
        secondaryColor = '#059669';
        dimColor = 'rgba(52, 211, 153, 0.45)';
        glowColor = 'rgba(52, 211, 153, 0.9)';
        eyeColor = '#6ee7b7';
        accentColor = '#a7f3d0';
      } else if (isLivenessActive) {
        primaryColor = '#38bdf8';
        dimColor = 'rgba(56, 189, 248, 0.4)';
        glowColor = 'rgba(56, 189, 248, 0.85)';
      }

      ctx.save();
      // High-efficiency crisp rendering (0 shadowBlur eliminates CPU software raster blur)
      ctx.shadowBlur = 0;

      // Helper to draw clean polyline
      const drawPolyline = (
        indices: number[],
        close = false,
        lineWidth = 1.2,
        stroke = primaryColor,
        dash: number[] = []
      ) => {
        ctx.beginPath();
        if (dash.length > 0) ctx.setLineDash(dash);
        for (let i = 0; i < indices.length; i++) {
          const pt = points[indices[i]];
          if (!pt) continue;
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        if (close) ctx.closePath();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        if (dash.length > 0) ctx.setLineDash([]);
      };

      // Fast caliper dimension line with end tick brackets (clean visual lines, no number clutter)
      const drawCaliper = (
        pA: { x: number; y: number },
        pB: { x: number; y: number },
        offsetY = 0,
        bracketLen = 8,
        color = primaryColor
      ) => {
        const yA = pA.y + offsetY;
        const yB = pB.y + offsetY;
        const midX = (pA.x + pB.x) * 0.5;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.1;

        // Projection extension lines (from actual facial point to caliper bar)
        if (Math.abs(offsetY) > 2) {
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pA.x, yA);
          ctx.moveTo(pB.x, pB.y);
          ctx.lineTo(pB.x, yB);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Main caliper dimension line (animating outward from center)
        const curAx = midX + (pA.x - midX) * easeSnap;
        const curBx = midX + (pB.x - midX) * easeSnap;

        const halfTick = bracketLen * 0.5;
        ctx.beginPath();
        // Dimension bar
        ctx.moveTo(curAx, yA);
        ctx.lineTo(curBx, yB);
        // Left bracket: |
        ctx.moveTo(curAx, yA - halfTick);
        ctx.lineTo(curAx, yA + halfTick);
        // Right bracket: |
        ctx.moveTo(curBx, yB - halfTick);
        ctx.lineTo(curBx, yB + halfTick);
        ctx.stroke();
      };

      // Helper for vertical caliper dimension line
      const drawVerticalCaliper = (
        topPt: { x: number; y: number },
        bottomPt: { x: number; y: number },
        offsetX = 0,
        bracketLen = 8,
        color = primaryColor
      ) => {
        const xT = topPt.x + offsetX;
        const xB = bottomPt.x + offsetX;
        const midX = (xT + xB) * 0.5;
        const midY = (topPt.y + bottomPt.y) * 0.5;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.1;

        if (Math.abs(offsetX) > 2) {
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(topPt.x, topPt.y);
          ctx.lineTo(xT, topPt.y);
          ctx.moveTo(bottomPt.x, bottomPt.y);
          ctx.lineTo(xB, bottomPt.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const curTy = midY + (topPt.y - midY) * easeSnap;
        const curBy = midY + (bottomPt.y - midY) * easeSnap;
        const halfTick = bracketLen * 0.5;

        ctx.beginPath();
        // Vertical bar
        ctx.moveTo(midX, curTy);
        ctx.lineTo(midX, curBy);
        // Top bracket: -
        ctx.moveTo(midX - halfTick, curTy);
        ctx.lineTo(midX + halfTick, curTy);
        // Bottom bracket: -
        ctx.moveTo(midX - halfTick, curBy);
        ctx.lineTo(midX + halfTick, curBy);
        ctx.stroke();
      };

      // -------------------------------------------------------------
      // 1. REFINED FACIAL FEATURE OUTLINES
      // Clean, thin, high-contrast natural contours (no spiderweb, no cage)
      // -------------------------------------------------------------
      // Jawline
      drawPolyline(
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        false,
        1.3,
        dimColor
      );

      // Eyebrows
      drawPolyline([17, 18, 19, 20, 21], false, 1.4, primaryColor);
      drawPolyline([22, 23, 24, 25, 26], false, 1.4, primaryColor);

      // Eyes
      drawPolyline([36, 37, 38, 39, 40, 41], true, blinkFlash ? 2.5 : 1.5, eyeColor);
      drawPolyline([42, 43, 44, 45, 46, 47], true, blinkFlash ? 2.5 : 1.5, eyeColor);

      // Nose bridge and base
      drawPolyline([27, 28, 29, 30], false, 1.3, primaryColor);
      drawPolyline([31, 32, 33, 34, 35], true, 1.2, primaryColor);

      // Lips
      drawPolyline([48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59], true, 1.1, dimColor);
      drawPolyline([60, 61, 62, 63, 64, 65, 66, 67], true, 0.8, dimColor);

      // -------------------------------------------------------------
      // 2. BIOMETRIC MEASUREMENT CALIPERS (MOVIE-STYLE DIMENSION LINES)
      // -------------------------------------------------------------
      const leftPupil = {
        x: (points[36].x + points[39].x) * 0.5,
        y: (points[36].y + points[39].y) * 0.5,
      };
      const rightPupil = {
        x: (points[42].x + points[45].x) * 0.5,
        y: (points[42].y + points[45].y) * 0.5,
      };

      // 1) INTER-PUPILLARY DISTANCE (IPD) CALIPER
      drawCaliper(leftPupil, rightPupil, -18, 10, primaryColor);

      // Pupil measuring crosses and rings
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      [leftPupil, rightPupil].forEach((p) => {
        ctx.moveTo(p.x - 5, p.y);
        ctx.lineTo(p.x + 5, p.y);
        ctx.moveTo(p.x, p.y - 5);
        ctx.lineTo(p.x, p.y + 5);
      });
      ctx.stroke();

      ctx.strokeStyle = dimColor;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(leftPupil.x, leftPupil.y, 6, 0, Math.PI * 2);
      ctx.arc(rightPupil.x, rightPupil.y, 6, 0, Math.PI * 2);
      ctx.stroke();

      // 2) ZYGOMATIC (CHEEKBONE BREADTH) CALIPER
      const leftZygion = points[2];
      const rightZygion = points[14];
      if (leftZygion && rightZygion) {
        drawCaliper(leftZygion, rightZygion, 0, 10, accentColor);
      }

      // 3) MANDIBULAR (JAWLINE BREADTH) CALIPER
      const leftGon = points[4];
      const rightGon = points[12];
      if (leftGon && rightGon) {
        drawCaliper(leftGon, rightGon, 16, 8, dimColor);
      }

      // 4) ALAR (NOSTRIL BREADTH) & LABIAL (LIP WIDTH) CALIPERS
      const leftAlar = points[31];
      const rightAlar = points[35];
      if (leftAlar && rightAlar) {
        drawCaliper(leftAlar, rightAlar, 8, 6, secondaryColor);
      }

      const leftCheilion = points[48];
      const rightCheilion = points[54];
      if (leftCheilion && rightCheilion) {
        drawCaliper(leftCheilion, rightCheilion, -12, 6, dimColor);
      }

      // 5) VERTICAL NEOCLASSICAL FACIAL AXIS (CRANIAL HEIGHT)
      const chinPt = points[8];
      const glabellaPt = points[27];
      const subnasalePt = points[33];
      if (chinPt && glabellaPt && subnasalePt) {
        const midBrowY = (points[19].y + points[24].y) * 0.5;
        const foreheadApex = {
          x: glabellaPt.x,
          y: midBrowY - (subnasalePt.y - midBrowY) * 0.9,
        };

        // Vertical caliper line on right side of face
        drawVerticalCaliper(
          foreheadApex,
          chinPt,
          box ? box.width * 0.45 : 85,
          10,
          primaryColor
        );

        // Midline alignment axis through face center
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(foreheadApex.x, foreheadApex.y);
        ctx.lineTo(chinPt.x, chinPt.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.setLineDash([]);

        // Neoclassical Thirds Division Ticks on the midline
        ctx.beginPath();
        [foreheadApex, glabellaPt, subnasalePt, chinPt].forEach((node) => {
          ctx.moveTo(node.x - 8, node.y);
          ctx.lineTo(node.x + 8, node.y);
        });
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        [foreheadApex, glabellaPt, subnasalePt, chinPt].forEach((node) => {
          ctx.moveTo(node.x + 2, node.y);
          ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        });
        ctx.fill();
      }

      // -------------------------------------------------------------
      // 3. HORIZONTAL LASER MEASURING RULER SWEEP
      // Smooth laser line scanning up & down the face with metric ticks (batched rendering)
      // -------------------------------------------------------------
      if (box) {
        const scanYProgress = (Math.sin(tick * 0.05) + 1) * 0.5;
        const scanY = box.y + scanYProgress * box.height;
        const scanWidth = box.width;

        // Laser scan line
        ctx.beginPath();
        ctx.moveTo(box.x, scanY);
        ctx.lineTo(box.x + scanWidth, scanY);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Laser subtle glow line
        ctx.beginPath();
        ctx.moveTo(box.x + scanWidth * 0.15, scanY);
        ctx.lineTo(box.x + scanWidth * 0.85, scanY);
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Metric ruler ticks along the laser line (batched single path)
        const numTicks = 14;
        ctx.beginPath();
        for (let i = 0; i <= numTicks; i++) {
          const tx = box.x + (i / numTicks) * scanWidth;
          const tickH = i % 4 === 0 ? 6 : 3.5;
          ctx.moveTo(tx, scanY - tickH * 0.5);
          ctx.lineTo(tx, scanY + tickH * 0.5);
        }
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // 4. PRECISION MEASUREMENT CROSSHAIRS AT KEY ANCHOR POINTS
      // -------------------------------------------------------------
      const measurementAnchors = [
        points[36], // Left exocanthion
        points[45], // Right exocanthion
        points[30], // Pronasale (nose tip)
        points[8],  // Gnathion (chin)
      ];

      const rSize = 5;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      measurementAnchors.forEach((pt) => {
        if (!pt) return;
        // Top-left bracket
        ctx.moveTo(pt.x - rSize, pt.y - 2);
        ctx.lineTo(pt.x - rSize, pt.y - rSize);
        ctx.lineTo(pt.x - 2, pt.y - rSize);
        // Bottom-right bracket
        ctx.moveTo(pt.x + rSize, pt.y + 2);
        ctx.lineTo(pt.x + rSize, pt.y + rSize);
        ctx.lineTo(pt.x + 2, pt.y + rSize);
      });
      ctx.stroke();

      // -------------------------------------------------------------
      // 5. DYNAMIC TACTICAL BOUNDING BOX & CORNER BRACKETS
      // -------------------------------------------------------------
      if (box) {
        const bx = box.x;
        const by = box.y;
        const bw = box.width;
        const bh = box.height;
        const bracketLen = Math.min(24, bw * 0.2);

        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        // Top-Left
        ctx.moveTo(bx, by + bracketLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + bracketLen, by);
        // Top-Right
        ctx.moveTo(bx + bw - bracketLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + bracketLen);
        // Bottom-Left
        ctx.moveTo(bx, by + bh - bracketLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + bracketLen, by + bh);
        // Bottom-Right
        ctx.moveTo(bx + bw - bracketLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - bracketLen);
        ctx.stroke();
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    landmarks,
    box,
    status,
    isLivenessActive,
    blinkFlash,
    leftEar,
    rightEar,
    ear,
    headTilt,
    videoRef,
    showCallouts,
    fullFaceValidation,
    activeScanZone,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none z-10"
    />
  );
};

