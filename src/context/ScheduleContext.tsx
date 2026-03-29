"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
  useState,
} from "react";
import { DaySchedule, ScheduleItem, ScheduleAction } from "@/types";
import { useSession } from "next-auth/react";

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

    case "SET_ITEMS":
      return {
        ...state,
        items: action.payload,
      };

    default:
      return state;
  }
}

// Context type
interface ScheduleContextType {
  schedule: DaySchedule;
  isLoading: boolean;
  addItem: (item: ScheduleItem) => Promise<void>;
  updateItem: (id: string, updates: Partial<ScheduleItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  reorderItems: (items: ScheduleItem[]) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);

// Provider component
export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [schedule, dispatch] = useReducer(scheduleReducer, createEmptySchedule());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch schedule from API when session is available
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchSchedule = async () => {
      try {
        const today = getTodayString();
        const response = await fetch(`/api/schedule?date=${today}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch schedule");
        }

        const items = await response.json();
        dispatch({ type: "SET_ITEMS", payload: items });
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [session, status]);

  // Action creators with API calls and optimistic updates
  const addItem = useCallback(async (item: ScheduleItem) => {
    // Optimistic update
    dispatch({ type: "ADD_ITEM", payload: item });

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      // Rollback on error
      dispatch({ type: "DELETE_ITEM", payload: item.id });
      throw error;
    }
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<ScheduleItem>) => {
    // Store previous state for rollback
    const previousItems = schedule.items;
    
    // Optimistic update
    dispatch({ type: "UPDATE_ITEM", payload: { id, updates } });

    try {
      const response = await fetch(`/api/schedule/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      // Rollback on error
      dispatch({ type: "SET_ITEMS", payload: previousItems });
      throw error;
    }
  }, [schedule.items]);

  const deleteItem = useCallback(async (id: string) => {
    // Store the item for rollback
    const deletedItem = schedule.items.find((item) => item.id === id);
    
    // Optimistic update
    dispatch({ type: "DELETE_ITEM", payload: id });

    try {
      const response = await fetch(`/api/schedule/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      // Rollback on error
      if (deletedItem) {
        dispatch({ type: "ADD_ITEM", payload: deletedItem });
      }
      throw error;
    }
  }, [schedule.items]);

  const reorderItems = useCallback(async (items: ScheduleItem[]) => {
    // Store previous state for rollback
    const previousItems = schedule.items;
    
    // Optimistic update
    dispatch({ type: "REORDER_ITEMS", payload: items });

    try {
      const reorderData = items.map((item) => ({
        id: item.id,
        order: item.order,
      }));

      const response = await fetch("/api/schedule/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reorderData }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder items");
      }
    } catch (error) {
      console.error("Error reordering items:", error);
      // Rollback on error
      dispatch({ type: "SET_ITEMS", payload: previousItems });
      throw error;
    }
  }, [schedule.items]);

  const toggleComplete = useCallback(async (id: string) => {
    const item = schedule.items.find((i) => i.id === id);
    if (!item) return;

    const newCompleted = !item.completed;
    
    // Optimistic update
    dispatch({ type: "TOGGLE_COMPLETE", payload: id });

    try {
      const response = await fetch(`/api/schedule/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle complete");
      }
    } catch (error) {
      console.error("Error toggling complete:", error);
      // Rollback on error
      dispatch({ type: "TOGGLE_COMPLETE", payload: id });
      throw error;
    }
  }, [schedule.items]);

  const value: ScheduleContextType = {
    schedule,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    toggleComplete,
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
