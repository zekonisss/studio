"use client";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export default function SearchHistoryPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <ListChecks className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>{t('searchHistory.pageTitle')}</CardTitle>
                            <CardDescription>{t('searchHistory.pageDescription')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p>Search history will be displayed here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
