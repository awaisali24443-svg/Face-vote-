import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '../services/offlineStorage';

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
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Refresh counts from local storage
  const refreshCounts = useCallback(() => {
    const pending = offlineStorage.getPendingOfflineVotes();
    const voters = offlineStorage.getLocalVoters();
    setPendingVotesCount(pending.length);
    setCachedVotersCount(voters.length);
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

  const installApp = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return {
    isOnline,
    isInstallable,
    isInstalled,
    installApp,
    pendingVotesCount,
    cachedVotersCount,
    isSyncing,
    lastSyncTime,
    syncOfflineData,
    refreshCounts,
  };
}
