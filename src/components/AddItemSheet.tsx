"use client";

import { useState, useEffect, useRef } from "react";
import { ScheduleItem } from "@/types";
import { useSchedule } from "@/context/ScheduleContext";
import { nanoid } from "nanoid";

interface AddItemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  editItem?: ScheduleItem | null;
  prefillTime?: string; // HH:mm format
}

// Helper to calculate order for a new item
function calculateOrder(
  newItem: { startTime?: string; endTime?: string },
  existingItems: ScheduleItem[]
): number {
  // For items without start time, place at the end
  if (!newItem.startTime) {
    const maxOrder = existingItems.reduce((max, item) => Math.max(max, item.order), 0);
    return maxOrder + 1;
  }

  // For items with start time, find the correct position
  const sortedItems = [...existingItems].sort((a, b) => a.order - b.order);
  
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    
    // Skip items without start times (todos)
    if (!item.startTime) continue;
    
    // Compare start times
    if (newItem.startTime < item.startTime) {
      // New item starts before this item, place it before
      return i > 0 ? (sortedItems[i - 1].order + item.order) / 2 : item.order - 1;
    }
    
    if (newItem.startTime === item.startTime) {
      // Same start time - use end time to decide placement
      // If only one has an end time, the one without end time goes first
      const newHasEnd = !!newItem.endTime;
      const itemHasEnd = !!item.endTime;
      
      if (newHasEnd && !itemHasEnd) {
        // New item has end time, existing doesn't - place new below (after)
        const nextItem = sortedItems[i + 1];
        if (nextItem) {
          return (item.order + nextItem.order) / 2;
        } else {
          return item.order + 1;
        }
      } else if (!newHasEnd && itemHasEnd) {
        // Existing has end time, new doesn't - place new above (before)
        return i > 0 ? (sortedItems[i - 1].order + item.order) / 2 : item.order - 1;
      } else {
        // Both have end times or both don't - compare end times
        const newEndTime = newItem.endTime || newItem.startTime;
        const itemEndTime = item.endTime || item.startTime;
        
        if (newEndTime < itemEndTime) {
          // New item ends earlier, place above (before)
          return i > 0 ? (sortedItems[i - 1].order + item.order) / 2 : item.order - 1;
        } else {
          // New item ends same or later, place below (after)
          const nextItem = sortedItems[i + 1];
          if (nextItem) {
            return (item.order + nextItem.order) / 2;
          } else {
            return item.order + 1;
          }
        }
      }
    }
  }
  
  // If we get here, new item starts after all existing items
  const maxOrder = sortedItems.reduce((max, item) => Math.max(max, item.order), 0);
  return maxOrder + 1;
}

export function AddItemSheet({ isOpen, onClose, onSave, editItem, prefillTime }: AddItemSheetProps) {
  const { addItem, updateItem, deleteItem, schedule } = useSchedule();
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [isDeepWork, setIsDeepWork] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [timeError, setTimeError] = useState("");

  // Clear end time when start time is removed
  useEffect(() => {
    if (!startTime && endTime) {
      setEndTime("");
    }
  }, [startTime, endTime]);

  // Validate time fields
  useEffect(() => {
    if (startTime && endTime) {
      if (startTime > endTime) {
        setTimeError("Start time cannot be after end time");
      } else {
        setTimeError("");
      }
    } else {
      setTimeError("");
    }
  }, [startTime, endTime]);

  // Check if form has been modified (only relevant when editing)
  const hasChanges = editItem
    ? title.trim() !== editItem.title ||
      isDeepWork !== editItem.isDeepWork ||
      startTime !== (editItem.startTime || "") ||
      endTime !== (editItem.endTime || "") ||
      location.trim() !== (editItem.location || "") ||
      notes.trim() !== (editItem.notes || "")
    : true; // Always allow saving when creating new item

  // Reset form when opening/closing or changing edit item
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setTitle(editItem.title);
        setIsDeepWork(editItem.isDeepWork);
        setStartTime(editItem.startTime || "");
        setEndTime(editItem.endTime || "");
        setLocation(editItem.location || "");
        setNotes(editItem.notes || "");
      } else {
        setTitle("");
        setIsDeepWork(false);
        setStartTime(prefillTime || "");
        setEndTime("");
        setLocation("");
        setNotes("");
      }
      setTimeError("");
      // Focus title input
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, editItem, prefillTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    if (timeError) return;

    const itemData: Partial<ScheduleItem> = {
      title: title.trim(),
      isDeepWork,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (editItem) {
      // Update existing item
      // For items with start time, always recalculate order based on time to ensure proper chronological placement
      const hasStartTime = itemData.startTime !== undefined ? !!itemData.startTime : !!editItem.startTime;
      
      if (hasStartTime) {
        // Recalculate order based on current time
        const otherItems = schedule.items.filter(item => item.id !== editItem.id);
        const newOrder = calculateOrder(
          {
            startTime: itemData.startTime !== undefined ? itemData.startTime : editItem.startTime,
            endTime: itemData.endTime !== undefined ? itemData.endTime : editItem.endTime,
          },
          otherItems
        );
        updateItem(editItem.id, { ...itemData, order: newOrder });
      } else {
        updateItem(editItem.id, itemData);
      }
    } else {
      // Create new item with calculated order based on start time
      const order = calculateOrder(
        {
          startTime: startTime || undefined,
          endTime: endTime || undefined,
        },
        schedule.items
      );
      
      const newItem: ScheduleItem = {
        id: nanoid(),
        completed: false,
        order,
        ...itemData,
      } as ScheduleItem;
      addItem(newItem);
    }

    onSave?.();
    onClose();
  };

  const handleDelete = () => {
    if (editItem && confirm("Delete this item?")) {
      deleteItem(editItem.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editItem ? "Edit Item" : "Add Item"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Deep Work Toggle */}
          <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-900">
            <div className="flex items-center gap-3">
              <div className="text-indigo-600 dark:text-indigo-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Deep Work</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Focused, distraction-free time
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDeepWork(!isDeepWork)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDeepWork ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDeepWork ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Time fields */}
          <div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0">
                    <label className="block text-sm font-medium mb-2">Start Time</label>
                    <input
                      type="time"
                      step="300"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={`w-full px-2 py-3 rounded-lg border bg-white dark:bg-gray-800 focus:ring-2 focus:border-transparent outline-none ${
                        timeError
                          ? "border-red-300 dark:border-red-700 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      step="300"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={!startTime}
                      className={`w-full px-2 py-3 rounded-lg border bg-white dark:bg-gray-800 focus:ring-2 focus:border-transparent outline-none ${
                        timeError
                          ? "border-red-300 dark:border-red-700 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
                      } ${
                        !startTime ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>
                {timeError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{timeError}</p>
                )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">Location (optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where will this take place?"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasChanges || !title.trim() || !!timeError}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  !hasChanges || !title.trim() || timeError
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {editItem ? "Save Changes" : "Add Item"}
              </button>
            </div>
            
            {/* Delete button - only show when editing */}
            {editItem && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-3 px-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors border border-red-200 dark:border-red-900 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Item
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
