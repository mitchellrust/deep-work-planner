"use client";

import { useState } from "react";
import { useSchedule } from "@/context/ScheduleContext";
import { ScheduleItem, Preset } from "@/types";
import { ScheduleItemCard } from "./ScheduleItemCard";
import { AddItemSheet } from "./AddItemSheet";
import { PresetPickerSheet } from "./PresetPickerSheet";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
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
      className="w-full"
    >
      <div className={`
        flex items-stretch w-full rounded-lg border transition-all
        ${isDragging ? "opacity-50 rotate-2 scale-105" : ""}
        ${
          item.isDeepWork
            ? "border-l-4 border-l-indigo-600 dark:border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        }
        hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20
        ${item.completed ? "opacity-60" : ""}
      `}>
        {/* Drag handle - only this area triggers drag */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-8 cursor-grab active:cursor-grabbing touch-none flex-shrink-0 border-r border-gray-200 dark:border-gray-700"
          aria-label="Drag to reorder"
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
            <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
            <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
            <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
            <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
            <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
          </div>
        </div>
        {/* Card content */}
        <div className="flex-1 min-w-0">
          <ScheduleItemCard item={item} onEdit={onEdit} isDragging={isDragging} />
        </div>
      </div>
    </div>
  );
}

export function Timeline() {
  const { schedule, reorderItems } = useSchedule();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isPresetPickerOpen, setIsPresetPickerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [isDragEdit, setIsDragEdit] = useState(false);
  const [preDragOrder, setPreDragOrder] = useState<ScheduleItem[] | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 150ms press on handle before drag starts
        tolerance: 5, // Allow minimal movement during press
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

  // Helper to check if an item violates chronological order
  const isEventOutOfOrder = (
    item: ScheduleItem,
    itemsBefore: ScheduleItem[],
    itemsAfter: ScheduleItem[]
  ): boolean => {
    // Only check items with start times
    if (!item.startTime) {
      return false;
    }

    // Check if any item before has a later start time
    const eventBefore = [...itemsBefore]
      .reverse()
      .find((i) => i.startTime);
    
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

    // Check if any item after has an earlier start time
    const eventAfter = itemsAfter.find((i) => i.startTime);
    
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
    setSelectedPreset(null);
    setIsDragEdit(false);
    setPreDragOrder(null);
  };

  // Handle preset selection from preset picker
  const handleSelectPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setIsAddSheetOpen(true);
  };

  // Long-press detection for FAB
  const handleFabPressStart = () => {
    const timer = setTimeout(() => {
      // Long press detected - open preset picker
      setIsPresetPickerOpen(true);
      // Haptic feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(30);
      }
    }, 500); // 500ms for long-press
    setLongPressTimer(timer);
  };

  const handleFabPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleFabClick = () => {
    // Only open add sheet if it wasn't a long-press
    // (long-press would have already opened preset picker)
    if (!isPresetPickerOpen) {
      setIsAddSheetOpen(true);
    }
  };

  const activeItem = activeId ? allItems.find((item) => item.id === activeId) : null;

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20 w-full">
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
                <div className={`
                  flex items-stretch w-full rounded-lg border transition-all
                  ${
                    activeItem.isDeepWork
                      ? "border-l-4 border-l-indigo-600 dark:border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  }
                  shadow-2xl
                `}>
                  {/* Drag handle in overlay */}
                  <div className="flex items-center justify-center w-8 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                      <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                      <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                      <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                      <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                      <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <ScheduleItemCard item={activeItem} onEdit={() => {}} isDragging />
                  </div>
                </div>
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
                    <div className={`
                      w-full rounded-lg border transition-all
                      ${
                        item.isDeepWork
                          ? "border-l-4 border-l-indigo-600 dark:border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900"
                          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      }
                      hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20
                      ${item.completed ? "opacity-60" : ""}
                    `}>
                      <ScheduleItemCard item={item} onEdit={handleEdit} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleFabClick}
        onMouseDown={handleFabPressStart}
        onMouseUp={handleFabPressEnd}
        onMouseLeave={handleFabPressEnd}
        onTouchStart={handleFabPressStart}
        onTouchEnd={handleFabPressEnd}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-30"
        aria-label="Add item (long-press for presets)"
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
        preset={selectedPreset}
      />

      {/* Preset Picker Sheet */}
      <PresetPickerSheet
        isOpen={isPresetPickerOpen}
        onClose={() => setIsPresetPickerOpen(false)}
        onSelectPreset={handleSelectPreset}
      />
    </>
  );
}
