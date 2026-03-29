"use client";

import { useState, useEffect, useRef } from "react";
import { ScheduleItem, ItemType } from "@/types";
import { useSchedule } from "@/context/ScheduleContext";
import { nanoid } from "nanoid";

interface AddItemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: ScheduleItem | null;
  prefillTime?: string; // HH:mm format
}

export function AddItemSheet({ isOpen, onClose, editItem, prefillTime }: AddItemSheetProps) {
  const { addItem, updateItem } = useSchedule();
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [type, setType] = useState<ItemType>("todo");
  const [title, setTitle] = useState("");
  const [isDeepWork, setIsDeepWork] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Reset form when opening/closing or changing edit item
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setType(editItem.type);
        setTitle(editItem.title);
        setIsDeepWork(editItem.isDeepWork);
        setStartTime(editItem.startTime || "");
        setEndTime(editItem.endTime || "");
        setLocation(editItem.location || "");
        setNotes(editItem.notes || "");
      } else {
        setType("todo");
        setTitle("");
        setIsDeepWork(false);
        setStartTime(prefillTime || "");
        setEndTime("");
        setLocation("");
        setNotes("");
      }
      // Focus title input
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, editItem, prefillTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    const itemData: Partial<ScheduleItem> = {
      title: title.trim(),
      type,
      isDeepWork,
      notes: notes.trim() || undefined,
    };

    if (type === "event") {
      itemData.startTime = startTime || undefined;
      itemData.endTime = endTime || undefined;
      itemData.location = location.trim() || undefined;
    }

    if (editItem) {
      // Update existing item
      updateItem(editItem.id, itemData);
    } else {
      // Create new item
      const newItem: ScheduleItem = {
        id: nanoid(),
        completed: false,
        order: Date.now(), // Use timestamp for initial ordering
        ...itemData,
      } as ScheduleItem;
      addItem(newItem);
    }

    onClose();
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

          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("todo")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  type === "todo"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                To-Do
              </button>
              <button
                type="button"
                onClick={() => setType("event")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  type === "event"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                Event
              </button>
            </div>
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

          {/* Event-specific fields */}
          {type === "event" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where will this take place?"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </>
          )}

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
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              {editItem ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
