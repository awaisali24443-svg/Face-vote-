import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ur';

export interface Translations {
  // Brand & Header
  brandTitle: string;
  brandTag: string;
  pollingStation: string;
  votingKiosk: string;
  presidingDesk: string;
  enrollCitizen: string;
  lightMode: string;
  darkMode: string;
  neuralReady: string;

  // Kiosk Landing
  kioskTitle: string;
  kioskSubtitle: string;
  kioskInstructions: string;
  startVerification: string;
  demoSimulator: string;
  uploadPhoto: string;
  cameraStandby: string;
  cameraNotice: string;
  grantCamera: string;
  orSelectDemo: string;

  // Liveness & Anti-Spoofing
  vitalityIndex: string;
  analyzingLiveness: string;
  staticPhotoAlert: string;
  staticPhotoDesc: string;
  movementApproved: string;
  movementApprovedDesc: string;
  alignFace: string;
  fullFaceRequired: string;
  multipleFacesAlert: string;
  microMotionDetected: string;

  // Verification & Outcomes
  verifyingBiometrics: string;
  duplicatePrevented: string;
  duplicateDesc: string;
  unregisteredVoter: string;
  unregisteredDesc: string;
  identityVerified: string;
  transferringBallot: string;

  // Ballot Paper
  ballotTitle: string;
  ballotSubtitle: string;
  secretNotice: string;
  selectCandidatePrompt: string;
  candidateChoice: string;
  party: string;
  symbol: string;
  castVoteBtn: string;
  castingVote: string;
  cancelBallot: string;
  returnToKiosk: string;

  // Vote Success
  voteRecordedTitle: string;
  voteRecordedSubtitle: string;
  ballotBoxId: string;
  nextVoterNotice: string;

  // Admin / Presiding Desk
  adminLockTitle: string;
  adminLockDesc: string;
  enterOfficerPin: string;
  unlockDesk: string;
  invalidPin: string;
  voterRoll: string;
  candidatesManagement: string;
  electionTallies: string;
  biometricEnrollment: string;

  // Form-47 & Results
  form47Title: string;
  form47Subtitle: string;
  printOfficialForm47: string;
  printVoterSlip: string;
  totalRegisteredVoters: string;
  totalVotesPolled: string;
  turnoutRatio: string;
  validVotes: string;
  rejectedVotes: string;
  winnerDeclared: string;
  marginOfVictory: string;

  // Enrollment
  fullName: string;
  cnicNumber: string;
  districtLabel: string;
  pollingStationLabel: string;
  captureModeCamera: string;
  captureModeUpload: string;
  capturePhoto: string;
  uploadVoterPhoto: string;
  enrollVoterSubmit: string;
  voterEnrolledSuccess: string;
}

const translationsData: Record<Language, Translations> = {
  en: {
    brandTitle: 'ELECTION COMMISSION OF PAKISTAN',
    brandTag: 'NA-127',
    pollingStation: 'CONSTITUENCY NA-127 (LAHORE-XI) • POLLING STATION #42',
    votingKiosk: 'VOTING KIOSK',
    presidingDesk: 'PRESIDING DESK',
    enrollCitizen: 'ENROLL CITIZEN',
    lightMode: 'LIGHT',
    darkMode: 'DARK',
    neuralReady: 'NEURAL ENGINE READY',

    kioskTitle: 'NATIONAL BIOMETRIC VOTING KIOSK',
    kioskSubtitle: 'Anti-Spoofing & Duplicate-Free Sovereign Voting Station',
    kioskInstructions: 'Position your face in front of the optical sensor. Natural micro-movement will verify live human presence and unlock your secret digital ballot paper.',
    startVerification: 'START VOTER VERIFICATION',
    demoSimulator: 'OFFICIAL VOTER SIMULATOR',
    uploadPhoto: 'UPLOAD PHOTO / CNIC',
    cameraStandby: 'CAMERA SENSOR STANDBY',
    cameraNotice: 'Camera access is required for real-time biometric scanning.',
    grantCamera: 'ALLOW CAMERA ACCESS',
    orSelectDemo: 'OR SELECT PRE-REGISTERED CITIZEN FOR DEMO TEST:',

    vitalityIndex: 'LIVENESS & MOTION INDEX',
    analyzingLiveness: 'SCANNING FOR NATURAL FACIAL MICRO-MOVEMENT...',
    staticPhotoAlert: 'STATIC PHOTO / SCREEN DETECTED',
    staticPhotoDesc: 'Live human movement required. Please blink, move lips, or tilt head slightly to confirm vitality.',
    movementApproved: 'LIVE HUMAN CONFIRMED',
    movementApprovedDesc: 'Natural facial motion validated. Processing 128-D biometric identity match...',
    alignFace: 'ALIGN FULL FACE INSIDE RETICLE',
    fullFaceRequired: 'Entire face must be visible (eyes, nose, mouth, and chin).',
    multipleFacesAlert: 'MULTIPLE FACES DETECTED — ONLY ONE VOTER ALLOWED AT KIOSK',
    microMotionDetected: 'MOTION DETECTED',

    verifyingBiometrics: 'MATCHING BIOMETRIC VECTOR WITH ELECTORAL ROLL...',
    duplicatePrevented: 'DUPLICATE BALLOT PREVENTED',
    duplicateDesc: 'This citizen has already cast their ballot. Second voting attempt is blocked.',
    unregisteredVoter: 'BIOMETRIC RECORD NOT FOUND',
    unregisteredDesc: 'Voter is not registered in this constituency. Visit the Presiding Desk for enrollment.',
    identityVerified: 'CITIZEN IDENTITY CONFIRMED',
    transferringBallot: 'Opening Official Secret Ballot Paper...',

    ballotTitle: 'OFFICIAL SECRET BALLOT PAPER',
    ballotSubtitle: 'National Assembly Constituency NA-127 (Lahore-XI)',
    secretNotice: 'Constitutional Ballot Secrecy Enforced: No photo or vote choice is ever linked to your identity.',
    selectCandidatePrompt: 'Tap on your chosen candidate to select, then confirm with the official stamp button below.',
    candidateChoice: 'CANDIDATE',
    party: 'Party',
    symbol: 'Symbol',
    castVoteBtn: 'STAMP & CAST OFFICIAL BALLOT',
    castingVote: 'RECORDING BALLOT ENCRYPTED...',
    cancelBallot: 'Cancel & Return to Kiosk',
    returnToKiosk: 'Return to Public Kiosk',

    voteRecordedTitle: 'VOTE SUCCESSFULLY RECORDED IN BALLOT BOX',
    voteRecordedSubtitle: 'Thank you for exercising your constitutional right to vote.',
    ballotBoxId: 'Official Digital Ballot Token Generated',
    nextVoterNotice: 'Kiosk will automatically reset for the next voter...',

    adminLockTitle: 'PRESIDING OFFICER SECURITY LOCK',
    adminLockDesc: 'Enter authorized Returning Officer PIN to manage voter rolls, candidates, and live tallies.',
    enterOfficerPin: 'Enter Officer PIN',
    unlockDesk: 'Verify Officer PIN & Unlock',
    invalidPin: 'ACCESS DENIED: Invalid Official PIN.',
    voterRoll: 'Voter Roll & Registry',
    candidatesManagement: 'Ballot & Candidates',
    electionTallies: 'Election Tallies & Ledger',
    biometricEnrollment: 'Biometric Enrollment',

    form47Title: 'FORM-47 PROVISIONAL CONSOLIDATED STATEMENT OF RESULTS',
    form47Subtitle: 'Election Commission of Pakistan • Constituency NA-127 (Lahore-XI)',
    printOfficialForm47: 'PRINT OFFICIAL FORM-47 RESULT SHEET',
    printVoterSlip: 'PRINT VOTER REGISTRATION SLIP',
    totalRegisteredVoters: 'Total Registered Voters',
    totalVotesPolled: 'Total Votes Polled',
    turnoutRatio: 'Voter Turnout Ratio',
    validVotes: 'Valid Ballots Polled',
    rejectedVotes: 'Rejected / Spoiled Ballots',
    winnerDeclared: 'LEADING CANDIDATE / WINNER',
    marginOfVictory: 'Margin of Lead',

    fullName: 'Full Legal Name (as per CNIC)',
    cnicNumber: '13-Digit CNIC Number',
    districtLabel: 'Constituency & District',
    pollingStationLabel: 'Assigned Polling Station',
    captureModeCamera: 'Live Optical Camera',
    captureModeUpload: 'Upload Digital Portrait',
    capturePhoto: 'Capture Biometric Photo',
    uploadVoterPhoto: 'Choose Photo / Image File',
    enrollVoterSubmit: 'ENROLL & ISSUE VOTER CARD',
    voterEnrolledSuccess: 'Voter Registered & Authenticated Successfully!',
  },
  ur: {
    brandTitle: 'الیکشن کمیشن آف پاکستان',
    brandTag: 'این اے 127',
    pollingStation: 'حلقہ این اے 127 (لاہور-11) • بائیو میٹرک پولنگ اسٹیشن نمبر 42',
    votingKiosk: 'ووٹنگ کیوسک',
    presidingDesk: 'پریذائیڈنگ ڈیسک',
    enrollCitizen: 'ووٹر کا اندراج',
    lightMode: 'دن کا موڈ',
    darkMode: 'رات کا موڈ',
    neuralReady: 'نیورل انجن فعال ہے',

    kioskTitle: 'قومی بائیو میٹرک تصدیقی ووٹنگ کیوسک',
    kioskSubtitle: 'جعلسازی سے پاک اور ڈپلیکیٹ ووٹ کی روک تھام کا خودکار نظام',
    kioskInstructions: 'اپنا چہرہ کیمرے کے سامنے رکھیں۔ چہرے کی قدرتی معمولی حرکت سے زندہ انسان کی تصدیق کی جائے گی اور آپ کو سرکاری خفیہ بیلٹ پیپر جاری ہوگا۔',
    startVerification: 'بائیو میٹرک تصدیق اور ووٹ کا آغاز',
    demoSimulator: 'ووٹر سمولیٹر ٹیسٹ',
    uploadPhoto: 'تصویر یا شناختی کارڈ منتخب کریں',
    cameraStandby: 'کیمرہ سنسر تیار ہے',
    cameraNotice: 'براہ راست تصدیق کے لیے کیمرے کی اجازت درکار ہے۔',
    grantCamera: 'کیمرے کی اجازت دیں',
    orSelectDemo: 'یا آزمائشی ٹیسٹ کے لیے رجسٹرڈ شہری منتخب کریں:',

    vitalityIndex: 'انسانی حرکت اور لائیو ہونے کا اشاریہ',
    analyzingLiveness: 'چہرے کی قدرتی معمولی حرکت کا جائزہ لیا جا رہا ہے...',
    staticPhotoAlert: 'ساکت تصویر یا موبائل سکرین کا شبہ',
    staticPhotoDesc: 'زندہ انسان کی تصدیق درکار ہے۔ براہ کرم معمولی پلک جھپکائیں، چہرہ ہلائیں یا ہونٹ ہلائیں۔',
    movementApproved: 'زندہ انسان کی تصدیق ہو گئی',
    movementApprovedDesc: 'چہرے کی قدرتی حرکت تصدیق شدہ۔ 128 ڈائمینشنل بائیو میٹرک ریکارڈ کی جانچ جاری ہے...',
    alignFace: 'چہرہ دائرے کے اندر سیدھا رکھیں',
    fullFaceRequired: 'پورا چہرہ (آنکھیں، ناک، منہ اور ٹھوڑی) کیمرے میں واضح ہونا ضروری ہے۔',
    multipleFacesAlert: 'ایک سے زائد چہرے نظر آ رہے ہیں — کیوسک پر صرف ایک ووٹر کی اجازت ہے',
    microMotionDetected: 'حرکت کی تصدیق ہو گئی',

    verifyingBiometrics: 'ووٹر لسٹ سے بائیو میٹرک کا موازنہ جاری ہے...',
    duplicatePrevented: 'ڈپلیکیٹ ووٹ روک دیا گیا!',
    duplicateDesc: 'یہ شہری اپنا ووٹ پہلے ہی ڈال چکے ہیں۔ دوسری بار ووٹ ڈالنے کی کوشش بلاک کر دی گئی ہے۔',
    unregisteredVoter: 'انتخابی فہرست میں ریکارڈ نہیں ملا',
    unregisteredDesc: 'یہ شہری اس پولنگ اسٹیشن پر رجسٹرڈ نہیں ہے۔ اندراج کے لیے پریذائیڈنگ ڈیسک سے رجوع کریں۔',
    identityVerified: 'شہری کی شناخت تصدیق شدہ',
    transferringBallot: 'خفیہ بیلٹ پیپر کھولا جا رہا ہے...',

    ballotTitle: 'سرکاری خفیہ بیلٹ پیپر',
    ballotSubtitle: 'قومی اسمبلی حلقہ این اے 127 (لاہور-11)',
    secretNotice: 'خفیہ رائے شماری کی آئینی ضمانت: آپ کا ووٹ مکمل طور پر خفیہ اور محفوظ ہے۔',
    selectCandidatePrompt: 'اپنے پسندیدہ امیدوار کا انتخاب کریں اور نیچے سرکاری مہر کے بٹن پر کلک کریں۔',
    candidateChoice: 'امیدوار',
    party: 'جماعت',
    symbol: 'انتخابی نشان',
    castVoteBtn: 'ووٹ پر مہر لگائیں اور درج کریں',
    castingVote: 'ووٹ محفوظ کیا جا رہا ہے...',
    cancelBallot: 'منسوخ کریں اور کیوسک پر واپس جائیں',
    returnToKiosk: 'کیوسک پر واپس جائیں',

    voteRecordedTitle: 'ووٹ کامیابی سے بیلٹ باکس میں محفوظ ہو گیا',
    voteRecordedSubtitle: 'اپنا آئینی اور جمہوری حق استعمال کرنے کا شکریہ۔',
    ballotBoxId: 'ڈیجیٹل ووٹ ٹوکن کامیابی سے تیار ہو گیا',
    nextVoterNotice: 'کیوسک اگلے ووٹر کے لیے خود بخود تیار ہو رہا ہے...',

    adminLockTitle: 'پریذائیڈنگ آفیسر سیکیورٹی لاک',
    adminLockDesc: 'ووٹر لسٹ، امیدواروں اور انتخابی نتائج دیکھنے کے لیے پریذائیڈنگ آفیسر کا پن کوڈ درج کریں۔',
    enterOfficerPin: 'آفیسر پن درج کریں',
    unlockDesk: 'پن کی تصدیق کریں اور انلاک کریں',
    invalidPin: 'رسائی مسترد: غلط پن کوڈ درج کیا گیا۔',
    voterRoll: 'انتخابی ووٹر لسٹ',
    candidatesManagement: 'بیلٹ اور امیدوار',
    electionTallies: 'انتخابی نتائج و لیجر',
    biometricEnrollment: 'بائیو میٹرک اندراج',

    form47Title: 'فارم-47 ابتدائی غیر حتمی انتخابی نتیجہ',
    form47Subtitle: 'الیکشن کمیشن آف پاکستان • قومی اسمبلی حلقہ این اے 127 (لاہور-11)',
    printOfficialForm47: 'سرکاری فارم-47 رزلٹ شیٹ پرنٹ کریں',
    printVoterSlip: 'سرکاری ووٹر تصدیقی پرچہ پرنٹ کریں',
    totalRegisteredVoters: 'کل رجسٹرڈ ووٹرز',
    totalVotesPolled: 'کاسٹ شدہ کل ووٹ',
    turnoutRatio: 'ووٹنگ ٹرن آؤٹ تناسب',
    validVotes: 'درست ووٹ',
    rejectedVotes: 'مسترد شدہ ووٹ',
    winnerDeclared: 'کامیاب / برتری حاصل کرنے والا امیدوار',
    marginOfVictory: 'برتری کا فرق',

    fullName: 'مکمل قانونی نام (شناختی کارڈ کے مطابق)',
    cnicNumber: '13 ہندسوں کا قومی شناختی کارڈ نمبر',
    districtLabel: 'حلقہ و ضلع',
    pollingStationLabel: 'مختص کردہ پولنگ اسٹیشن',
    captureModeCamera: 'براہ راست کیمرہ اسکین',
    captureModeUpload: 'تصویر فائل اپلوڈ',
    capturePhoto: 'چہرے کی تصویر محفوظ کریں',
    uploadVoterPhoto: 'تصویر فائل منتخب کریں',
    enrollVoterSubmit: 'اندراج مکمل کریں اور پرچہ پرنٹ کریں',
    voterEnrolledSuccess: 'شہری کا بائیو میٹرک اندراج اور نادرا تصدیق کامیابی سے مکمل ہو گئی!',
  },
};

interface LanguageContextType {
  language: Language;
  t: Translations;
  isUrdu: boolean;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: translationsData.en,
  isUrdu: false,
  toggleLanguage: () => {},
  setLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('facevote_lang');
    return saved === 'ur' ? 'ur' : 'en';
  });

  const isUrdu = language === 'ur';

  useEffect(() => {
    localStorage.setItem('facevote_lang', language);
    if (language === 'ur') {
      document.documentElement.lang = 'ur';
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        t: translationsData[language],
        isUrdu,
        toggleLanguage,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
