import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { safeFetchJson } from '../utils/apiClient';
import { OfflineAttendanceQueueItem } from '../types';

interface OfflineSyncBannerProps {
  onQueueSynced?: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ onQueueSynced }) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  const getStoredQueue = (): OfflineAttendanceQueueItem[] => {
    try {
      const stored = localStorage.getItem('attendit_offline_queue');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const updateQueueCount = () => {
    const q = getStoredQueue();
    setQueueCount(q.length);
  };

  const flushQueue = async () => {
    const queue = getStoredQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    try {
      const { ok, data } = await safeFetchJson('/api/session/batch-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue }),
      });

      if (ok && data?.success) {
        localStorage.removeItem('attendit_offline_queue');
        setQueueCount(0);
        setLastSyncMessage(`Synced ${data.syncedCount || queue.length} offline attendance records to cloud server.`);
        setTimeout(() => setLastSyncMessage(null), 5000);
        if (onQueueSynced) onQueueSynced();
      }
    } catch (err) {
      console.error('Failed to sync offline queue:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    updateQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      flushQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleStorageChange = () => {
      updateQueueCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(updateQueueCount, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && queueCount === 0 && !lastSyncMessage) {
    return null;
  }

  return (
    <div
      id="offline-sync-banner"
      className="w-full bg-slate-900 text-white px-4 py-2 text-xs transition-all border-b border-slate-800"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Wifi className="w-3.5 h-3.5" />
              <span>Connected to Attendit Network</span>
            </div>
          )}

          <span className="text-slate-400">|</span>

          {!isOnline ? (
            <span className="text-slate-300">
              Scans and actions will be saved locally ({queueCount} queued) and auto-replayed on reconnect.
            </span>
          ) : lastSyncMessage ? (
            <span className="text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {lastSyncMessage}
            </span>
          ) : queueCount > 0 ? (
            <span className="text-slate-300">
              {queueCount} offline scan record{queueCount > 1 ? 's' : ''} ready to synchronize.
            </span>
          ) : null}
        </div>

        {isOnline && queueCount > 0 && (
          <button
            onClick={flushQueue}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : `Sync Now (${queueCount})`}</span>
          </button>
        )}
      </div>
    </div>
  );
};
