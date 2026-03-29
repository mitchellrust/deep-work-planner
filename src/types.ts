export type ItemType = "event" | "todo";

export interface ScheduleItem {
  id: string;
  type: ItemType;
  title: string;
  isDeepWork: boolean;
  completed: boolean; // For todos only
  startTime?: string; // HH:mm format, for events only
  endTime?: string; // HH:mm format, for events only
  location?: string; // For events only
  notes?: string;
  order: number; // For manual sorting, especially todos among events
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
