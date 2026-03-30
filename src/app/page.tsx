"use client";

import { Header } from "@/components/Header";
import { Timeline } from "@/components/Timeline";
import { EmptyState } from "@/components/EmptyState";
import { PresetPickerSheet } from "@/components/PresetPickerSheet";
import { useSchedule } from "@/context/ScheduleContext";
import { useState, useEffect } from "react";
import { AddItemSheet } from "@/components/AddItemSheet";
import { useSession, signIn } from "next-auth/react";
import { Preset } from "@/types";

export default function Home() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side hydration to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading spinner during SSR and until mounted
  if (!mounted) {
    return (
      <div className="h-full flex flex-col overflow-auto">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // After mounting, show the actual authenticated content
  return <HomeContent isAddSheetOpen={isAddSheetOpen} setIsAddSheetOpen={setIsAddSheetOpen} />;
}

function HomeContent({ 
  isAddSheetOpen, 
  setIsAddSheetOpen 
}: { 
  isAddSheetOpen: boolean; 
  setIsAddSheetOpen: (value: boolean) => void;
}) {
  const { data: session, status } = useSession();
  const { schedule, isLoading } = useSchedule();
  const hasItems = schedule.items.length > 0;
  const [isPresetPickerOpen, setIsPresetPickerOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  const handleSelectPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setIsAddSheetOpen(true);
  };

  const handleCloseAddSheet = () => {
    setIsAddSheetOpen(false);
    setSelectedPreset(null);
  };

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="h-full flex flex-col overflow-auto">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Unauthenticated - show sign-in prompt
  if (!session) {
    return (
      <div className="h-full flex flex-col overflow-auto">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Welcome to Deep Work Planner</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sign in with your Google account to start planning your deep work sessions.
            </p>
            <button
              onClick={() => signIn("google")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show schedule (with loading state for data)
  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-auto">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-auto">
      <Header />
      
      {hasItems ? (
        <Timeline />
      ) : (
        <>
          <EmptyState 
            onAddClick={() => setIsAddSheetOpen(true)} 
            onPickPreset={() => setIsPresetPickerOpen(true)}
          />
          <AddItemSheet
            isOpen={isAddSheetOpen}
            onClose={handleCloseAddSheet}
            preset={selectedPreset}
          />
          <PresetPickerSheet
            isOpen={isPresetPickerOpen}
            onClose={() => setIsPresetPickerOpen(false)}
            onSelectPreset={handleSelectPreset}
          />
        </>
      )}
    </div>
  );
}
