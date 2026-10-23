import React from 'react';
import { ScanFace, Sun, Moon, Languages } from 'lucide-react';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  onBrandClick: () => void;
}

/**
 * Slim top app bar (Android pattern): brand on the left, language and
 * theme controls on the right. Section navigation lives in the bottom
 * navigation bar — see BottomNav.
 */
export const Header: React.FC<HeaderProps> = ({ onBrandClick }) => {
  const { isLight, toggleTheme } = useTheme();
  const { isUrdu, toggleLanguage } = useLanguage();

  return (
    <header
      id="main-app-header"
      className={`sticky top-0 z-40 border-b shadow-sm transition-colors duration-300 ${
        isLight
          ? 'border-slate-200 bg-white/95 backdrop-blur'
          : 'border-slate-800 bg-slate-950/95 backdrop-blur'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Brand */}
          <button
            id="header-brand-icon-btn"
            onClick={() => {
              cyberSound.playClick();
              onBrandClick();
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer min-h-[48px]"
          >
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isLight
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600/90 text-white'
              }`}
            >
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <div
                className={`text-base font-black tracking-tight leading-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                FaceVote
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 leading-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isUrdu ? 'محفوظ و شفاف ووٹنگ' : 'Secure & Transparent'}</span>
              </div>
            </div>
          </button>

          {/* Language & theme */}
          <div className="flex items-center gap-1.5">
            <button
              id="lang-toggle-btn"
              onClick={() => {
                cyberSound.playClick();
                toggleLanguage();
              }}
              aria-label="Language Toggle"
              className={`min-h-[44px] px-3 rounded-full border font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                isUrdu
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200'
                  : 'bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Languages className="w-4 h-4" />
              <span>{isUrdu ? 'اردو' : 'EN'}</span>
            </button>

            <button
              id="theme-toggle-btn"
              onClick={() => {
                cyberSound.playClick();
                toggleTheme();
              }}
              aria-label="Theme Toggle"
              className={`w-11 h-11 rounded-full border transition cursor-pointer flex items-center justify-center ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800'
              }`}
            >
              {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
