"use client";

import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function MyEntriesTab() {
  const { t } = useLanguage();
  return (
    <div>
      <p className="text-muted-foreground mb-4">
        {t("account.entries.description.part1")}
        <Link href="/reports/history" className="underline hover:text-primary">
          {t("account.entries.description.link")}
        </Link>
        {t("account.entries.description.part2")}
      </p>
      <p>{t("account.entries.noEntries")}</p>
       <Button asChild className="mt-4">
          <Link href="/reports/history">{t("account.entries.viewAllButton")}</Link>
        </Button>
    </div>
  );
}