import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket.service';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { AuthService } from '../../auth/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { io } from 'socket.io-client';

const mockSocketInstance = {
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocketInstance),
}));

describe('SocketService', () => {
  let service: SocketService;
  let mockConfig: { getConfigObjectKey: ReturnType<typeof vi.fn> };
  let mockAuth: { getToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketInstance.connected = false;

    mockConfig = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://localhost:3000/api'),
    };
    mockAuth = {
      getToken: vi.fn().mockReturnValue('mock-jwt-token'),
    };

    TestBed.configureTestingModule({
      providers: [
        SocketService,
        { provide: RuntimeConfigLoaderService, useValue: mockConfig },
        { provide: AuthService, useValue: mockAuth },
      ],
    });

    service = TestBed.inject(SocketService);
  });

  it('should create and initialize lifecycle listeners', () => {
    expect(service).toBeTruthy();
    expect(service.isConnected()).toBe(false);
  });

  it('should connect when token is present and socket is not created', () => {
    service.connect();

    expect(io).toHaveBeenCalledWith('http://localhost:3000', {
      auth: { token: 'mock-jwt-token' },
      transports: ['websocket'],
    });
  });

  it('should re-emit joinEvent and trigger reconnected$ on connect callback', () => {
    let reconnectedFired = false;
    service.reconnected$.subscribe(() => {
      reconnectedFired = true;
    });

    service.joinEvent('event-123');

    // Simulate socket.io 'connect' event handler execution
    const connectHandler = mockSocketInstance.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )?.[1];
    expect(connectHandler).toBeDefined();

    connectHandler();

    expect(service.isConnected()).toBe(true);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith('joinEvent', 'event-123');
    expect(reconnectedFired).toBe(true);
  });

  it('should handle visibilitychange and resume events by reconnecting or emitting reconnected$', () => {
    let reconnectedCount = 0;
    service.reconnected$.subscribe(() => {
      reconnectedCount++;
    });

    service.connect();
    mockSocketInstance.connected = true;
    service.joinEvent('event-123');

    // Trigger visibilitychange event
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(reconnectedCount).toBe(1);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith('joinEvent', 'event-123');
  });
});
