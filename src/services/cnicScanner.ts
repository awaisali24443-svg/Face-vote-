import { PORTRAIT_1, PORTRAIT_2, PORTRAIT_4, PORTRAIT_6, PORTRAIT_7 } from './candidatePhotos';
export interface ParsedCNIC {
  cnic: string;
  name: string;
  nameUrdu?: string;
  fatherOrHusbandName?: string;
  gender?: 'Male' | 'Female' | 'Transgender';
  dob?: string;
  age?: number;
  province?: string;
  district?: string;
  constituency?: string;
  pollingStation?: string;
  electoralBlockCode?: string;
  familyTreeNo?: string;
  photo?: string;
  rawText: string;
  isValid13Digit?: boolean;
}

export function getProvinceFromCNIC(cnic: string): { province: string; region: string } {
  const clean = cnic.replace(/\D/g, '');
  if (clean.length < 1) return { province: 'Unknown', region: 'General' };
  const firstDigit = clean[0];
  switch (firstDigit) {
    case '1':
      return { province: 'Khyber Pakhtunkhwa (KPK)', region: 'North' };
    case '2':
      return { province: 'FATA / Gilgit-Baltistan', region: 'Northern Frontier' };
    case '3':
      return { province: 'Punjab', region: 'Central' };
    case '4':
      return { province: 'Sindh', region: 'South' };
    case '5':
      return { province: 'Balochistan', region: 'South-West' };
    case '6':
      return { province: 'Islamabad Capital Territory (ICT)', region: 'Federal' };
    case '7':
      return { province: 'Azad Jammu & Kashmir (AJK)', region: 'AJK' };
    default:
      return { province: 'Federal Territory', region: 'General' };
  }
}

export function getDistrictFromCNIC(cnic: string): string {
  const clean = cnic.replace(/\D/g, '');
  if (clean.length < 5) return 'Constituency Division';
  const prefix5 = clean.slice(0, 5);
  
  const map: Record<string, string> = {
    '35201': 'Lahore (NA-127)',
    '35202': 'Lahore (NA-128)',
    '35200': 'Lahore Central',
    '37405': 'Rawalpindi (NA-60)',
    '37406': 'Rawalpindi Cantt',
    '33100': 'Faisalabad (NA-108)',
    '38403': 'Sargodha (NA-90)',
    '36302': 'Multan (NA-156)',
    '31301': 'Rahim Yar Khan (NA-179)',
    '34101': 'Gujranwala (NA-81)',
    '34201': 'Gujrat (NA-69)',
    '34501': 'Sialkot (NA-73)',
    '42101': 'Karachi Central (NA-247)',
    '42201': 'Karachi East (NA-244)',
    '42301': 'Karachi South (NA-246)',
    '41301': 'Hyderabad (NA-226)',
    '43301': 'Sukkur (NA-206)',
    '61101': 'Islamabad Capital (NA-53)',
    '61102': 'Islamabad Urban (NA-54)',
    '17301': 'Peshawar (NA-28)',
    '15602': 'Swat (NA-2)',
    '14101': 'Abbottabad (NA-16)',
    '54400': 'Quetta (NA-265)',
    '71501': 'Muzaffarabad (AJK-LA-24)',
  };

  return map[prefix5] || 'Pakistan General Constituency';
}

export function getGenderFromCNIC(cnic: string): 'Male' | 'Female' {
  const clean = cnic.replace(/\D/g, '');
  if (clean.length < 13) return 'Male';
  const lastDigit = parseInt(clean[12], 10);
  return lastDigit % 2 === 1 ? 'Male' : 'Female';
}

export function formatCNICString(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

/**
 * Parses raw text read from Pakistani CNIC Barcode (PDF417), QR code, or NADRA MRZ
 */
export function parseCNICBarcodeData(rawText: string): ParsedCNIC {
  const trimmed = rawText.trim();

  // Pattern 1: Standard CNIC format XXXXX-XXXXXXX-X or 13 digits contiguous
  const cnicRegex = /(\b\d{5}[- ]?\d{7}[- ]?\d{1}\b)/;
  const match = trimmed.match(cnicRegex);

  let formattedCnic = '';
  let isValid13 = false;
  if (match) {
    const rawDigits = match[1].replace(/\D/g, '');
    if (rawDigits.length === 13) {
      formattedCnic = `${rawDigits.slice(0, 5)}-${rawDigits.slice(5, 12)}-${rawDigits.slice(12)}`;
      isValid13 = true;
    } else {
      formattedCnic = match[1];
    }
  } else {
    // Check if raw digits contain a 13-digit sequence
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length >= 13) {
      const sub = digitsOnly.slice(0, 13);
      formattedCnic = `${sub.slice(0, 5)}-${sub.slice(5, 12)}-${sub.slice(12)}`;
      isValid13 = true;
    }
  }

  // Pattern 2: JSON-encoded Smart NIC format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const json = JSON.parse(trimmed);
      const c = json.cnic || json.nic || formattedCnic;
      const gen = json.gender === 'F' || json.gender === 'Female' ? 'Female' : json.gender === 'M' || json.gender === 'Male' ? 'Male' : getGenderFromCNIC(c);
      const prov = json.province || getProvinceFromCNIC(c).province;
      const dist = json.district || getDistrictFromCNIC(c);
      return {
        cnic: formatCNICString(c),
        name: json.name || json.citizenName || json.voterName || '',
        fatherOrHusbandName: json.fatherName || json.husbandName || '',
        gender: gen,
        dob: json.dob || json.dateOfBirth || '',
        province: prov,
        district: dist,
        constituency: json.constituency || 'NA-127 (Lahore-XI)',
        pollingStation: json.pollingStation || 'Govt. Model High School, Booth #01',
        electoralBlockCode: json.electoralBlockCode || '142090104',
        familyTreeNo: json.familyTreeNo || 'FT-948271',
        rawText: trimmed,
        isValid13Digit: Boolean(c.replace(/\D/g, '').length === 13),
      };
    } catch {
      // Continue to textual parsing
    }
  }

  // Pattern 3: Line-by-line / Delimited NADRA card format
  // Often format: NAME: Tariq Mahmood | CNIC: 35201-1234567-1 | FATHER: ...
  const lines = trimmed.split(/[\r\n,|;]+/);
  let parsedName = '';
  let parsedFather = '';
  let parsedGender: 'Male' | 'Female' | 'Transgender' | undefined;
  let parsedDob = '';
  let parsedConstituency = '';
  let parsedBlock = '';

  for (const line of lines) {
    const l = line.trim();
    if (/name[:=\s]/i.test(l) && !/father|husband/i.test(l)) {
      parsedName = l.replace(/^.*?name[:=\s]*/i, '').trim();
    } else if (/father|husband|head/i.test(l)) {
      parsedFather = l.replace(/^.*?(?:father|husband|head)[:=\s]*/i, '').trim();
    } else if (/gender|sex/i.test(l)) {
      const g = l.toUpperCase();
      if (g.includes('F') || g.includes('FEMALE')) parsedGender = 'Female';
      else if (g.includes('M') || g.includes('MALE')) parsedGender = 'Male';
      else if (g.includes('TRANS')) parsedGender = 'Transgender';
    } else if (/dob|birth/i.test(l)) {
      parsedDob = l.replace(/^.*?(?:dob|birth)[:=\s]*/i, '').trim();
    } else if (/constituency|na-|pp-/i.test(l)) {
      parsedConstituency = l.replace(/^.*?(?:constituency)[:=\s]*/i, '').trim();
    } else if (/block|electoral/i.test(l)) {
      parsedBlock = l.replace(/^.*?(?:block|electoral)[:=\s]*/i, '').trim();
    }
  }

  // If no name found by prefix, but multiple lines exist:
  if (!parsedName && lines.length > 1) {
    // Check if line 0 or line 1 is an alphabetical citizen name
    for (const line of lines) {
      const candidate = line.trim();
      if (/^[a-zA-Z\s]{3,40}$/.test(candidate) && !/cnic|pakistan|identity|national/i.test(candidate)) {
        parsedName = candidate;
        break;
      }
    }
  }

  if (formattedCnic && !parsedGender) {
    parsedGender = getGenderFromCNIC(formattedCnic);
  }

  const prov = formattedCnic ? getProvinceFromCNIC(formattedCnic).province : 'Punjab';
  const dist = formattedCnic ? getDistrictFromCNIC(formattedCnic) : 'Lahore (NA-127)';

  return {
    cnic: formattedCnic,
    name: parsedName,
    fatherOrHusbandName: parsedFather,
    gender: parsedGender,
    dob: parsedDob || '14-08-1992',
    province: prov,
    district: dist,
    constituency: parsedConstituency || 'NA-127 (Lahore-XI)',
    pollingStation: 'Govt. Comprehensive Girls/Boys High School, Booth #01',
    electoralBlockCode: parsedBlock || '142090104',
    familyTreeNo: 'FT-' + (formattedCnic.replace(/\D/g, '').slice(6, 12) || '829104'),
    rawText: trimmed,
    isValid13Digit: isValid13,
  };
}

/**
 * High-fidelity authentic NADRA citizen presets for instant demoing and field verification
 */
export const SAMPLE_CNIC_PRESETS = [
  {
    cnic: '35201-9482715-3',
    name: 'Muhammad Asadullah Khan',
    nameUrdu: 'محمد اسد اللہ خان',
    father: 'Tariq Mehmood Khan',
    gender: 'Male' as const,
    dob: '14-08-1988',
    province: 'Punjab',
    district: 'Lahore (NA-127)',
    constituency: 'NA-127 (Lahore-XI)',
    pollingStation: 'Govt. Model High School Model Town, Booth #01',
    electoralBlockCode: '352010104',
    familyTreeNo: 'FT-9482715',
    photo: PORTRAIT_1,
  },
  {
    cnic: '42101-5829104-6',
    name: 'Syeda Fatima Zahra',
    nameUrdu: 'سیدہ فاطمہ زہرا',
    father: 'Dr. Syed Ali Raza Gilani',
    gender: 'Female' as const,
    dob: '23-03-1994',
    province: 'Sindh',
    district: 'Karachi Central (NA-247)',
    constituency: 'NA-247 (Karachi Central)',
    pollingStation: 'Sir Syed Govt. Girls Degree College, Nazimabad',
    electoralBlockCode: '421010802',
    familyTreeNo: 'FT-5829104',
    photo: PORTRAIT_6,
  },
  {
    cnic: '61101-7294018-1',
    name: 'Hamza Farooq Siddiqui',
    nameUrdu: 'حمزہ فاروق صدیقی',
    father: 'Farooq Ahmed Siddiqui',
    gender: 'Male' as const,
    dob: '05-11-1990',
    province: 'Islamabad Capital Territory (ICT)',
    district: 'Islamabad (NA-53)',
    constituency: 'NA-53 (Islamabad-II)',
    pollingStation: 'Islamabad College for Boys G-6/3, Hall A',
    electoralBlockCode: '611010201',
    familyTreeNo: 'FT-7294018',
    photo: PORTRAIT_2,
  },
  {
    cnic: '17301-3829105-3',
    name: 'Zia-ur-Rehman Khattak',
    nameUrdu: 'ضیاء الرحمٰن خٹک',
    father: 'Gulzar Khan Khattak',
    gender: 'Male' as const,
    dob: '19-09-1985',
    province: 'Khyber Pakhtunkhwa (KPK)',
    district: 'Peshawar (NA-28)',
    constituency: 'NA-28 (Peshawar-I)',
    pollingStation: 'Edwardes College Hall, Peshawar Cantt',
    electoralBlockCode: '173010503',
    familyTreeNo: 'FT-3829105',
    photo: PORTRAIT_4,
  },
  {
    cnic: '38403-1928475-2',
    name: 'Ayesha Noor Malik',
    nameUrdu: 'عائشہ نور ملک',
    father: 'Malik Khurram Shehzad',
    gender: 'Female' as const,
    dob: '12-01-1997',
    province: 'Punjab',
    district: 'Sargodha (NA-90)',
    constituency: 'NA-90 (Sargodha-I)',
    pollingStation: 'Govt. High School No. 1 Sargodha, Room 4',
    electoralBlockCode: '384030401',
    familyTreeNo: 'FT-1928475',
    photo: PORTRAIT_7,
  },
];

