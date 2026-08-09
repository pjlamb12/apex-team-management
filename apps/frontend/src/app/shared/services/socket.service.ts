import { inject, Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { AuthService } from '../../auth/auth.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly auth = inject(AuthService);
  
  private socket: Socket | null = null;
  public readonly isConnected = signal(false);

  private readonly _reconnected$ = new Subject<void>();
  public readonly reconnected$ = this._reconnected$.asObservable();

  private activeEventId: string | null = null;
  private activeTeamId: string | null = null;
  private listenersInitialized = false;

  private get socketUrl(): string {
    const url = this.config.getConfigObjectKey('apiBaseUrl') as string;
    // If apiBaseUrl is http://localhost:3000/api, we want http://localhost:3000
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch {
      return url.replace('/api', '');
    }
  }

  constructor() {
    this.setupLifecycleListeners();
  }

  private setupLifecycleListeners(): void {
    if (this.listenersInitialized) return;
    this.listenersInitialized = true;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.handleAppResume();
        }
      });
      document.addEventListener('resume', () => {
        this.handleAppResume();
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.handleAppResume();
      });
      window.addEventListener('online', () => {
        this.handleAppResume();
      });
    }
  }

  private handleAppResume(): void {
    const token = this.auth.getToken();
    if (!token) return;

    if (!this.socket || !this.socket.connected) {
      this.connect();
    } else {
      if (this.activeEventId) {
        this.socket.emit('joinEvent', this.activeEventId);
      }
      if (this.activeTeamId) {
        this.socket.emit('joinTeam', this.activeTeamId);
      }
      this._reconnected$.next();
    }
  }

  connect(): void {
    const token = this.auth.getToken();
    if (!token) return;

    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return;
    }

    this.socket = io(this.socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      console.log('Socket connected');
      
      if (this.activeEventId) {
        this.socket?.emit('joinEvent', this.activeEventId);
        console.log(`Rejoined event room: ${this.activeEventId}`);
      }
      if (this.activeTeamId) {
        this.socket?.emit('joinTeam', this.activeTeamId);
        console.log(`Rejoined team room: ${this.activeTeamId}`);
      }

      this._reconnected$.next();
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected.set(false);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeEventId = null;
    this.activeTeamId = null;
  }

  joinTeam(teamId: string): void {
    this.activeTeamId = teamId;
    this.ensureConnected();
    this.socket?.emit('joinTeam', teamId);
  }

  leaveTeam(teamId: string): void {
    this.activeTeamId = null;
    this.socket?.emit('leaveTeam', teamId);
  }

  joinEvent(eventId: string): void {
    this.activeEventId = eventId;
    this.ensureConnected();
    this.socket?.emit('joinEvent', eventId);
  }

  leaveEvent(eventId: string): void {
    this.activeEventId = null;
    this.socket?.emit('leaveEvent', eventId);
  }

  onEvent<T>(eventName: string, callback: (data: T) => void): void {
    this.socket?.on(eventName, callback);
  }

  offEvent(eventName: string): void {
    this.socket?.off(eventName);
  }

  private ensureConnected(): void {
    if (!this.socket?.connected) {
      this.connect();
    }
  }
}

