"use client";

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MyEntriesTab() {
  const { t } = useLanguage();

  return (
    <Card className="mt-6 border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t('account.entries.title')}</CardTitle>
        <CardDescription>
          {t('account.entries.description.part1')}
          <Link href="/reports/history" className="underline text-primary hover:text-primary/80">
            {t('account.entries.description.link')}
          </Link>
          {t('account.entries.description.part2')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* This content is now dynamically loaded on the history page */}
        <p className="text-muted-foreground">{t('account.entries.noEntries')}</p>
      </CardContent>
      <CardFooter className="border-t pt-6">
         <Button asChild>
            <Link href="/reports/history">{t('account.entries.viewAllButton')}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
