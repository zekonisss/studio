"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

export default function ActivationPendingPage() {
  const { logout } = useAuth();
  const { t } = useLanguage();

  return (
    <>
      <Card className="w-full max-w-xl text-center">
        <CardHeader className="items-center">
            <div className="p-4 bg-primary/10 rounded-full mb-2">
                 <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="text-3xl font-bold tracking-tight">{t('activation.pending.title')}</CardTitle>
          <CardDescription>{t('activation.pending.description')}</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">{t('activation.pending.questions', { email: 'support@drivercheck.lt' })}</p>
        </CardContent>
        <CardFooter className="flex-col gap-4 pt-6 border-t">
          <p className="text-xs text-muted-foreground">{t('activation.pending.differentAccount')}</p>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            {t('sidebar.logout')}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
