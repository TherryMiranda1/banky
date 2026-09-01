export const STORAGE_KEYS = {
  REALM_AVATAR: "banky_realm_avatar",
  DASHBOARD_VIEW: "banky_dashboard_view",
  TOKEN: "banky_token",
  MOCK_MODE: "banky_mock_mode"
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const storage = {
  get<T>(key: StorageKey, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  getString(key: StorageKey, defaultValue = ""): string {
    try {
      return localStorage.getItem(key) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignorar errores de almacenamiento restringido
    }
  },

  setString(key: StorageKey, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignorar errores de almacenamiento restringido
    }
  },

  remove(key: StorageKey): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignorar errores de almacenamiento restringido
    }
  }
};
