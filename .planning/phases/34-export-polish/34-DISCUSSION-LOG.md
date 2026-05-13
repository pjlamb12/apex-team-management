# Phase 34: Export & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 34-Export & Polish
**Areas discussed:** Export Engine Location, PDF Summary Scope & Layout, CSV Data Granularity, UI Polish Priorities

---

## Export Engine Location

| Option | Description | Selected |
|--------|-------------|----------|
| Frontend (Client-side) | Instant downloads using jspdf/papaparse. Uses data already in your browser. | |
| Backend (Server-side) | More robust for massive datasets. Generates files on the server using PDFKit or similar. | ✓ |

**User's choice:** Backend (Server-side)
**Notes:** Decided to go with a more robust server-side generation approach to ensure high-quality, professional outputs and potential future scalability.

---

## PDF Summary Scope & Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Team Overview Only | A single page with team totals, top performers, and attendance averages. | ✓ |
| Full Team & Player Pack | Team overview + a dedicated page for every player with their personal heatmap and stats. | ✓ |
| Tabular Data Only | Just a tabular list of stats without charts or fancy layout. | ✓ |

**User's choice:** User should be able to choose any of the three options.
**Notes:** The system will provide an export configuration modal where the coach can select the desired report depth.

---

## PDF Visuals

| Option | Description | Selected |
|--------|-------------|----------|
| Include Charts | Include charts (Minutes distribution, heatmaps). (Matches dashboard look) | ✓ |
| Text & Tables Only | Text and tables only. (Faster to generate, smaller file size) | ✓ |

**User's choice:** User should be able to choose either option.
**Notes:** Added as a toggle in the export configuration modal.

---

## CSV Data Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Aggregated Totals | One row per player with their season totals. | ✓ |
| Per-Game Breakdown | One row per player per game. Best for spreadsheet analysis. | ✓ |
| Raw Event Log | Every single recorded event (Subs, Goals, etc.). | |

**User's choice:** User should be able to choose Aggregated or Per-game depending on what they want.
**Notes:** Raw event log was deferred. The CSV export will offer the choice between the two primary granularity levels.

---

## UI Polish Priorities

| Option | Description | Selected |
|--------|-------------|----------|
| Dark Mode Accessibility | Ensure all charts and analytics have perfect contrast in dark mode. | ✓ |
| Mobile Chart Refinement | Optimizing heatmaps and bar charts for one-handed phone use. | ✓ |
| Animation & Loading Polish | Add Skeleton loaders and transition animations for that "premium" feel. | |

**User's choice:** Dark Mode Accessibility + Mobile Chart Refinement
**Notes:** The user requested both high-contrast dark mode accessibility and mobile-specific refinement for charts to ensure the professional look and feel carries through on handheld devices.

---

## Claude's Discretion
- Selection of specific backend libraries for PDF/CSV generation.
- UI implementation of the Export Configuration modal and triggers.

## Deferred Ideas
- Raw Event Log Export (for future data-science focus).
- Automated/Scheduled Email Reports.
- Excel (.xlsx) file format.
