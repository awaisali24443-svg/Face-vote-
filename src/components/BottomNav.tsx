import React from 'react';
import { Vote, UserPlus, Trophy, ShieldCheck } from 'lucide-react';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import type { AdminTab } from './AdminView';

interface BottomNavProps {
  currentTab: 'checkin' | 'results' | 'admin';
  adminSubTab: AdminTab;
  onSelectTab: (tab: 'checkin' | 'results' | 'admin', subTab?: AdminTab) => void;
}

/**
 * Android-style bottom navigation: Vote / Register / Results / Admin.
 * Active item gets a Material pill behind its icon. Hidden while a
 * ballot is open (App does not render it then).
 */
export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, adminSubTab, onSelectTab }) => {
  const { isLight } = useTheme();
  const { isUrdu } = useLanguage();

  const items: {
    key: string;
    icon: React.ElementType;
    en: string;
    ur: string;
    active: boolean;
    onClick: () => void;
  }[] = [
    {
      key: 'vote',
      icon: Vote,
      en: 'Vote',
      ur: 'ووٹ ڈالیں',
      active: currentTab === 'checkin',
      onClick: () => onSelectTab('checkin'),
    },
    {
      key: 'register',
      icon: UserPlus,
      en: 'Register',
      ur: 'رجسٹر',
      active: currentTab === 'admin' && adminSubTab === 'enrollment',
      onClick: () => onSelectTab('admin', 'enrollment'),
    },
    {
      key: 'results',
      icon: Trophy,
      en: 'Results',
      ur: 'نتائج',
      active: currentTab === 'results',
      onClick: () => onSelectTab('results'),
    },
    {
      key: 'admin',
      icon: ShieldCheck,
      en: 'Admin',
      ur: 'ایڈمن',
      active: currentTab === 'admin' && adminSubTab !== 'enrollment',
      onClick: () => onSelectTab('admin', adminSubTab === 'enrollment' ? 'approvals' : adminSubTab),
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Main"
      className={`fixed bottom-0 inset-x-0 z-40 border-t pb-safe ${
        isLight
          ? 'bg-white/97 border-slate-200 shadow-[0_-2px_12px_rgba(15,23,42,0.06)]'
          : 'bg-slate-950/97 border-slate-800 shadow-[0_-2px_12px_rgba(0,0,0,0.4)]'
      }`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-xl mx-auto grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => {
                cyberSound.playClick();
                item.onClick();
              }}
              aria-current={item.active ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 min-h-[62px] py-1.5 cursor-pointer"
            >
              <span
                className={`px-5 py-1 rounded-full transition-colors ${
                  item.active
                    ? 'bg-emerald-600/15 text-emerald-600 dark:text-emerald-400'
                    : isLight
                    ? 'text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={item.active ? 2.4 : 2} />
              </span>
              <span
                className={`text-[11px] leading-none ${
                  item.active
                    ? 'font-black text-emerald-700 dark:text-emerald-400'
                    : isLight
                    ? 'font-semibold text-slate-500'
                    : 'font-semibold text-slate-400'
                }`}
              >
                {isUrdu ? item.ur : item.en}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
