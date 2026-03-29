export function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-4 text-center">
      <div className="mb-6">
        <svg
          className="w-24 h-24 text-gray-300 dark:text-gray-700 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
        No schedule yet
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        Start planning your day by adding events and to-do items. Mark deep work sessions to stay focused.
      </p>
      <button
        onClick={onAddClick}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
      >
        Plan Your Day
      </button>
    </div>
  );
}
