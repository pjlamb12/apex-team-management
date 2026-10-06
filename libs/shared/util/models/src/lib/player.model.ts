// D-11: Pure TypeScript interface — no @Entity decorators
export interface Player {
  id: string;
  teamId?: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  preferredPosition?: string;
  isGuest?: boolean;
  isActive?: boolean;
}
