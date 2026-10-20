import React, { useState, useEffect } from 'react';
import { Sun, Moon, Languages } from 'lucide-react';
import { Header } from './components/Header';
import { CheckInView } from './components/CheckInView';
import { BallotView } from './components/BallotView';
import { PublicResultsBallotView } from './components/PublicResultsBallotView';
import { AdminView, AdminTab } from './components/AdminView';
import { loadFaceApiModels } from './services/faceApi';
import { Voter } from './types';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import { cyberSound } from './services/soundEffects';

export default function App() {
  const { isLight, toggleTheme } = useTheme();
  const { isUrdu, toggleLanguage } = useLanguage();
  const [currentTab, setCurrentTab] = useState<'checkin' | 'results' | 'admin'>('checkin');
  const [adminSubTab, setAdminSubTab] = useState<AdminTab>('enrollment');
  const [activeBallotVoter, setActiveBallotVoter] = useState<Voter | null>(null);
  const [ballotToken, setBallotToken] = useState<string | null>(null);
  const [modelsReady, setModelsReady] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(0.6);
  const [voteRecordedMessage, setVoteRecordedMessage] = useState<string | null>(null);

  // Pre-load face-api models on initial mount for instant camera readiness
  useEffect(() => {
    loadFaceApiModels()
      .then(() => setModelsReady(true))
      .catch((err) => console.warn('Model initialization notice:', err));
  }, []);

  // Fetch initial threshold configuration
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.threshold) setThreshold(data.threshold);
      })
      .catch((err) => console.warn('Threshold config notice:', err));
  }, []);

  // Handler to enter the secret ballot screen after successful check-in
  const handleProceedToBallot = (voter: Voter, token?: string | null) => {
    setActiveBallotVoter(voter);
    setBallotToken(token || null);
  };

  // Handler when ballot is officially submitted
  const handleVoteComplete = (message: string) => {
    setActiveBallotVoter(null);
    setBallotToken(null);
    setCurrentTab('checkin');
    setVoteRecordedMessage(message);
  };

  // Cancel ballot
  const handleCancelBallot = () => {
    setActiveBallotVoter(null);
    setBallotToken(null);
  };

  const handleOpenEnrollmentDesk = () => {
    setAdminSubTab('enrollment');
    setCurrentTab('admin');
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors duration-300 ${
        isLight
          ? 'bg-[#f4f8fe] text-blue-950 selection:bg-blue-600 selection:text-white'
          : 'bg-[#090e17] text-slate-100 selection:bg-blue-500 selection:text-white'
      }`}
    >
      {/* Institutional Civic Ambient Glows */}
      <div
        className={`fixed inset-0 bg-cyber-grid pointer-events-none z-0 ${
          isLight ? 'opacity-40' : 'opacity-20'
        }`}
      />
      <div
        className={`fixed -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none z-0 ${
          isLight ? 'bg-blue-400/10' : 'bg-blue-500/10'
        }`}
      />
      <div
        className={`fixed -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none z-0 ${
          isLight ? 'bg-emerald-400/10' : 'bg-emerald-500/5'
        }`}
      />

      {/* Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab, subTab) => {
          setActiveBallotVoter(null);
          if (subTab) setAdminSubTab(subTab);
          setCurrentTab(tab);
        }}
        modelsReady={modelsReady}
        threshold={threshold}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 w-full relative z-10">
        {/* If an eligible voter has checked in and is on the ballot screen */}
        {activeBallotVoter ? (
          <BallotView
            voter={activeBallotVoter}
            ballotToken={ballotToken}
            onVoteComplete={handleVoteComplete}
            onCancel={handleCancelBallot}
          />
        ) : (
          <>
            {currentTab === 'checkin' && (
              <CheckInView
                onProceedToBallot={handleProceedToBallot}
                onGoToEnroll={handleOpenEnrollmentDesk}
                onViewResults={() => setCurrentTab('results')}
                lastVoteRecordedMessage={voteRecordedMessage}
                onClearVoteMessage={() => setVoteRecordedMessage(null)}
              />
            )}

            {currentTab === 'results' && (
              <PublicResultsBallotView
                onBackToKiosk={() => setCurrentTab('checkin')}
              />
            )}

            {currentTab === 'admin' && (
              <AdminView
                initialSubTab={adminSubTab}
                onGoToKiosk={() => setCurrentTab('checkin')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer - No text, no numbers */}
      <footer
        id="main-app-footer"
        className={`py-3 border-t relative z-10 transition-colors ${
          isLight
            ? 'border-blue-200/60 bg-white/70'
            : 'border-blue-950/60 bg-slate-950/70'
        }`}
      />

      {/* Floating Quick Controls - Icons only */}
      <aside aria-label="Quick Controls" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center space-x-2">
        {/* Floating Language Switcher */}
        <button
          id="floating-language-toggle"
          type="button"
          onClick={() => {
            cyberSound.playClick();
            toggleLanguage();
          }}
          aria-label="Language Toggle"
          title={isUrdu ? 'English' : 'اردو'}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            isLight
              ? 'bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50 shadow-[0_4px_20px_rgba(16,185,129,0.2)]'
              : 'bg-emerald-950/90 border-emerald-500 text-emerald-200 hover:bg-emerald-900 shadow-[0_4px_25px_rgba(16,185,129,0.3)]'
          }`}
        >
          <Languages className="w-5 h-5 text-emerald-500 shrink-0" />
        </button>

        {/* Floating Theme Switch */}
        <button
          id="floating-theme-switch"
          type="button"
          onClick={() => {
            cyberSound.playClick();
            toggleTheme();
          }}
          aria-label="Theme Toggle"
          title="Theme Toggle"
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            isLight
              ? 'bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800 shadow-[0_4px_20px_rgba(15,23,42,0.4)]'
              : 'bg-amber-950/90 border-amber-400 text-amber-200 hover:bg-amber-900 shadow-[0_4px_25px_rgba(245,158,11,0.35)]'
          }`}
        >
          {isLight ? (
            <Moon className="w-5 h-5 text-cyan-400 shrink-0" />
          ) : (
            <Sun className="w-5 h-5 text-amber-400 shrink-0" />
          )}
        </button>
      </aside>
    </div>
  );
}

