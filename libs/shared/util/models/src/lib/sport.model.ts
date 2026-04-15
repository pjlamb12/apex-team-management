// D-11: Pure TypeScript interface — no @Entity decorators
export interface Sport {
  id: string;
  name: string;
  positionTypes: string[];  // D-04: ["Goalkeeper", "Defender", "Midfielder", "Forward"]
  isEnabled: boolean;
}
