"use client";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function AdminPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <ShieldAlert className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle>{t('admin.pageTitle')}</CardTitle>
                            <CardDescription>{t('admin.users.description')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p>Admin panel in development.</p>
                </CardContent>
            </Card>
        </div>
    );
}
