"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { FileSpreadsheet } from "lucide-react";

export default function UserImportPage() {
    const { t } = useLanguage();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>{t('usersImport.title')}</CardTitle>
                        <CardDescription>{t('usersImport.description')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p>User import functionality will be here.</p>
            </CardContent>
        </Card>
    );
}
