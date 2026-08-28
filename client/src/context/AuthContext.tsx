import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, loginUser, registerUser, getMe, updateUserPreferences } from "../lib/api/auth.js";
import { getStoredToken, setStoredToken } from "../lib/api/client.js";
import {
  isMockModeActive,
  setMockModeActive,
  MOCK_TOKEN
} from "../lib/mock/mockInterceptor.js";
import { mockStorage } from "../lib/mock/mockStorage.js";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateCutoffDay: (cutoffDay: number) => Promise<void>;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(
    isMockModeActive() || getStoredToken() === MOCK_TOKEN
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setMockModeActive(false);
    setIsDemoMode(false);
  }, []);

  const loadUser = useCallback(async () => {
    const currentToken = getStoredToken();
    const isMock = isMockModeActive() || currentToken === MOCK_TOKEN;
    setIsDemoMode(isMock);

    if (!currentToken && !isMock) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await getMe();
      setUser({
        ...response.user,
        cutoffDay: response.user.cutoffDay ?? 1
      });
      setToken(currentToken || MOCK_TOKEN);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await loginUser(email, password);
      setStoredToken(response.token);
      setToken(response.token);
      setIsDemoMode(false);
      setMockModeActive(false);
      setUser({
        ...response.user,
        cutoffDay: response.user.cutoffDay ?? 1
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async (): Promise<void> => {
    setIsLoading(true);
    try {
      setMockModeActive(true);
      setStoredToken(MOCK_TOKEN);
      setToken(MOCK_TOKEN);
      setIsDemoMode(true);
      const demoUser = mockStorage.getUser();
      setUser({
        ...demoUser,
        cutoffDay: demoUser.cutoffDay ?? 1
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await registerUser(name, email, password);
      setStoredToken(response.token);
      setToken(response.token);
      setIsDemoMode(false);
      setMockModeActive(false);
      setUser({
        ...response.user,
        cutoffDay: response.user.cutoffDay ?? 1
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCutoffDay = async (cutoffDay: number): Promise<void> => {
    const updatedUser = await updateUserPreferences({ cutoffDay });
    setUser((prev) => (prev ? { ...prev, cutoffDay: updatedUser.cutoffDay ?? cutoffDay } : prev));
  };

  const resetDemoData = (): void => {
    mockStorage.resetToDefault();
    const demoUser = mockStorage.getUser();
    setUser({
      ...demoUser,
      cutoffDay: demoUser.cutoffDay ?? 1
    });
    // Trigger global refresh
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isDemoMode,
        login,
        loginDemo,
        register,
        logout,
        updateCutoffDay,
        resetDemoData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

