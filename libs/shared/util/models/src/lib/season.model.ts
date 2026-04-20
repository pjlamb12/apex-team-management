// D-11: Pure TypeScript interface — no @Entity decorators
export interface Season {
  id: string;
  teamId: string;
  name: string;        // e.g. "Fall 2026"
  startDate: string;   // ISO date string
  endDate: string;     // ISO date string
  isActive: boolean;
  defaultHomeVenue?: string;
  defaultHomeColor?: string;
  defaultAwayColor?: string;
  defaultPracticeLocation?: string;
}
