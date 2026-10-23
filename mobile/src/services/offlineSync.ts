export interface OfflineMutation {
  id: string;
  type: 'TOGGLE_ITEM';
  itemId: string;
  timestamp: number;
}

class OfflineSyncQueue {
  private queue: OfflineMutation[] = [];
  private isSyncing = false;
  private listeners: Array<(pendingCount: number) => void> = [];

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

  public queueItemToggle(itemId: string): void {
    this.queue.push({
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'TOGGLE_ITEM',
      itemId,
      timestamp: Date.now(),
    });
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
    this.notify();

    return { synced, failed };
  }

  public clear(): void {
    this.queue = [];
    this.notify();
  }
}

export const offlineSyncQueue = new OfflineSyncQueue();
