import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { OfflineStorageService, SyncQueueItem } from './offline-storage.service';
import { NetworkStatusService } from './network-status.service';
import { TacticPlay } from '@apex-team/shared/util/models';

@Injectable({
  providedIn: 'root',
})
export class OfflineSyncService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly storage = inject(OfflineStorageService);
  private readonly network = inject(NetworkStatusService);

  private get apiUrl(): string {
    return (this.config.getConfigObjectKey('apiBaseUrl') as string) || '';
  }

  constructor() {
    // Refresh pending count on init
    this.refreshPendingCount();

    // Auto sync when online status changes to true
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncPendingMutations();
      });
    }
  }

  async refreshPendingCount(): Promise<number> {
    const queue = await this.storage.getSyncQueue();
    this.network.setPendingCount(queue.length);
    return queue.length;
  }

  async syncPendingMutations(): Promise<void> {
    if (!this.network.isOnline() || this.network.isSyncing()) {
      return;
    }

    const queue = await this.storage.getSyncQueue();
    if (queue.length === 0) {
      this.network.setPendingCount(0);
      return;
    }

    this.network.setSyncing(true);

    try {
      for (const item of queue) {
        if (!item.id) continue;

        try {
          await this.processQueueItem(item);
          await this.storage.removeSyncQueueItem(item.id);
        } catch (error) {
          console.warn('Failed to sync queue item, will retry later:', item, error);
          // Stop processing remaining items in case of network breakdown
          break;
        }
      }

      this.network.recordSyncSuccess();
    } finally {
      await this.refreshPendingCount();
      this.network.setSyncing(false);
    }
  }

  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    if (item.entity === 'play') {
      await this.processPlaySync(item);
    }
    // Add additional entities (drill, attendance, etc.) as needed
  }

  private async processPlaySync(item: SyncQueueItem): Promise<void> {
    const baseUrl = `${this.apiUrl}/tactics`;

    if (item.action === 'CREATE') {
      const serverPlay = await firstValueFrom(
        this.http.post<TacticPlay>(baseUrl, item.payload)
      );

      // Replace temporary offline play with server play in IndexedDB
      if (item.tempId && item.tempId !== serverPlay.id) {
        await this.storage.remove(this.storage.STORES.PLAYS, item.tempId);
      }
      await this.storage.save(this.storage.STORES.PLAYS, serverPlay);
    } else if (item.action === 'UPDATE' && item.entityId) {
      const updated = await firstValueFrom(
        this.http.patch<TacticPlay>(`${baseUrl}/${item.entityId}`, item.payload)
      );
      await this.storage.save(this.storage.STORES.PLAYS, updated);
    } else if (item.action === 'DELETE' && item.entityId) {
      await firstValueFrom(this.http.delete(`${baseUrl}/${item.entityId}`));
      await this.storage.remove(this.storage.STORES.PLAYS, item.entityId);
    }
  }
}
