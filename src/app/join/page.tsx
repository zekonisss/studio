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
            const result = await verifyInvitation(token);
            if (result.success && result.data) {
                setInvitation(result.data);
            } else {
                setError(result.error || "Įvyko nežinoma klaida.");
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
                description: "Prašome užpildyti visus laukus. Slaptažodis turi būti bent 6 simbolių ilgio.",
            });
            return;
        }
        
        setIsSubmitting(true);
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
                title: "Registracijos klaida",
                description: result.error,
            });
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Tikrinamas pakvietimas...</p>
            </div>
        );
    }
    
    if (error) {
        return (
             <Card className="w-full max-w-md">
                <CardHeader className="items-center text-center">
                    <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
                    <CardTitle>Pakvietimas negalioja</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">{error}</p>
                </CardContent>
             </Card>
        );
    }

    if (invitation) {
        return (
             <Card className="w-full max-w-lg">
                <CardHeader className="items-center text-center">
                    <UserCheck className="h-10 w-10 text-primary mb-3" />
                    <CardTitle className="text-2xl">Prisijunkite prie komandos</CardTitle>
                    <CardDescription className="flex items-center gap-2 pt-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        Jūs buvote pakviestas prisijungti prie <strong className="text-foreground">{invitation.companyName}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">El. paštas</Label>
                            <Input id="email" value={invitation.email} disabled className="bg-muted/50" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="fullName">Vardas ir Pavardė</Label>
                            <Input 
                                id="fullName" 
                                placeholder="Jūsų vardas ir pavardė"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="password">Slaptažodis</Label>
                            <Input 
                                id="password" 
                                type="password"
                                placeholder="Sukurkite slaptažodį (min. 6 simboliai)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Priimti pakvietimą ir sukurti paskyrą
                        </Button>
                    </form>
                </CardContent>
             </Card>
        )
    }

    return null; // Should not be reached
}
