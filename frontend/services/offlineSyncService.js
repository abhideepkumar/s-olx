// Offline message synchronization service
class OfflineSyncService {
  constructor() {
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.syncInterval = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Back online - starting sync');
      this.startSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Gone offline - stopping sync');
      this.stopSync();
    });

    // Start sync if already online
    if (this.isOnline) {
      this.startSync();
    }
  }

  startSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync immediately
    this.syncOfflineMessages();

    // Then sync every 30 seconds
    this.syncInterval = setInterval(() => {
      this.syncOfflineMessages();
    }, 30000);
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncOfflineMessages() {
    if (!this.isOnline) {
      return;
    }

    try {
      const offlineMessages = this.getOfflineMessages();
      if (offlineMessages.length === 0) {
        return;
      }

      console.log(`Syncing ${offlineMessages.length} offline messages`);

      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No auth token - skipping sync');
        return;
      }

      const syncedMessages = [];
      const failedMessages = [];

      for (const message of offlineMessages) {
        try {
          await this.syncSingleMessage(message, token);
          syncedMessages.push(message);
        } catch (error) {
          console.error('Failed to sync message:', message.messageId, error);
          failedMessages.push(message);
        }
      }

      // Remove successfully synced messages
      if (syncedMessages.length > 0) {
        this.removeSyncedMessages(syncedMessages);
        console.log(`Successfully synced ${syncedMessages.length} messages`);
      }

      // Keep failed messages for retry
      if (failedMessages.length > 0) {
        console.log(`${failedMessages.length} messages failed to sync - will retry later`);
      }

    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  async syncSingleMessage(message, token) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/v1/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomId: message.roomId,
        content: {
          text: message.message,
          type: 'text'
        },
        receiverId: message.receiverId || 'unknown',
        metadata: {
          syncedFromOffline: true,
          originalMessageId: message.messageId,
          storedAt: message.storedAt
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  getOfflineMessages() {
    try {
      const stored = localStorage.getItem('offlineMessages');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline messages:', error);
      return [];
    }
  }

  removeSyncedMessages(syncedMessages) {
    try {
      const allMessages = this.getOfflineMessages();
      const remainingMessages = allMessages.filter(
        msg => !syncedMessages.some(synced => synced.messageId === msg.messageId)
      );
      localStorage.setItem('offlineMessages', JSON.stringify(remainingMessages));
    } catch (error) {
      console.error('Failed to remove synced messages:', error);
    }
  }

  addOfflineMessage(message) {
    try {
      const offlineMessages = this.getOfflineMessages();
      offlineMessages.push({
        ...message,
        storedAt: new Date().toISOString(),
        needsSync: true
      });
      localStorage.setItem('offlineMessages', JSON.stringify(offlineMessages));
    } catch (error) {
      console.error('Failed to add offline message:', error);
    }
  }

  getOfflineMessageCount() {
    return this.getOfflineMessages().length;
  }

  clearOfflineMessages() {
    localStorage.removeItem('offlineMessages');
  }

  // Manual sync trigger
  async forceSync() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    await this.syncOfflineMessages();
  }
}

// Create singleton instance
const offlineSyncService = new OfflineSyncService();
export default offlineSyncService;
