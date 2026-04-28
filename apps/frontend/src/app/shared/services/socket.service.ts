import { inject, Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly auth = inject(AuthService);
  
  private socket: Socket | null = null;
  public readonly isConnected = signal(false);

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

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.auth.getToken();
    if (!token) return;

    this.socket = io(this.socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      console.log('Socket connected');
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
  }

  joinTeam(teamId: string): void {
    this.ensureConnected();
    this.socket?.emit('joinTeam', teamId);
  }

  leaveTeam(teamId: string): void {
    this.socket?.emit('leaveTeam', teamId);
  }

  joinEvent(eventId: string): void {
    this.ensureConnected();
    this.socket?.emit('joinEvent', eventId);
  }

  leaveEvent(eventId: string): void {
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
