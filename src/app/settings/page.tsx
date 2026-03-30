"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { usePresets } from "@/context/PresetContext";
import { Preset } from "@/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PresetForm } from "@/components/PresetForm";
import Link from "next/link";

function formatTimeDisplay(time?: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { presets, isLoading: presetsLoading, deletePreset } = usePresets();
  const [mounted, setMounted] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Client-side hydration check
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleDeletePreset = async (id: string, title: string) => {
    if (confirm(`Delete preset "${title}"?`)) {
      try {
        await deletePreset(id);
      } catch (error) {
        // Error already handled by deletePreset
        console.error("Failed to delete preset:", error);
      }
    }
  };

  const handleEditPreset = (preset: Preset) => {
    setEditingPreset(preset);
    setIsFormOpen(true);
  };

  const handleAddPreset = () => {
    setEditingPreset(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPreset(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Back to schedule"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Appearance Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Theme</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Choose your preferred color scheme
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* Presets Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Presets</h2>
            <button
              onClick={handleAddPreset}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Preset
            </button>
          </div>

          {presetsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                Loading presets...
              </div>
            </div>
          ) : presets.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
              <svg
                className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4 mx-auto"
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
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Create presets to quickly add recurring tasks to your schedule
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`
                    p-4 rounded-lg border transition-all
                    ${
                      preset.isDeepWork
                        ? "border-l-4 border-l-indigo-600 dark:border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900"
                        : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {preset.title}
                        </h3>
                        {preset.isDeepWork && (
                          <span
                            className="text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                            title="Deep Work"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {preset.startTime && (
                          <span>
                            {formatTimeDisplay(preset.startTime)}
                            {preset.endTime &&
                              ` - ${formatTimeDisplay(preset.endTime)}`}
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
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                          {preset.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditPreset(preset)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                        aria-label="Edit preset"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset.id, preset.title)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
                        aria-label="Delete preset"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Preset Form */}
      <PresetForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editPreset={editingPreset}
      />
    </div>
  );
}
