"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getLocale, setLocale, t, type Locale, type TranslationKey } from "@/lib/i18n";

let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): Locale {
  return getLocale();
}

function getServerSnapshot(): Locale {
  return "ja";
}

export function useTranslation() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    listeners.forEach((l) => l());
  }, []);

  return { locale, t, changeLocale };
}

/** Shortcut to just get the `t` function */
export function useT() {
  useTranslation(); // subscribe to locale changes
  return t;
}

/** Get translated category name */
export function useCategoryName(slug: string): string {
  useTranslation();
  return t(slug as TranslationKey);
}
