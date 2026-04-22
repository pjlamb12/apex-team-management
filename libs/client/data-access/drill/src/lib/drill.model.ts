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

export interface UpdateDrillDto extends Partial<CreateDrillDto> {}
