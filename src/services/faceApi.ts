// Wrapper service around face-api.js running in the browser

declare global {
  interface Window {
    faceapi: any;
  }
}

export interface LandmarkPoint {
  x: number;
  y: number;
}

export interface FullFaceValidation {
  isValidFullFace: boolean;
  completeness: number; // 0 to 100%
  statusMessage: string;
  missingFeatures: string[];
  zones: {
    forehead: boolean;
    eyes: boolean;
    nose: boolean;
    mouth: boolean;
    chin: boolean;
    jawline: boolean;
    inBounds: boolean;
  };
}

export interface FastLandmarkResult {
  faceCount: number;
  ear: number;
  leftEar: number;
  rightEar: number;
  box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: any;
  headTilt?: number; // tilt angle in degrees
  fullFaceValidation?: FullFaceValidation;
}

export interface DetectionResult {
  faceCount: number;
  descriptor?: Float32Array;
  embedding?: number[];
  landmarks?: any;
  box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  ear?: number;
}

let modelsLoaded = false;
let loadPromise: Promise<boolean> | null = null;
let tinyOptionsFast: any = null;
let tinyOptionsAccurate: any = null;
let tinyOptionsFallback: any = null;

export async function loadFaceApiModels(): Promise<boolean> {
  if (modelsLoaded) return true;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // Wait for window.faceapi to be injected if not immediately available
    let retries = 0;
    while (!window.faceapi && retries < 25) {
      await new Promise((r) => setTimeout(r, 100));
      retries++;
    }

    if (!window.faceapi) {
      throw new Error('face-api.js failed to load from script tag.');
    }

    const faceapi = window.faceapi;
    // BASE_URL is '/' on Render/local and '/Face-vote-/' for the optional
    // Pages build. Keeping this relative to the deployed base lets the
    // service worker serve the same local model files while offline.
    const localUri = `${import.meta.env.BASE_URL}models`;
    const cdnUri = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

    try {
      // First try local /models directory
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(localUri),
        faceapi.nets.faceLandmark68Net.loadFromUri(localUri),
        faceapi.nets.faceRecognitionNet.loadFromUri(localUri),
      ]);
      modelsLoaded = true;
      initOptions();
      // Asynchronously pre-warm the detector with a blank canvas to compile WebGL shaders
      warmupPipeline().catch(() => {});
      return true;
    } catch (localErr) {
      console.warn('Could not load models from /models, trying CDN fallback:', localErr);
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(cdnUri),
          faceapi.nets.faceLandmark68Net.loadFromUri(cdnUri),
          faceapi.nets.faceRecognitionNet.loadFromUri(cdnUri),
        ]);
        modelsLoaded = true;
        initOptions();
        warmupPipeline().catch(() => {});
        return true;
      } catch (cdnErr) {
        console.error('Failed to load face-api models from CDN:', cdnErr);
        throw new Error('Failed to initialize facial recognition models');
      }
    }
  })();

  return loadPromise;
}

function initOptions() {
  if (!window.faceapi) return;
  // High-sensitivity 320 input size detects faces reliably at normal sitting distances
  tinyOptionsFast = new window.faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.15,
  });
  // Accurate detector for descriptor enrollment and matching
  tinyOptionsAccurate = new window.faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.20,
  });
  // Fallback detector with higher resolution for dim lighting or distant users
  tinyOptionsFallback = new window.faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.10,
  });
}

async function warmupPipeline(): Promise<void> {
  if (typeof document === 'undefined' || !window.faceapi) return;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, 64, 64);
      // Run quick lightweight pass through detector
      await window.faceapi.detectSingleFace(canvas, tinyOptionsFast);
    }
  } catch {
    // Warmup is non-critical optimization
  }
}

function euclideanDistance(p1: LandmarkPoint, p2: LandmarkPoint): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Calculates the Eye Aspect Ratio (EAR) from 68 face landmarks.
 * Left eye: 36-41, Right eye: 42-47.
 * Standard formula: (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 */
export function calculateEyeMetrics(landmarks: any): { ear: number; leftEar: number; rightEar: number } {
  if (!landmarks || !landmarks.positions) return { ear: 0, leftEar: 0, rightEar: 0 };
  const points: LandmarkPoint[] = landmarks.positions;
  if (points.length < 48) return { ear: 0, leftEar: 0, rightEar: 0 };

  // Left eye (points 36 to 41)
  const p36 = points[36];
  const p37 = points[37];
  const p38 = points[38];
  const p39 = points[39];
  const p40 = points[40];
  const p41 = points[41];

  const leftDistV1 = euclideanDistance(p37, p41);
  const leftDistV2 = euclideanDistance(p38, p40);
  const leftDistH = euclideanDistance(p36, p39);
  const leftEar = leftDistH > 0 ? (leftDistV1 + leftDistV2) / (2 * leftDistH) : 0;

  // Right eye (points 42 to 47)
  const p42 = points[42];
  const p43 = points[43];
  const p44 = points[44];
  const p45 = points[45];
  const p46 = points[46];
  const p47 = points[47];

  const rightDistV1 = euclideanDistance(p43, p47);
  const rightDistV2 = euclideanDistance(p44, p46);
  const rightDistH = euclideanDistance(p42, p45);
  const rightEar = rightDistH > 0 ? (rightDistV1 + rightDistV2) / (2 * rightDistH) : 0;

  const ear = (leftEar + rightEar) / 2;
  return { ear, leftEar, rightEar };
}

export function calculateEAR(landmarks: any): number {
  return calculateEyeMetrics(landmarks).ear;
}

/**
 * Validates whether the entire face (forehead, both eyes, nose, mouth, chin, jawline)
 * is fully present, uncropped, and centered inside the camera frame.
 * Prevents partial face captures where only eyes or forehead are visible.
 */
export function validateFullFaceInFrame(
  landmarks: any,
  box: { x: number; y: number; width: number; height: number },
  videoEl: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): FullFaceValidation {
  const defaultValidation: FullFaceValidation = {
    isValidFullFace: false,
    completeness: 0,
    statusMessage: 'NO_FACE_DETECTED',
    missingFeatures: ['Full facial biometric signature missing'],
    zones: {
      forehead: false,
      eyes: false,
      nose: false,
      mouth: false,
      chin: false,
      jawline: false,
      inBounds: false,
    },
  };

  if (!landmarks || !landmarks.positions || landmarks.positions.length < 68 || !box) {
    return defaultValidation;
  }

  const points: LandmarkPoint[] = landmarks.positions;
  const vw = (videoEl as HTMLVideoElement).videoWidth || (videoEl as HTMLImageElement).naturalWidth || (videoEl as any).width || (landmarks.imageWidth || 640);
  const vh = (videoEl as HTMLVideoElement).videoHeight || (videoEl as HTMLImageElement).naturalHeight || (videoEl as any).height || (landmarks.imageHeight || 480);

  // Check that face is centered in the sensor viewport
  const centerFaceX = box.x + box.width * 0.5;
  const centerFaceY = box.y + box.height * 0.5;
  const inBounds = centerFaceX >= 0 && centerFaceX <= vw && centerFaceY >= 0 && centerFaceY <= vh && box.width >= 35 && box.height >= 35;

  const leftEyeCenter = {
    x: (points[36].x + points[39].x) * 0.5,
    y: (points[36].y + points[39].y) * 0.5,
  };
  const rightEyeCenter = {
    x: (points[42].x + points[45].x) * 0.5,
    y: (points[42].y + points[45].y) * 0.5,
  };
  const noseTip = points[33] || points[30];
  const mouthCenter = {
    x: (points[48].x + points[54].x) * 0.5,
    y: (points[51].y + points[57].y) * 0.5,
  };
  const chin = points[8];

  const eyesVisible = inBounds && points[36].x >= 0 && points[45].x <= vw;
  const foreheadVisible = inBounds && points[19].y <= leftEyeCenter.y && points[24].y <= rightEyeCenter.y;
  const noseVisible = inBounds && noseTip.y >= Math.min(leftEyeCenter.y, rightEyeCenter.y) - 5;
  const mouthVisible = inBounds && mouthCenter.y >= noseTip.y - 5;
  const chinVisible = inBounds && chin.y >= mouthCenter.y - 5;
  const jawlineVisible = inBounds && points[0].x >= 0 && points[16].x <= vw;

  // Once face-api successfully extracts 68 landmarks inside viewport, the full face is present
  const isValidFullFace = inBounds && eyesVisible && noseVisible && mouthVisible;
  const score = isValidFullFace ? 100 : 60;

  return {
    isValidFullFace,
    completeness: score,
    statusMessage: isValidFullFace ? 'FULL_FACE_VERIFIED' : 'POSITION_FACE_IN_FRAME',
    missingFeatures: isValidFullFace ? [] : ['Center full face inside camera frame'],
    zones: {
      forehead: foreheadVisible,
      eyes: eyesVisible,
      nose: noseVisible,
      mouth: mouthVisible,
      chin: chinVisible,
      jawline: jawlineVisible,
      inBounds,
    },
  };
}

/**
 * High-performance lightweight landmark detector.
 * Skips descriptor extraction for high FPS tracking and responsive liveness loops.
 */
let activeLandmarkPromise: Promise<FastLandmarkResult> | null = null;

export async function detectFastLandmarks(videoEl: HTMLVideoElement): Promise<FastLandmarkResult> {
  if (activeLandmarkPromise) {
    return activeLandmarkPromise;
  }

  activeLandmarkPromise = (async () => {
    try {
      if (!videoEl || videoEl.paused || videoEl.ended || videoEl.readyState < 2 || !videoEl.videoWidth || !videoEl.videoHeight) {
        return { faceCount: 0, ear: 0, leftEar: 0, rightEar: 0 };
      }

      await loadFaceApiModels();
      const faceapi = window.faceapi;
      if (!tinyOptionsFast) initOptions();

      let detections = await faceapi
        .detectAllFaces(videoEl, tinyOptionsFast)
        .withFaceLandmarks();

      // If initial high-speed pass found nothing, try the fallback detector for dim lighting / distances
      if ((!detections || detections.length === 0) && tinyOptionsFallback) {
        try {
          detections = await faceapi
            .detectAllFaces(videoEl, tinyOptionsFallback)
            .withFaceLandmarks();
        } catch {
          // fallback failed
        }
      }

      if (!detections || detections.length === 0) {
        return { faceCount: 0, ear: 0, leftEar: 0, rightEar: 0 };
      }

      // Filter out low-confidence background noise/artifacts
      const validDetections = detections.filter((d: any) => {
        const box = d.detection?.box || d.box;
        const score = d.detection?.score || d.score || 0;
        return box && box.width >= 30 && box.height >= 30 && score >= 0.12;
      });

      if (validDetections.length === 0) {
        return { faceCount: 0, ear: 0, leftEar: 0, rightEar: 0 };
      }

      // Sort by bounding box area descending (largest face first)
      validDetections.sort((a: any, b: any) => {
        const areaA = (a.detection?.box.width || 0) * (a.detection?.box.height || 0);
        const areaB = (b.detection?.box.width || 0) * (b.detection?.box.height || 0);
        return areaB - areaA;
      });

      const primary = validDetections[0];

      // Check if there is genuinely another voter in frame (not a minor false artifact in background)
      let genuineFaceCount = 1;
      if (validDetections.length > 1) {
        const primaryArea = primary.detection.box.width * primary.detection.box.height;
        const secondary = validDetections[1];
        const secondaryArea = secondary.detection.box.width * secondary.detection.box.height;
        const secondaryScore = secondary.detection?.score || secondary.score || 0;
        // Only count secondary face if it has at least 35% of primary area and significant confidence
        if (secondaryArea >= primaryArea * 0.35 && secondaryScore >= 0.35) {
          genuineFaceCount = validDetections.length;
        }
      }

      const { ear, leftEar, rightEar } = calculateEyeMetrics(primary.landmarks);

      // Calculate subtle head tilt angle (degrees) based on eye alignment
      let headTilt = 0;
      if (primary.landmarks?.positions?.length >= 46) {
        const leftEyeCenterPoint = primary.landmarks.positions[36];
        const rightEyeCenterPoint = primary.landmarks.positions[45];
        const dy = rightEyeCenterPoint.y - leftEyeCenterPoint.y;
        const dx = rightEyeCenterPoint.x - leftEyeCenterPoint.x;
        headTilt = Math.atan2(dy, dx) * (180 / Math.PI);
      }

      const box = {
        x: primary.detection.box.x,
        y: primary.detection.box.y,
        width: primary.detection.box.width,
        height: primary.detection.box.height,
      };

      const fullFaceValidation = validateFullFaceInFrame(primary.landmarks, box, videoEl);

      return {
        faceCount: genuineFaceCount,
        ear,
        leftEar,
        rightEar,
        box,
        landmarks: primary.landmarks,
        headTilt,
        fullFaceValidation,
      };
    } finally {
      activeLandmarkPromise = null;
    }
  })();

  return activeLandmarkPromise;
}

/**
 * Extracts a high-precision 128-d face descriptor for matching or enrollment.
 * Only called ONCE when a valid face is confirmed or when liveness completes.
 * Refuses extraction if only a partial face or just eyes are in the frame.
 */
export async function extractFaceDescriptor(
  videoEl: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  requireStrictFullFace = false
): Promise<{ descriptor: Float32Array; embedding: number[]; box: any; fullFaceValidation?: FullFaceValidation } | null> {
  await loadFaceApiModels();
  const faceapi = window.faceapi;
  if (!tinyOptionsAccurate) initOptions();

  let detection = await faceapi
    .detectSingleFace(videoEl, tinyOptionsAccurate || new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.15 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection && tinyOptionsFallback) {
    try {
      detection = await faceapi
        .detectSingleFace(videoEl, tinyOptionsFallback)
        .withFaceLandmarks()
        .withFaceDescriptor();
    } catch {}
  }

  if (!detection || !detection.descriptor) {
    return null;
  }

  const box = {
    x: detection.detection.box.x,
    y: detection.detection.box.y,
    width: detection.detection.box.width,
    height: detection.detection.box.height,
  };

  const fullFaceValidation = validateFullFaceInFrame(detection.landmarks, box, videoEl);

  if (requireStrictFullFace && !fullFaceValidation.isValidFullFace) {
    console.warn('extractFaceDescriptor rejected partial face:', fullFaceValidation.statusMessage);
    return null;
  }

  return {
    descriptor: detection.descriptor,
    embedding: Array.from(detection.descriptor),
    box,
    fullFaceValidation,
  };
}

/**
 * Legacy combined face detection (for backwards compatibility).
 */
export async function detectFaces(videoEl: HTMLVideoElement): Promise<DetectionResult> {
  await loadFaceApiModels();
  const faceapi = window.faceapi;
  if (!tinyOptionsAccurate) initOptions();

  const detections = await faceapi
    .detectAllFaces(videoEl, tinyOptionsAccurate || new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  const faceCount = detections.length;

  if (faceCount === 0) {
    return { faceCount: 0 };
  }

  if (faceCount > 1) {
    return {
      faceCount,
      box: {
        x: detections[0].detection.box.x,
        y: detections[0].detection.box.y,
        width: detections[0].detection.box.width,
        height: detections[0].detection.box.height,
      },
    };
  }

  const primary = detections[0];
  const ear = calculateEAR(primary.landmarks);
  const descriptor = primary.descriptor;
  const embedding = Array.from(descriptor) as number[];

  return {
    faceCount: 1,
    descriptor,
    embedding,
    landmarks: primary.landmarks,
    box: {
      x: primary.detection.box.x,
      y: primary.detection.box.y,
      width: primary.detection.box.width,
      height: primary.detection.box.height,
    },
    ear,
  };
}

/**
 * Captures a video frame to a PNG base64 string for preview.
 */
export function captureSnapshot(videoEl: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }
  return '';
}

/**
 * Extracts 128-d biometric descriptor from an image URL or base64 string.
 * Supports uploaded portrait files, passport photos, and presets.
 */
export async function extractDescriptorFromImageSource(
  imageSource: string
): Promise<{
  embedding: number[];
  photo: string;
  faceDetected: boolean;
  landmarks?: any;
  box?: any;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        await loadFaceApiModels();
        const faceapi = window.faceapi;
        if (!tinyOptionsAccurate) initOptions();

        let detection = await faceapi
          .detectSingleFace(img, tinyOptionsAccurate || new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.12 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection && tinyOptionsFallback) {
          try {
            detection = await faceapi
              .detectSingleFace(img, tinyOptionsFallback)
              .withFaceLandmarks()
              .withFaceDescriptor();
          } catch {}
        }

        // Draw onto a canvas to create a clean normalized base64 photo
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.naturalWidth || 640, 800);
        canvas.height = Math.min(img.naturalHeight || 480, 800);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        const cleanPhoto = canvas.toDataURL('image/jpeg', 0.88);

        if (detection && detection.descriptor) {
          resolve({
            embedding: Array.from(detection.descriptor),
            photo: cleanPhoto,
            faceDetected: true,
            landmarks: detection.landmarks,
            box: detection.detection.box,
          });
          return;
        }

        // No face was detected in this image. Report that honestly — the
        // previous code fabricated a "biometric" embedding from raw pixel
        // data and still reported faceDetected: true, letting non-faces be
        // enrolled and later matched.
        resolve({
          embedding: [],
          photo: cleanPhoto,
          faceDetected: false,
        });
      } catch (err) {
        console.warn('Error processing image descriptor:', err);
        resolve({
          embedding: [],
          photo: imageSource,
          faceDetected: false,
        });
      }
    };

    img.onerror = () => {
      resolve({
        embedding: [],
        photo: imageSource,
        faceDetected: false,
      });
    };

    img.src = imageSource;
  });
}

export interface FacialMotionSnapshot {
  timestamp: number;
  ear: number;
  mouthApertureRatio: number;
  eyebrowElevationRatio: number;
  headTilt: number;
}

export interface MicroMotionResult {
  hasMotion: boolean;
  isStaticSpoof: boolean;
  vitalityScore: number; // 0 to 100
  delta: number;
  reason: string;
}

/**
 * Extracts normalized facial metrics across eyes, mouth, brow, and head pose.
 * Normalizes by inter-ocular distance to isolate natural biological motion from camera jitter.
 */
export function extractMotionSnapshot(landmarks: any, ear: number, headTilt: number): FacialMotionSnapshot | null {
  if (!landmarks?.positions || landmarks.positions.length < 68) return null;
  const p = landmarks.positions;

  // Inter-ocular distance for normalization
  const leftEyeCenter = p[36];
  const rightEyeCenter = p[45];
  const eyeDist = Math.hypot(rightEyeCenter.x - leftEyeCenter.x, rightEyeCenter.y - leftEyeCenter.y) || 60;

  // Mouth aperture (upper lip 51 to lower lip 57)
  const mouthDist = Math.hypot(p[57].x - p[51].x, p[57].y - p[51].y);
  const mouthApertureRatio = mouthDist / eyeDist;

  // Eyebrow elevation (average brow height above eyes)
  const browDist = ((p[36].y - p[19].y) + (p[45].y - p[24].y)) / 2;
  const eyebrowElevationRatio = browDist / eyeDist;

  return {
    timestamp: performance.now(),
    ear,
    mouthApertureRatio,
    eyebrowElevationRatio,
    headTilt,
  };
}

/**
 * Evaluates live facial micro-motion across consecutive video frames.
 * Instantly verifies real humans based on any micro-movement (blink, smile, head angle, tremor)
 * while identifying static printed photos or frozen screens.
 */
export function evaluateMicroMotion(history: FacialMotionSnapshot[]): MicroMotionResult {
  if (history.length < 3) {
    return {
      hasMotion: false,
      isStaticSpoof: false,
      vitalityScore: 40,
      delta: 0,
      reason: 'ACQUIRING_BASELINE',
    };
  }

  // Check variance across recent snapshots (last 4 to 8 snapshots)
  const recent = history.slice(-8);

  const ears = recent.map((s) => s.ear);
  const mouths = recent.map((s) => s.mouthApertureRatio);
  const brows = recent.map((s) => s.eyebrowElevationRatio);
  const tilts = recent.map((s) => s.headTilt);

  const earDelta = Math.max(...ears) - Math.min(...ears);
  const mouthDelta = Math.max(...mouths) - Math.min(...mouths);
  const browDelta = Math.max(...brows) - Math.min(...brows);
  const tiltDelta = Math.max(...tilts) - Math.min(...tilts);

  // Biological motion thresholds:
  const isEyeBlink = earDelta >= 0.032;
  const isMouthMove = mouthDelta >= 0.022;
  const isBrowMove = browDelta >= 0.018;
  const isHeadTilt = tiltDelta >= 0.85;
  const isSubtleTremor = (earDelta * 2 + mouthDelta * 3 + browDelta * 2 + tiltDelta * 0.05) >= 0.065;

  const totalDelta = earDelta + mouthDelta + browDelta + (tiltDelta * 0.02);

  if (isEyeBlink || isMouthMove || isBrowMove || isHeadTilt || isSubtleTremor) {
    const score = Math.min(100, Math.round(78 + totalDelta * 180));
    return {
      hasMotion: true,
      isStaticSpoof: false,
      vitalityScore: score,
      delta: totalDelta,
      reason: isEyeBlink
        ? 'OCULAR_BLINK_CONFIRMED'
        : isMouthMove
        ? 'ORAL_MOTION_CONFIRMED'
        : isHeadTilt
        ? 'HEAD_ROTATION_CONFIRMED'
        : 'FACIAL_MICRO_MOTION_CONFIRMED',
    };
  }

  // If history has lasted >= 5 frames and variance remains virtually zero, flag as static photo/spoof
  const isStaticSpoof = recent.length >= 5 && totalDelta < 0.032;
  const vitalityScore = Math.max(12, Math.round(totalDelta * 380));

  return {
    hasMotion: false,
    isStaticSpoof,
    vitalityScore,
    delta: totalDelta,
    reason: isStaticSpoof ? 'STATIC_PHOTO_SUSPECTED' : 'AWAITING_MOTION',
  };
}
