"use client";

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SearchHistoryTab() {
  const { t } = useLanguage();

  return (
    <Card className="mt-6 border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t('account.searchHistory.title')}</CardTitle>
        <CardDescription>
          {t('account.searchHistory.description.part1')}
          <Link href="/search/history" className="underline text-primary hover:text-primary/80">
            {t('account.searchHistory.description.link')}
          </Link>
          {t('account.searchHistory.description.part2')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{t('account.searchHistory.noHistory')}</p>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button asChild>
            <Link href="/search/history">{t('account.searchHistory.viewAllButton')}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
