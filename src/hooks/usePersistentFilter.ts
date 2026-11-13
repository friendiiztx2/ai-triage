'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_PREFIX = 'sift.filter.';

/**
 * A string filter value (date range, start/end date, ...) that is remembered per browser
 * across page reloads.
 *
 * - `setValue`     — use for the USER's own choices. Updates and remembers the value.
 * - `setTemporary` — use for automatic changes (deep links, "no chats today → 30 days"
 *                    fallback). Updates the screen but does NOT overwrite the saved choice.
 * - `hasSavedRef`  — true once the user has ever chosen a value (restored or picked now).
 *                    Auto-fallbacks should do nothing when this is true.
 *
 * The saved value is restored right after mount (not during render) to avoid
 * server/client hydration mismatches.
 */
export function usePersistentFilter(key: string, defaultValue: string) {
  const storageKey = STORAGE_PREFIX + key;
  const [value, setValueState] = useState<string>(defaultValue);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        hasSavedRef.current = true;
        setValueState(saved);
      }
    } catch {
      // storage unavailable (private mode, blocked) — keep the default
    }
  }, [storageKey]);

  const setValue = useCallback(
    (next: string) => {
      hasSavedRef.current = true;
      setValueState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // ignore storage errors
      }
    },
    [storageKey]
  );

  const setTemporary = useCallback((next: string) => {
    setValueState(next);
  }, []);

  return { value, setValue, setTemporary, hasSavedRef };
}
