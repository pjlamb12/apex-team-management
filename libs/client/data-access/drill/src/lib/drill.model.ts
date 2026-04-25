export interface Tag {
  id: string;
  coachId: string;
  name: string;
}

export interface Drill {
  id: string;
  coachId: string;
  name: string;
  description: string;
  sourceUrl?: string;
  instructions: any;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDrillDto {
  name: string;
  description: string;
  sourceUrl?: string;
  instructions: any;
  tagNames: string[];
}

export interface UpdateDrillDto extends Partial<CreateDrillDto> {
  lastUpdated?: string;
}

export interface PracticeDrill {
  id: string;
  eventId: string;
  drillId: string;
  sequence: number;
  durationMinutes: number;
  teamRating: number | null;
  notes: string | null;
  drill?: Drill;
}

export interface AddDrillToPlanDto {
  drillId: string;
  durationMinutes: number;
  notes?: string;
}

export interface UpdatePracticeDrillDto {
  sequence?: number;
  durationMinutes?: number;
  teamRating?: number;
  notes?: string;
}

export interface ReorderPracticeDrillsDto {
  ids: string[];
}
