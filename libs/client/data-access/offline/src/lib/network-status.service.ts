import { Injectable, signal, NgZone, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NetworkStatusService {
  private readonly ngZone = inject(NgZone);

  readonly isOnline = signal<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  readonly isSyncing = signal<boolean>(false);
  readonly pendingSyncCount = signal<number>(0);
  readonly lastSyncTime = signal<Date | null>(null);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.ngZone.run(() => {
          this.isOnline.set(true);
        });
      });

      window.addEventListener('offline', () => {
        this.ngZone.run(() => {
          this.isOnline.set(false);
        });
      });
    }
  }

  setOnlineStatus(online: boolean): void {
    this.isOnline.set(online);
  }

  setSyncing(syncing: boolean): void {
    this.isSyncing.set(syncing);
  }

  setPendingCount(count: number): void {
    this.pendingSyncCount.set(count);
  }

  recordSyncSuccess(): void {
    this.lastSyncTime.set(new Date());
  }
}
