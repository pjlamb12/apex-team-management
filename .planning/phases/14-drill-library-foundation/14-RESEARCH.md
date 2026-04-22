# Phase 14: Drill Library Foundation - Research

**Researched:** 2026-04-21
**Domain:** Content Libraries, Tagging, Media Embedding, Multi-Step Instructions
**Confidence:** HIGH

## Summary

Phase 14 focuses on building a searchable repository of drills ("Drill Library") that coaches can manage as their personal playbook. The core architecture relies on a **Many-to-Many** relationship between `Drill` and `Tag` entities, and a **JSONB**-backed instruction set to handle multi-step drills without the overhead of complex relational schemas.

For media handling, we will leverage official Angular components for YouTube and sanitization-safe computed signals for Vimeo/external URLs. The UI will use standard Ionic 8 components (chips + input) powered by Angular 21 Signals to provide a modern "Athletic Professional" tagging experience.

**Primary recommendation:** Use TypeORM's `JsonContains` and `In` operators for efficient backend filtering, and compose the frontend tag input from `ion-chip` and `ion-input` with Signals rather than importing a heavy third-party library.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Drill Persistence | API / Backend | Database | Postgres stores JSONB instructions and M2M tags. |
| Tag Search/Filtering | API / Backend | Database | QueryBuilder handles OR/AND tag logic and ILike search. |
| Media Embedding | Browser / Client | — | Official YouTube component and sanitized iframes for Vimeo. |
| Step Management | Browser / Client | — | Reactive Forms with `FormArray` for dynamic instructions. |
| Global Tag Management| API / Backend | Database | Coach-level tags persisted for cross-team reuse. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `typeorm` | 0.3.28 | ORM / Querying | Native support for `JsonContains` and `In` filters. |
| `@angular/youtube-player` | ~21.2.0 | YouTube Video Support | Official Angular component; handles IFrame API safely. |
| `ionic/angular` | 8.8.4 | UI Components | `ion-chip` and `ion-input` for tagging UX. |
| `ngx-reactive-forms-utils`| 5.1.0 | Form Validation | Automated error display for drill editor fields. [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `ajv` | 8.18.0 | JSONB Validation | Validating instruction step schema on the API. |
| `dom-sanitizer` | (built-in) | Security | Sanitizing external URLs for Vimeo/PDF iframes. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `jsonb` instructions | `DrillStep` entity | Too much relational overhead for a simple list of steps. |
| Tag library (e.g. `ngx-chips`) | Custom Ionic composition | Custom is more lightweight and aligns with Angular 21 Signals. |
| Rich Text (CKEditor/Quill) | Structured Steps | JSONB steps are easier to style consistently in mobile/PWA. |

**Installation:**
```bash
npm install @angular/youtube-player@~21.2.0
```

## Architecture Patterns

### Recommended Project Structure
```
libs/client/data-access/
└── drill/              # Drill state & API services
libs/client/feature/
└── drill-library/      # List, Search, Detail, Editor views
apps/api/src/drills/
├── entities/
│   ├── drill.entity.ts # includes instructions: any[]
│   └── tag.entity.ts   # coach-level tags
└── drills.service.ts   # QueryBuilder filtering logic
```

### Pattern 1: Many-to-Many Tag Filtering (OR Logic)
**What:** Finding drills that have *any* of the selected tags.
**When to use:** Default library browse view.
**Example:**
```typescript
// Source: https://typeorm.io/find-options
const drills = await drillRepository.find({
  where: {
    tags: {
      id: In(tagIds) 
    }
  },
  relations: ['tags']
});
```

### Pattern 2: Signal-Based Video Sanitization
**What:** Using `computed` signals to sanitize Vimeo/external URLs.
**When to use:** Displaying drill media from `sourceUrl`.
**Example:**
```typescript
// Source: https://angular.dev/api/platform-browser/DomSanitizer
protected safeUrl = computed<SafeResourceUrl>(() => {
  const url = `https://player.vimeo.com/video/${this.videoId()}`;
  return this.sanitizer.bypassSecurityTrustResourceUrl(url);
});
```

### Anti-Patterns to Avoid
- **Hand-Rolling YouTube Player:** Don't use raw iframes for YouTube; the official component handles API loading and race conditions.
- **Global `*ngIf` Errors:** Avoid manual error blocks; use `ControlErrorsDisplayComponent` from `ngx-reactive-forms-utils`.
- **Filtering Tags in Memory:** Always filter tags on the database tier to support pagination and performance.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video Players | Custom IFrame wrappers | `@angular/youtube-player` | Handles API loading and security correctly. |
| Tag Input | Heavy 3rd-party tag lib | `ion-chip` + `ion-input` | Native Ionic components are more PWA-friendly and easy to theme. |
| Searching | Manual JSON parsing | `JsonContains` (TypeORM) | Offloads search complexity and performance to Postgres. |

## Common Pitfalls

### Pitfall 1: "Selected Tag" Ghosting
**What goes wrong:** When filtering by Tag A, the returned Drill object only contains Tag A in its `tags` array, even if it has Tags A, B, and C.
**Why it happens:** TypeORM's `leftJoinAndSelect` with a `where` clause on the joined table filters the *joined records* as well as the parent.
**How to avoid:** Use a double join in `QueryBuilder` — one `innerJoin` for filtering and one `leftJoinAndSelect` for loading the full tag list.

### Pitfall 2: Sanitization Performance
**What goes wrong:** Sanitizing URLs on every change detection cycle leads to performance lag.
**Why it happens:** Using a method in the template like `[src]="getSafeUrl()"` triggers re-execution constantly.
**How to avoid:** Use Angular 21's **`computed` signals**; sanitization only runs when the input `videoId` changes.

## Code Examples

### Custom Tag Input (Angular 21 + Signals)
```typescript
// Source: [CITED: ionicframework.com/docs/api/chip]
@Component({
  selector: 'app-tag-input',
  template: `
    <div class="flex flex-wrap border rounded p-2">
      @for (tag of tags(); track tag) {
        <ion-chip (click)="removeTag(tag)">
          <ion-label>{{ tag.name }}</ion-label>
          <ion-icon name="close-circle" />
        </ion-chip>
      }
      <ion-input 
        (keydown.enter)="addTag($event)" 
        placeholder="Add tag..." 
        fill="none" />
    </div>
  `,
  imports: [IonChip, IonLabel, IonIcon, IonInput]
})
export class TagInput {
  tags = signal<Tag[]>([]);
  // ... signal update logic ...
}
```

### GIN Index for JSONB Search
```typescript
// Source: [CITED: typeorm.io/entities#indices]
@Entity()
export class Drill {
  @Column('jsonb')
  instructions: { title: string; description: string }[];

  // Note: GIN index for efficient instructions searching
  // Manual migration usually required for proper jsonb_ops in TypeORM
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Coaches prefer structured steps over free-text markdown for drills. | Architectural Patterns | UI might be too rigid for complex drills. |
| A2 | Drills are coach-specific but managed in team context for UX. | Summary | Confusion over why drills show up across all teams. |
| A3 | Simple `ILike` search is sufficient for v1 library size. | Architecture Patterns | Performance issues if a coach has 1000+ drills (unlikely for v1). |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Application Runtime | ✓ | 25.2.1 | — |
| npm | Package Management | ✓ | 11.6.2 | — |
| PostgreSQL | Data Layer | ✓ | (Local) | Docker compose |
| Docker | Local Services | ✓ | (Detected) | Manual Postgres |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Playwright |
| Config file | `vitest.workspace.ts` |
| Quick run command | `nx test frontend` |
| Full suite command | `nx test frontend && nx test api` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DRIL-01 | Create drill with structured steps | integration | `nx test api` | ❌ Wave 0 |
| DRIL-02 | Tag drills and filter | unit | `nx test api` | ❌ Wave 0 |
| DRIL-04 | Browse and search library | e2e | `npx playwright test` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | `ajv` for JSONB steps; `class-validator` for DTOs. |
| V12 File/Media Security| yes | `DomSanitizer` for all external source URLs. |
| V4 Access Control | yes | Ensure `coach_id` ownership check on all drill CRUD. |

### Known Threat Patterns for content-libraries

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via sourceUrl | Tampering | `DomSanitizer.bypassSecurityTrustResourceUrl` |
| Unauthorized Drill Edit| Spoofing | Validate `userId` from JWT against `coach_id`. |
| Tag Database Injection | Tampering | TypeORM parameterized queries (automatic). |

## Sources

### Primary (HIGH confidence)
- `typeorm` - Native JSONB support and `In` operator logic. [VERIFIED: typeorm.io]
- `@angular/youtube-player` - Official support for YouTube in Angular. [VERIFIED: npm registry]
- `ionic-angular` - Chip and Input components. [CITED: ionicframework.com]

### Secondary (MEDIUM confidence)
- TypeORM Double-Join Filtering Strategy - Community-accepted fix for filtered relation returns. [CITED: stackoverflow.com]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified versions against registry and project config.
- Architecture: HIGH - M2M and JSONB are standard Postgres/TypeORM patterns.
- Pitfalls: HIGH - Documented common TypeORM/Angular security issues.

**Research date:** 2026-04-21
**Valid until:** 2026-05-21
