import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RefreshCw,
  Vote,
  UserX,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Lock,
  UserPlus,
  Camera,
} from 'lucide-react';
import {
  detectFastLandmarks,
  extractAveragedFaceDescriptor,
  FullFaceValidation,
  extractMotionSnapshot,
  evaluateMicroMotion,
  FacialMotionSnapshot,
  MicroMotionResult,
} from '../services/faceApi';
import { CheckInStatus, Voter, MatchResult } from '../types';
import { BiometricMeshCanvas } from './BiometricMeshCanvas';
import { CastVoteKiosk } from './CastVoteKiosk';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { offlineStorage } from '../services/offlineStorage';
import { isDeviceMode } from '../services/deviceMode';

interface CheckInViewProps {
  onProceedToBallot: (voter: Voter, ballotToken?: string | null) => void;
  onGoToEnroll: () => void;
  onViewResults?: () => void;
  lastVoteRecordedMessage?: string | null;
  onClearVoteMessage?: () => void;
}

type LivenessSensitivity = 'balanced' | 'sensitive' | 'strict';

function checkBlinkInHistory(
  history: number[],
  sensitivity: LivenessSensitivity
): { isBlink: boolean; drop: number; minVal: number } {
  if (history.length < 2) return { isBlink: false, drop: 0, minVal: 1 };

  const current = history[history.length - 1];
  const prev = history[history.length - 2];
  const instantDelta = Math.abs(current - prev);

  const window = history.slice(-8);
  const minVal = Math.min(...window);
  const maxVal = Math.max(...window);
  const windowRange = maxVal - minVal;

  let isBlink = false;

  if (sensitivity === 'sensitive') {
    isBlink =
      instantDelta >= 0.003 ||
      windowRange >= 0.005 ||
      current < 0.285 ||
      (maxVal > 0.18 && (maxVal - current) / maxVal >= 0.025);
  } else if (sensitivity === 'strict') {
    isBlink =
      instantDelta >= 0.015 ||
      windowRange >= 0.022 ||
      current < 0.220 ||
      (maxVal > 0.18 && (maxVal - current) / maxVal >= 0.08);
  } else {
    isBlink =
      instantDelta >= 0.006 ||
      windowRange >= 0.008 ||
      current < 0.270 ||
      (maxVal > 0.18 && (maxVal - current) / maxVal >= 0.035);
  }

  return { isBlink, drop: windowRange, minVal };
}

export const CheckInView: React.FC<CheckInViewProps> = ({
  onProceedToBallot,
  onGoToEnroll,
  onViewResults,
  lastVoteRecordedMessage,
  onClearVoteMessage,
}) => {
  const { isLight } = useTheme();
  const { isUrdu } = useLanguage();
  const [isKioskMode, setIsKioskMode] = useState<boolean>(true);
  // Public roll counts from /api/config — used to stop the camera opening
  // when nobody can possibly match (empty or unapproved voter roll).
  const [rollCounts, setRollCounts] = useState<{ registered: number; approved: number } | null>(null);
  const [showNoVoters, setShowNoVoters] = useState<boolean>(false);

  useEffect(() => {
    if (!isKioskMode) return;
    let cancelled = false;
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.approved_voters === 'number') {
          setRollCounts({ registered: data.registered_voters ?? 0, approved: data.approved_voters });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isKioskMode]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CheckInStatus>('position_face');
  const [matchedVoter, setMatchedVoter] = useState<Voter | null>(null);
  const [ballotToken, setBallotToken] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Live face tracking states
  const [facePresent, setFacePresent] = useState<boolean>(false);
  const [currentLandmarks, setCurrentLandmarks] = useState<any | null>(null);
  const [currentBox, setCurrentBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Eye Aspect Ratio & Liveness
  const [currentEAR, setCurrentEAR] = useState<number>(0.28);
  const [leftEarVal, setLeftEarVal] = useState<number | null>(null);
  const [rightEarVal, setRightEarVal] = useState<number | null>(null);
  const [headTilt, setHeadTilt] = useState<number>(0);
  const [blinkFlash, setBlinkFlash] = useState<boolean>(false);
  const [isLivenessActive, setIsLivenessActive] = useState<boolean>(false);
  const [fullFaceValidation, setFullFaceValidation] = useState<FullFaceValidation | null>(null);

  const earHistoryRef = useRef<number[]>([]);
  const isLivenessActiveRef = useRef<boolean>(false);
  const statusRef = useRef<CheckInStatus>('position_face');
  const sensitivityRef = useRef<LivenessSensitivity>('balanced');
  const consecutiveFaceFramesRef = useRef<number>(0);
  const autoScanTriggeredRef = useRef<boolean>(false);

  // Vitality & Micro-Motion
  const motionHistoryRef = useRef<FacialMotionSnapshot[]>([]);
  const [microMotion, setMicroMotion] = useState<MicroMotionResult | null>(null);
  const [spoofWarning, setSpoofWarning] = useState<boolean>(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isLivenessActiveRef.current = isLivenessActive;
  }, [isLivenessActive]);

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          isUrdu
            ? 'کیمرہ سپورٹ دستیاب نہیں ہے۔ بائیو میٹرک تصدیق کے لیے لائیو کیمرہ ضروری ہے۔'
            : 'Camera access is not supported. A live optical sensor is required for biometric voter check-in.'
        );
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr: any) {
          if (playErr.name !== 'AbortError' && !playErr.message?.includes('interrupted')) {
            console.warn('Video play notice:', playErr);
          }
        }
      }
    } catch (err: any) {
      console.warn('Camera access notice:', err);
      const isPermDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        String(err).includes('Permission denied') ||
        String(err).includes('NotAllowedError');

      setCameraError(
        isPermDenied
          ? isUrdu
            ? 'کیمرے کی اجازت نہیں دی گئی۔ انتخابی شفافیت اور لائیو بائیو میٹرک کے لیے کیمرہ لازمی ہے۔'
            : 'Camera permission was denied. Live optical verification is mandatory to prevent election fraud.'
          : isUrdu
          ? 'کیمرہ شروع نہیں ہو سکا۔ برائے مہربانی دوبارہ کوشش کریں۔'
          : 'Unable to start camera sensor. Please ensure your camera is connected and retry.'
      );
    }
  }, [isUrdu]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // When leaving kiosk mode, start camera
  useEffect(() => {
    if (!isKioskMode) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isKioskMode, startCamera, stopCamera]);

  // Execute Match against Voter Registry (Online & Offline)
  const executeMatch = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;

    setStatus('matching');

    try {
      // Multi-frame averaged descriptor: ~0.5s of samples averaged together
      // is far more accurate than any single frame.
      const descriptorResult = await extractAveragedFaceDescriptor(videoRef.current, 3);
      if (!descriptorResult || !descriptorResult.embedding) {
        setStatus('not_registered');
        return;
      }

      const probeEmbedding = descriptorResult.embedding;

      // Match via the API first — in Device Mode the API is on this
      // device, so this also works with no internet and issues the token.
      if (navigator.onLine || isDeviceMode()) {
        try {
          const response = await fetch('/api/voters/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embedding: probeEmbedding }),
          });

          if (response.ok) {
            const data: MatchResult = await response.json();
            if (data.match && data.voter) {
              setMatchedVoter(data.voter);
              if (data.voter.has_voted) {
                cyberSound.playSecurityAlarm();
                setStatus('already_voted');
              } else if (data.voter.approval_status === 'pending') {
                cyberSound.playSecurityAlarm();
                setStatus('pending_approval');
              } else if (data.voter.approval_status === 'rejected') {
                cyberSound.playSecurityAlarm();
                setStatus('registration_rejected');
              } else {
                setBallotToken(data.ballotToken || null);
                cyberSound.playAccessGranted();
                setStatus('match_found');
              }
              return;
            }
          }
        } catch (netErr) {
          console.warn('Network matching unreachable, using offline biometric database:', netErr);
        }
      }

      // Offline client-side biometric matching
      const localResult = offlineStorage.matchLocalVoter(probeEmbedding, 0.78);
      if (localResult.match && localResult.voter) {
        setMatchedVoter(localResult.voter);
        if (localResult.voter.has_voted) {
          cyberSound.playSecurityAlarm();
          setStatus('already_voted');
        } else if (localResult.voter.approval_status === 'pending') {
          cyberSound.playSecurityAlarm();
          setStatus('pending_approval');
        } else if (localResult.voter.approval_status === 'rejected') {
          cyberSound.playSecurityAlarm();
          setStatus('registration_rejected');
        } else {
          setBallotToken(null);
          cyberSound.playAccessGranted();
          setStatus('match_found');
        }
      } else {
        cyberSound.playSecurityAlarm();
        setStatus('not_registered');
      }
    } catch (err) {
      console.warn('Matching error:', err);
      setStatus('not_registered');
    } finally {
      setIsLivenessActive(false);
    }
  }, []);

  // Liveness Check & Auto-Verification
  const handleVerify = useCallback(async () => {
    if (isLivenessActiveRef.current || !facePresent) return;

    // Liveness gate: a live person must show a blink or natural micro-motion,
    // and a static-spoof flag blocks verification outright. Previously the
    // blink/motion analysis was displayed but never checked — a printed
    // photo held still would verify.
    const blinkSeen =
      earHistoryRef.current.length >= 8 &&
      checkBlinkInHistory(earHistoryRef.current, sensitivityRef.current).isBlink;
    const motionOk = !!microMotion && microMotion.hasMotion && !microMotion.isStaticSpoof;
    if (spoofWarning || (!blinkSeen && !motionOk)) {
      cyberSound.playSecurityAlarm();
      setStatus('liveness_failed');
      return;
    }

    setIsLivenessActive(true);
    setStatus('checking_liveness');

    // Run quick verification window
    setTimeout(() => {
      executeMatch();
    }, 900);
  }, [facePresent, executeMatch, microMotion, spoofWarning]);

  // Reset State to Scan Again
  const handleReset = useCallback(() => {
    setStatus('position_face');
    setMatchedVoter(null);
    setBallotToken(null);
    setIsLivenessActive(false);
    autoScanTriggeredRef.current = false;
    consecutiveFaceFramesRef.current = 0;
  }, []);

  // Back to Kiosk
  const handleBackToKiosk = useCallback(() => {
    handleReset();
    setIsKioskMode(true);
  }, [handleReset]);

  // Continuous Face & Landmark Tracking Loop
  useEffect(() => {
    if (isKioskMode) return;

    let isSubscribed = true;
    let animId: number;

    const trackLoop = async () => {
      if (!isSubscribed) return;

      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        statusRef.current !== 'matching' &&
        statusRef.current !== 'match_found' &&
        statusRef.current !== 'already_voted'
      ) {
        try {
          const res = await detectFastLandmarks(videoRef.current);

          if (isSubscribed && res) {
            setFacePresent(true);
            setCurrentLandmarks(res.landmarks);
            setCurrentBox(res.box || null);
            setCurrentEAR(res.ear);
            setLeftEarVal(res.leftEar || null);
            setRightEarVal(res.rightEar || null);
            setHeadTilt(res.headTilt || 0);
            setFullFaceValidation(res.fullFaceValidation || null);

            // Micro-motion vitality tracking
            const motionSnap = extractMotionSnapshot(res.landmarks, res.ear, res.headTilt || 0);
            if (motionSnap) {
              motionHistoryRef.current.push(motionSnap);
              if (motionHistoryRef.current.length > 30) {
                motionHistoryRef.current.shift();
              }
              const motionRes = evaluateMicroMotion(motionHistoryRef.current);
              setMicroMotion(motionRes);
              setSpoofWarning(motionRes.isStaticSpoof);
            }

            // EAR Blink history
            earHistoryRef.current.push(res.ear);
            if (earHistoryRef.current.length > 25) {
              earHistoryRef.current.shift();
            }

            const blinkRes = checkBlinkInHistory(
              earHistoryRef.current,
              sensitivityRef.current
            );
            if (blinkRes.isBlink) {
              setBlinkFlash(true);
              setTimeout(() => setBlinkFlash(false), 250);
            }

            consecutiveFaceFramesRef.current += 1;

            // Auto-trigger verification after steady face presence
            if (
              consecutiveFaceFramesRef.current > 18 &&
              !autoScanTriggeredRef.current &&
              !isLivenessActiveRef.current &&
              statusRef.current === 'position_face'
            ) {
              autoScanTriggeredRef.current = true;
              handleVerify();
            }
          } else if (isSubscribed) {
            setFacePresent(false);
            setCurrentLandmarks(null);
            setCurrentBox(null);
            consecutiveFaceFramesRef.current = 0;
            autoScanTriggeredRef.current = false;
          }
        } catch {
          // ignore detection frame drops
        }
      }

      if (isSubscribed) {
        animId = requestAnimationFrame(trackLoop);
      }
    };

    animId = requestAnimationFrame(trackLoop);

    return () => {
      isSubscribed = false;
      cancelAnimationFrame(animId);
    };
  }, [isKioskMode, handleVerify]);

  // If in Kiosk Mode, show main kiosk landing card
  if (isKioskMode) {
    // Empty-roll guard: no approved voters = nobody can cast a vote yet.
    // Explain it plainly instead of opening a camera that can never match.
    if (showNoVoters) {
      return (
        <div className="w-full max-w-xl mx-auto px-3 sm:px-6 py-6">
          <div
            className={`rounded-[28px] border shadow-xl p-6 sm:p-8 text-center ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mb-4">
              <UserX className="w-8 h-8" />
            </div>
            <h2 className={`text-xl sm:text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isUrdu ? 'ابھی کوئی ووٹر رجسٹرڈ نہیں ہے' : 'No voters registered yet'}
            </h2>
            <p className={`mt-3 text-sm sm:text-base leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {isUrdu
                ? 'ووٹنگ تب ہی شروع ہو سکتی ہے جب افسر پہلے ووٹرز کو رجسٹر اور منظور کرے۔ ایڈمن کھولیں، ووٹر شامل کریں، پھر اسے منظور کریں۔'
                : 'Voting can only start after the election officer registers voters and approves them. Open Admin, enroll a voter, then approve them in the Voters list.'}
            </p>
            <button
              onClick={() => {
                cyberSound.playClick();
                setShowNoVoters(false);
                onGoToEnroll();
              }}
              className="mt-6 w-full min-h-[56px] px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <UserPlus className="w-6 h-6" />
              <span>{isUrdu ? 'ایڈمن — ووٹر رجسٹر کریں' : 'Open Admin — Register Voters'}</span>
            </button>
            <button
              onClick={() => {
                cyberSound.playClick();
                setShowNoVoters(false);
              }}
              className={`mt-3 w-full min-h-[52px] px-6 rounded-2xl border font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer ${
                isLight
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{isUrdu ? 'واپس' : 'Back'}</span>
            </button>
          </div>
        </div>
      );
    }
    return (
      <CastVoteKiosk
        onStartCastVote={() => {
          if (rollCounts && rollCounts.approved === 0) {
            cyberSound.playClick();
            setShowNoVoters(true);
            return;
          }
          setIsKioskMode(false);
        }}
        onGoToEnroll={onGoToEnroll}
        onViewResults={onViewResults}
        lastVoteRecordedMessage={lastVoteRecordedMessage}
        onClearVoteMessage={onClearVoteMessage}
      />
    );
  }

  // Live Biometric Scanning Screen
  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6 flex flex-col items-center space-y-4 sm:space-y-6">
      {/* Top Header / Navigation */}
      <div
        className={`w-full p-4 sm:p-5 rounded-3xl border-2 transition-all shadow-md flex items-center justify-between ${
          isLight
            ? 'bg-white border-blue-200'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <button
          id="back-to-kiosk-btn"
          type="button"
          onClick={handleBackToKiosk}
          className={`flex items-center space-x-2 px-4 py-2 sm:py-2.5 rounded-2xl border font-bold text-xs sm:text-sm transition cursor-pointer shadow-sm ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isUrdu ? 'واپس جائیں' : 'Back'}</span>
        </button>

        {/* Simple Status Pill */}
        <div
          className={`px-4 py-2 rounded-2xl border font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-sm ${
            isLivenessActive || status === 'matching'
              ? 'bg-blue-600 text-white border-blue-500'
              : facePresent
              ? 'bg-emerald-600 text-white border-emerald-500'
              : isLight
              ? 'bg-slate-100 border-slate-300 text-slate-700'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLivenessActive || status === 'matching'
                ? 'bg-white animate-spin'
                : facePresent
                ? 'bg-white animate-pulse'
                : 'bg-slate-400'
            }`}
          />
          <span>
            {isLivenessActive || status === 'matching'
              ? isUrdu
                ? 'تصدیق جاری ہے...'
                : 'Verifying...'
              : facePresent
              ? isUrdu
                ? 'چہرہ مل گیا'
                : 'Face Detected'
              : isUrdu
              ? 'کیمرے کے سامنے آئیں'
              : 'Position Face in Camera'}
          </span>
        </div>
      </div>

      {/* Camera Error Message */}
      {cameraError && (
        <div className="w-full p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500 text-rose-600 dark:text-rose-300 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <Camera className="w-5 h-5 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={startCamera}
            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer"
          >
            {isUrdu ? 'دوبارہ کوشش کریں' : 'Retry'}
          </button>
        </div>
      )}

      {/* Central Video Viewport */}
      <div className="relative w-full max-w-2xl aspect-[4/3] bg-slate-950 rounded-3xl overflow-hidden border-4 border-blue-600 shadow-2xl flex items-center justify-center">
        {/* Camera Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />

        {/* Visual Biometric Mesh Canvas */}
        <BiometricMeshCanvas
          landmarks={currentLandmarks}
          box={currentBox}
          status={status}
          isLivenessActive={isLivenessActive}
          blinkFlash={blinkFlash}
          leftEar={leftEarVal}
          rightEar={rightEarVal}
          ear={currentEAR}
          headTilt={headTilt}
          videoRef={videoRef}
          showCallouts={false}
          fullFaceValidation={fullFaceValidation}
        />

        {/* Oval Alignment Guide */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className={`w-52 sm:w-64 h-72 sm:h-88 rounded-[50%] border-2 transition-all duration-300 ${
              blinkFlash
                ? 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.8)] scale-105'
                : facePresent
                ? 'border-emerald-400/90 shadow-[0_0_25px_rgba(52,211,153,0.4)]'
                : 'border-dashed border-blue-400/60'
            }`}
          />
        </div>

        {/* Matching Overlay */}
        {status === 'matching' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm p-6 text-center space-y-4">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin" />
            <h3 className="text-xl font-bold text-white">
              {isUrdu ? 'تصدیق جاری ہے...' : 'Verifying Voter...'}
            </h3>
          </div>
        )}

        {/* Spoof Movement Reminder */}
        {facePresent && spoofWarning && (
          <div className="absolute top-4 inset-x-4 z-30 p-3 rounded-2xl bg-rose-950/90 border border-rose-500 text-white text-center flex items-center justify-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              {isUrdu
                ? 'برائے مہربانی عام انداز میں پلک جھپکائیں یا سر ہلائیں'
                : 'Please blink naturally or tilt your head'}
            </span>
          </div>
        )}
      </div>

      {/* Primary Action Button Below Viewport */}
      <div className="w-full max-w-md flex flex-col items-center space-y-3">
        <button
          id="verify-face-btn"
          onClick={handleVerify}
          disabled={isLivenessActive || status === 'matching' || !facePresent}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center space-x-3 shadow-xl transition-all cursor-pointer ${
            isLivenessActive || status === 'matching'
              ? 'bg-blue-600 text-white cursor-wait opacity-90'
              : !facePresent
              ? isLight
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 text-white shadow-emerald-500/30 hover:scale-105 active:scale-95 border border-emerald-300'
          }`}
        >
          {isLivenessActive || status === 'matching' ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{isUrdu ? 'تصدیق ہو رہی ہے...' : 'Verifying...'}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-6 h-6" />
              <span>{isUrdu ? 'شناخت کی تصدیق کریں' : 'Verify & Proceed'}</span>
            </>
          )}
        </button>
      </div>

      {/* RESULT MODALS */}

      {/* 1. MATCH FOUND MODAL */}
      {status === 'match_found' && matchedVoter && (
        <div
          id="match-found-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div
            className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border-4 text-center shadow-2xl transition-all ${
              isLight
                ? 'bg-white border-emerald-500 text-slate-900 shadow-emerald-200/80'
                : 'bg-slate-900 border-emerald-400 text-white shadow-[0_0_50px_rgba(52,211,153,0.3)]'
            }`}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-display">
              {isUrdu ? 'ووٹر کی تصدیق ہو گئی' : 'Voter Verified'}
            </h2>

            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 my-4">
              {matchedVoter.name}
            </div>

            <div className="mt-6 flex flex-col space-y-3">
              <button
                id="proceed-to-ballot-btn"
                onClick={() => onProceedToBallot(matchedVoter, ballotToken)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base sm:text-lg shadow-xl flex items-center justify-center space-x-2 transition cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <Vote className="w-6 h-6" />
                <span>{isUrdu ? 'بیلٹ پیپر کھولیں' : 'Proceed to Vote'}</span>
              </button>

              <button
                onClick={handleReset}
                className={`py-2.5 rounded-2xl font-bold text-xs sm:text-sm border transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {isUrdu ? 'منسوخ' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ALREADY VOTED MODAL */}
      {status === 'already_voted' && matchedVoter && (
        <div
          id="already-voted-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div
            className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border-4 text-center shadow-2xl transition-all ${
              isLight
                ? 'bg-white border-rose-500 text-slate-900 shadow-rose-200/80'
                : 'bg-slate-900 border-rose-500 text-white shadow-[0_0_50px_rgba(244,63,94,0.3)]'
            }`}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-rose-100 dark:bg-rose-950 border-2 border-rose-500 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-lg">
              <Lock className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-display text-rose-600 dark:text-rose-400">
              {isUrdu ? 'ووٹ پہلے ہی ڈالا جا چکا ہے' : 'Already Voted'}
            </h2>

            <div className="text-xl font-bold my-3">{matchedVoter.name}</div>

            <div className="mt-6">
              <button
                onClick={handleBackToKiosk}
                className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm sm:text-base shadow-lg transition cursor-pointer"
              >
                {isUrdu ? 'واپس جائیں' : 'Back to Kiosk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. NOT REGISTERED MODAL */}
      {status === 'not_registered' && (
        <div
          id="not-registered-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div
            className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border-4 text-center shadow-2xl transition-all ${
              isLight
                ? 'bg-white border-amber-500 text-slate-900 shadow-amber-200/80'
                : 'bg-slate-900 border-amber-500 text-white shadow-[0_0_50px_rgba(245,158,11,0.3)]'
            }`}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-950 border-2 border-amber-500 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-lg">
              <UserX className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-display text-amber-600 dark:text-amber-400">
              {isUrdu ? 'ووٹر لسٹ میں موجود نہیں' : 'Voter Not Registered'}
            </h2>

            <div className="mt-6 flex flex-col space-y-3">
              <button
                onClick={onGoToEnroll}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm sm:text-base shadow-lg flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <UserPlus className="w-5 h-5" />
                <span>{isUrdu ? 'نیا ووٹر رجسٹر کریں' : 'Register New Voter'}</span>
              </button>

              <button
                onClick={handleReset}
                className={`py-2.5 rounded-2xl font-bold text-xs sm:text-sm border transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {isUrdu ? 'دوبارہ کوشش کریں' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PENDING APPROVAL MODAL */}
      {status === 'pending_approval' && matchedVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border-4 text-center shadow-2xl ${isLight ? 'bg-white border-amber-500 text-slate-900' : 'bg-slate-900 border-amber-500 text-white'}`}>
            <h2 className="text-xl sm:text-2xl font-black font-display text-amber-600 dark:text-amber-400">
              {isUrdu ? 'رجسٹریشن منظوری کے منتظر ہے' : 'Registration Pending Approval'}
            </h2>
            <div className="text-xl font-bold my-3">{matchedVoter.name}</div>
            <p className="text-sm opacity-80">
              {isUrdu
                ? 'آپ کی رجسٹریشن ابھی افسر کی منظوری کے منتظر ہے۔ منظوری کے بعد ہی ووٹ ڈالا جا سکتا ہے۔'
                : 'Your registration is still awaiting officer approval. Voting opens after approval.'}
            </p>
            <div className="mt-6">
              <button onClick={handleBackToKiosk} className="w-full py-3.5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm sm:text-base shadow-lg transition cursor-pointer">
                {isUrdu ? 'واپس جائیں' : 'Back to Kiosk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. REGISTRATION REJECTED MODAL */}
      {status === 'registration_rejected' && matchedVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border-4 text-center shadow-2xl ${isLight ? 'bg-white border-rose-500 text-slate-900' : 'bg-slate-900 border-rose-500 text-white'}`}>
            <h2 className="text-xl sm:text-2xl font-black font-display text-rose-600 dark:text-rose-400">
              {isUrdu ? 'رجسٹریشن مسترد کر دی گئی' : 'Registration Rejected'}
            </h2>
            <div className="text-xl font-bold my-3">{matchedVoter.name}</div>
            <p className="text-sm opacity-80">
              {isUrdu
                ? 'یہ رجسٹریشن مسترد کر دی گئی ہے، اس لیے ووٹ نہیں ڈالا جا سکتا۔ افسر سے رابطہ کریں۔'
                : 'This registration was rejected, so voting is not allowed. Please contact the presiding officer.'}
            </p>
            <div className="mt-6">
              <button onClick={handleBackToKiosk} className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm sm:text-base shadow-lg transition cursor-pointer">
                {isUrdu ? 'واپس جائیں' : 'Back to Kiosk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. LIVENESS FAILED MODAL */}
      {status === 'liveness_failed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border-4 text-center shadow-2xl ${isLight ? 'bg-white border-rose-500 text-slate-900' : 'bg-slate-900 border-rose-500 text-white'}`}>
            <h2 className="text-xl sm:text-2xl font-black font-display text-rose-600 dark:text-rose-400">
              {isUrdu ? 'زندہ ہونے کی تصدیق ناکام' : 'Liveness Check Failed'}
            </h2>
            <p className="text-sm opacity-80 mt-3">
              {isUrdu
                ? 'برائے مہربانی براہِ راست کیمرے کے سامنے آئیں، پلک جھپکائیں یا سر ہلائیں۔ تصویر یا اسکرین سے تصدیق نہیں ہوگی۔'
                : 'Please face the camera in person and blink or move your head naturally. A photo or screen cannot verify.'}
            </p>
            <div className="mt-6">
              <button onClick={handleReset} className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm sm:text-base shadow-lg transition cursor-pointer">
                {isUrdu ? 'دوبارہ کوشش کریں' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
