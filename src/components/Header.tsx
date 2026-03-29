"use client";

import { ThemeToggle } from "./ThemeToggle";
import { useSession, signIn, signOut } from "next-auth/react";

export function Header({ onAddClick }: { onAddClick: () => void }) {
  const { data: session, status } = useSession();
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
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ) : session?.user ? (
            <div className="flex items-center gap-2">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Sign in with Google
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
