export interface ScheduleItem {
  id: string;
  title: string;
  isDeepWork: boolean;
  completed: boolean;
  startTime?: string; // HH:mm format, optional
  endTime?: string; // HH:mm format, optional
  location?: string; // Optional
  notes?: string;
  order: number; // For manual sorting
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD format
  items: ScheduleItem[];
}

export type ScheduleAction =
  | { type: "ADD_ITEM"; payload: ScheduleItem }
  | { type: "UPDATE_ITEM"; payload: { id: string; updates: Partial<ScheduleItem> } }
  | { type: "DELETE_ITEM"; payload: string } // id
  | { type: "REORDER_ITEMS"; payload: ScheduleItem[] }
  | { type: "TOGGLE_COMPLETE"; payload: string } // id
  | { type: "CLEAR_SCHEDULE" }
  | { type: "LOAD_SCHEDULE"; payload: DaySchedule };
