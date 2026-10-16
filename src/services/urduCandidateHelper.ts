/**
 * Bilingual Urdu / English Candidate and Party localization helpers
 * For authentic Election Commission of Pakistan (ECP Form 33 & Form 47) representation.
 */

const CANDIDATE_URDU_MAP: Record<string, string> = {
  'Barrister Muhammad Ali Khan': 'بیرسٹر محمد علی خان',
  'Muhammad Ali Khan': 'بیرسٹر محمد علی خان',
  'Mian Tariq Mehmood Sharif': 'میاں طارق محمود شریف',
  'Tariq Mehmood': 'میاں طارق محمود شریف',
  'Mian Tariq Mehmood': 'میاں طارق محمود شریف',
  'Syeda Fatima Zahra Gilani': 'سیدہ فاطمہ زہرا گیلانی',
  'Syeda Fatima Zahra': 'سیدہ فاطمہ زہرا گیلانی',
  'Fatima Zahra': 'سیدہ فاطمہ زہرا گیلانی',
  'Hafiz Asad Qureshi': 'حافظ اسعد قریشی',
  'Asad Qureshi': 'حافظ اسعد قریشی',
  'Mr. Awais Ali': 'محمد اویس علی',
  'Muhammad Awais Ali': 'محمد اویس علی',
  'Awais Ali': 'محمد اویس علی',
  'Marcus Sterling': 'مارکس سٹرلنگ',
  'Elena Rostova': 'ایلینا روستووا',
  'Dr. Aris Thorne': 'ڈاکٹر عارِض تھورن',
  'Maya Lin': 'مایا لِن',
  'Jordan Vance': 'اردن وینس',
};

const PARTY_URDU_MAP: Record<string, string> = {
  'Pakistan Tehreek-e-Insaf (PTI)': 'پاکستان تحریک انصاف (پی ٹی آئی)',
  'Pakistan Tehreek-e-Insaf': 'پاکستان تحریک انصاف',
  'PTI': 'پاکستان تحریک انصاف (پی ٹی آئی)',
  'Pakistan Muslim League - Nawaz (PML-N)': 'پاکستان مسلم لیگ - نواز (ن لیگ)',
  'Pakistan Muslim League - Nawaz': 'پاکستان مسلم لیگ (ن)',
  'PML-N': 'پاکستان مسلم لیگ (ن)',
  'Pakistan Peoples Party Parliamentarians (PPPP)': 'پاکستان پیپلز پارٹی پارلیمنٹیرینز',
  'Pakistan Peoples Party': 'پاکستان پیپلز پارٹی',
  'PPPP': 'پاکستان پیپلز پارٹی (پی پی پی)',
  'PPP': 'پاکستان پیپلز پارٹی (پی پی پی)',
  'Jamaat-e-Islami (JI)': 'جماعت اسلامی پاکستان',
  'Jamaat-e-Islami': 'جماعت اسلامی',
  'JI': 'جماعت اسلامی',
  'Independent Candidate (آزاد امیدوار)': 'آزاد امیدوار (غیر وابستہ)',
  'Independent Candidate': 'آزاد امیدوار',
  'Independent': 'آزاد امیدوار',
  'Constitutional Reform Coalition': 'آئینی اصلاحاتی اتحاد',
  'Progressive Alliance': 'ترقی پسند اتحاد',
  'Democratic Front': 'جمہوری فرنٹ',
};

const SYMBOL_URDU_MAP: Record<string, string> = {
  'Cricket Bat (بلہ)': 'بلہ (Cricket Bat)',
  'Cricket Bat': 'بلہ (Cricket Bat)',
  'Bat': 'بلہ (Cricket Bat)',
  'Tiger (شیر)': 'شیر (Tiger)',
  'Tiger': 'شیر (Tiger)',
  'Lion': 'شیر (Lion)',
  'Arrow (تیر)': 'تیر (Arrow)',
  'Arrow': 'تیر (Arrow)',
  'Scale of Justice (ترازو)': 'ترازو (Scale of Justice)',
  'Scale of Justice': 'ترازو (Scale of Justice)',
  'Scale': 'ترازو (Scale)',
  'Eagle of Iqbal (شاہین)': 'شاہین (Eagle of Iqbal)',
  'Eagle of Sovereignty': 'شاہین (Eagle)',
  'Eagle': 'شاہین (Eagle)',
  'Lion of Courage': 'شیر (Lion)',
  'Torch of Liberty': 'مشعل (Torch)',
  'Torch': 'مشعل (Torch)',
  'Tree of Resilience': 'درخت (Tree)',
  'Tree': 'درخت (Tree)',
  'Rising Sun of Hope': 'سورج (Sun)',
  'Sun': 'سورج (Sun)',
  'Rocket of Future': 'راکٹ (Rocket)',
  'Rocket': 'راکٹ (Rocket)',
  'Shield of Integrity': 'ڈھال (Shield)',
  'Shield': 'ڈھال (Shield)',
  'Anchor of Stability': 'لنگر (Anchor)',
  'Anchor': 'لنگر (Anchor)',
  'Book of Wisdom': 'کتاب (Book)',
  'Book': 'کتاب (Book)',
  'Sheaf of Wheat': 'گندم کا سٹہ (Wheat)',
  'Wheat': 'گندم کا سٹہ (Wheat)',
  'Beacon of Innovation': 'لالٹین / چراغ (Lantern)',
  'Lightbulb': 'بلب / روشنی (Lightbulb)',
  'Heart of Welfare': 'دل (Heart)',
  'Heart': 'دل (Heart)',
  'Star of Republic': 'ستارہ (Star)',
  'Star': 'ستارہ (Star)',
  'Liberty Bell': 'گھنٹی (Bell)',
  'Bell': 'گھنٹی (Bell)',
  'Compass of Direction': 'قطب نما (Compass)',
  'Compass': 'قطب نما (Compass)',
  'Global Harmony': 'دنیا (Globe)',
  'Globe': 'دنیا (Globe)',
  'Key of Prosperity': 'چابی (Key)',
  'Key': 'چابی (Key)',
};

const TAGLINE_URDU_MAP: Record<string, string> = {
  'Empowering youth, judicial transparency, anti-corruption reforms, and citizen digital governance.':
    'نوجوانوں کی خودمختاری، عدالتی شفافیت، انسداد بدعنوانی اور جدید ڈیجیٹل گورننس۔',
  'Economic growth corridors, national motorways, power infrastructure, and industrial revitalization.':
    'معاشی ترقیاتی راہداریاں، موٹرویز کا جدید نیٹ ورک، توانائی اور صنعتی بحالی۔',
  'Social security nets, Benazir Income Support, healthcare access for rural communities, and labor rights.':
    'سوشل سیکیورٹی نیٹ، بینظیر انکم سپورٹ، دیہی صحت کی سہولیات اور محنت کشوں کے حقوق۔',
  'Honest municipal leadership, clean drinking water filtration, and youth IT training programs.':
    'دیانت دار بلدیاتی قیادت، پینے کا صاف پانی اور نوجوانوں کے لیے مفت آئی ٹی ٹریننگ۔',
  'Grassroots constituency representation, IT innovation hubs, and community welfare in NA-127.':
    'حلقہ این اے 127 میں نچلی سطح پر مخلصانہ نمائندگی، آئی ٹی حب اور عوامی فلاح و بہبود۔',
};

/**
 * Returns Urdu or English candidate name based on active language
 */
export function getLocalizedCandidateName(name: string, isUrdu: boolean): string {
  if (!name) return '';
  if (!isUrdu) return name;

  // Direct lookup
  if (CANDIDATE_URDU_MAP[name.trim()]) {
    return CANDIDATE_URDU_MAP[name.trim()];
  }

  // Partial substring match
  for (const [key, val] of Object.entries(CANDIDATE_URDU_MAP)) {
    if (name.includes(key) || key.includes(name)) {
      return val;
    }
  }

  return name;
}

/**
 * Returns Urdu or English party name based on active language
 */
export function getLocalizedPartyName(party: string, isUrdu: boolean): string {
  if (!party) return '';
  if (!isUrdu) return party;

  if (PARTY_URDU_MAP[party.trim()]) {
    return PARTY_URDU_MAP[party.trim()];
  }

  for (const [key, val] of Object.entries(PARTY_URDU_MAP)) {
    if (party.includes(key) || key.includes(party)) {
      return val;
    }
  }

  return party;
}

/**
 * Returns Urdu or English electoral symbol name
 */
export function getLocalizedSymbolName(symbolName: string, isUrdu: boolean): string {
  if (!symbolName) return '';
  if (!isUrdu) return symbolName;

  if (SYMBOL_URDU_MAP[symbolName.trim()]) {
    return SYMBOL_URDU_MAP[symbolName.trim()];
  }

  for (const [key, val] of Object.entries(SYMBOL_URDU_MAP)) {
    if (symbolName.includes(key) || key.includes(symbolName)) {
      return val;
    }
  }

  return symbolName;
}

/**
 * Returns Urdu or English candidate manifesto / tagline
 */
export function getLocalizedTagline(tagline: string, isUrdu: boolean): string {
  if (!tagline) return '';
  if (!isUrdu) return tagline;

  if (TAGLINE_URDU_MAP[tagline.trim()]) {
    return TAGLINE_URDU_MAP[tagline.trim()];
  }

  for (const [key, val] of Object.entries(TAGLINE_URDU_MAP)) {
    if (tagline.includes(key) || key.includes(tagline)) {
      return val;
    }
  }

  return tagline;
}
