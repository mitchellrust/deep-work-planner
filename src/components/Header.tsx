"use client";

import { ThemeToggle } from "./ThemeToggle";

export function Header({ onAddClick }: { onAddClick: () => void }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between w-full">
        <div>
          <h1 className="text-xl font-bold">Deep Work Planner</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{today}</p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
