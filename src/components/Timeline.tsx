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
      className="touch-none w-full"
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
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [isDragEdit, setIsDragEdit] = useState(false);
  const [preDragOrder, setPreDragOrder] = useState<ScheduleItem[] | null>(null);

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

  // Sort all items by order to create a unified timeline
  // Separate completed from incomplete items
  const allSortedItems = [...schedule.items].sort((a, b) => a.order - b.order);
  const incompleteItems = allSortedItems.filter(item => !item.completed);
  const completedItems = allSortedItems.filter(item => item.completed);
  const allItems = incompleteItems; // For drag and drop context

  // Helper to check if an event violates chronological order
  const isEventOutOfOrder = (
    item: ScheduleItem,
    itemsBefore: ScheduleItem[],
    itemsAfter: ScheduleItem[]
  ): boolean => {
    // Only check events with start times
    if (item.type !== "event" || !item.startTime) {
      return false;
    }

    // Check if any event before has a later start time
    const eventBefore = [...itemsBefore]
      .reverse()
      .find((i) => i.type === "event" && i.startTime);
    
    if (eventBefore && eventBefore.startTime) {
      if (item.startTime < eventBefore.startTime) {
        return true; // Current item starts before previous event
      }
      
      // Same start time - check end times
      if (item.startTime === eventBefore.startTime) {
        const itemHasEnd = !!item.endTime;
        const beforeHasEnd = !!eventBefore.endTime;
        
        // Events without end time should come before events with end time
        if (!itemHasEnd && beforeHasEnd) {
          return true; // Current has no end, previous has end - should be before previous
        }
        if (itemHasEnd && !beforeHasEnd) {
          return false; // Current has end, previous doesn't - correct order
        }
        
        // Both have end times or both don't - compare them
        const itemEnd = item.endTime || item.startTime;
        const beforeEnd = eventBefore.endTime || eventBefore.startTime;
        if (itemEnd < beforeEnd) {
          return true; // Current item ends before previous event with same start
        }
      }
    }

    // Check if any event after has an earlier start time
    const eventAfter = itemsAfter.find((i) => i.type === "event" && i.startTime);
    
    if (eventAfter && eventAfter.startTime) {
      if (item.startTime > eventAfter.startTime) {
        return true; // Current item starts after next event
      }
      
      // Same start time - check end times
      if (item.startTime === eventAfter.startTime) {
        const itemHasEnd = !!item.endTime;
        const afterHasEnd = !!eventAfter.endTime;
        
        // Events without end time should come before events with end time
        if (itemHasEnd && !afterHasEnd) {
          return true; // Current has end, next doesn't - should be after next
        }
        if (!itemHasEnd && afterHasEnd) {
          return false; // Current has no end, next has end - correct order
        }
        
        // Both have end times or both don't - compare them
        const itemEnd = item.endTime || item.startTime;
        const afterEnd = eventAfter.endTime || eventAfter.startTime;
        if (itemEnd > afterEnd) {
          return true; // Current item ends after next event with same start
        }
      }
    }

    return false;
  };

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

      // Check if the dragged item is an event that's now out of chronological order
      const draggedItem = reordered[newIndex];
      const itemsBefore = reordered.slice(0, newIndex);
      const itemsAfter = reordered.slice(newIndex + 1);

      if (isEventOutOfOrder(draggedItem, itemsBefore, itemsAfter)) {
        // Event is out of order - save current order and open edit sheet
        setPreDragOrder([...allItems]);
        setIsDragEdit(true);
        reorderItems(reordered);
        setTimeout(() => {
          setEditingItem(draggedItem);
          setIsAddSheetOpen(true);
        }, 100);
      } else {
        // Not out of order - just reorder normally
        reorderItems(reordered);
      }

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

  const handleSave = () => {
    // Clear drag edit state on successful save
    setIsDragEdit(false);
    setPreDragOrder(null);
  };

  const handleCloseSheet = () => {
    // If this was a drag edit and we're closing (user cancelled), restore original order
    if (isDragEdit && preDragOrder) {
      reorderItems(preDragOrder);
    }
    setIsAddSheetOpen(false);
    setEditingItem(null);
    setIsDragEdit(false);
    setPreDragOrder(null);
  };

  const activeItem = activeId ? allItems.find((item) => item.id === activeId) : null;

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 w-full">
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
            {/* Unified timeline - incomplete items sorted by order */}
            <div className="space-y-3 w-full">
              {allItems.map((item) => (
                <SortableItem key={item.id} item={item} onEdit={handleEdit} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeItem ? (
              <div className="opacity-90 max-w-4xl">
                <ScheduleItemCard item={activeItem} onEdit={() => {}} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Completed section */}
        {completedItems.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setCompletedExpanded(!completedExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                    completedExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Completed
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  ({completedItems.length})
                </span>
              </div>
            </button>

            {completedExpanded && (
              <div className="mt-3 space-y-3">
                {completedItems.map((item) => (
                  <div key={item.id} className="w-full">
                    <ScheduleItemCard item={item} onEdit={handleEdit} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
        onSave={handleSave}
        editItem={editingItem}
      />
    </>
  );
}
