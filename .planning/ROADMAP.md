# Roadmap: Apex Team

## Milestone v1.7: Drill Import Foundation

**Goal**: Enhance the Drill Library with import capabilities to leverage AI-generated content.

## Phases

- [ ] **Phase 27: Import API & Validation** - Backend endpoint for importing drills with strict JSON validation.
- [ ] **Phase 28: Drill Import UI** - Frontend interface for pasting JSON and uploading files in the Drill Library.

## Phase Details

### Phase 27: Import API & Validation
**Goal**: Provide a secure and validated way to ingest drill data from external sources.
**Depends on**: Milestone v1.6
**Requirements**: IMP-BE-01, IMP-BE-02, IMP-BE-03
**Success Criteria** (what must be TRUE):
  1. `POST /api/drills/import` successfully creates a drill from a valid JSON body.
  2. Missing `name` or `instructions` results in a 400 Bad Request.
  3. Non-existent tags in the import are automatically created and linked.

### Phase 28: Drill Import UI
**Goal**: Allow coaches to use the import feature without touching the API.
**Depends on**: Phase 27
**Requirements**: IMP-FE-01, IMP-FE-02, IMP-FE-03, IMP-FE-04
**Success Criteria** (what must be TRUE):
  1. "Import" button appears in the Drill Library.
  2. User can toggle between "Paste JSON" and "Upload File".
  3. Preview shows the drill's name and instructions before final confirmation.
  4. Successful import redirects to the new drill's detail view.

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 23. iCal Sync Integration | 2/2 | Completed | 2026-05-05 |
| 24. Recurring Events | 2/2 | Completed | 2026-05-05 |
| 25. Weather Integration | 1/1 | Completed | 2026-05-05 |
| 26. Structured Locations | 1/1 | Completed | 2026-05-05 |
| 27. Import API & Validation | 2/2 | Completed | 2026-05-05 |
| 28. Drill Import UI | 1/1 | Completed | 2026-05-05 |
