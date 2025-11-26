"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

export default function DashboardPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen px-4 py-8 md:px-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('sidebar.dashboard')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('dashboard.platformDescription')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/reports/add"
          className="rounded-xl border bg-card p-5 shadow-sm hover:border-primary/60 hover:shadow-md transition"
        >
          <h2 className="font-semibold mb-1">{t('sidebar.addReport')}</h2>
          <p className="text-xs text-muted-foreground">
            Užregistruokite naują vairuotojo incidentą / įrašą duomenų bazėje.
          </p>
        </Link>

        <Link
          href="/reports/history"
          className="rounded-xl border bg-card p-5 shadow-sm hover:border-primary/60 hover:shadow-md transition"
        >
          <h2 className="font-semibold mb-1">{t('sidebar.reportsHistory')}</h2>
          <p className="text-xs text-muted-foreground">
            Peržiūrėkite anksčiau pateiktus įrašus, jų statusą ir detales.
          </p>
        </Link>

        <Link
          href="/search"
          className="rounded-xl border bg-card p-5 shadow-sm hover:border-primary/60 hover:shadow-md transition"
        >
          <h2 className="font-semibold mb-1">{t('sidebar.search')}</h2>
          <p className="text-xs text-muted-foreground">
            Patikrinkite kandidatų istoriją prieš priimdami į darbą.
          </p>
        </Link>
      </div>
    </div>
  );
}
