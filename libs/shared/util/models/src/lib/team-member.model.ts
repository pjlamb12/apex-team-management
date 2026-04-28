export enum TeamRole {
  HEAD_COACH = 'HEAD_COACH',
  ASSISTANT = 'ASSISTANT',
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
}
