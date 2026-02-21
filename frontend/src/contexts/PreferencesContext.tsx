"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api";

interface Preferences {
  hiddenCategorySlugs: string[];
  mutedUserIds: string[];
  preferredPlatforms: string[];
}

interface PreferencesContextValue {
  preferences: Preferences;
  loading: boolean;
  toggleHiddenCategory: (slug: string) => void;
  muteUser: (userId: string) => Promise<void>;
  unmuteUser: (userId: string) => Promise<void>;
  isUserMuted: (userId: string) => boolean;
  isCategoryHidden: (slug: string) => boolean;
  setPreferredPlatforms: (platforms: string[]) => void;
}

const defaultPreferences: Preferences = {
  hiddenCategorySlugs: [],
  mutedUserIds: [],
  preferredPlatforms: [],
};

const PLATFORMS_STORAGE_KEY = "buzzclip_platforms";

const STORAGE_KEY = "buzzclip_preferences";

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);

  // Load platforms from localStorage (works for both logged-in and anonymous)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(PLATFORMS_STORAGE_KEY);
      if (stored) {
        const platforms = JSON.parse(stored);
        if (Array.isArray(platforms)) {
          setPreferences((prev) => ({ ...prev, preferredPlatforms: platforms }));
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user) {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setPreferences((prev) => ({ ...prev, ...parsed }));
          }
        } catch { /* ignore */ }
      }
      return;
    }

    setLoading(true);
    apiGet<{ hidden_category_slugs: string[]; muted_user_ids: string[] }>("/api/auth/me/preferences")
      .then((data) => {
        setPreferences((prev) => ({
          ...prev,
          hiddenCategorySlugs: data.hidden_category_slugs,
          mutedUserIds: data.muted_user_ids,
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const syncHiddenCategories = useCallback(async (slugs: string[]) => {
    if (user) {
      await apiPut("/api/auth/me/hidden-categories", { category_slugs: slugs }).catch(() => {});
    } else if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ hiddenCategorySlugs: slugs, mutedUserIds: [] }));
    }
  }, [user]);

  const toggleHiddenCategory = useCallback((slug: string) => {
    setPreferences((prev) => {
      const isHidden = prev.hiddenCategorySlugs.includes(slug);
      const newSlugs = isHidden
        ? prev.hiddenCategorySlugs.filter((s) => s !== slug)
        : [...prev.hiddenCategorySlugs, slug];

      syncHiddenCategories(newSlugs);
      return { ...prev, hiddenCategorySlugs: newSlugs };
    });
  }, [syncHiddenCategories]);

  const muteUser = useCallback(async (userId: string) => {
    if (!user) return;
    await apiPost(`/api/auth/me/mutes/${userId}`);
    setPreferences((prev) => ({
      ...prev,
      mutedUserIds: [...prev.mutedUserIds, userId],
    }));
  }, [user]);

  const unmuteUser = useCallback(async (userId: string) => {
    if (!user) return;
    await apiDelete(`/api/auth/me/mutes/${userId}`);
    setPreferences((prev) => ({
      ...prev,
      mutedUserIds: prev.mutedUserIds.filter((id) => id !== userId),
    }));
  }, [user]);

  const isUserMuted = useCallback((userId: string) => {
    return preferences.mutedUserIds.includes(userId);
  }, [preferences.mutedUserIds]);

  const isCategoryHidden = useCallback((slug: string) => {
    return preferences.hiddenCategorySlugs.includes(slug);
  }, [preferences.hiddenCategorySlugs]);

  const setPreferredPlatforms = useCallback((platforms: string[]) => {
    setPreferences((prev) => ({ ...prev, preferredPlatforms: platforms }));
    if (typeof window !== "undefined") {
      localStorage.setItem(PLATFORMS_STORAGE_KEY, JSON.stringify(platforms));
    }
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        loading,
        toggleHiddenCategory,
        muteUser,
        unmuteUser,
        isUserMuted,
        isCategoryHidden,
        setPreferredPlatforms,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
