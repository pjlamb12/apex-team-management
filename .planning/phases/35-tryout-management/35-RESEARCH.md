# Research: Tryout Management Feature

**Date:** 2026-05-12
**Status:** Initial Research

## Overview
The "Tryout Management" feature allows coaches to track prospective players (candidates) who are not yet part of a formal team roster. This involves capturing scouting notes, performance ratings, and attendance during tryout sessions, with the ultimate goal of selecting and onboarding new players.

## Core Requirements

### 1. Candidate Management
- **Model**: `Candidate` (distinct from `Player`). Candidates belong to a `Team` (for context) or a `Season`.
- **Fields**: Name, Age/Birth Year, Contact Info (Parent/Guardian), Current Club/Team, Position(s).
- **Status**: Registered, Attending, Selected, Declined, Waitlisted.

### 2. Tryout Events
- **Event Type**: `Tryout`. Similar to practices but with a focus on evaluation.
- **Attendance**: Track which candidates showed up to which session.

### 3. Scouting & Evaluations
- **Qualitative Notes**: Free-text fields for "Strengths", "Weaknesses", and general comments.
- **Quantitative Ratings**: 1-5 star ratings for specific categories (e.g., Technical, Tactical, Physical, Psychosocial).
- **Rubrics**: Ideally, the rating categories are configurable per sport/team.

### 4. Roster Conversion
- **Promotion**: A "Convert to Player" action that creates a `Player` record from a `Candidate` and adds them to the team roster.
- **Data Retention**: Transfer scouting notes to the player's profile for long-term tracking.

## Technical Considerations
- **Storage**: New `candidates` and `evaluations` tables in PostgreSQL.
- **API**: NestJS endpoints for CRUD on candidates and evaluations.
- **UI**: 
  - A new "Tryouts" section in the main navigation.
  - Candidate list with filtering/sorting by rating.
  - Evaluation form optimized for quick entry on a phone during a session.

## Next Steps
1. Define the database schema for Candidates and Evaluations.
2. Update `ROADMAP.md` with Milestone v3.0.
3. Update `PROJECT.md` with the new target features.
