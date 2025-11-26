"use client";

import { useLanguage } from "@/contexts/language-context";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminPage() {
  const { t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('admin.pageTitle')}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            This is a placeholder for the admin dashboard content.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
