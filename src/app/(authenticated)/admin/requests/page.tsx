"use client";

import { useState, useEffect } from 'react';
import type { VerificationRequest } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Clock, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function AdminRequestsPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            if (!user?.isAdmin) {
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch('/api/admin/all-requests');
                if (!response.ok) throw new Error('Failed to fetch requests');
                const data: VerificationRequest[] = await response.json();
                setRequests(data);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Klaida', description: error.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, [user, toast]);

    const handleEmailChange = (requestId: string, email: string) => {
        setEmailInputs(prev => ({ ...prev, [requestId]: email }));
    };

    const handleUpdateRequest = async (requestId: string) => {
        const newEmail = emailInputs[requestId];
        if (!newEmail || !newEmail.includes('@')) {
            toast({ variant: 'destructive', title: 'Klaida', description: 'Prašome įvesti teisingą el. pašto adresą.' });
            return;
        }

        setSubmittingId(requestId);
        try {
            const response = await fetch('/api/admin/update-request', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, newEmail }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Serverio klaida');

            toast({ title: 'Atnaujinta!', description: 'Užklausa persiųsta nauju el. paštu.' });
            
            // Update local state for instant feedback
            setRequests(prev => prev.map(req => 
                req.id === requestId 
                    ? { ...req, status: 'PENDING', targetEmail: newEmail, emailSource: 'ADMIN_FIX' } 
                    : req
            ));

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Klaida atnaujinant', description: error.message });
        } finally {
            setSubmittingId(null);
        }
    };

    const getStatusBadge = (status: VerificationRequest['status']) => {
        switch (status) {
            case 'NEW':
                return <Badge className="bg-red-500/10 text-red-700 border-red-500/20"><AlertCircle className="mr-1 h-3 w-3"/>Trūksta el. pašto</Badge>;
            case 'PENDING':
                return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20"><Clock className="mr-1 h-3 w-3"/>Laukiama</Badge>;
            case 'COMPLETED':
                return <Badge className="bg-green-500/10 text-green-700 border-green-500/20"><CheckCircle className="mr-1 h-3 w-3"/>Atsakyta</Badge>;
            case 'EXPIRED':
                return <Badge variant="destructive" className="bg-gray-500/10 text-gray-500 border-gray-500/20"><HelpCircle className="mr-1 h-3 w-3"/>Neatsakė</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (!user?.isAdmin) {
        return (
            <Card>
                <CardHeader><CardTitle>Prieiga negalima</CardTitle></CardHeader>
                <CardContent><p>Šis puslapis prieinamas tik administratoriams.</p></CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="bg-card">
            <CardHeader>
                <CardTitle className="text-2xl">Užklausų Valdymo Centras</CardTitle>
                <CardDescription>Peržiūrėkite, valdykite ir taisykite visas sistemos patikros užklausas.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-muted/50">
                                <TableHead className="w-[180px]">Būsena</TableHead>
                                <TableHead>Vairuotojas / Tikrinama Įmonė</TableHead>
                                <TableHead>Užklausė</TableHead>
                                <TableHead className="w-[350px]">El. paštas (Veiksmas)</TableHead>
                                <TableHead className="text-right">Užklausos Data</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Šiuo metu aktyvių užklausų nėra.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map(req => (
                                    <TableRow key={req.id} className={cn(
                                        "hover:bg-muted/50",
                                        req.status === 'NEW' && "bg-red-500/5"
                                    )}>
                                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{req.driverName}</div>
                                            <div className="text-xs text-muted-foreground">{req.targetCompany}</div>
                                        </TableCell>
                                         <TableCell className="text-xs text-muted-foreground">{req.requesterCompanyName || 'Nenurodyta'}</TableCell>
                                        <TableCell>
                                            {req.status === 'NEW' ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="email"
                                                        placeholder="Įveskite teisingą el. paštą..."
                                                        value={emailInputs[req.id] || ''}
                                                        onChange={(e) => handleEmailChange(req.id, e.target.value)}
                                                        disabled={submittingId === req.id}
                                                        className="h-9"
                                                    />
                                                    <Button size="sm" onClick={() => handleUpdateRequest(req.id)} disabled={!emailInputs[req.id] || submittingId === req.id}>
                                                        {submittingId === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <span>{req.targetEmail}</span>
                                                    {req.emailSource === 'ADMIN_FIX' && <Badge variant="secondary" className="bg-green-500/20 text-green-700">Pataisyta</Badge>}
                                                    {req.emailSource === 'DIRECTORY' && <Badge variant="outline">Iš Adresų kn.</Badge>}
                                                    {req.emailSource === 'AI_GUESS' && <Badge variant="outline" className="border-amber-500/50 text-amber-700">Spėjimas</Badge>}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground font-mono">
                                            {format(new Date(req.createdAt), 'yyyy-MM-dd HH:mm', { locale: lt })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}