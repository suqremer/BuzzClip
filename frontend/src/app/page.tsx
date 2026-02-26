"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 px-4 py-24 text-center text-white sm:py-32">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          {t("heroTitle1")}
          <br />
          {t("heroTitle2")}
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-indigo-100 sm:text-xl">
          {t("heroSub1")}
          <br className="sm:hidden" />
          {t("heroSub2")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/ranking"
            className="w-full rounded-full bg-white px-8 py-3.5 text-base font-bold text-indigo-600 shadow-lg transition hover:bg-indigo-50 sm:w-auto"
          >
            {t("viewRanking")}
          </Link>
          <Link
            href="/submit"
            className="w-full rounded-full border-2 border-white px-8 py-3.5 text-base font-bold text-white transition hover:bg-white/10 sm:w-auto"
          >
            {t("submitVideoBtn")}
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            {t("howItWorks")}
          </h2>
          <p className="mt-3 text-center text-text-secondary">
            {t("howItWorksSub")}
          </p>
          <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-medium text-3xl">
                🔍
              </div>
              <div className="mt-2 text-sm font-bold text-brand-text">Step 1</div>
              <h3 className="mt-2 text-lg font-bold">{t("step1Title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {t("step1Desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-medium text-3xl">
                📋
              </div>
              <div className="mt-2 text-sm font-bold text-brand-text">Step 2</div>
              <h3 className="mt-2 text-lg font-bold">{t("step2Title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {t("step2Desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-medium text-3xl">
                🚀
              </div>
              <div className="mt-2 text-sm font-bold text-brand-text">Step 3</div>
              <h3 className="mt-2 text-lg font-bold">{t("step3Title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {t("step3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Showcase */}
      <section className="bg-surface-secondary px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            {t("browseCategory")}
          </h2>
          <p className="mt-3 text-center text-text-secondary">
            {t("browseCategorySub")}
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ranking?category=${cat.slug}`}
                className="flex items-center gap-3 rounded-xl bg-surface p-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-xl">
                  {cat.icon}
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {t(cat.slug as TranslationKey)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-20 text-center sm:py-24">
        <h2 className="text-2xl font-bold sm:text-3xl">
          {t("ctaTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-text-secondary">
          {t("ctaSub")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/ranking"
            className="inline-block rounded-full bg-brand px-10 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-brand-hover"
          >
            {t("viewRanking")}
          </Link>
          <Link
            href="/guide"
            className="inline-block rounded-full border-2 border-input-border px-8 py-3.5 text-base font-bold text-text-primary transition hover:border-brand hover:text-brand-text"
          >
            {t("howToUse")}
          </Link>
        </div>
      </section>
    </div>
  );
}
