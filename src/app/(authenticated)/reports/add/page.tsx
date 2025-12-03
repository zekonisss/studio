"use client";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilePlus2 } from "lucide-react";

export default function AddReportPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <FilePlus2 className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>{t('reports.add.title')}</CardTitle>
                            <CardDescription>{t('reports.add.description')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p>Report submission form will be here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
