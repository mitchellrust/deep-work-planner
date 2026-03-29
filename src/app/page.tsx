"use client";

import { Header } from "@/components/Header";
import { Timeline } from "@/components/Timeline";
import { EmptyState } from "@/components/EmptyState";
import { useSchedule } from "@/context/ScheduleContext";
import { useState } from "react";
import { AddItemSheet } from "@/components/AddItemSheet";

export default function Home() {
  const { schedule } = useSchedule();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const hasItems = schedule.items.length > 0;

  return (
    <div className="h-full flex flex-col overflow-auto">
      <Header onAddClick={() => setIsAddSheetOpen(true)} />
      
      {hasItems ? (
        <Timeline />
      ) : (
        <>
          <EmptyState onAddClick={() => setIsAddSheetOpen(true)} />
          <AddItemSheet
            isOpen={isAddSheetOpen}
            onClose={() => setIsAddSheetOpen(false)}
          />
        </>
      )}
    </div>
  );
}
