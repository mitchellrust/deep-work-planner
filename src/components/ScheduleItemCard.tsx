"use client";

import { ScheduleItem } from "@/types";
import { useSchedule } from "@/context/ScheduleContext";

interface ScheduleItemCardProps {
  item: ScheduleItem;
  onEdit: (item: ScheduleItem) => void;
  isDragging?: boolean;
}

// Convert 24-hour time (HH:mm) to 12-hour format (h:mm AM/PM)
function formatTime12Hour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12; // Convert 0 to 12, and 13-23 to 1-11
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function ScheduleItemCard({ item, onEdit, isDragging }: ScheduleItemCardProps) {
  const { toggleComplete, deleteItem } = useSchedule();

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleComplete(item.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this item?")) {
      deleteItem(item.id);
    }
  };

  return (
    <div
      onClick={() => onEdit(item)}
      className={`
        w-full group relative p-4 rounded-lg border transition-all cursor-pointer
        ${isDragging ? "opacity-50 rotate-2 scale-105" : ""}
        ${
          item.isDeepWork
            ? "border-l-4 border-l-indigo-600 dark:border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        }
        hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20
        ${item.completed ? "opacity-60" : ""}
      `}
    >
      {/* Deep work indicator */}
      {item.isDeepWork && (
        <div className="absolute top-3 right-3 text-indigo-600 dark:text-indigo-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
          </svg>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Checkbox for all items */}
        <button
            onClick={handleToggleComplete}
            className={`
              mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-all
              ${
                item.completed
                  ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500"
                  : "border-gray-300 dark:border-gray-600 hover:border-indigo-400"
              }
            `}
          >
            {item.completed && (
              <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium mb-1 ${
              item.completed ? "line-through text-gray-500 dark:text-gray-500" : ""
            }`}
          >
            {item.title}
          </h3>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {/* Time (if present) */}
            {item.startTime && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {formatTime12Hour(item.startTime)}
                  {item.endTime && ` - ${formatTime12Hour(item.endTime)}`}
                </span>
              </div>
            )}
            
            {/* Location (if present) */}
            {item.location && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{item.location}</span>
              </div>
            )}
            
            {/* Notes */}
            {item.notes && (
              <p className="text-xs line-clamp-2">{item.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete button (appears on hover) */}
      <button
        onClick={handleDelete}
        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
        aria-label="Delete item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
