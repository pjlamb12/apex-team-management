import { TestBed } from '@angular/core/testing';
import { OfflineStorageService } from './offline-storage.service';
import { NetworkStatusService } from './network-status.service';
import { OfflineSyncService } from './offline-sync.service';
import { HttpClient } from '@angular/common/http';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Offline Services', () => {
  let storageService: OfflineStorageService;
  let networkService: NetworkStatusService;
  let syncService: OfflineSyncService;
  let mockHttp: any;
  let mockConfig: any;

  beforeEach(() => {
    mockHttp = {
      post: vi.fn().mockReturnValue(of({ id: 'srv_1', title: 'Synced Play' })),
      patch: vi.fn().mockReturnValue(of({ id: 'srv_1', title: 'Updated Play' })),
      delete: vi.fn().mockReturnValue(of(null)),
    };

    mockConfig = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://localhost:3000/api'),
    };

    TestBed.configureTestingModule({
      providers: [
        OfflineStorageService,
        NetworkStatusService,
        OfflineSyncService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: RuntimeConfigLoaderService, useValue: mockConfig },
      ],
    });

    storageService = TestBed.inject(OfflineStorageService);
    networkService = TestBed.inject(NetworkStatusService);
    syncService = TestBed.inject(OfflineSyncService);
  });

  it('should initialize network status correctly', () => {
    expect(networkService.isOnline()).toBeDefined();
    networkService.setOnlineStatus(false);
    expect(networkService.isOnline()).toBe(false);
    networkService.setOnlineStatus(true);
    expect(networkService.isOnline()).toBe(true);
  });

  it('should manage pending sync counters and sync state', () => {
    networkService.setPendingCount(3);
    expect(networkService.pendingSyncCount()).toBe(3);
    networkService.setSyncing(true);
    expect(networkService.isSyncing()).toBe(true);
  });

  it('should provide offline storage CRUD and store constants', () => {
    expect(storageService.STORES.PLAYS).toBe('plays');
    expect(storageService.STORES.DRILLS).toBe('drills');
    expect(storageService.STORES.TEAMS).toBe('teams');
    expect(storageService.STORES.PLAYERS).toBe('players');
    expect(storageService.STORES.EVENTS).toBe('events');
    expect(storageService.STORES.SYNC_QUEUE).toBe('sync_queue');
  });
});
