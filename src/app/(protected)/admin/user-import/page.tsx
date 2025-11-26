"use client";

import { useLanguage } from "@/contexts/language-context";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminUserImportPage() {
  const { t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('usersImport.title')}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('usersImport.title')}</CardTitle>
          <CardDescription>
            This is a placeholder for the user import page content.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
