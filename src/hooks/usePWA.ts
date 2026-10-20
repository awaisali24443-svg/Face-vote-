import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, OfflinePreparationResult } from '../services/offlineStorage';
import { loadFaceApiModels } from '../services/faceApi';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWA() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pendingVotesCount, setPendingVotesCount] = useState<number>(0);
  const [cachedVotersCount, setCachedVotersCount] = useState<number>(0);
  const [cachedCandidatesCount, setCachedCandidatesCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPreparingOffline, setIsPreparingOffline] = useState<boolean>(false);
  const [isAppCached, setIsAppCached] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Refresh counts from local storage
  const refreshCounts = useCallback(() => {
    const pending = offlineStorage.getPendingOfflineVotes();
    const voters = offlineStorage.getLocalVoters();
    const candidates = offlineStorage.getLocalCandidates();
    const lastSync = offlineStorage.getLastSyncTime();
    setPendingVotesCount(pending.length);
    setCachedVotersCount(voters.length);
    setCachedCandidatesCount(candidates.length);
    if (lastSync) {
      const parsed = new Date(lastSync);
      if (!Number.isNaN(parsed.getTime())) setLastSyncTime(parsed);
    }
  }, []);

  // Sync data with server
  const syncOfflineData = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const success = await offlineStorage.syncRegistryFromServer();
      if (success) {
        setLastSyncTime(new Date());
      }
    } finally {
      setIsSyncing(false);
      refreshCounts();
    }
  }, [isSyncing, refreshCounts]);

  // Prepare everything a normal user can prepare with one tap while online.
  // The face-model loader warms/downloads the model files; the service worker
  // has already pre-cached them during install. Candidate data is public.
  // The biometric registry is included only for an officer-signed-in browser.
  const prepareOfflineData = useCallback(async (): Promise<OfflinePreparationResult | null> => {
    if (!navigator.onLine || isPreparingOffline) return null;
    setIsPreparingOffline(true);
    try {
      await loadFaceApiModels().catch(() => false);
      const result = await offlineStorage.prepareOfflineData();
      setLastSyncTime(new Date());
      return result;
    } finally {
      setIsPreparingOffline(false);
      refreshCounts();
    }
  }, [isPreparingOffline, refreshCounts]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when back online
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshCounts();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);
    refreshCounts();

    // Check if running in standalone mode (already installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // An active service worker means the app shell and pre-cached face
    // models have finished downloading for offline use.
    if ('serviceWorker' in navigator) {
      if (navigator.serviceWorker.controller) setIsAppCached(true);
      navigator.serviceWorker.ready
        .then(() => setIsAppCached(true))
        .catch(() => setIsAppCached(false));
    }

    // BeforeInstallPrompt for PWA
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Sync on initial load if online
    if (navigator.onLine) {
      syncOfflineData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [syncOfflineData, refreshCounts]);

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      return outcome === 'accepted';
    } catch {
      return false;
    } finally {
      // A beforeinstallprompt event can only be used once.
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return {
    isOnline,
    isInstallable,
    isInstalled,
    isAppCached,
    installApp,
    pendingVotesCount,
    cachedVotersCount,
    cachedCandidatesCount,
    isSyncing,
    isPreparingOffline,
    prepareOfflineData,
    lastSyncTime,
    syncOfflineData,
    refreshCounts,
  };
}
