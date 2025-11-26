"use client";

import { useLanguage } from "@/contexts/language-context";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReportsImportPage() {
  const { t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('reports.import.title')}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.import.title')}</CardTitle>
          <CardDescription>
            {t('reports.import.description')}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
