"use client";

import { useState } from "react";
import { useSchedule } from "@/context/ScheduleContext";
import { ScheduleItem } from "@/types";
import { ScheduleItemCard } from "./ScheduleItemCard";
import { AddItemSheet } from "./AddItemSheet";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  item: ScheduleItem;
  onEdit: (item: ScheduleItem) => void;
}

function SortableItem({ item, onEdit }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <ScheduleItemCard item={item} onEdit={onEdit} isDragging={isDragging} />
    </div>
  );
}

export function Timeline() {
  const { schedule, reorderItems } = useSchedule();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 150ms delay before drag starts on touch
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Separate and sort items
  const timedEvents = schedule.items
    .filter((item) => item.type === "event" && item.startTime)
    .sort((a, b) => (a.startTime! < b.startTime! ? -1 : 1));

  const unscheduledTodos = schedule.items
    .filter((item) => item.type === "todo" || !item.startTime)
    .sort((a, b) => a.order - b.order);

  // Combine for sortable context
  const allItems = [...unscheduledTodos, ...timedEvents];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Haptic feedback on drag start
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = allItems.findIndex((item) => item.id === active.id);
      const newIndex = allItems.findIndex((item) => item.id === over.id);

      const reordered = arrayMove(allItems, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index,
      }));

      reorderItems(reordered);

      // Haptic feedback on drop
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setIsAddSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsAddSheetOpen(false);
    setEditingItem(null);
  };

  const activeItem = activeId ? allItems.find((item) => item.id === activeId) : null;

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={allItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {/* Unscheduled to-dos section */}
            {unscheduledTodos.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Unscheduled
                </h2>
                <div className="space-y-3">
                  {unscheduledTodos.map((item) => (
                    <SortableItem key={item.id} item={item} onEdit={handleEdit} />
                  ))}
                </div>
              </div>
            )}

            {/* Timeline section */}
            {timedEvents.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Timeline
                </h2>
                <div className="space-y-3">
                  {timedEvents.map((item) => (
                    <SortableItem key={item.id} item={item} onEdit={handleEdit} />
                  ))}
                </div>
              </div>
            )}
          </SortableContext>

          <DragOverlay>
            {activeItem ? (
              <div className="opacity-90">
                <ScheduleItemCard item={activeItem} onEdit={() => {}} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddSheetOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-30"
        aria-label="Add item"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Add/Edit Sheet */}
      <AddItemSheet
        isOpen={isAddSheetOpen}
        onClose={handleCloseSheet}
        editItem={editingItem}
      />
    </>
  );
}
