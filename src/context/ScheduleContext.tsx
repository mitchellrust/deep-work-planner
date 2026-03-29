"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { DaySchedule, ScheduleItem, ScheduleAction } from "@/types";
import { useMidnightReset } from "@/hooks/useMidnightReset";

const STORAGE_KEY = "dwp-schedule";

// Helper to get today's date in YYYY-MM-DD format
function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

// Helper to create empty schedule for today
function createEmptySchedule(): DaySchedule {
  return {
    date: getTodayString(),
    items: [],
  };
}

// Reducer function
function scheduleReducer(
  state: DaySchedule,
  action: ScheduleAction
): DaySchedule {
  switch (action.type) {
    case "ADD_ITEM":
      return {
        ...state,
        items: [...state.items, action.payload],
      };

    case "UPDATE_ITEM": {
      const { id, updates } = action.payload;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      };
    }

    case "DELETE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };

    case "REORDER_ITEMS":
      return {
        ...state,
        items: action.payload,
      };

    case "TOGGLE_COMPLETE": {
      const id = action.payload;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        ),
      };
    }

    case "CLEAR_SCHEDULE":
      return createEmptySchedule();

    case "LOAD_SCHEDULE":
      return action.payload;

    default:
      return state;
  }
}

// Context type
interface ScheduleContextType {
  schedule: DaySchedule;
  addItem: (item: ScheduleItem) => void;
  updateItem: (id: string, updates: Partial<ScheduleItem>) => void;
  deleteItem: (id: string) => void;
  reorderItems: (items: ScheduleItem[]) => void;
  toggleComplete: (id: string) => void;
  clearSchedule: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);

// Provider component
export function ScheduleProvider({ children }: { children: ReactNode }) {
  // Always initialize with empty schedule to ensure server/client match
  const [schedule, dispatch] = useReducer(scheduleReducer, createEmptySchedule());

  // Load from localStorage after mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as DaySchedule;
      
      // Check if stored schedule is for today
      const today = getTodayString();
      if (parsed.date !== today) {
        // Old schedule - already have empty, no need to do anything
        return;
      }

      // Load the stored schedule
      dispatch({ type: "LOAD_SCHEDULE", payload: parsed });
    } catch (error) {
      console.error("Error loading schedule from localStorage:", error);
    }
  }, []);

  // Sync to localStorage whenever schedule changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    }
  }, [schedule]);

  // Auto-reset at midnight
  const handleMidnight = useCallback(() => {
    dispatch({ type: "CLEAR_SCHEDULE" });
  }, []);

  useMidnightReset(handleMidnight);

  // Action creators
  const addItem = useCallback((item: ScheduleItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<ScheduleItem>) => {
    dispatch({ type: "UPDATE_ITEM", payload: { id, updates } });
  }, []);

  const deleteItem = useCallback((id: string) => {
    dispatch({ type: "DELETE_ITEM", payload: id });
  }, []);

  const reorderItems = useCallback((items: ScheduleItem[]) => {
    dispatch({ type: "REORDER_ITEMS", payload: items });
  }, []);

  const toggleComplete = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_COMPLETE", payload: id });
  }, []);

  const clearSchedule = useCallback(() => {
    dispatch({ type: "CLEAR_SCHEDULE" });
  }, []);

  const value: ScheduleContextType = {
    schedule,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    toggleComplete,
    clearSchedule,
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}

// Hook to use the schedule context
export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }
  return context;
}
