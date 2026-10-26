import { secureStorage } from './secureStorage';

export interface OfflineMutation {
  id: string;
  type: 'TOGGLE_ITEM';
  itemId: string;
  targetState?: boolean;
  timestamp: number;
}

class OfflineSyncQueue {
  private queue: OfflineMutation[] = [];
  private isSyncing = false;
  private isInitialized = false;
  private listeners: Array<(pendingCount: number) => void> = [];

  /**
   * Initializes queue from persistent storage on startup
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const persisted = await secureStorage.getQueue();
      if (Array.isArray(persisted)) {
        this.queue = persisted;
      }
    } catch {
      // Keep memory fallback
    } finally {
      this.isInitialized = true;
      this.notify();
    }
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  public subscribe(listener: (pendingCount: number) => void): () => void {
    this.listeners.push(listener);
    listener(this.queue.length);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const count = this.queue.length;
    this.listeners.forEach((l) => l(count));
  }

  public queueItemToggle(itemId: string, targetState?: boolean): void {
    // Coalesce if an existing mutation for the same itemId is already pending
    const existing = this.queue.find((m) => m.itemId === itemId);
    if (existing) {
      existing.targetState = targetState;
      existing.timestamp = Date.now();
    } else {
      this.queue.push({
        id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'TOGGLE_ITEM',
        itemId,
        targetState,
        timestamp: Date.now(),
      });
    }

    // Persist to secure storage across app restarts
    secureStorage.setQueue(this.queue).catch(() => {});
    this.notify();
  }

  public async flush(
    executor: (mutation: OfflineMutation) => Promise<boolean>
  ): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || this.queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    const remaining: OfflineMutation[] = [];

    for (const mutation of this.queue) {
      try {
        const success = await executor(mutation);
        if (success) {
          synced++;
        } else {
          remaining.push(mutation);
          failed++;
        }
      } catch {
        remaining.push(mutation);
        failed++;
      }
    }

    this.queue = remaining;
    this.isSyncing = false;
    secureStorage.setQueue(this.queue).catch(() => {});
    this.notify();

    return { synced, failed };
  }

  public clear(): void {
    this.queue = [];
    secureStorage.setQueue([]).catch(() => {});
    this.notify();
  }
}

export const offlineSyncQueue = new OfflineSyncQueue();
offlineSyncQueue.init();
