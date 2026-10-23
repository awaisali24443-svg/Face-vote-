import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CheckInView } from './components/CheckInView';
import { BallotView } from './components/BallotView';
import { PublicResultsBallotView } from './components/PublicResultsBallotView';
import { AdminView, AdminTab } from './components/AdminView';
import { loadFaceApiModels } from './services/faceApi';
import { isDeviceMode, removeCachedDummyVoters } from './services/deviceMode';
import { Voter } from './types';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { isLight } = useTheme();
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

  // No dummy voters: the roll starts empty and the officer enrolls real
  // voters manually. Remove any dummy records left by the earlier demo build.
  useEffect(() => {
    if (isDeviceMode()) removeCachedDummyVoters();
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
                onGoToKiosk={() => setCurrentTab('checkin')}
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
    </div>
  );
}

