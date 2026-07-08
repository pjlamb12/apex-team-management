export interface SeasonChecklistItem {
  id: string;
  seasonId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface SeasonChecklistValue {
  id: string;
  playerId: string;
  itemId: string;
  value: string | null; // 'Yes', 'No', 'N/A', or null
  createdAt: string;
  updatedAt: string;
  item?: SeasonChecklistItem;
}
