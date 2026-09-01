import { useState, useCallback, useEffect } from "react";
import { storage, type StorageKey } from "@/lib/storage";

export function useLocalStorage<T>(
  key: StorageKey,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return storage.get<T>(key, initialValue);
  });

  useEffect(() => {
    storage.set<T>(key, storedValue);
  }, [key, storedValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        return next;
      });
    },
    []
  );

  return [storedValue, setValue];
}
