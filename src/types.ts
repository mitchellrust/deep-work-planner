export interface ScheduleItem {
  id: string;
  userId?: string; // Set by the server from JWT, not sent by client
  date: string; // YYYY-MM-DD format
  title: string;
  isDeepWork: boolean;
  completed: boolean;
  startTime?: string; // HH:mm format, optional
  endTime?: string; // HH:mm format, optional
  location?: string; // Optional
  notes?: string;
  order: number; // For manual sorting
}

export interface Preset {
  id: string;
  userId?: string; // Set by the server from JWT, not sent by client
  title: string;
  isDeepWork: boolean;
  startTime?: string; // HH:mm format, optional
  endTime?: string; // HH:mm format, optional
  location?: string; // Optional
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  | { type: "SET_ITEMS"; payload: ScheduleItem[] };

export type PresetAction =
  | { type: "ADD_PRESET"; payload: Preset }
  | { type: "UPDATE_PRESET"; payload: { id: string; updates: Partial<Preset> } }
  | { type: "DELETE_PRESET"; payload: string } // id
  | { type: "SET_PRESETS"; payload: Preset[] };
