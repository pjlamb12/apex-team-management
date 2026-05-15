# Phase 34: Export & Polish - Validation Plan

## Goal
Verify that the Apex Team application provides professional analytics reports (PDF/CSV) and a polished, accessible user interface in dark mode.

## Core Dimensions

### 1. Functional Integrity
- **CSV Export**: Verify that generated CSV files contain accurate, aggregated, and per-game data.
- **PDF Export**: Verify that generated PDF reports include all requested layouts (Overview, Player Pack, Tabular) and optional visuals (charts/heatmaps).
- **Mobile Sharing**: Ensure the native share sheet opens on mobile devices with the correct file attachments.

### 2. UI/UX & Accessibility
- **Dark Mode Audit**: Confirm that all analytics views have high contrast and perfect readability in dark mode.
- **Mobile Optimization**: Verify that charts and heatmaps are responsive and usable on one-handed mobile displays.

### 3. Security & Compliance
- **RBAC**: Ensure only authorized coaches can export data for their teams.
- **Data Privacy**: Verify that exports only contain data for the specified team and season.

## Automated Testing Strategy

### Backend (NestJS)
- **Unit Tests**: Test `CsvExportService` and `PdfExportService` in isolation.
- **E2E Tests**: Use supertest to hit export endpoints and verify response headers and content types.

### Frontend (Angular)
- **Unit Tests**: Test `ExportModalComponent` and `AnalyticsService` export triggers.
- **Playwright E2E**: Verify the "Export" button triggers the modal and that the configuration options are correctly passed to the backend.

## Manual Verification Protocol
1. **Visual PDF Check**: Open generated PDFs on various devices to verify layout consistency and chart rendering quality.
2. **Native Mobile Test**: Run the app on iOS/Android simulators/devices to verify Capacitor `@capacitor/share` integration.
3. **Dark Mode Toggle**: Manually toggle system dark mode and inspect all analytics screens for contrast issues.

## Success Criteria
- [ ] Backend returns valid CSV files with correct headers and data.
- [ ] Backend returns high-quality PDFs matching the "Athletic Professional" aesthetic.
- [ ] Frontend Export Modal correctly configures export requests.
- [ ] Mobile users can successfully share/download reports via the native OS share sheet.
- [ ] Zero high-severity contrast violations in Dark Mode.
