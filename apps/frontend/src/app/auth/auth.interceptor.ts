import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './auth.service';

// Module-level flag: prevents multiple concurrent refresh calls (RESEARCH.md deduplication)
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token) return next(req);

  // D-02: Sliding window — refresh if fewer than 7 days remain on the token
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp: number };
    const expiresAtMs = payload.exp * 1000; // exp is in seconds
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const timeRemainingMs = expiresAtMs - Date.now();

    if (timeRemainingMs < sevenDaysMs && !isRefreshing) {
      isRefreshing = true;
      // Refresh runs in background via fetch() — does not block current request
      authService
        .refresh()
        .catch(() => authService.logout())
        .finally(() => {
          isRefreshing = false;
        });
    }
  } catch {
    // Malformed token — let the request proceed; the guard will handle navigation
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq);
};
