"use client";

import { usePresets } from "@/context/PresetContext";
import { Preset } from "@/types";
import Link from "next/link";

interface PresetPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: Preset) => void;
}

function formatTimeDisplay(time?: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function PresetPickerSheet({
  isOpen,
  onClose,
  onSelectPreset,
}: PresetPickerSheetProps) {
  const { presets, isLoading } = usePresets();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Choose a Preset
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                Loading presets...
              </div>
            </div>
          ) : presets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No presets yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                Create presets in settings to quickly add recurring tasks
              </p>
              <Link
                href="/settings"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                onClick={onClose}
              >
                Go to Settings
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className={`
                    w-full text-left p-4 rounded-lg border transition-all
                    ${
                      preset.isDeepWork
                        ? "border-l-4 border-l-indigo-600 dark:border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }
                    hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {preset.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {preset.startTime && (
                          <span>
                            {formatTimeDisplay(preset.startTime)}
                            {preset.endTime && ` - ${formatTimeDisplay(preset.endTime)}`}
                          </span>
                        )}
                        {preset.location && (
                          <span className="flex items-center gap-1">
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
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {preset.location}
                          </span>
                        )}
                      </div>
                      {preset.notes && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500 line-clamp-1">
                          {preset.notes}
                        </p>
                      )}
                    </div>
                    {preset.isDeepWork && (
                      <div
                        className="flex-shrink-0 text-indigo-600 dark:text-indigo-400"
                        title="Deep Work"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
