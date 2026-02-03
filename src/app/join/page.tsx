"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertTriangle, Building, UserCheck } from "lucide-react";
import { verifyInvitation, acceptInvitation } from "./actions";
import { useLanguage } from "@/contexts/language-context";

interface InvitationDetails {
    companyName: string;
    email: string;
}

export default function JoinPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const token = searchParams.get('token');
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setError(t('join.invalidLink'));
            setLoading(false);
            return;
        }

        const checkToken = async () => {
            try {
                const result = await verifyInvitation(token);
                if (result.success && result.data) {
                    setInvitation(result.data);
                } else {
                    let errorMessage = result.error || t('join.unknownError');
                    if (result.error?.includes("Pakvietimas nerastas")) errorMessage = t('join.tokenNotFound');
                    if (result.error?.includes("panaudotas")) errorMessage = t('join.tokenUsed');
                    if (result.error?.includes("baigėsi")) errorMessage = t('join.tokenExpired');
                    if (result.error?.includes("jau egzistuoja")) errorMessage = t('join.userExists');
                    setError(errorMessage);
                }
            } catch (err) {
                setError(t('join.serverContactError'));
            }
            setLoading(false);
        };

        checkToken();
    }, [token, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token || !fullName || password.length < 6) {
            toast({
                variant: "destructive",
                title: t('common.error'),
                description: t('join.fillFieldsError'),
            });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const result = await acceptInvitation(token, fullName, password);
            
            if (result.success) {
                toast({
                    title: t('join.welcomeToast.title'),
                    description: t('join.welcomeToast.description', { companyName: invitation?.companyName }),
                });
                window.location.replace('/login');
            } else {
                toast({
                    variant: "destructive",
                    title: t('common.error'),
                    description: result.error,
                });
            }
        } catch (err) {
            toast({
                variant: "destructive",
                title: t('common.error'),
                description: t('join.genericRegisterError'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    
    if (error) {
        return (
             <div className="flex h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md border-red-200">
                    <CardHeader className="text-center">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                        <CardTitle className="text-red-700">{t('join.errorCard.title')}</CardTitle>
                        <CardDescription className="text-red-600 font-medium text-lg mt-2">
                           {error}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-gray-500 text-sm">
                        {t('join.errorCard.checkLink')}
                    </CardContent>
                 </Card>
             </div>
        );
    }

    if (invitation) {
        return (
             <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                            <Building className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl pt-2">{t('join.form.title')}</CardTitle>
                        <CardDescription className="text-base">
                            {t('join.form.description')}<br/>
                            <span className="font-bold text-foreground text-lg">{invitation.companyName}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('join.form.emailLabel')}</Label>
                                <Input value={invitation.email} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('join.form.fullNameLabel')}</Label>
                                <Input 
                                    placeholder={t('reports.add.form.fullName.placeholder')} 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('join.form.passwordLabel')}</Label>
                                <Input 
                                    type="password" 
                                    placeholder="******" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Button type="submit" className="w-full h-11 text-base" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <UserCheck className="mr-2 h-4 w-4" />}
                                {t('join.form.createAccountButton')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
             </div>
        );
    }

    return null;
}
