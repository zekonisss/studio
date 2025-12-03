"use client";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

export default function ReportsHistoryPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                     <div className="flex items-center gap-4">
                        <History className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>{t('reports.history.pageTitle')}</CardTitle>
                            <CardDescription>{t('reports.history.pageDescription')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p>Reports history will be displayed here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
