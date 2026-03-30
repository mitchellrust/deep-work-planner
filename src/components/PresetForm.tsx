"use client";

import { useState, useEffect, useRef } from "react";
import { Preset } from "@/types";
import { usePresets } from "@/context/PresetContext";
import { nanoid } from "nanoid";
import Picker from "react-mobile-picker";

interface PresetFormProps {
  isOpen: boolean;
  onClose: () => void;
  editPreset?: Preset | null;
}

// Generate hours (01-12) for 12-hour format
const hours = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString().padStart(2, "0")
);

// Generate minutes in 5-minute increments (00, 05, 10, ..., 55)
const minutes = Array.from({ length: 12 }, (_, i) =>
  (i * 5).toString().padStart(2, "0")
);

// AM/PM periods
const periods = ["AM", "PM"];

// Convert HH:mm string to picker value
function timeStringToPickerValue(timeString: string): {
  hour: string;
  minute: string;
  period: string;
} {
  if (!timeString) return { hour: "09", minute: "00", period: "AM" };
  const [hourStr, minute] = timeString.split(":");
  const hourNum = parseInt(hourStr);

  // Convert 24-hour to 12-hour format
  const period = hourNum >= 12 ? "PM" : "AM";
  const hour12 = hourNum % 12 || 12;

  // Round minute to nearest 5-minute increment
  const minuteNum = parseInt(minute);
  const roundedMinute = Math.round(minuteNum / 5) * 5;

  return {
    hour: hour12.toString().padStart(2, "0"),
    minute: roundedMinute.toString().padStart(2, "0"),
    period,
  };
}

// Convert picker value to HH:mm string (24-hour format)
function pickerValueToTimeString(value: {
  hour: string;
  minute: string;
  period: string;
}): string {
  let hour24 = parseInt(value.hour);

  // Convert 12-hour to 24-hour format
  if (value.period === "AM") {
    if (hour24 === 12) hour24 = 0; // 12 AM = 00:00
  } else {
    if (hour24 !== 12) hour24 += 12; // PM hours (except 12 PM)
  }

  return `${hour24.toString().padStart(2, "0")}:${value.minute}`;
}

// Format time for display (12-hour format)
function formatTimeDisplay(timeString: string): string {
  if (!timeString) return "Select time";
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function PresetForm({ isOpen, onClose, editPreset }: PresetFormProps) {
  const { addPreset, updatePreset } = usePresets();
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [isDeepWork, setIsDeepWork] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [timeError, setTimeError] = useState("");

  // Picker states
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startPickerValue, setStartPickerValue] = useState(
    timeStringToPickerValue("09:00")
  );
  const [endPickerValue, setEndPickerValue] = useState(
    timeStringToPickerValue("10:00")
  );

  // Lock body scroll when either picker is open
  useEffect(() => {
    if (showStartPicker || showEndPicker) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [showStartPicker, showEndPicker]);

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
  const hasChanges = editPreset
    ? title.trim() !== editPreset.title ||
      isDeepWork !== editPreset.isDeepWork ||
      startTime !== (editPreset.startTime || "") ||
      endTime !== (editPreset.endTime || "") ||
      location.trim() !== (editPreset.location || "") ||
      notes.trim() !== (editPreset.notes || "")
    : true; // Always allow saving when creating new preset

  // Reset form when opening/closing or changing edit preset
  useEffect(() => {
    if (isOpen) {
      if (editPreset) {
        setTitle(editPreset.title);
        setIsDeepWork(editPreset.isDeepWork);
        setStartTime(editPreset.startTime || "");
        setEndTime(editPreset.endTime || "");
        setStartPickerValue(
          timeStringToPickerValue(editPreset.startTime || "09:00")
        );
        setEndPickerValue(
          timeStringToPickerValue(editPreset.endTime || "10:00")
        );
        setLocation(editPreset.location || "");
        setNotes(editPreset.notes || "");
      } else {
        setTitle("");
        setIsDeepWork(false);
        setStartTime("");
        setEndTime("");
        setStartPickerValue(timeStringToPickerValue("09:00"));
        setEndPickerValue(timeStringToPickerValue("10:00"));
        setLocation("");
        setNotes("");
      }
      setTimeError("");
      setShowStartPicker(false);
      setShowEndPicker(false);
      // Focus title input
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, editPreset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;
    if (timeError) return;

    const presetData: Partial<Preset> = {
      title: title.trim(),
      isDeepWork,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (editPreset) {
        // Update existing preset
        await updatePreset(editPreset.id, presetData);
      } else {
        // Create new preset
        const newPreset: Preset = {
          id: nanoid(),
          ...presetData,
        } as Preset;

        await addPreset(newPreset);
      }

      onClose();
    } catch (error) {
      // Error already handled by context
      console.error("Failed to save preset:", error);
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

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editPreset ? "Edit Preset" : "Add Preset"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
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
              placeholder="e.g., Morning Run, Team Meeting"
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
                <label className="block text-sm font-medium mb-2">
                  Start Time (optional)
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStartPicker(true)}
                    className={`w-full px-2 py-3 rounded-lg border bg-white dark:bg-gray-800 focus:ring-2 focus:border-transparent outline-none text-left ${
                      timeError
                        ? "border-red-300 dark:border-red-700 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
                    }`}
                  >
                    {startTime ? (
                      formatTimeDisplay(startTime)
                    ) : (
                      <span className="text-gray-400">Select time</span>
                    )}
                  </button>
                  {startTime && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStartTime("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-medium mb-2">
                  End Time (optional)
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => startTime && setShowEndPicker(true)}
                    disabled={!startTime}
                    className={`w-full px-2 py-3 rounded-lg border bg-white dark:bg-gray-800 focus:ring-2 focus:border-transparent outline-none text-left ${
                      timeError
                        ? "border-red-300 dark:border-red-700 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
                    } ${!startTime ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {endTime ? (
                      formatTimeDisplay(endTime)
                    ) : (
                      <span className="text-gray-400">Select time</span>
                    )}
                  </button>
                  {endTime && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEndTime("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            {timeError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {timeError}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Location (optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Home, Office, Gym"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Notes (optional)
            </label>
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
              disabled={!hasChanges || !title.trim() || !!timeError}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                !hasChanges || !title.trim() || timeError
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {editPreset ? "Save Changes" : "Create Preset"}
            </button>
          </div>
        </form>
      </div>

      {/* Start Time Picker Modal */}
      {showStartPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowStartPicker(false)}
          />
          <div
            className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl"
            style={{ touchAction: "pan-y" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowStartPicker(false)}
                className="text-gray-600 dark:text-gray-400 font-medium"
              >
                Cancel
              </button>
              <h3 className="font-semibold">Start Time</h3>
              <button
                onClick={() => {
                  setStartTime(pickerValueToTimeString(startPickerValue));
                  setShowStartPicker(false);
                }}
                className="text-indigo-600 dark:text-indigo-400 font-medium"
              >
                Done
              </button>
            </div>
            <div className="p-4">
              <Picker
                value={startPickerValue}
                onChange={setStartPickerValue}
                wheelMode="natural"
                height={216}
              >
                <Picker.Column name="hour">
                  {hours.map((hour) => (
                    <Picker.Item key={hour} value={hour}>
                      {({ selected }) => (
                        <div
                          className={`py-2 text-center ${
                            selected
                              ? "text-indigo-600 dark:text-indigo-400 font-semibold text-lg"
                              : "text-gray-400 dark:text-gray-600"
                          }`}
                        >
                          {hour}
                        </div>
                      )}
                    </Picker.Item>
                  ))}
                </Picker.Column>
                <Picker.Column name="minute">
                  {minutes.map((minute) => (
                    <Picker.Item key={minute} value={minute}>
                      {({ selected }) => (
                        <div
                          className={`py-2 text-center ${
                            selected
                              ? "text-indigo-600 dark:text-indigo-400 font-semibold text-lg"
                              : "text-gray-400 dark:text-gray-600"
                          }`}
                        >
                          {minute}
                        </div>
                      )}
                    </Picker.Item>
                  ))}
                </Picker.Column>
                <Picker.Column name="period">
                  {periods.map((period) => (
                    <Picker.Item key={period} value={period}>
                      {({ selected }) => (
                        <div
                          className={`py-2 text-center ${
                            selected
                              ? "text-indigo-600 dark:text-indigo-400 font-semibold text-lg"
                              : "text-gray-400 dark:text-gray-600"
                          }`}
                        >
                          {period}
                        </div>
                      )}
                    </Picker.Item>
                  ))}
                </Picker.Column>
              </Picker>
            </div>
          </div>
        </div>
      )}

      {/* End Time Picker Modal */}
      {showEndPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowEndPicker(false)}
          />
          <div
            className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl"
            style={{ touchAction: "pan-y" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowEndPicker(false)}
                className="text-gray-600 dark:text-gray-400 font-medium"
              >
                Cancel
              </button>
              <h3 className="font-semibold">End Time</h3>
              <button
                onClick={() => {
                  setEndTime(pickerValueToTimeString(endPickerValue));
                  setShowEndPicker(false);
                }}
                className="text-indigo-600 dark:text-indigo-400 font-medium"
              >
                Done
              </button>
            </div>
            <div className="p-4">
              <Picker
                value={endPickerValue}
                onChange={setEndPickerValue}
                wheelMode="natural"
                height={216}
              >
                <Picker.Column name="hour">
                  {hours.map((hour) => (
                    <Picker.Item key={hour} value={hour}>
                      {({ selected }) => (
                        <div
                          className={`py-2 text-center ${
                            selected
                              ? "text-indigo-600 dark:text-indigo-400 font-semibold text-lg"
                              : "text-gray-400 dark:text-gray-600"
                          }`}
                        >
                          {hour}
                        </div>
                      )}
                    </Picker.Item>
                  ))}
                </Picker.Column>
                <Picker.Column name="minute">
                  {minutes.map((minute) => (
                    <Picker.Item key={minute} value={minute}>
                      {({ selected }) => (
                        <div
                          className={`py-2 text-center ${
                            selected
                              ? "text-indigo-600 dark:text-indigo-400 font-semibold text-lg"
                              : "text-gray-400 dark:text-gray-600"
                          }`}
                        >
                          {minute}
                        </div>
                      )}
                    </Picker.Item>
                  ))}
                </Picker.Column>
                <Picker.Column name="period">
                  {periods.map((period) => (
                    <Picker.Item key={period} value={period}>
                      {({ selected }) => (
                        <div
                          className={`py-2 text-center ${
                            selected
                              ? "text-indigo-600 dark:text-indigo-400 font-semibold text-lg"
                              : "text-gray-400 dark:text-gray-600"
                          }`}
                        >
                          {period}
                        </div>
                      )}
                    </Picker.Item>
                  ))}
                </Picker.Column>
              </Picker>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
