"use client";

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function StatisticsTab() {
  const { t } = useLanguage();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('admin.statistics.title')}</CardTitle>
        <CardDescription>{t('admin.statistics.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-8">
            <p>{t('admin.statistics.noDataForChart')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
