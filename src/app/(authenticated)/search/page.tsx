"use client";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function SearchPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Search className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>{t('search.title')}</CardTitle>
                            <CardDescription>{t('search.description')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p>Search functionality will be implemented here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
