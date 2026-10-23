import React from 'react';
import {
  ScanFace,
  Vote,
  ShieldCheck,
  Trophy,
  Sun,
  Moon,
  Languages,
} from 'lucide-react';
import { cyberSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentTab: 'checkin' | 'results' | 'admin';
  onSelectTab: (tab: 'checkin' | 'results' | 'admin', subTab?: 'enrollment') => void;
  modelsReady: boolean;
  threshold: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { isLight, toggleTheme } = useTheme();
  const { isUrdu, toggleLanguage } = useLanguage();

  const handleToggleTheme = () => {
    cyberSound.playClick();
    toggleTheme();
  };

  const handleToggleLanguage = () => {
    cyberSound.playClick();
    toggleLanguage();
  };

  const handleTabClick = (tab: 'checkin' | 'results' | 'admin', subTab?: 'enrollment') => {
    cyberSound.playClick();
    onSelectTab(tab, subTab);
  };

  return (
    <header
      id="main-app-header"
      className={`border-b sticky top-0 z-50 shadow-md relative overflow-hidden transition-colors duration-300 ${
        isLight
          ? 'border-blue-200 bg-white/95 backdrop-blur shadow-blue-100/40'
          : 'border-blue-950/80 bg-slate-950/95 backdrop-blur'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo / Brand */}
          <button
            id="header-brand-icon-btn"
            onClick={() => handleTabClick('checkin')}
            className="flex items-center space-x-2.5 text-left cursor-pointer group"
          >
            <div
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-md transition-all ${
                isLight
                  ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-600 text-blue-700'
                  : 'bg-gradient-to-br from-slate-900 to-blue-950 border-blue-400/80 text-blue-400'
              }`}
            >
              <ScanFace className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-105 transition-transform" />
            </div>
            <div className="hidden sm:block">
              <div
                className={`text-base sm:text-lg font-black tracking-tight leading-tight ${
                  isLight ? 'text-blue-950' : 'text-white'
                }`}
              >
                {isUrdu ? 'بائیو میٹرک انتخابی نظام' : 'Biometric Voting System'}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isUrdu ? 'محفوظ و شفاف ووٹنگ' : 'Secure & Transparent'}</span>
              </div>
            </div>
          </button>

          {/* Navigation - Clear, Easy to read for normal users */}
          <nav
            id="header-navigation-bar"
            aria-label="Navigation"
            className={`flex items-center space-x-1 sm:space-x-2 p-1 sm:p-1.5 rounded-2xl border shadow-inner transition-colors ${
              isLight
                ? 'bg-blue-50/70 border-blue-200'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            {/* Primary Tab 1: Cast Vote */}
            <button
              id="nav-checkin-btn"
              onClick={() => handleTabClick('checkin')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                currentTab === 'checkin'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-400'
                  : isLight
                  ? 'text-blue-950 hover:text-blue-700 hover:bg-blue-100/70'
                  : 'text-slate-200 hover:text-blue-300 hover:bg-slate-800/80'
              }`}
            >
              <Vote className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{isUrdu ? 'ووٹ ڈالیں' : 'Cast Vote'}</span>
            </button>

            {/* Primary Tab 2: Results */}
            <button
              id="nav-results-btn"
              onClick={() => handleTabClick('results')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                currentTab === 'results'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-400'
                  : isLight
                  ? 'text-blue-950 hover:text-emerald-700 hover:bg-emerald-50'
                  : 'text-slate-200 hover:text-emerald-300 hover:bg-slate-800/80'
              }`}
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{isUrdu ? 'نتائج' : 'Results'}</span>
            </button>

            {/* Primary Tab 3: Admin Desk */}
            <button
              id="nav-admin-btn"
              onClick={() => handleTabClick('admin')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md border border-blue-500'
                  : isLight
                  ? 'text-blue-950 hover:text-blue-700 hover:bg-blue-100/70'
                  : 'text-slate-200 hover:text-blue-300 hover:bg-slate-800/80'
              }`}
            >
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="hidden md:inline">{isUrdu ? 'ڈیسک' : 'Admin'}</span>
            </button>

          </nav>

          {/* Controls: Language & Theme only — everything else lives on the pages */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Language Toggle */}
            <button
              id="lang-toggle-btn"
              onClick={handleToggleLanguage}
              aria-label="Language Toggle"
              className={`px-2.5 sm:px-3 py-2 rounded-xl border font-bold text-xs sm:text-sm transition cursor-pointer flex items-center space-x-1.5 shadow-sm ${
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

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={handleToggleTheme}
              aria-label="Theme Toggle"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition cursor-pointer flex items-center justify-center shadow-sm ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800'
              }`}
            >
              {isLight ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
