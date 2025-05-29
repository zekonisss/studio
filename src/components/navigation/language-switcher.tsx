
"use client";

import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale('lt')}
          disabled={locale === 'lt'}
        >
          {t('language.lithuanian')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('en')}
          disabled={locale === 'en'}
        >
          {t('language.english')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('ru')}
          disabled={locale === 'ru'}
        >
          {t('language.russian')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('lv')}
          disabled={locale === 'lv'}
        >
          {t('language.latvian')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('et')}
          disabled={locale === 'et'}
        >
          {t('language.estonian')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('pl')}
          disabled={locale === 'pl'}
        >
          {t('language.polish')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
