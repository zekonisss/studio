"use client";

import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SearchHistoryTab() {
  const { t } = useLanguage();
  return (
     <div>
      <p className="text-muted-foreground mb-4">
        {t("account.searchHistory.description.part1")}
        <Link href="/search/history" className="underline hover:text-primary">
          {t("account.searchHistory.description.link")}
        </Link>
        {t("account.searchHistory.description.part2")}
      </p>
      <p>{t("account.searchHistory.noHistory")}</p>
       <Button asChild className="mt-4">
          <Link href="/search/history">{t("account.searchHistory.viewAllButton")}</Link>
        </Button>
    </div>
  );
}