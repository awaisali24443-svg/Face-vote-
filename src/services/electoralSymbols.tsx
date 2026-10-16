import React from 'react';

export interface ElectoralSymbol {
  id: string;
  name: string;
  nameUrdu: string;
  category: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  iconName: string;
}

export const ELECTORAL_SYMBOLS: ElectoralSymbol[] = [
  {
    id: 'bat',
    name: 'Cricket Bat',
    nameUrdu: 'بلہ',
    category: 'Sports & Youth',
    emoji: '🏏',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-950/70',
    borderClass: 'border-amber-500/80',
    iconName: 'bat',
  },
  {
    id: 'tiger',
    name: 'Tiger / Lion',
    nameUrdu: 'شیر',
    category: 'Strength & National',
    emoji: '🐅',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-950/70',
    borderClass: 'border-orange-500/80',
    iconName: 'tiger',
  },
  {
    id: 'arrow',
    name: 'Arrow',
    nameUrdu: 'تیر',
    category: 'Direction & Focus',
    emoji: '🏹',
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-950/70',
    borderClass: 'border-emerald-500/80',
    iconName: 'arrow',
  },
  {
    id: 'scale',
    name: 'Scale of Justice',
    nameUrdu: 'ترازو',
    category: 'Civic & Law',
    emoji: '⚖️',
    colorClass: 'text-yellow-500',
    bgClass: 'bg-yellow-950/70',
    borderClass: 'border-yellow-500/80',
    iconName: 'scale',
  },
  {
    id: 'eagle',
    name: 'Eagle of Iqbal',
    nameUrdu: 'شاہین',
    category: 'Sovereignty & Vision',
    emoji: '🦅',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-950/70',
    borderClass: 'border-cyan-500/80',
    iconName: 'eagle',
  },
  {
    id: 'lantern',
    name: 'Lantern / Laltain',
    nameUrdu: 'لالٹین',
    category: 'Heritage & Light',
    emoji: '🏮',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-950/70',
    borderClass: 'border-amber-500/80',
    iconName: 'lantern',
  },
  {
    id: 'tractor',
    name: 'Tractor',
    nameUrdu: 'ٹریکٹر',
    category: 'Agriculture & Labor',
    emoji: '🚜',
    colorClass: 'text-red-500',
    bgClass: 'bg-red-950/70',
    borderClass: 'border-red-500/80',
    iconName: 'tractor',
  },
  {
    id: 'book',
    name: 'Book of Wisdom',
    nameUrdu: 'کتاب',
    category: 'Education & Reform',
    emoji: '📖',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-950/70',
    borderClass: 'border-purple-500/80',
    iconName: 'book',
  },
  {
    id: 'kite',
    name: 'Kite / Patang',
    nameUrdu: 'پتنگ',
    category: 'Culture & Freedom',
    emoji: '🪁',
    colorClass: 'text-pink-400',
    bgClass: 'bg-pink-950/70',
    borderClass: 'border-pink-500/80',
    iconName: 'kite',
  },
  {
    id: 'sun',
    name: 'Rising Sun',
    nameUrdu: 'سورج',
    category: 'Progress & Dawn',
    emoji: '☀️',
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-950/70',
    borderClass: 'border-yellow-500/80',
    iconName: 'sun',
  },
  {
    id: 'wheat',
    name: 'Sheaf of Wheat',
    nameUrdu: 'گندم کا خوشہ',
    category: 'Agriculture & Sustenance',
    emoji: '🌾',
    colorClass: 'text-amber-300',
    bgClass: 'bg-amber-950/70',
    borderClass: 'border-amber-400/80',
    iconName: 'wheat',
  },
  {
    id: 'key',
    name: 'Key of Prosperity',
    nameUrdu: 'چابی',
    category: 'Economy & Enterprise',
    emoji: '🗝️',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-950/70',
    borderClass: 'border-amber-500/80',
    iconName: 'key',
  },
  {
    id: 'crane',
    name: 'Crane',
    nameUrdu: 'کرین',
    category: 'Industry & Building',
    emoji: '🏗️',
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-950/70',
    borderClass: 'border-orange-500/80',
    iconName: 'crane',
  },
  {
    id: 'bicycle',
    name: 'Bicycle',
    nameUrdu: 'سائیکل',
    category: 'Common Citizen',
    emoji: '🚲',
    colorClass: 'text-sky-400',
    bgClass: 'bg-sky-950/70',
    borderClass: 'border-sky-500/80',
    iconName: 'bicycle',
  },
  {
    id: 'torch',
    name: 'Torch of Liberty',
    nameUrdu: 'مشعل',
    category: 'Progress & Rights',
    emoji: '🔥',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-950/70',
    borderClass: 'border-rose-500/80',
    iconName: 'torch',
  },
  {
    id: 'tree',
    name: 'Tree of Resilience',
    nameUrdu: 'درخت',
    category: 'Ecology & Community',
    emoji: '🌳',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/70',
    borderClass: 'border-emerald-500/80',
    iconName: 'tree',
  },
  {
    id: 'rocket',
    name: 'Rocket of Future',
    nameUrdu: 'راکٹ',
    category: 'Innovation & Tech',
    emoji: '🚀',
    colorClass: 'text-sky-400',
    bgClass: 'bg-sky-950/70',
    borderClass: 'border-sky-500/80',
    iconName: 'rocket',
  },
  {
    id: 'shield',
    name: 'Shield of Integrity',
    nameUrdu: 'ڈھال',
    category: 'Security & Trust',
    emoji: '🛡️',
    colorClass: 'text-indigo-400',
    bgClass: 'bg-indigo-950/70',
    borderClass: 'border-indigo-500/80',
    iconName: 'shield',
  },
  {
    id: 'anchor',
    name: 'Anchor of Stability',
    nameUrdu: 'لنگر',
    category: 'Maritime & Economy',
    emoji: '⚓',
    colorClass: 'text-teal-400',
    bgClass: 'bg-teal-950/70',
    borderClass: 'border-teal-500/80',
    iconName: 'anchor',
  },
  {
    id: 'star',
    name: 'Star of Republic',
    nameUrdu: 'ستارہ',
    category: 'National Heritage',
    emoji: '⭐',
    colorClass: 'text-amber-200',
    bgClass: 'bg-amber-950/70',
    borderClass: 'border-amber-300/80',
    iconName: 'star',
  },
  {
    id: 'bell',
    name: 'Liberty Bell',
    nameUrdu: 'گھنٹی',
    category: 'Freedom & Voice',
    emoji: '🔔',
    colorClass: 'text-yellow-500',
    bgClass: 'bg-yellow-950/70',
    borderClass: 'border-yellow-600/80',
    iconName: 'bell',
  },
];

export function getSymbolById(id: string): ElectoralSymbol {
  const normalized = (id || '').toLowerCase().trim();
  const found = ELECTORAL_SYMBOLS.find(
    (s) => s.id === normalized || s.iconName === normalized || s.name.toLowerCase().includes(normalized)
  );
  return (
    found || {
      id: 'scale',
      name: 'Scale of Justice',
      nameUrdu: 'ترازو',
      category: 'Civic',
      emoji: '⚖️',
      colorClass: 'text-yellow-500',
      bgClass: 'bg-yellow-950/70',
      borderClass: 'border-yellow-500/80',
      iconName: 'scale',
    }
  );
}

/**
 * Authentic high-detail SVGs for real Pakistani & international electoral candidate symbols
 */
export function RealSymbolSVG({
  iconName,
  className = 'w-10 h-10',
}: {
  iconName: string;
  className?: string;
}): React.ReactElement {
  const norm = (iconName || 'scale').toLowerCase().trim();

  // 1. Cricket Bat (بلہ) - Authentic Willow Blade & Wrapped Handle
  if (norm === 'bat' || norm === 'cricket' || norm === 'cricket bat' || norm === 'zap') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Shadow / Base */}
        <g transform="rotate(-35 50 50)">
          {/* Bat Handle Grip */}
          <rect x="46" y="8" width="8" height="28" rx="4" fill="#E2E8F0" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="46" y1="14" x2="54" y2="14" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="46" y1="20" x2="54" y2="20" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="46" y1="26" x2="54" y2="26" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="46" y1="32" x2="54" y2="32" stroke="#0F172A" strokeWidth="1.5" />
          {/* Handle Top Knob */}
          <ellipse cx="50" cy="8" rx="5" ry="2.5" fill="#0F172A" />

          {/* Wooden Blade */}
          <path
            d="M44 36 C44 34, 56 34, 56 36 L59 78 C59 86, 41 86, 41 78 Z"
            fill="#F59E0B"
            stroke="#78350F"
            strokeWidth="3"
          />
          {/* Bat Spine Center Ridge */}
          <path d="M50 36 L50 82" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          {/* Wood grain curves */}
          <path d="M46 44 Q50 48 46 72" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M54 44 Q50 48 54 72" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
          {/* Bat Toe reinforcement */}
          <path d="M42 78 C42 84, 58 84, 58 78" stroke="#78350F" strokeWidth="2" fill="none" />
        </g>
      </svg>
    );
  }

  // 2. Tiger / Lion (شیر) - Roaring Bengal Tiger Face Profile
  if (norm === 'tiger' || norm === 'lion' || norm === 'flame' || norm === 'sher') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Tiger Head Silhouette */}
        <circle cx="50" cy="50" r="38" fill="#F97316" stroke="#431407" strokeWidth="3" />
        {/* Tiger Ears */}
        <path d="M22 28 C18 16, 32 18, 35 28 Z" fill="#EA580C" stroke="#431407" strokeWidth="2.5" />
        <path d="M78 28 C82 16, 68 18, 65 28 Z" fill="#EA580C" stroke="#431407" strokeWidth="2.5" />
        <path d="M25 26 C23 19, 31 20, 33 26 Z" fill="#FEF08A" />
        <path d="M75 26 C77 19, 69 20, 67 26 Z" fill="#FEF08A" />

        {/* Tiger Stripes */}
        <path d="M50 16 L50 28 M44 20 L50 26 M56 20 L50 26" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
        <path d="M18 48 Q30 48 34 44" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M18 56 Q28 56 32 54" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M82 48 Q70 48 66 44" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M82 56 Q72 56 68 54" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />

        {/* White Muzzle & Eyes */}
        <ellipse cx="50" cy="66" rx="20" ry="14" fill="#FFFBEB" stroke="#431407" strokeWidth="2" />
        {/* Tiger Eyes */}
        <polygon points="32,42 42,44 36,49" fill="#FEF08A" stroke="#1E293B" strokeWidth="2" />
        <circle cx="37" cy="45" r="2" fill="#0F172A" />
        <polygon points="68,42 58,44 64,49" fill="#FEF08A" stroke="#1E293B" strokeWidth="2" />
        <circle cx="63" cy="45" r="2" fill="#0F172A" />

        {/* Tiger Nose & Whiskers */}
        <polygon points="46,58 54,58 50,64" fill="#DC2626" stroke="#431407" strokeWidth="1.5" />
        <path d="M50 64 L50 72 M44 70 Q50 74 56 70" stroke="#1E293B" strokeWidth="2" fill="none" />
        <line x1="38" y1="66" x2="22" y2="64" stroke="#1E293B" strokeWidth="1.5" />
        <line x1="38" y1="70" x2="22" y2="72" stroke="#1E293B" strokeWidth="1.5" />
        <line x1="62" y1="66" x2="78" y2="64" stroke="#1E293B" strokeWidth="1.5" />
        <line x1="62" y1="70" x2="78" y2="72" stroke="#1E293B" strokeWidth="1.5" />
      </svg>
    );
  }

  // 3. Arrow (تیر) - Archery Bow Arrow with Steel Head & Feathers
  if (norm === 'arrow' || norm === 'target' || norm === 'teer') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <g transform="rotate(-45 50 50)">
          {/* Arrow Shaft */}
          <rect x="47" y="16" width="6" height="70" rx="3" fill="#10B981" stroke="#064E3B" strokeWidth="2" />

          {/* Steel Arrow Head (Sharp Triangle) */}
          <polygon points="50,4 66,24 50,18 34,24" fill="#059669" stroke="#064E3B" strokeWidth="2.5" />
          <line x1="50" y1="6" x2="50" y2="18" stroke="#D1FAE5" strokeWidth="2" />

          {/* Fletching / Feathers */}
          <path d="M47 70 L32 82 L47 80 Z" fill="#34D399" stroke="#064E3B" strokeWidth="1.5" />
          <path d="M53 70 L68 82 L53 80 Z" fill="#34D399" stroke="#064E3B" strokeWidth="1.5" />
          <path d="M47 76 L34 88 L47 86 Z" fill="#34D399" stroke="#064E3B" strokeWidth="1.5" />
          <path d="M53 76 L66 88 L53 86 Z" fill="#34D399" stroke="#064E3B" strokeWidth="1.5" />
          {/* Nock */}
          <rect x="48" y="86" width="4" height="6" rx="2" fill="#064E3B" />
        </g>
      </svg>
    );
  }

  // 4. Scale of Justice (ترازو) - Balanced Brass Scales
  if (norm === 'scale' || norm === 'tarazu' || norm === 'justice') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Center Pillar & Pedestal */}
        <line x1="50" y1="12" x2="50" y2="82" stroke="#D97706" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="50" cy="12" rx="6" ry="6" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
        <path d="M30 84 C30 80, 70 80, 70 84 L76 90 L24 90 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />

        {/* Balance Horizontal Beam */}
        <line x1="16" y1="26" x2="84" y2="26" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="50" cy="26" r="4" fill="#78350F" />
        <circle cx="18" cy="26" r="3" fill="#78350F" />
        <circle cx="82" cy="26" r="3" fill="#78350F" />

        {/* Left Scale Pan with Chains */}
        <line x1="18" y1="26" x2="10" y2="52" stroke="#B45309" strokeWidth="1.5" />
        <line x1="18" y1="26" x2="26" y2="52" stroke="#B45309" strokeWidth="1.5" />
        <line x1="18" y1="26" x2="18" y2="52" stroke="#B45309" strokeWidth="1.5" />
        <path d="M6 52 C6 64, 30 64, 30 52 Z" fill="#FBBF24" stroke="#78350F" strokeWidth="2" />

        {/* Right Scale Pan with Chains */}
        <line x1="82" y1="26" x2="74" y2="52" stroke="#B45309" strokeWidth="1.5" />
        <line x1="82" y1="26" x2="90" y2="52" stroke="#B45309" strokeWidth="1.5" />
        <line x1="82" y1="26" x2="82" y2="52" stroke="#B45309" strokeWidth="1.5" />
        <path d="M70 52 C70 64, 94 64, 94 52 Z" fill="#FBBF24" stroke="#78350F" strokeWidth="2" />
      </svg>
    );
  }

  // 5. Eagle / Shaheen (شاہین) - Majestic Soaring Eagle with Wings
  if (norm === 'eagle' || norm === 'bird' || norm === 'shaheen') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Left Wing */}
        <path
          d="M50 45 C35 15, 8 18, 4 38 C14 36, 24 44, 34 54 C42 62, 48 58, 50 45 Z"
          fill="#0284C7"
          stroke="#0C4A6E"
          strokeWidth="2.5"
        />
        {/* Right Wing */}
        <path
          d="M50 45 C65 15, 92 18, 96 38 C86 36, 76 44, 66 54 C58 62, 52 58, 50 45 Z"
          fill="#0284C7"
          stroke="#0C4A6E"
          strokeWidth="2.5"
        />
        {/* Eagle Body & Tail */}
        <path d="M44 45 L50 85 L56 45 Z" fill="#0369A1" stroke="#0C4A6E" strokeWidth="2" />
        <path d="M42 78 L50 94 L58 78 Z" fill="#38BDF8" stroke="#0C4A6E" strokeWidth="1.5" />

        {/* Eagle Head & Curved Beak */}
        <circle cx="50" cy="36" r="11" fill="#F8FAFC" stroke="#0C4A6E" strokeWidth="2" />
        <circle cx="48" cy="34" r="2" fill="#0F172A" />
        <path d="M50 34 Q58 36 60 42 Q54 44 50 40 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
      </svg>
    );
  }

  // 6. Lantern / Laltain (لالٹین) - Traditional Kerosene Lamp
  if (norm === 'lantern' || norm === 'laltain' || norm === 'lamp' || norm === 'lightbulb') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Wire Handle */}
        <path d="M30 38 C30 10, 70 10, 70 38" stroke="#78350F" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="10" r="4" fill="#F59E0B" />

        {/* Top Chimney Cap */}
        <path d="M36 34 L64 34 L58 24 L42 24 Z" fill="#D97706" stroke="#78350F" strokeWidth="2" />

        {/* Glass Chimney with Flame */}
        <path d="M34 36 C28 50, 28 66, 34 76 L66 76 C72 66, 72 50, 66 36 Z" fill="#FEF3C7" stroke="#78350F" strokeWidth="2.5" />
        {/* Inner Glowing Flame */}
        <path d="M50 68 C44 64, 44 54, 50 46 C56 54, 56 64, 50 68 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
        <path d="M50 66 C46 63, 46 56, 50 50 C54 56, 54 63, 50 66 Z" fill="#FBBF24" />

        {/* Protective Wire Cage */}
        <line x1="42" y1="36" x2="42" y2="76" stroke="#B45309" strokeWidth="1.5" />
        <line x1="58" y1="36" x2="58" y2="76" stroke="#B45309" strokeWidth="1.5" />

        {/* Base Kerosene Tank */}
        <path d="M30 76 L70 76 L74 90 L26 90 Z" fill="#D97706" stroke="#78350F" strokeWidth="2.5" />
      </svg>
    );
  }

  // 7. Tractor (ٹریکٹر) - Agricultural Tractor with Big Tread Wheel
  if (norm === 'tractor' || norm === 'hal') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Exhaust pipe */}
        <line x1="68" y1="20" x2="68" y2="40" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M68 20 Q72 16 76 20" stroke="#1E293B" strokeWidth="3" fill="none" />

        {/* Hood / Engine Body */}
        <rect x="44" y="40" width="36" height="24" rx="4" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2.5" />
        <circle cx="76" cy="46" r="3" fill="#FEF08A" stroke="#7F1D1D" strokeWidth="1" />

        {/* Driver Cabin Frame & Seat */}
        <path d="M30 32 L46 32 L46 56 L24 56 Z" fill="#EF4444" stroke="#7F1D1D" strokeWidth="2.5" />
        <rect x="32" y="36" width="10" height="12" rx="2" fill="#E2E8F0" stroke="#7F1D1D" strokeWidth="1.5" />
        <line x1="40" y1="34" x2="44" y2="44" stroke="#1E293B" strokeWidth="2.5" />

        {/* Big Rear Tire with Deep Treads */}
        <circle cx="34" cy="68" r="20" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
        <circle cx="34" cy="68" r="11" fill="#FBBF24" stroke="#78350F" strokeWidth="2" />
        <circle cx="34" cy="68" r="4" fill="#1E293B" />
        {/* Tire Treads */}
        <line x1="34" y1="49" x2="34" y2="53" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="34" y1="83" x2="34" y2="87" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="15" y1="68" x2="19" y2="68" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="49" y1="68" x2="53" y2="68" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />

        {/* Front Tire */}
        <circle cx="74" cy="74" r="12" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
        <circle cx="74" cy="74" r="6" fill="#FBBF24" stroke="#78350F" strokeWidth="1.5" />
      </svg>
    );
  }

  // 8. Book / Kitab (کتاب) - Open Book of Wisdom
  if (norm === 'book' || norm === 'kitab' || norm === 'quran') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Wooden Stand (Rehal) */}
        <path d="M22 78 L50 62 L78 78" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
        <path d="M22 86 L50 70 L78 86" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />

        {/* Book Cover Base */}
        <path d="M12 56 C28 50, 46 54, 50 60 C54 54, 72 50, 88 56 L88 32 C72 26, 54 30, 50 36 C46 30, 28 26, 12 32 Z" fill="#7C3AED" stroke="#4C1D95" strokeWidth="2.5" />

        {/* Pages Left & Right */}
        <path d="M14 52 C28 46, 46 50, 50 56 L50 32 C46 26, 28 22, 14 28 Z" fill="#F8FAFC" stroke="#334155" strokeWidth="1.5" />
        <path d="M86 52 C72 46, 54 50, 50 56 L50 32 C54 26, 72 22, 86 28 Z" fill="#F8FAFC" stroke="#334155" strokeWidth="1.5" />

        {/* Page text lines */}
        <line x1="20" y1="34" x2="42" y2="38" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="20" y1="40" x2="42" y2="44" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="20" y1="46" x2="42" y2="50" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="58" y1="38" x2="80" y2="34" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="58" y1="44" x2="80" y2="40" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="58" y1="50" x2="80" y2="46" stroke="#94A3B8" strokeWidth="1.5" />
      </svg>
    );
  }

  // 9. Kite / Patang (پتنگ) - Diamond Paper Kite with Tail
  if (norm === 'kite' || norm === 'patang') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Diamond Kite Body */}
        <polygon points="50,10 88,46 50,78 12,46" fill="#EC4899" stroke="#831843" strokeWidth="3" />
        {/* Two-tone color split */}
        <polygon points="50,10 88,46 50,78" fill="#F43F5E" />

        {/* Bamboo Struts (Central Spine & Bow) */}
        <line x1="50" y1="10" x2="50" y2="78" stroke="#FEF08A" strokeWidth="2.5" />
        <path d="M12 46 Q50 20 88 46" stroke="#FEF08A" strokeWidth="2.5" fill="none" />

        {/* Kite Tail & Ribbons */}
        <polygon points="50,78 40,94 60,94" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="1.5" />
        <path d="M50 94 Q42 98 46 100" stroke="#3B82F6" strokeWidth="2" fill="none" />
      </svg>
    );
  }

  // 10. Rising Sun (سورج) - Radiant Sun with Beams
  if (norm === 'sun' || norm === 'suraj') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Sun Center Core */}
        <circle cx="50" cy="50" r="22" fill="#FBBF24" stroke="#D97706" strokeWidth="3" />
        <circle cx="50" cy="50" r="16" fill="#F59E0B" />

        {/* 12 Radiant Sun Rays */}
        <g stroke="#F59E0B" strokeWidth="4" strokeLinecap="round">
          <line x1="50" y1="8" x2="50" y2="20" />
          <line x1="50" y1="80" x2="50" y2="92" />
          <line x1="8" y1="50" x2="20" y2="50" />
          <line x1="80" y1="50" x2="92" y2="50" />
          <line x1="20" y1="20" x2="29" y2="29" />
          <line x1="71" y1="71" x2="80" y2="80" />
          <line x1="20" y1="80" x2="29" y2="71" />
          <line x1="71" y1="29" x2="80" y2="20" />
        </g>
      </svg>
    );
  }

  // 11. Sheaf of Wheat (گندم کا خوشہ) - Golden Wheat Ears
  if (norm === 'wheat' || norm === 'gandum') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Central Stem */}
        <path d="M50 14 L50 90" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
        {/* Golden Wheat Grains */}
        <g fill="#FBBF24" stroke="#78350F" strokeWidth="1.5">
          <ellipse cx="40" cy="24" rx="8" ry="5" transform="rotate(-30 40 24)" />
          <ellipse cx="60" cy="24" rx="8" ry="5" transform="rotate(30 60 24)" />
          <ellipse cx="38" cy="38" rx="9" ry="5.5" transform="rotate(-30 38 38)" />
          <ellipse cx="62" cy="38" rx="9" ry="5.5" transform="rotate(30 62 38)" />
          <ellipse cx="36" cy="52" rx="10" ry="6" transform="rotate(-30 36 52)" />
          <ellipse cx="64" cy="52" rx="10" ry="6" transform="rotate(30 64 52)" />
          <ellipse cx="38" cy="66" rx="9" ry="5.5" transform="rotate(-30 38 66)" />
          <ellipse cx="62" cy="66" rx="9" ry="5.5" transform="rotate(30 62 66)" />
          <ellipse cx="50" cy="14" rx="6" ry="10" />
        </g>
        {/* Awns / Whiskers */}
        <path d="M50 10 L50 2" stroke="#B45309" strokeWidth="1.5" />
        <path d="M34 20 L24 10" stroke="#B45309" strokeWidth="1.5" />
        <path d="M66 20 L76 10" stroke="#B45309" strokeWidth="1.5" />
      </svg>
    );
  }

  // 12. Key (چابی) - Antique Brass Key
  if (norm === 'key' || norm === 'chabi') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <g transform="rotate(-45 50 50)">
          {/* Key Bow / Head */}
          <circle cx="28" cy="50" r="18" fill="#FBBF24" stroke="#78350F" strokeWidth="3" />
          <circle cx="28" cy="50" r="8" fill="#FFFBEB" stroke="#78350F" strokeWidth="2.5" />

          {/* Key Shaft */}
          <rect x="42" y="47" width="46" height="6" rx="3" fill="#F59E0B" stroke="#78350F" strokeWidth="2.5" />

          {/* Key Teeth */}
          <rect x="72" y="53" width="6" height="12" rx="2" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
          <rect x="82" y="53" width="6" height="18" rx="2" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
        </g>
      </svg>
    );
  }

  // 13. Bicycle (سائیکل)
  if (norm === 'bicycle' || norm === 'cycle') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Wheels */}
        <circle cx="26" cy="64" r="18" stroke="#0284C7" strokeWidth="3" fill="#F0F9FF" />
        <circle cx="74" cy="64" r="18" stroke="#0284C7" strokeWidth="3" fill="#F0F9FF" />
        <circle cx="26" cy="64" r="3" fill="#0C4A6E" />
        <circle cx="74" cy="64" r="3" fill="#0C4A6E" />

        {/* Frame */}
        <polygon points="26,64 48,64 66,42 42,42" stroke="#0369A1" strokeWidth="3" fill="none" strokeLinejoin="round" />
        <line x1="48" y1="64" x2="66" y2="42" stroke="#0369A1" strokeWidth="3" />
        <line x1="74" y1="64" x2="66" y2="42" stroke="#0369A1" strokeWidth="3" />
        <line x1="66" y1="42" x2="64" y2="30" stroke="#0369A1" strokeWidth="3" />
        {/* Handlebars */}
        <line x1="58" y1="30" x2="70" y2="30" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
        {/* Seat */}
        <line x1="38" y1="38" x2="48" y2="38" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
        <line x1="42" y1="42" x2="44" y2="38" stroke="#0369A1" strokeWidth="3" />
      </svg>
    );
  }

  // Default fallback: Scale of Justice
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <line x1="50" y1="12" x2="50" y2="82" stroke="#D97706" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="50" cy="12" rx="6" ry="6" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
      <path d="M30 84 C30 80, 70 80, 70 84 L76 90 L24 90 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
      <line x1="16" y1="26" x2="84" y2="26" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="50" cy="26" r="4" fill="#78350F" />
      <line x1="18" y1="26" x2="10" y2="52" stroke="#B45309" strokeWidth="1.5" />
      <line x1="18" y1="26" x2="26" y2="52" stroke="#B45309" strokeWidth="1.5" />
      <path d="M6 52 C6 64, 30 64, 30 52 Z" fill="#FBBF24" stroke="#78350F" strokeWidth="2" />
      <line x1="82" y1="26" x2="74" y2="52" stroke="#B45309" strokeWidth="1.5" />
      <line x1="82" y1="26" x2="90" y2="52" stroke="#B45309" strokeWidth="1.5" />
      <path d="M70 52 C70 64, 94 64, 94 52 Z" fill="#FBBF24" stroke="#78350F" strokeWidth="2" />
    </svg>
  );
}

/**
 * Renders the electoral symbol sign with support for custom image URLs or authentic vector illustration
 */
export function renderSymbolIcon(
  iconName: string,
  className = 'w-8 h-8',
  signImageUrl?: string
): React.ReactElement {
  if (signImageUrl && signImageUrl.trim() !== '') {
    return (
      <img
        src={signImageUrl}
        alt={iconName}
        className={`${className} object-contain`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return <RealSymbolSVG iconName={iconName} className={className} />;
}
