"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { FileSpreadsheet } from "lucide-react";

export default function ReportsImportPage() {
    const { t } = useLanguage();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>{t('reports.import.title')}</CardTitle>
                        <CardDescription>{t('reports.import.description')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p>Report import functionality will be here.</p>
            </CardContent>
        </Card>
    );
}
