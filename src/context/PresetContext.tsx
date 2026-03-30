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
import { Preset, PresetAction } from "@/types";
import { useSession } from "next-auth/react";

// Reducer function
function presetReducer(state: Preset[], action: PresetAction): Preset[] {
  switch (action.type) {
    case "ADD_PRESET":
      return [...state, action.payload];

    case "UPDATE_PRESET": {
      const { id, updates } = action.payload;
      return state.map((preset) =>
        preset.id === id ? { ...preset, ...updates } : preset
      );
    }

    case "DELETE_PRESET":
      return state.filter((preset) => preset.id !== action.payload);

    case "SET_PRESETS":
      return action.payload;

    default:
      return state;
  }
}

// Context type
interface PresetContextType {
  presets: Preset[];
  isLoading: boolean;
  addPreset: (preset: Preset) => Promise<void>;
  updatePreset: (id: string, updates: Partial<Preset>) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
}

const PresetContext = createContext<PresetContextType | undefined>(undefined);

// Provider component
export function PresetProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [presets, dispatch] = useReducer(presetReducer, []);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch presets from API when session is available
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchPresets = async () => {
      try {
        const response = await fetch("/api/presets");

        if (!response.ok) {
          throw new Error("Failed to fetch presets");
        }

        const data = await response.json();
        dispatch({ type: "SET_PRESETS", payload: data });
      } catch (error) {
        console.error("Error fetching presets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresets();
  }, [session, status]);

  // Action creators with API calls and optimistic updates
  const addPreset = useCallback(async (preset: Preset) => {
    // Optimistic update
    dispatch({ type: "ADD_PRESET", payload: preset });

    try {
      const response = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to add preset" }));
        throw new Error(errorData.error || "Failed to add preset");
      }
    } catch (error) {
      console.error("Error adding preset:", error);
      const message =
        error instanceof Error ? error.message : "Failed to add preset";
      alert(`Error adding preset: ${message}`);
      // Rollback on error
      dispatch({ type: "DELETE_PRESET", payload: preset.id });
      throw error;
    }
  }, []);

  const updatePreset = useCallback(
    async (id: string, updates: Partial<Preset>) => {
      // Store previous state for rollback
      const previousPresets = presets;

      // Optimistic update
      dispatch({ type: "UPDATE_PRESET", payload: { id, updates } });

      try {
        const response = await fetch(`/api/presets/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Failed to update preset" }));
          throw new Error(errorData.error || "Failed to update preset");
        }
      } catch (error) {
        console.error("Error updating preset:", error);
        const message =
          error instanceof Error ? error.message : "Failed to update preset";
        alert(`Error updating preset: ${message}`);
        // Rollback on error
        dispatch({ type: "SET_PRESETS", payload: previousPresets });
        throw error;
      }
    },
    [presets]
  );

  const deletePreset = useCallback(
    async (id: string) => {
      // Store the preset for rollback
      const deletedPreset = presets.find((preset) => preset.id === id);

      // Optimistic update
      dispatch({ type: "DELETE_PRESET", payload: id });

      try {
        const response = await fetch(`/api/presets/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Failed to delete preset" }));
          throw new Error(errorData.error || "Failed to delete preset");
        }
      } catch (error) {
        console.error("Error deleting preset:", error);
        const message =
          error instanceof Error ? error.message : "Failed to delete preset";
        alert(`Error deleting preset: ${message}`);
        // Rollback on error
        if (deletedPreset) {
          dispatch({ type: "ADD_PRESET", payload: deletedPreset });
        }
        throw error;
      }
    },
    [presets]
  );

  const value: PresetContextType = {
    presets,
    isLoading,
    addPreset,
    updatePreset,
    deletePreset,
  };

  return (
    <PresetContext.Provider value={value}>{children}</PresetContext.Provider>
  );
}

// Hook to use the preset context
export function usePresets() {
  const context = useContext(PresetContext);
  if (context === undefined) {
    throw new Error("usePresets must be used within a PresetProvider");
  }
  return context;
}
