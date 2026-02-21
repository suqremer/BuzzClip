"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User } from "@/types/user";
import { apiGet } from "@/lib/api";
import { setToken as saveToken, removeToken } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const me = await apiGet<User>("/api/auth/me");
      setUser(me);
    } catch {
      setUser(null);
      setToken(null);
      removeToken();
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("buzzclip_token");
    if (stored) {
      setToken(stored);
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = useCallback(
    async (newToken: string) => {
      saveToken(newToken);
      setToken(newToken);
      await fetchUser();
    },
    [fetchUser],
  );

  const logout = useCallback(() => {
    removeToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
