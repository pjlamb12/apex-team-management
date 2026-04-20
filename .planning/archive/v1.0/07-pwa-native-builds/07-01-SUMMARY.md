---
phase: 07-pwa-native-builds
plan: "01"
subsystem: pwa-capacitor-init
tags: [pwa, capacitor, service-worker, manifest]
dependency_graph:
  requires: ["06-08"]
  provides: [pwa-manifest, service-worker-config, capacitor-init]
  affects: [app.config.ts, project.json, index.html]
tech_stack:
  added: ["@angular/service-worker", "@capacitor/core", "@capacitor/cli", "@capacitor/android", "@capacitor/ios"]
  patterns: [PWA-manifest, ngsw-config]
key_files:
  created:
    - apps/frontend/src/manifest.webmanifest
    - apps/frontend/src/ngsw-config.json
    - capacitor.config.ts
  modified:
    - apps/frontend/src/app/app.config.ts
    - apps/frontend/src/index.html
    - apps/frontend/project.json
    - package.json
decisions:
  - "Manually configured PWA assets instead of using ng-add due to Nx compatibility issues"
  - "Used dist/apps/frontend/browser as the webDir in capacitor.config.ts to match Angular 21 build output"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-04-19"
  tasks_completed: 4
  tasks_total: 4
---

# Phase 07 Plan 01: PWA and Capacitor Initialization Summary

PWA manifest, service worker, and icons configured; Capacitor core and native platforms initialized with project-specific build routing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Initialize PWA assets | d3f1b4c | manifest.webmanifest, ngsw-config.json |
| 2 | Register PWA in app | e8a2b1f | app.config.ts, index.html, project.json |
| 3 | Install & Init Capacitor | a4c2b1e | package.json, capacitor.config.ts |
| 4 | Add Nx Capacitor targets | f7d3a2b | apps/frontend/project.json |

## What Was Built

### Task 1 — PWA Assets

Created the foundational PWA configuration files:
- `apps/frontend/src/manifest.webmanifest`: Defines app identity, colors, and start URL.
- `apps/frontend/src/ngsw-config.json`: Configures caching strategies for the service worker.

### Task 2 — App Registration

Integrated the PWA into the Angular application lifecycle:
- `app.config.ts`: Added `provideServiceWorker()` with production-only enablement.
- `index.html`: Linked the manifest and defined `theme-color`.
- `project.json`: Updated the `build` target to include the manifest in assets and point to the `serviceWorker` config.

### Task 3 — Capacitor Initialization

Established the foundation for native mobile builds:
- Installed `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, and `@capacitor/ios`.
- Generated `capacitor.config.ts` with `appId: 'com.apexteam.app'` and correctly mapped `webDir`.

### Task 4 — Nx Integration

Added convenience targets to the frontend project for easier developer workflow:
- `nx cap frontend`: Runs `npx cap sync` to synchronize web assets and plugins.
- `nx cap-copy frontend`: Runs `npx cap copy` for faster asset-only updates.

## Verification Results

- `npx nx build frontend --configuration=production`: **SUCCESS**
- `ls dist/apps/frontend/browser/manifest.webmanifest`: **EXISTS**
- `ls dist/apps/frontend/browser/ngsw.json`: **EXISTS**
- `npx cap sync`: **SUCCESS** (confirmed it reads from the correct output directory)

## Self-Check: PASSED

- [x] manifest.webmanifest exists and is linked in index.html
- [x] provideServiceWorker added to app.config.ts
- [x] capacitor.config.ts correctly points to `dist/apps/frontend/browser`
- [x] Build output contains all PWA artifacts
