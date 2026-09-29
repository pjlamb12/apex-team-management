# Quick Task Plan: Fix PWA Service Worker Updates & Stale Mobile Caching (007)

## Problem
On mobile devices (iOS Safari / installed PWA), the app repeatedly launches into older cached versions:
1. **Cache-first navigation (`performance`)**: Angular Service Worker defaults to `"navigationRequestStrategy": "performance"`, which always serves the cached `index.html` on initial launch and navigation without checking the network.
2. **Missing `activateUpdate()`**: In `apps/frontend/src/app/app.ts`, when `VERSION_READY` fired, `this._swUpdate.activateUpdate()` was never called. `window.location.reload()` simply reloaded the same old version from the active worker cache. The new worker could only activate if all browser processes and tabs running the app were terminated (swiping away the app).
3. **Suppressed `confirm()` dialogs**: iOS WebKit frequently suppresses native `confirm()` dialogs in standalone PWA mode.
4. **No update checks on app resume**: iOS suspends PWAs in memory when placed in background. When the coach returns days later, the app wakes up from memory without checking for updates.

## Solution Architecture

1. **Service Worker Navigation Strategy (`apps/frontend/src/ngsw-config.json`)**:
   - Set `"navigationRequestStrategy": "freshness"`.
   - When the user has network connectivity, the Service Worker requests `index.html` from the network first (with quick fallback to cache if offline).
   - Ensures online users immediately receive the latest application shell pointing to current JS bundles.

2. **Service Worker Lifecycle & In-App Update Notifications (`apps/frontend/src/app/app.ts`)**:
   - Inject `ToastController` from `@ionic/angular/standalone`.
   - On `VERSION_READY`:
     - Call `await this._swUpdate.activateUpdate()` so the waiting Service Worker takes over active control immediately.
     - Present an Ionic Toast: *"A new version of Apex Team is ready."* with action buttons:
       - **Update Now** (`window.location.reload()`)
       - **Later**
   - On `unrecoverable`:
     - Automatically call `window.location.reload()`.
   - Add visibility / focus hooks:
     - Listen to `document.visibilitychange` and window `focus` to call `this._swUpdate.checkForUpdate()` whenever the coach returns to the app.
   - Add periodic background check (every 30 minutes) while active.
   - Clean up event listeners in `ngOnDestroy()`.

3. **Unit Tests (`apps/frontend/src/app/app.spec.ts`)**:
   - Mock `ToastController` and `SwUpdate` methods (`activateUpdate`, `checkForUpdate`, `versionUpdates`, `unrecoverable`).
   - Verify `VERSION_READY` triggers `activateUpdate` and displays toast.
   - Verify `visibilitychange` triggers `checkForUpdate`.

4. **Verification**:
   - Run Vitest for `frontend`.
   - Run frontend production build to verify `ngsw.json` contains `"navigationRequestStrategy": "freshness"`.
