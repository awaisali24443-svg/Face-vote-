import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Vote,
  ShieldCheck,
  Scan,
  Cpu,
  Fingerprint,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Trash2,
  Users,
  ShieldAlert,
  X,
  Info,
  CreditCard,
  Zap,
  Upload,
  Image as ImageIcon,
  Printer,
  FileText,
} from 'lucide-react';
import {
  detectFastLandmarks,
  extractAveragedFaceDescriptor,
  captureSnapshot,
  extractDescriptorFromImageSource,
  FullFaceValidation,
} from '../services/faceApi';
import { Voter } from '../types';
import { BiometricMeshCanvas } from './BiometricMeshCanvas';
import { VectorMatrixVisualizer } from './VectorMatrixVisualizer';
import { CNICBarcodeScannerModal } from './CNICBarcodeScannerModal';
import { PrintVoterCardModal } from './PrintVoterCardModal';
import { ParsedCNIC, formatCNICString, getProvinceFromCNIC, getDistrictFromCNIC, getGenderFromCNIC, SAMPLE_CNIC_PRESETS } from '../services/cnicScanner';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { offlineStorage } from '../services/offlineStorage';
import { adminHeaders } from '../services/adminAuth';

interface EnrollmentViewProps {
  onGoToCheckIn: () => void;
}

type EnrollmentStep = 'enter_name' | 'scan_face';

interface DuplicateConflict {
  existingVoter: { id: number; name: string; photo?: string };
  similarity: number;
  distance?: number;
  embedding: number[];
  snapshot: string | null;
}

export const EnrollmentView: React.FC<EnrollmentViewProps> = ({ onGoToCheckIn }) => {
  const { isLight } = useTheme();
  const { isUrdu } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Step state: first enter name & identity data, then show camera to scan face
  const [step, setStep] = useState<EnrollmentStep>('enter_name');
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
  const [isPrintCardModalOpen, setIsPrintCardModalOpen] = useState<boolean>(false);
  const [isProcessingUploadedImage, setIsProcessingUploadedImage] = useState<boolean>(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedDescriptor, setUploadedDescriptor] = useState<number[] | null>(null);

  // Realistic Pakistani NADRA Identity Fields
  const [voterName, setVoterName] = useState<string>('');
  const [voterCnic, setVoterCnic] = useState<string>('');
  const [fatherName, setFatherName] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Transgender'>('Male');
  const [dob, setDob] = useState<string>('14-08-1992');
  const [province, setProvince] = useState<string>('Punjab');
  const [district, setDistrict] = useState<string>('Lahore (NA-127)');
  const [constituency, setConstituency] = useState<string>('NA-127 (Lahore-XI)');
  const [pollingStation, setPollingStation] = useState<string>('Govt. Model High School, Booth #01');
  const [electoralBlockCode, setElectoralBlockCode] = useState<string>('352010104');
  const [familyTreeNo, setFamilyTreeNo] = useState<string>('FT-9482715');
  const [nadraVerified, setNadraVerified] = useState<boolean>(true);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState<boolean>(false);

  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Duplicate conflict state
  const [duplicateConflict, setDuplicateConflict] = useState<DuplicateConflict | null>(null);

  // Registered voters quick management
  const [registeredVoters, setRegisteredVoters] = useState<Voter[]>([]);
  const [isVotersModalOpen, setIsVotersModalOpen] = useState<boolean>(false);
  const [isDeletingVoter, setIsDeletingVoter] = useState<number | null>(null);

  // Live face tracking status & landmarks (active only during 'scan_face')
  const [faceCount, setFaceCount] = useState<number>(0);
  const [currentLandmarks, setCurrentLandmarks] = useState<any | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [currentEAR, setCurrentEAR] = useState<number | null>(null);
  const [leftEarVal, setLeftEarVal] = useState<number | null>(null);
  const [rightEarVal, setRightEarVal] = useState<number | null>(null);
  const [fullFaceValidation, setFullFaceValidation] = useState<FullFaceValidation | null>(null);

  // Successful enrollment result
  const [enrolledVoter, setEnrolledVoter] = useState<Voter | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [enrolledEmbedding, setEnrolledEmbedding] = useState<number[] | null>(null);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);

  // Load registered voters from backend
  const fetchRegisteredVoters = useCallback(async () => {
    try {
      const res = await fetch('/api/voters', { headers: { ...adminHeaders() } });
      if (res.ok) {
        const data = await res.json();
        const list = data.voters || [];
        setRegisteredVoters(list);
        if (list.length > 0) {
          offlineStorage.saveVotersLocally(list);
        }
      } else {
        const localList = offlineStorage.getLocalVoters();
        if (localList.length > 0) {
          setRegisteredVoters(localList);
        }
      }
    } catch (err) {
      console.warn('Error fetching registered voters, using offline cache:', err);
      const localList = offlineStorage.getLocalVoters();
      if (localList.length > 0) {
        setRegisteredVoters(localList);
      }
    }
  }, []);

  useEffect(() => {
    fetchRegisteredVoters();
  }, [fetchRegisteredVoters]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported in this browser window. Please use the Upload Photo option below.');
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr: any) {
          if (playErr.name !== 'AbortError' && !playErr.message?.includes('interrupted')) {
            console.warn('Video playback notice in enrollment:', playErr);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('interrupted')) {
        return;
      }
      console.warn('Camera access notice in enrollment:', err?.name || err?.message || err);
      const isPermDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || String(err).includes('Permission denied') || String(err).includes('NotAllowedError');
      setCameraError(
        isPermDenied
          ? 'Camera permission was denied. You can grant access or use the Upload Photo / Demo option below.'
          : 'Unable to connect to optical hardware. You can use the Upload Photo / Demo option below.'
      );
    }
  }, []);

  // Activate camera ONLY when in 'scan_face' step and not yet enrolled
  useEffect(() => {
    isMountedRef.current = true;
    if (step === 'scan_face' && !enrolledVoter) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [step, enrolledVoter, startCamera, stopCamera]);

  // Periodic face detector to guide user in real time when scanning face
  useEffect(() => {
    let intervalId: any;

    const trackFace = async () => {
      if (step !== 'scan_face' || enrolledVoter || !videoRef.current || videoRef.current.readyState < 2) {
        return;
      }

      try {
        const result = await detectFastLandmarks(videoRef.current);
        setFaceCount(result.faceCount);
        if (result.faceCount === 1) {
          setCurrentLandmarks(result.landmarks || null);
          setCurrentBox(result.box || null);
          setCurrentEAR(result.ear);
          setLeftEarVal(result.leftEar !== undefined ? result.leftEar : null);
          setRightEarVal(result.rightEar !== undefined ? result.rightEar : null);
          setFullFaceValidation(result.fullFaceValidation || null);
        } else {
          setCurrentLandmarks(null);
          setCurrentBox(null);
          setCurrentEAR(null);
          setFullFaceValidation(null);
        }
      } catch (err) {
        // Models may still be initializing
      }
    };

    if (step === 'scan_face' && !enrolledVoter) {
      intervalId = setInterval(trackFace, 45);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, enrolledVoter]);

  // Step 1 -> Step 2: Validate name and proceed to optical scan
  const handleProceedToScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!voterName.trim()) {
      setErrorMessage('Please specify the voter designation / full name.');
      return;
    }
    cyberSound.playClick();
    setErrorMessage(null);
    setStep('scan_face');
  };

  // Step 2 -> Step 1: Return to edit name
  const handleBackToName = () => {
    cyberSound.playClick();
    setErrorMessage(null);
    setFaceCount(0);
    setCurrentLandmarks(null);
    setCurrentBox(null);
    setStep('enter_name');
  };

  // Capture face and register voter
  const handleCaptureAndEnroll = async () => {
    if (!voterName.trim()) {
      setErrorMessage('Please specify the voter designation / full name.');
      setStep('enter_name');
      return;
    }

    if (!videoRef.current || videoRef.current.readyState < 2) {
      setErrorMessage('Optical sensor is calibrating. Please wait.');
      return;
    }

    cyberSound.playClick();
    setIsCapturing(true);
    setErrorMessage(null);
    cyberSound.playScanSweep();

    try {
      // 1. Verify face count
      const fastCheck = await detectFastLandmarks(videoRef.current);

      if (fastCheck.faceCount === 0) {
        setErrorMessage(`Zero facial signatures detected. Center ${voterName.trim()} inside the reticle.`);
        setIsCapturing(false);
        return;
      }

      if (fastCheck.faceCount > 1) {
        setErrorMessage(
          `Multiple signatures detected (${fastCheck.faceCount}). Only ${voterName.trim()} may occupy frame during biometric template generation.`
        );
        setIsCapturing(false);
        return;
      }

      // 1b. Verify full face is present (not just eyes)
      if (!fastCheck.fullFaceValidation?.isValidFullFace) {
        setErrorMessage(
          fastCheck.fullFaceValidation?.statusMessage ||
            'Whole face required for biometric registration. Step back so forehead, eyes, nose, mouth, and chin are completely in frame.'
        );
        setIsCapturing(false);
        return;
      }

      // 2. Extract a high-precision 128-d descriptor (3 frames averaged,
      // full-face enforced) — the stored signature every later match uses.
      const descriptorResult = await extractAveragedFaceDescriptor(videoRef.current, 3, true);

      if (!descriptorResult || !descriptorResult.embedding || descriptorResult.embedding.length !== 128) {
        setErrorMessage('Biometric registration rejected: Entire face (chin to forehead) must be clearly visible.');
        setIsCapturing(false);
        return;
      }

      setEnrolledEmbedding(descriptorResult.embedding);

      // Capture snapshot photo
      const snapshot = captureSnapshot(videoRef.current);
      setCapturedSnapshot(snapshot);

      // 3. Send { name, cnic, embedding, photo, ...identity } to backend
      const response = await fetch('/api/voters/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({
          name: voterName.trim(),
          cnic: voterCnic.trim() || undefined,
          father_name: fatherName.trim() || undefined,
          gender,
          dob: dob.trim() || undefined,
          province,
          district,
          constituency,
          polling_station: pollingStation,
          electoral_block_code: electoralBlockCode,
          family_tree_no: familyTreeNo,
          nadra_verified: nadraVerified,
          embedding: descriptorResult.embedding,
          photo: snapshot || uploadedPhoto,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          cyberSound.playSecurityAlarm();
          setDuplicateConflict({
            existingVoter: data.existingVoter || { id: 0, name: 'Registered Subject' },
            similarity: data.similarity || 0.94,
            distance: data.distance,
            embedding: descriptorResult.embedding,
            snapshot,
          });
          setErrorMessage(data.error || 'Biometric similarity match detected with an already registered voter.');
          setIsCapturing(false);
          return;
        }
        throw new Error(data.error || 'Failed to enroll voter in database');
      }

      cyberSound.playAccessGranted();
      setEnrolledVoter(data.voter);
      setDuplicateConflict(null);
      fetchRegisteredVoters();
      setIsCapturing(false);
    } catch (err: any) {
      console.error('Enrollment error:', err);
      cyberSound.playSecurityAlarm();
      setErrorMessage(err.message || 'An error occurred during biometric enrollment');
      setIsCapturing(false);
    }
  };

  // Process uploaded image file or URL
  const processImageSource = async (imageSrc: string) => {
    setIsProcessingUploadedImage(true);
    setErrorMessage(null);
    cyberSound.playScanSweep();

    try {
      const result = await extractDescriptorFromImageSource(imageSrc);
      if (!result.faceDetected || !result.embedding || result.embedding.length !== 128) {
        setErrorMessage('No face was detected in that image. Please choose a clear portrait photo.');
        return;
      }
      setUploadedImagePreview(result.photo);
      setUploadedDescriptor(result.embedding);
      setEnrolledEmbedding(result.embedding);
      setUploadedPhoto(result.photo);
      cyberSound.playAcquireBeep();
    } catch (err: any) {
      console.error('Error extracting descriptor from image:', err);
      setErrorMessage('Could not process image. Please choose another portrait image.');
    } finally {
      setIsProcessingUploadedImage(false);
    }
  };

  // File input change handler for image upload
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        processImageSource(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Select preset portrait photo
  const handleSelectPresetPhoto = (photoUrl: string) => {
    cyberSound.playClick();
    processImageSource(photoUrl);
  };

  // Enroll voter directly using uploaded image & extracted 128-D descriptor
  const handleEnrollWithUploadedPhoto = async () => {
    if (!voterName.trim()) {
      setErrorMessage('Please specify the voter designation / full name.');
      setStep('enter_name');
      return;
    }

    if (!uploadedDescriptor || !uploadedImagePreview) {
      setErrorMessage('Please upload or select a citizen portrait photograph first.');
      return;
    }

    cyberSound.playClick();
    setIsCapturing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/voters/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({
          name: voterName.trim(),
          cnic: voterCnic.trim() || undefined,
          father_name: fatherName.trim() || undefined,
          gender,
          dob: dob.trim() || undefined,
          province,
          district,
          constituency,
          polling_station: pollingStation,
          electoral_block_code: electoralBlockCode,
          family_tree_no: familyTreeNo,
          nadra_verified: nadraVerified,
          embedding: uploadedDescriptor,
          photo: uploadedImagePreview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          cyberSound.playSecurityAlarm();
          setDuplicateConflict({
            existingVoter: data.existingVoter || { id: 0, name: 'Registered Subject' },
            similarity: data.similarity || 0.94,
            distance: data.distance,
            embedding: uploadedDescriptor,
            snapshot: uploadedImagePreview,
          });
          setErrorMessage(data.error || 'Biometric similarity match detected with an already registered voter.');
          setIsCapturing(false);
          return;
        }
        throw new Error(data.error || 'Failed to enroll voter in database');
      }

      cyberSound.playAccessGranted();
      setEnrolledVoter(data.voter);
      setCapturedSnapshot(uploadedImagePreview);
      setDuplicateConflict(null);
      fetchRegisteredVoters();
      setIsCapturing(false);
    } catch (err: any) {
      console.error('Enrollment from photo error:', err);
      cyberSound.playSecurityAlarm();
      setErrorMessage(err.message || 'An error occurred during biometric enrollment');
      setIsCapturing(false);
    }
  };

  // REMOVED: "force enroll" and "erase previous voter & enroll".
  // Duplicate CNIC / face registrations are blocked server-side with no
  // override. If a record is genuinely wrong, an officer deletes it from the
  // registered voters list first, then enrolls — two separate, visible actions.

  // Delete an individual registered voter from the quick modal
  const handleDeleteRegisteredVoter = async (id: number, name: string) => {
    cyberSound.playClick();
    if (!window.confirm(`Delete registered voter "${name}" (ID #${id})? Biometric signature will be wiped.`)) return;
    setIsDeletingVoter(id);
    try {
      const res = await fetch(`/api/voters/${id}`, { method: 'DELETE', headers: { ...adminHeaders() } });
      if (res.ok) {
        cyberSound.playClick();
        await fetchRegisteredVoters();
        if (duplicateConflict?.existingVoter?.id === id) {
          setDuplicateConflict(null);
          setErrorMessage(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete voter:', err);
    } finally {
      setIsDeletingVoter(null);
    }
  };

  const handleResetForNext = () => {
    cyberSound.playClick();
    setEnrolledVoter(null);
    setCapturedSnapshot(null);
    setEnrolledEmbedding(null);
    setVoterName('');
    setErrorMessage(null);
    setDuplicateConflict(null);
    setFaceCount(0);
    setCurrentLandmarks(null);
    setCurrentBox(null);
    setStep('enter_name');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 font-mono">
      {/* Title Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b ${isLight ? 'border-slate-300' : 'border-cyan-950'}`}>
        <div>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center ${
              isLight
                ? 'bg-white border-blue-600 text-blue-700 shadow-md'
                : 'bg-slate-900 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
            }`}>
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-black tracking-wide uppercase font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isUrdu ? 'ووٹر رجسٹریشن' : 'Voter Registration'}
              </h1>
            </div>
          </div>
        </div>

        {/* Actions & Progression */}
        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => {
              cyberSound.playClick();
              fetchRegisteredVoters();
              setIsVotersModalOpen(true);
            }}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center space-x-2 transition shadow cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-slate-900 hover:bg-slate-800 border-cyan-800 hover:border-cyan-400 text-cyan-300'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
            <span>{isUrdu ? 'رجسٹرڈ ووٹرز' : 'Registered Voters'} ({registeredVoters.length})</span>
          </button>

          {/* Step Progression Badges */}
          {!enrolledVoter && (
            <div className="flex items-center space-x-2 text-xs">
              <span
                className={`px-3 py-1 rounded-lg border font-bold flex items-center space-x-1.5 ${
                  step === 'enter_name'
                    ? isLight
                      ? 'bg-blue-100 text-blue-900 border-blue-400 shadow-sm'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : isLight
                    ? 'bg-slate-100 text-slate-500 border-slate-300'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800'
                }`}
              >
                <span>{isUrdu ? '1. نام درج کریں' : '1. Enter Name'}</span>
              </span>
              <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>&rarr;</span>
              <span
                className={`px-3 py-1 rounded-lg border font-bold flex items-center space-x-1.5 ${
                  step === 'scan_face'
                    ? isLight
                      ? 'bg-blue-100 text-blue-900 border-blue-400 shadow-sm'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : isLight
                    ? 'bg-slate-100 text-slate-500 border-slate-300'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800'
                }`}
              >
                <span>{isUrdu ? '2. چہرہ اسکین کریں' : '2. Scan Face'}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CAMERA ERROR BANNER */}
      {cameraError && step === 'scan_face' && (
        <div className="mb-6 p-5 rounded-2xl bg-slate-950/95 border-2 border-rose-500 text-rose-100 flex flex-col gap-3 shadow-[0_0_25px_rgba(244,63,94,0.35)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-rose-300 shrink-0" />
              <div>
                <span className="text-xs font-mono font-bold text-rose-200 uppercase">[SYS.ERR // CAMERA ACCESS DENIED]</span>
                <p className="text-xs text-rose-200/90 mt-0.5">{cameraError}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 text-white font-bold text-xs cursor-pointer shadow flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RETRY PERMISSION</span>
              </button>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-start space-x-2">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>To allow camera: click the lock/site settings icon (🔒) beside the browser address bar, set Camera to <strong>Allow</strong>, then click Retry Permission. Live optical capture is required to preserve electoral integrity.</span>
          </div>
        </div>
      )}

      {/* SUCCESS CARD AFTER ENROLLMENT */}
      {enrolledVoter ? (
        <div className={`p-8 sm:p-12 rounded-2xl border-2 flex flex-col items-center text-center relative overflow-hidden ${
          isLight
            ? 'bg-white border-emerald-500 shadow-xl'
            : 'bg-slate-950 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.3)]'
        }`}>
          {/* Tech Corner Brackets */}
          <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
          <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500" />
          <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500" />
          <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />

          <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-4 ${
            isLight
              ? 'bg-emerald-100 border-emerald-500 text-emerald-700 shadow-md'
              : 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.5)]'
          }`}>
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className={`text-2xl sm:text-3xl font-black tracking-wide font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {isUrdu ? 'ووٹر کامیابی سے رجسٹر ہو گیا' : 'Voter Registered Successfully'}
          </h2>

          {/* Voter Card Details */}
          <div className={`w-full max-w-lg mt-6 p-6 rounded-2xl border text-left shadow-lg relative ${
            isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-cyan-800/80'
          }`}>
            <div className="flex items-start space-x-5">
              {(capturedSnapshot || uploadedPhoto || enrolledVoter.photo) && (
                <img
                  src={capturedSnapshot || uploadedPhoto || enrolledVoter.photo || ''}
                  alt="Enrolled Face"
                  className={`w-24 h-24 rounded-xl object-cover border-2 shadow-md shrink-0 ${
                    isLight ? 'border-blue-600' : 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                  }`}
                />
              )}
              <div className="space-y-1 min-w-0 flex-1">
                <div className={`text-2xl font-black ${isLight ? 'text-blue-700' : 'text-cyan-400'}`}>#{enrolledVoter.id}</div>
                <div className={`text-lg font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{enrolledVoter.name}</div>
                
                {enrolledVoter.cnic && (
                  <div className={`text-xs font-mono font-bold ${isLight ? 'text-blue-800' : 'text-cyan-300'}`}>
                    CNIC: {enrolledVoter.cnic}
                  </div>
                )}

                {enrolledVoter.father_name && (
                  <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {isUrdu ? 'ولدیت' : "Father's Name"}: <span className="font-bold">{enrolledVoter.father_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                cyberSound.playClick();
                setIsPrintCardModalOpen(true);
              }}
              className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer transition shadow-emerald-900/30"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>{isUrdu ? 'پرنٹ کارڈ' : 'Print Voter Card'}</span>
            </button>

            <button
              id="enroll-another-btn"
              onClick={handleResetForNext}
              className={`px-6 py-3.5 rounded-xl font-bold text-xs border flex items-center justify-center space-x-2 cursor-pointer transition ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <UserPlus className={`w-4 h-4 ${isLight ? 'text-blue-700' : 'text-cyan-400'}`} />
              <span>{isUrdu ? 'نیا ووٹر رجسٹر کریں' : 'Register Another Voter'}</span>
            </button>

            <button
              id="test-checkin-btn"
              onClick={() => {
                cyberSound.playClick();
                onGoToCheckIn();
              }}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg border border-blue-400 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Vote className="w-4 h-4" />
              <span>{isUrdu ? 'ووٹنگ اسکرین پر جائیں' : 'Go to Voting Kiosk'}</span>
            </button>
          </div>
        </div>
      ) : step === 'enter_name' ? (
        /* ================================================================ */
        /* STEP 1: ENTER VOTER NAME FIRST (No premature camera activation)  */
        /* ================================================================ */
        <div className="w-full max-w-xl mx-auto">
          <form
            onSubmit={handleProceedToScan}
            className={`p-8 sm:p-10 rounded-3xl border-2 relative overflow-hidden ${
              isLight
                ? 'bg-white border-slate-300 shadow-xl'
                : 'bg-slate-900/90 border-cyan-900 shadow-[0_0_50px_rgba(15,23,42,0.9)]'
            }`}
          >
            {/* Tech Corner Accents */}
            <span className={`absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 ${isLight ? 'border-cyan-600' : 'border-cyan-400'}`} />
            <span className={`absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 ${isLight ? 'border-cyan-600' : 'border-cyan-400'}`} />
            <span className={`absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 ${isLight ? 'border-cyan-600' : 'border-cyan-400'}`} />
            <span className={`absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 ${isLight ? 'border-cyan-600' : 'border-cyan-400'}`} />

            <div className="flex items-center space-x-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                isLight
                  ? 'bg-cyan-50 border-cyan-500 text-cyan-700 shadow-sm'
                  : 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
              }`}>
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  STEP 01 // CITIZEN CREDENTIALS
                </span>
                <h2 className={`text-xl font-black uppercase tracking-wider font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ENTER VOTER LEGAL NAME
                </h2>
              </div>
            </div>

            <p className={`text-xs mb-6 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Specify the legal identity of the citizen to be enrolled. You can scan their Pakistani CNIC barcode
              directly using the webcam (no hardware scanner needed) or enter the credentials manually.
            </p>

            {/* CNIC BARCODE SCANNER TRIGGER (ZERO HARDWARE) */}
            <div className={`p-4 rounded-2xl border-2 mb-6 transition-all ${
              isLight
                ? 'bg-cyan-50/70 border-cyan-400 text-slate-900 shadow-sm'
                : 'bg-cyan-950/40 border-cyan-500/80 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-cyan-400">
                      IN-BROWSER CNIC BARCODE / QR SCANNER
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Zero extra hardware — uses existing kiosk camera to read NADRA CNIC barcodes &amp; auto-fill details.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  id="scan-cnic-barcode-btn"
                  onClick={() => setIsScannerModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition cursor-pointer shrink-0"
                >
                  <Scan className="w-4 h-4" />
                  <span>SCAN CNIC BARCODE</span>
                </button>
              </div>
            </div>

            {/* Sample NADRA Citizen Quick-Select Presets */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  QUICK LOAD SAMPLE NADRA RECORDS (FOR DEMO / TESTING)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_CNIC_PRESETS.map((preset) => (
                  <button
                    key={preset.cnic}
                    type="button"
                    onClick={() => {
                      cyberSound.playClick();
                      setVoterCnic(preset.cnic);
                      setVoterName(preset.name);
                      setFatherName(preset.father);
                      setGender(preset.gender);
                      setDob(preset.dob);
                      setProvince(preset.province);
                      setDistrict(preset.district);
                      setConstituency(preset.constituency);
                      setPollingStation(preset.pollingStation);
                      setElectoralBlockCode(preset.electoralBlockCode);
                      setFamilyTreeNo(preset.familyTreeNo);
                      if (preset.photo) setUploadedPhoto(preset.photo);
                      setNadraVerified(true);
                      setErrorMessage(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                      voterCnic === preset.cnic
                        ? isLight
                          ? 'bg-cyan-100 text-cyan-900 border-cyan-500 shadow-sm'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                        : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span>{preset.name}</span>
                    <span className="text-[9px] opacity-75">({preset.district})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Voter CNIC Field */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <label className={`block text-[11px] uppercase tracking-wider font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                  CITIZEN CNIC / NATIONAL ID NUMBER (13 DIGITS) *
                </label>
                <span className="text-[10px] text-cyan-500 font-mono">FORMAT: XXXXX-XXXXXXX-X</span>
              </div>
              <input
                id="voter-cnic-input"
                type="text"
                value={voterCnic}
                onChange={(e) => {
                  const formatted = formatCNICString(e.target.value);
                  setVoterCnic(formatted);
                  if (formatted.replace(/\D/g, '').length >= 5) {
                    setProvince(getProvinceFromCNIC(formatted));
                    setDistrict(getDistrictFromCNIC(formatted));
                  }
                  if (formatted.replace(/\D/g, '').length === 13) {
                    setGender(getGenderFromCNIC(formatted));
                  }
                }}
                placeholder="35201-9482715-3"
                className={`w-full px-5 py-3.5 rounded-xl border-2 font-mono text-base focus:outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 focus:bg-white focus:shadow-md'
                    : 'bg-slate-950 border-cyan-800 text-white placeholder-slate-600 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                }`}
              />
            </div>

            {/* Voter Full Name Field */}
            <div className="space-y-2 mb-4">
              <label className={`block text-[11px] uppercase tracking-wider font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                FULL LEGAL CITIZEN NAME *
              </label>
              <input
                id="voter-name-input"
                type="text"
                autoFocus
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="e.g. Eleanor Vance, Senator Marcus Cole, Muhammad Tariq"
                className={`w-full px-5 py-3.5 rounded-xl border-2 font-mono text-base focus:outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 focus:bg-white focus:shadow-md'
                    : 'bg-slate-950 border-cyan-800 text-white placeholder-slate-600 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                }`}
              />
            </div>

            {/* Father's Name & Gender Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className={`block text-[11px] uppercase tracking-wider font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                  FATHER / HUSBAND NAME
                </label>
                <input
                  id="voter-father-name-input"
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Vance, Abdul Rehman"
                  className={`w-full px-4 py-3 rounded-xl border font-mono text-sm focus:outline-none transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600'
                      : 'bg-slate-950 border-cyan-900 text-white placeholder-slate-600 focus:border-cyan-400'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className={`block text-[11px] uppercase tracking-wider font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                  GENDER &bull; DATE OF BIRTH
                </label>
                <div className="flex space-x-2">
                  <select
                    id="voter-gender-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className={`w-1/2 px-3 py-3 rounded-xl border font-mono text-xs focus:outline-none transition cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-cyan-900 text-white'
                    }`}
                  >
                    <option value="Male">Male (مرد)</option>
                    <option value="Female">Female (عورت)</option>
                    <option value="Transgender">Transgender (خواجہ سرا)</option>
                  </select>
                  <input
                    id="voter-dob-input"
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="DD-MM-YYYY"
                    className={`w-1/2 px-3 py-3 rounded-xl border font-mono text-xs focus:outline-none transition ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-cyan-900 text-white'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Toggle Advanced NADRA Electoral Details */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                className={`text-xs font-bold flex items-center space-x-2 py-1.5 transition cursor-pointer ${
                  isLight ? 'text-cyan-700 hover:text-cyan-800' : 'text-cyan-400 hover:text-cyan-300'
                }`}
              >
                <span>{showAdvancedFields ? '▲ HIDE ELECTORAL ROLL DETAILS' : '▼ VIEW / EDIT NADRA ELECTORAL LOCATION & CONSTITUENCY'}</span>
              </button>

              {showAdvancedFields && (
                <div className={`mt-3 p-4 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950/90 border-slate-800'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        Province / Territory
                      </label>
                      <input
                        type="text"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-mono ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        District / City
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-mono ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        Constituency (NA / Provincial)
                      </label>
                      <input
                        type="text"
                        value={constituency}
                        onChange={(e) => setConstituency(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-mono ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        Assigned Polling Station
                      </label>
                      <input
                        type="text"
                        value={pollingStation}
                        onChange={(e) => setPollingStation(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-mono ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        Electoral Census Block Code
                      </label>
                      <input
                        type="text"
                        value={electoralBlockCode}
                        onChange={(e) => setElectoralBlockCode(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-mono ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        NADRA Family Tree ID
                      </label>
                      <input
                        type="text"
                        value={familyTreeNo}
                        onChange={(e) => setFamilyTreeNo(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-mono ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions box */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 mb-6 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/80 border-white/10 text-slate-400'
            }`}>
              <div className={`font-bold flex items-center space-x-1.5 text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                <ShieldCheck className={`w-4 h-4 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
                <span>ENROLLMENT SEQUENCE:</span>
              </div>
              <div className={`flex items-center space-x-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <span className={`font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>1.</span>
                <span>Type and confirm the legal name of the person being registered.</span>
              </div>
              <div className={`flex items-center space-x-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <span className={`font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>2.</span>
                <span>Position the designated person in front of the camera and click Scan.</span>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-start space-x-2 mb-6">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* PROCEED TO SCAN BUTTON */}
            <button
              id="proceed-to-scan-btn"
              type="submit"
              disabled={!voterName.trim()}
              className={`w-full py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl transition-all cursor-pointer ${
                !voterName.trim()
                  ? isLight
                    ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                    : 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white border border-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.5)] hover:scale-[1.01]'
              }`}
            >
              <span>CONFIRM NAME &amp; PROCEED TO FACE SCAN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* ================================================================ */
        /* STEP 2: SCAN THE VOTER FACE (Camera activated for named citizen)  */
        /* ================================================================ */
        <div className="w-full flex flex-col space-y-6">
          {/* Active Citizen Target Bar & Mode Switcher */}
          <div className={`w-full p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
            isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-cyan-800'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                isLight ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'bg-cyan-950 border-cyan-400 text-cyan-300'
              }`}>
                {captureMode === 'camera' ? <Camera className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  STEP 02 // BIOMETRIC ENROLLMENT PROTOCOL
                </span>
                <div className={`text-lg font-black flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>REGISTERING CITIZEN:</span>
                  <span className={`${isLight ? 'text-cyan-700' : 'text-cyan-300'} underline underline-offset-4 decoration-cyan-500`}>
                    {voterName}
                  </span>
                </div>
              </div>
            </div>

            {/* Mode Selector & Back Button */}
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded-xl border flex items-center ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    cyberSound.playClick();
                    setCaptureMode('camera');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                    captureMode === 'camera'
                      ? isLight
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>LIVE CAMERA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    cyberSound.playClick();
                    setCaptureMode('upload');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                    captureMode === 'upload'
                      ? isLight
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>UPLOAD PHOTO</span>
                </button>
              </div>

              <button
                id="back-to-name-btn"
                onClick={handleBackToName}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>EDIT DETAILS</span>
              </button>
            </div>
          </div>

          {captureMode === 'camera' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* CAMERA VIEWPORT (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col items-center">
                <div className={`relative w-full aspect-[4/3] max-h-[500px] bg-slate-950 rounded-2xl overflow-hidden border-2 flex items-center justify-center ${
                  isLight ? 'border-slate-400 shadow-lg' : 'border-cyan-900/80 shadow-[0_0_35px_rgba(15,23,42,0.9)]'
                }`}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />

                  {/* LIVE HOLOGRAPHIC 68-POINT MESH CANVAS */}
                  <BiometricMeshCanvas
                    landmarks={currentLandmarks}
                    box={currentBox}
                    status={faceCount === 1 ? 'match_found' : 'position_face'}
                    isLivenessActive={isCapturing}
                    blinkFlash={false}
                    leftEar={leftEarVal}
                    rightEar={rightEarVal}
                    ear={currentEAR}
                    headTilt={0}
                    videoRef={videoRef}
                    showCallouts={true}
                    fullFaceValidation={fullFaceValidation}
                  />

                  {/* PARTIAL FACE / ONLY EYES WARNING BANNER */}
                  {faceCount === 1 && fullFaceValidation && !fullFaceValidation.isValidFullFace && (
                    <div className="absolute top-16 inset-x-4 sm:inset-x-8 z-20 p-3 sm:p-4 rounded-xl bg-amber-950/95 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] backdrop-blur text-left flex items-start space-x-3 pointer-events-none animate-pulse">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs font-black text-amber-200 tracking-wider font-display">
                          PARTIAL FACE DETECTED // WHOLE FACE REQUIRED
                        </div>
                        <div className="text-[11px] text-amber-100 font-medium mt-0.5">
                          {fullFaceValidation.statusMessage}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5 text-[9px] font-mono">
                          <span className={`px-1.5 py-0.5 rounded border ${fullFaceValidation.zones.forehead ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300'}`}>
                            FOREHEAD: {fullFaceValidation.zones.forehead ? '✓' : '✗'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${fullFaceValidation.zones.eyes ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300'}`}>
                            EYES: {fullFaceValidation.zones.eyes ? '✓' : '✗'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${fullFaceValidation.zones.nose ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300'}`}>
                            NOSE: {fullFaceValidation.zones.nose ? '✓' : '✗'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${fullFaceValidation.zones.mouth ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300'}`}>
                            MOUTH: {fullFaceValidation.zones.mouth ? '✓' : '✗'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${fullFaceValidation.zones.chin ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300'}`}>
                            CHIN/JAW: {fullFaceValidation.zones.chin ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sci-Fi Laser Sweep */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-laser-sweep pointer-events-none z-10" />

                  {/* Corner Brackets */}
                  <span className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
                  <span className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
                  <span className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
                  <span className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

                  {/* HUD Detection Status */}
                  <div className="absolute top-4 left-4 z-20">
                    <span
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs backdrop-blur border ${
                        faceCount === 1 && fullFaceValidation?.isValidFullFace
                          ? 'bg-slate-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                          : faceCount === 1
                          ? 'bg-slate-950/90 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : faceCount > 1
                          ? 'bg-slate-950/90 border-rose-500 text-rose-300'
                          : 'bg-slate-950/90 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          faceCount === 1 && fullFaceValidation?.isValidFullFace
                            ? 'bg-emerald-400 animate-ping'
                            : faceCount === 1
                            ? 'bg-amber-400 animate-pulse'
                            : faceCount > 1
                            ? 'bg-rose-400'
                            : 'bg-slate-500'
                        }`}
                      />
                      <span>
                        {faceCount === 1 && fullFaceValidation?.isValidFullFace
                          ? `FULL FACE LOCKED (100%) // READY FOR ${voterName.toUpperCase()}`
                          : faceCount === 1
                          ? `PARTIAL FACE (${fullFaceValidation?.completeness || 40}%) // CHIN/MOUTH MISSING`
                          : faceCount > 1
                          ? `MULTIPLE SIGNATURES (${faceCount}) // POSITION ONLY ${voterName.toUpperCase()}`
                          : `AWAITING SUBJECT // POSITION ${voterName.toUpperCase()} IN RETICLE`}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* CONTROLS & ENROLL ACTION (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col space-y-4">
                <div className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden ${
                  isLight ? 'bg-white border-slate-300' : 'bg-slate-900/90 border-cyan-950'
                }`}>
                  <span className={`absolute top-1 right-1 w-2 h-2 ${isLight ? 'bg-cyan-600' : 'bg-cyan-400'}`} />

                  <h2 className={`text-sm font-bold tracking-wider uppercase mb-3 flex items-center space-x-2 font-display ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    <Scan className={`w-4 h-4 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
                    <span>OPTICAL RETICLE CAPTURE</span>
                  </h2>

                  <div className={`p-4 rounded-xl border text-xs space-y-2 mb-5 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className={faceCount === 1 ? (isLight ? 'text-emerald-600 font-bold' : 'text-emerald-400') : (isLight ? 'text-slate-400' : 'text-slate-600')}>
                        {faceCount === 1 ? '✓' : '○'}
                      </span>
                      <span>Center {voterName} in optical reticle</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={isLight ? 'text-emerald-600 font-bold' : 'text-emerald-400'}>✓</span>
                      <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>Legal identity confirmed: {voterName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={isLight ? 'text-cyan-700 font-bold' : 'text-cyan-400'}>&bull;</span>
                      <span>Live 128-D facial embedding synthesized on capture</span>
                    </div>
                  </div>

                  {/* Duplicate Conflict Resolution Panel */}
                  {duplicateConflict && (
                    <div className="p-4 rounded-xl bg-amber-950/90 border-2 border-amber-500 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.3)] space-y-3 mb-4">
                      <div className="flex items-start space-x-2.5">
                        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                            Biometric Conflict Warning
                          </div>
                          <p className="text-xs text-amber-200/90 leading-relaxed">
                            Captured face is{' '}
                            <span className="font-bold text-white underline">
                              {(duplicateConflict.similarity * 100).toFixed(1)}% similar
                            </span>{' '}
                            to registered voter{' '}
                            <span className="font-bold text-amber-300">
                              "{duplicateConflict.existingVoter.name}"
                            </span>{' '}
                            (ID #{duplicateConflict.existingVoter.id}).
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] text-amber-200/80 leading-relaxed pt-1">
                        Duplicate registration is blocked and cannot be overridden here. If the
                        existing record is genuinely wrong, delete it from the registered voters
                        list first, then enroll again.
                      </p>

                      <div className="pt-2 flex flex-col gap-2">

                        <button
                          type="button"
                          onClick={() => {
                            setDuplicateConflict(null);
                            setErrorMessage(null);
                          }}
                          className="w-full py-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-200 text-[11px] transition text-center cursor-pointer"
                        >
                          Dismiss &amp; Re-align Face
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Standard Error Notification */}
                  {errorMessage && !duplicateConflict && (
                    <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-start space-x-2 mb-4">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* SCAN AND ENROLL BUTTON */}
                  <button
                    id="capture-and-enroll-btn"
                    onClick={handleCaptureAndEnroll}
                    disabled={isCapturing || faceCount !== 1 || !fullFaceValidation?.isValidFullFace}
                    className={`w-full py-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl transition-all ${
                      isCapturing
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-700 cursor-not-allowed'
                        : faceCount !== 1
                        ? isLight
                          ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
                          : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                        : !fullFaceValidation?.isValidFullFace
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-600 cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white border border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-[1.01] cursor-pointer'
                    }`}
                  >
                    {isCapturing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>PROCESSING LIVE BIOMETRICS...</span>
                      </>
                    ) : faceCount !== 1 ? (
                      <>
                        <Scan className="w-5 h-5 text-slate-500" />
                        <span>AWAITING FACE IN RETICLE</span>
                      </>
                    ) : !fullFaceValidation?.isValidFullFace ? (
                      <>
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span>POSITION FULL FACE (CHIN/MOUTH MISSING)</span>
                      </>
                    ) : (
                      <>
                        <Scan className="w-5 h-5 text-cyan-300" />
                        <span>SCAN &amp; ENROLL FULL FACE</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBackToName}
                    className={`w-full mt-3 py-2.5 rounded-xl border font-mono text-xs text-center transition cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    &larr; CANCEL / CHANGE DETAILS
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================ */
            /* UPLOAD CITIZEN PHOTO / FILE MODE                                 */
            /* ================================================================ */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* UPLOAD & PREVIEW AREA (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                <div className={`p-6 rounded-2xl border-2 shadow-xl ${
                  isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-indigo-900/60'
                }`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center space-x-2 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>CITIZEN PORTRAIT IMAGE SOURCE (تصویر منتخب کریں)</span>
                  </h3>

                  {/* Drag & Drop Upload Zone */}
                  <label className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group ${
                    isLight
                      ? 'border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/80'
                      : 'border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/40'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="sr-only"
                    />

                    <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-3 transition group-hover:scale-110 ${
                      isLight
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-600'
                        : 'bg-indigo-950 border-indigo-500/50 text-indigo-400'
                    }`}>
                      <ImageIcon className="w-8 h-8" />
                    </div>

                    <div className="text-sm font-bold text-indigo-500 mb-1">
                      CLICK TO BROWSE CITIZEN PHOTO OR DRAG &amp; DROP
                    </div>
                    <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Supports JPG, PNG, WEBP, Passport &amp; CNIC Photos (Min. 200x200px)
                    </div>
                  </label>

                  {/* Fast Preset Portraits */}
                  <div className="mt-5">
                    <div className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 flex items-center justify-between ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      <span>OR CHOOSE TEST CITIZEN PORTRAIT PRESETS:</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                      {SAMPLE_CNIC_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (preset.photo) handleSelectPresetPhoto(preset.photo);
                          }}
                          className={`group relative rounded-xl overflow-hidden border p-1 text-center transition cursor-pointer ${
                            uploadedImagePreview === preset.photo
                              ? 'border-indigo-500 ring-2 ring-indigo-400 bg-indigo-950/30'
                              : isLight
                              ? 'border-slate-300 hover:border-indigo-400 bg-slate-50'
                              : 'border-slate-800 hover:border-indigo-500 bg-slate-950'
                          }`}
                        >
                          <img
                            src={preset.photo}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition"
                          />
                          <div className={`text-[10px] font-bold truncate mt-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                            {preset.name.split(' ')[0]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* UPLOADED PHOTO PREVIEW & BIOMETRIC CONFIRMATION (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                <div className={`p-6 rounded-2xl border-2 shadow-xl ${
                  isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-indigo-900/60'
                }`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center space-x-2 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span>BIOMETRIC EXTRACTION PREVIEW</span>
                  </h3>

                  {uploadedImagePreview ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] bg-slate-950">
                        <img
                          src={uploadedImagePreview}
                          alt="Citizen Biometric Portrait"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {isProcessingUploadedImage && (
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-3">
                            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                            <span className="text-[11px] font-mono text-indigo-300 font-bold uppercase">
                              EXTRACTING 128-D VECTOR...
                            </span>
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/90 border border-indigo-400 text-[10px] font-mono text-indigo-300">
                          {uploadedDescriptor ? '128-D READY' : 'PROCESSING'}
                        </span>
                      </div>

                      <div className={`w-full p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        isLight ? 'bg-indigo-50/60 border-indigo-200 text-slate-800' : 'bg-indigo-950/40 border-indigo-800/60 text-indigo-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">CITIZEN:</span>
                          <span className="font-mono font-bold text-indigo-500">{voterName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">CNIC:</span>
                          <span className="font-mono">{voterCnic || 'Auto-generated'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">VECTOR STATUS:</span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {uploadedDescriptor ? '128-DIMENSIONS COMPILED ✓' : 'PROCESSING...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-8 rounded-xl border border-dashed flex flex-col items-center justify-center text-center text-xs ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <ImageIcon className="w-10 h-10 text-slate-500 mb-2" />
                      <span>No photograph uploaded yet. Select an image or preset above to synthesize biometric vector.</span>
                    </div>
                  )}

                  {/* Duplicate Conflict Resolution Panel (Upload Mode) */}
                  {duplicateConflict && (
                    <div className="mt-4 p-4 rounded-xl bg-amber-950/90 border-2 border-amber-500 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.3)] space-y-3">
                      <div className="flex items-start space-x-2.5">
                        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                            Biometric Conflict Warning
                          </div>
                          <p className="text-xs text-amber-200/90 leading-relaxed">
                            Uploaded photo is{' '}
                            <span className="font-bold text-white underline">
                              {(duplicateConflict.similarity * 100).toFixed(1)}% similar
                            </span>{' '}
                            to registered voter{' '}
                            <span className="font-bold text-amber-300">
                              "{duplicateConflict.existingVoter.name}"
                            </span>{' '}
                            (ID #{duplicateConflict.existingVoter.id}).
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] text-amber-200/80 leading-relaxed pt-1">
                        Duplicate registration is blocked and cannot be overridden here. If the
                        existing record is genuinely wrong, delete it from the registered voters
                        list first, then enroll again.
                      </p>
                    </div>
                  )}

                  {/* Standard Error Notification */}
                  {errorMessage && !duplicateConflict && (
                    <div className="mt-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* ENROLL WITH PHOTO BUTTON */}
                  <button
                    type="button"
                    onClick={handleEnrollWithUploadedPhoto}
                    disabled={isCapturing || !uploadedDescriptor || isProcessingUploadedImage}
                    className={`w-full mt-4 py-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl transition-all ${
                      isCapturing || !uploadedDescriptor || isProcessingUploadedImage
                        ? isLight
                          ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                          : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white border border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-[1.01] cursor-pointer'
                    }`}
                  >
                    {isCapturing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>REGISTERING CITIZEN IN NADRA DATABASE...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>ENROLL CITIZEN WITH PHOTO (مکمل رجسٹریشن)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBackToName}
                    className={`w-full mt-3 py-2.5 rounded-xl border font-mono text-xs text-center transition cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    &larr; CANCEL / CHANGE DETAILS
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enrolled Voters Quick Management Modal */}
      {isVotersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-2xl border-2 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
            isLight
              ? 'bg-white border-slate-300'
              : 'bg-slate-900 border-cyan-500/80 shadow-[0_0_40px_rgba(34,211,238,0.25)]'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-cyan-950'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                  isLight ? 'bg-cyan-50 border-cyan-400 text-cyan-700' : 'bg-cyan-950 border-cyan-400 text-cyan-300'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    ENROLLED VOTERS REGISTRY
                  </h3>
                  <p className={`text-[11px] ${isLight ? 'text-cyan-700 font-medium' : 'text-cyan-400'}`}>
                    {registeredVoters.length} registered {registeredVoters.length === 1 ? 'subject' : 'subjects'} currently in biometric ledger
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsVotersModalOpen(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                  isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Voter List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              {registeredVoters.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Zero voters enrolled in biometric ledger.</p>
                  <p className="text-[10px] mt-1 text-slate-600">Register new voters using this station.</p>
                </div>
              ) : (
                registeredVoters.map((voter) => (
                  <div
                    key={voter.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        : 'bg-slate-950 border-slate-800 hover:border-cyan-900/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {voter.photo ? (
                        <img
                          src={voter.photo}
                          alt={voter.name}
                          className="w-10 h-10 rounded-lg object-cover border border-cyan-800 shrink-0"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${
                          isLight ? 'bg-cyan-50 border-cyan-400 text-cyan-800' : 'bg-cyan-950 border-cyan-800 text-cyan-400'
                        }`}>
                          {voter.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          <span>{voter.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                            isLight ? 'bg-slate-200 text-cyan-900 border-slate-300' : 'bg-slate-900 text-cyan-400 border-slate-800'
                          }`}>
                            ID #{voter.id}
                          </span>
                        </div>
                        <div className={`text-[10px] flex items-center space-x-2 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              voter.has_voted
                                ? isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-950 text-amber-300 border border-amber-800'
                                : isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {voter.has_voted ? 'BALLOT CAST' : 'ELIGIBLE'}
                          </span>
                          <span>&bull;</span>
                          <span>{new Date(voter.enrolled_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRegisteredVoter(voter.id, voter.name)}
                      disabled={isDeletingVoter === voter.id}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 hover:border-rose-500 text-rose-300 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shrink-0"
                      title="Delete voter biometric record"
                    >
                      {isDeletingVoter === voter.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>DELETE</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-end ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-cyan-950'
            }`}>
              <button
                type="button"
                onClick={() => setIsVotersModalOpen(false)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                    : 'bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-300'
                }`}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 128-D Embedding inspector modal */}
      <VectorMatrixVisualizer
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        embedding={enrolledEmbedding}
        score={0.99}
        threshold={0.6}
        voterName={enrolledVoter?.name}
      />

      {/* In-Browser Optical CNIC Barcode Scanner Modal */}
      <CNICBarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onAutoFill={(parsed: ParsedCNIC) => {
          if (parsed.cnic) setVoterCnic(parsed.cnic);
          if (parsed.name) setVoterName(parsed.name);
          if (parsed.fatherOrHusbandName) setFatherName(parsed.fatherOrHusbandName);
          if (parsed.gender) setGender(parsed.gender);
          if (parsed.dob) setDob(parsed.dob);
          if (parsed.province) setProvince(parsed.province);
          if (parsed.district) setDistrict(parsed.district);
          if (parsed.constituency) setConstituency(parsed.constituency);
          if (parsed.pollingStation) setPollingStation(parsed.pollingStation);
          if (parsed.electoralBlockCode) setElectoralBlockCode(parsed.electoralBlockCode);
          if (parsed.familyTreeNo) setFamilyTreeNo(parsed.familyTreeNo);
          if (parsed.photo) setUploadedPhoto(parsed.photo);
          setNadraVerified(true);
          setErrorMessage(null);
        }}
      />

      {/* Official Voter Registration Card Modal for Printing */}
      <PrintVoterCardModal
        isOpen={isPrintCardModalOpen}
        onClose={() => setIsPrintCardModalOpen(false)}
        voter={
          enrolledVoter
            ? {
                ...enrolledVoter,
                photo: capturedSnapshot || enrolledVoter.photo || uploadedPhoto || undefined,
              }
            : null
        }
      />
    </div>
  );
};
