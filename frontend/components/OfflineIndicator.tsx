'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import offlineSyncService from '../services/offlineSyncService';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineCount(offlineSyncService.getOfflineMessageCount());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial offline count
    setOfflineCount(offlineSyncService.getOfflineMessageCount());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) return;

    setIsSyncing(true);
    try {
      await offlineSyncService.forceSync();
      setOfflineCount(offlineSyncService.getOfflineMessageCount());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && offlineCount === 0) {
    return null; // Don't show anything when online and no offline messages
  }

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline 
        ? 'bg-orange-100 border border-orange-200' 
        : 'bg-red-100 border border-red-200'
    }`}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <>
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''} text-orange-600`} />
            <span className="text-sm text-orange-800">
              {offlineCount} message{offlineCount !== 1 ? 's' : ''} pending sync
            </span>
            {offlineCount > 0 && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="text-xs bg-orange-200 hover:bg-orange-300 px-2 py-1 rounded transition-colors"
              >
                {isSyncing ? 'Syncing...' : 'Sync'}
              </button>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">Offline mode</span>
          </>
        )}
      </div>
    </div>
  );
}
