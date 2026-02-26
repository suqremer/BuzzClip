"use client";

import { useEffect, useState } from "react";
import { useT } from "@/hooks/useTranslation";

const STORAGE_KEY = "age_verified";

export function AgeGate() {
  const t = useT();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const verified = localStorage.getItem(STORAGE_KEY);
      if (verified !== "1") {
        setShow(true);
      }
    }
  }, []);

  if (!show) return null;

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  const handleDecline = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-surface p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl dark:bg-red-900/30">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-text-heading">
          {t("ageGateTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {t("ageGateDesc")}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleAccept}
            className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-lg transition hover:bg-brand-hover"
          >
            {t("ageGateYes")}
          </button>
          <button
            onClick={handleDecline}
            className="w-full rounded-xl border border-border-main py-3 text-sm font-medium text-text-secondary transition hover:bg-hover-bg"
          >
            {t("ageGateNo")}
          </button>
        </div>
        <p className="mt-4 text-xs text-text-muted">
          {t("ageGateNote")}
        </p>
      </div>
    </div>
  );
}
