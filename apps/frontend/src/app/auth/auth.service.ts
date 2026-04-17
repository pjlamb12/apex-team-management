import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly config = inject(RuntimeConfigLoaderService);

  protected readonly currentUser = signal<AuthUser | null>(this.loadUserFromStorage());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl');
  }

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<{ accessToken: string }>(`${this.apiUrl}/auth/login`, { email, password })
    );
    this.storeToken(response.accessToken);
    this.currentUser.set(this.decodeUser(response.accessToken));
    await this.router.navigate(['/home']);
  }

  async signup(email: string, password: string, displayName: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<{ accessToken: string }>(`${this.apiUrl}/auth/signup`, { email, password, displayName })
    );
    this.storeToken(response.accessToken);
    this.currentUser.set(this.decodeUser(response.accessToken));
    await this.router.navigate(['/home']);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  async refresh(): Promise<void> {
    // Called by interceptor when < 7 days remain (D-02)
    // Use native fetch() to avoid triggering the interceptor again (RESEARCH.md pitfall)
    const token = this.getToken();
    if (!token) return;
    const response = await fetch(`${this.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      this.logout();
      return;
    }
    const data = (await response.json()) as { accessToken: string };
    this.storeToken(data.accessToken);
    this.currentUser.set(this.decodeUser(data.accessToken));
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private loadUserFromStorage(): AuthUser | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      return this.decodeUser(token);
    } catch {
      return null;
    }
  }

  private decodeUser(token: string): AuthUser {
    // JWT payload is base64url-encoded in the second segment
    const payload = JSON.parse(atob(token.split('.')[1])) as {
      sub: string;
      email: string;
      displayName?: string;
    };
    return {
      id: payload.sub,
      email: payload.email,
      displayName: payload.displayName ?? '',
    };
  }
}
