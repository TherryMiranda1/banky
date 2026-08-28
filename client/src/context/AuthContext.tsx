import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, loginUser, registerUser, getMe, updateUserPreferences } from "../lib/api/auth.js";
import { getStoredToken, setStoredToken } from "../lib/api/client.js";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateCutoffDay: (cutoffDay: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const loadUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await getMe();
      setUser({
        ...response.user,
        cutoffDay: response.user.cutoffDay ?? 1
      });
      setToken(currentToken);
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
      setUser({
        ...response.user,
        cutoffDay: response.user.cutoffDay ?? 1
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateCutoffDay
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
