# Phase 34: Export & Polish - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the ability for coaches to export their team's captured analytics data (playing time, performance, participation) into professional PDF reports and portable CSV files. It also includes final UI refinements to ensure the "Athletic Professional" aesthetic is consistent and accessible, specifically in dark mode.

</domain>

<decisions>
## Implementation Decisions

### Export Architecture
- **D-01: Server-side Generation.** All PDF and CSV generation will be handled by the backend (NestJS API). This ensures high-quality PDF rendering and supports future capabilities like scheduled email reports.
- **D-02: Export Modal/Configuration.** Coaches will be presented with a selection modal to choose their export preferences (format, scope, detail level) before the file is generated and downloaded.

### PDF Summary Scope & Layout
- **D-03: Multiple Layout Options.** The system must support generating different types of PDF reports based on user choice:
    - **Team Overview**: A high-level summary of season totals and team-wide trends.
    - **Full Team & Player Pack**: Multi-page report including individual player profile pages.
    - **Tabular Data**: A clean, text-focused tabular report.
- **D-04: Visuals Toggle.** Users can choose whether to include charts (Minutes distribution, heatmaps) in the PDF.

### CSV Data Granularity
- **D-05: Detail Selection.** Coaches can choose the granularity of the CSV data:
    - **Aggregated Totals**: One row per player with season-long stats.
    - **Per-Game Breakdown**: One row per player per game for detailed external analysis.

### UI Polish
- **D-06: Dark Mode Accessibility.** Primary polish effort will focus on ensuring high contrast and perfect readability of all analytics views (charts, heatmaps, badges) in Dark Mode, adhering to the "Athletic Professional" theme tokens.
- **D-07: Mobile Chart Refinement.** Analytics visualizations (specifically heatmaps and minutes-distribution charts) must be optimized for one-handed phone use and high-density mobile displays.

### Claude's Discretion
- Specific choice of backend libraries (e.g., `pdfkit`, `exceljs`, or `puppeteer`).
- Specific data mapping for the CSV columns (ensuring all relevant metrics are included).
- Implementation of the "Export" button placement within the Team Analytics dashboard.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Standards
- `ROADMAP.md` — Phase 34 goals and success criteria.
- `libs/client/ui/theme/src/lib/theme/theme.css` — "Athletic Professional" color tokens.

### Data & Logic
- `apps/frontend/src/app/teams/team-dashboard/analytics/analytics.ts` — Existing analytics data fetching logic.
- `apps/api/src/analytics/analytics.controller.ts` — Existing backend analytics endpoints.
- `libs/client/data-access/team/src/lib/analytics.service.ts` — Frontend analytics service.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AnalyticsService` (Frontend): Already aggregates performance and participation data.
- `PerformanceMetricsService` (Backend): Provides raw aggregation logic for stats.
- `PlayingTimeService` (Backend): Calculates minutes and positions.

### Established Patterns
- **Signal-based state**: Used for dashboard UI. Export modal should follow this.
- **Ionic/Capacitor**: Downloads should work seamlessly in both web and native (Capacitor Filesystem/Browser plugins).

### Integration Points
- `AnalyticsController`: Needs new endpoints for `@Get('analytics/export/pdf')` and `@Get('analytics/export/csv')`.
- `TeamAnalytics` (Frontend): Needs an "Export" action button and configuration modal.

</code_context>

<specifics>
## Specific Ideas
- The PDF should look like a professional "Scouting Report" or "Season Recap".
- Heatmaps in the PDF should mirror the look and feel of the on-screen analytics dashboard.

</specifics>

<deferred>
## Deferred Ideas
- **Raw Event Log Export**: Deferred to a future data-science focused phase.
- **Automated Email Reports**: Out of scope for this phase.
- **Excel (.xlsx) support**: Sticking to CSV for simplicity and compatibility in v1.

</deferred>

---

*Phase: 34-export-polish*
*Context gathered: 2026-05-12*
