"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export function Header() {
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
          ) : 
            null
          }
          <Link
            href="/settings"
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Settings"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
