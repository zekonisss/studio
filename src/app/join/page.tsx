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

interface InvitationDetails {
    companyName: string;
    email: string;
}

export default function JoinPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Pakvietimo nuoroda negaliojanti arba jos trūksta.");
            setLoading(false);
            return;
        }

        const checkToken = async () => {
            try {
                const result = await verifyInvitation(token);
                if (result.success && result.data) {
                    setInvitation(result.data);
                } else {
                    setError(result.error || "Įvyko nežinoma klaida.");
                }
            } catch (err) {
                setError("Nepavyko susisiekti su serveriu.");
            }
            setLoading(false);
        };

        checkToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token || !fullName || password.length < 6) {
            toast({
                variant: "destructive",
                title: "Klaida",
                description: "Prašome užpildyti visus laukus teisingai (slaptažodis bent 6 simbolių).",
            });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const result = await acceptInvitation(token, fullName, password);
            
            if (result.success) {
                toast({
                    title: "Sveikiname prisijungus!",
                    description: `Jūs sėkmingai prisijungėte prie ${invitation?.companyName}. Dabar galite prisijungti.`,
                });
                router.push('/login');
            } else {
                toast({
                    variant: "destructive",
                    title: "Klaida",
                    description: result.error,
                });
            }
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Klaida",
                description: "Įvyko netikėta klaida registruojantis.",
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
                        <CardTitle className="text-red-700">Klaida</CardTitle>
                        <CardDescription className="text-red-600 font-medium text-lg mt-2">
                           {error}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-gray-500 text-sm">
                        Patikrinkite nuorodą arba paprašykite administratoriaus atsiųsti naują pakvietimą.
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
                        <CardTitle className="text-2xl pt-2">Sveiki atvykę!</CardTitle>
                        <CardDescription className="text-base">
                            Jūs kviečiamas prisijungti prie komandos: <br/>
                            <span className="font-bold text-foreground text-lg">{invitation.companyName}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>El. paštas</Label>
                                <Input value={invitation.email} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Jūsų Vardas Pavardė</Label>
                                <Input 
                                    placeholder="Vardenis Pavardenis" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Slaptažodis</Label>
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
                                Sukurti paskyrą ir Prisijungti
                            </Button>
                        </form>
                    </CardContent>
                </Card>
             </div>
        );
    }

    return null;
}
