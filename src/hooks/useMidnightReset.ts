import { useEffect } from "react";

/**
 * Hook that triggers a callback at midnight (when the day changes)
 * Used to auto-reset the schedule for a new day
 */
export function useMidnightReset(onMidnight: () => void) {
  useEffect(() => {
    const checkAndReset = () => {
      const now = new Date();
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0, 0
      );
      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      // Set timeout for midnight
      const timeoutId = setTimeout(() => {
        onMidnight();
        // Set up the next midnight check
        checkAndReset();
      }, msUntilMidnight);

      return timeoutId;
    };

    const timeoutId = checkAndReset();

    return () => clearTimeout(timeoutId);
  }, [onMidnight]);
}
