
"use client";

import { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  Send, 
  Search,
  RefreshCw,
  Inbox,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmails, setEditingEmails] = useState<{ [key: string]: string }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/all-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        throw new Error('Nepavyko užkrauti užklausų.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Klaida', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFixEmail = async (requestId: string) => {
    const newEmail = editingEmails[requestId];
    if (!newEmail || !newEmail.includes('@')) {
      toast({ variant: 'destructive', title: 'Klaida', description: 'Prašome įvesti validų el. paštą.' });
      return;
    }

    setActionLoading(requestId);
    try {
      const res = await fetch('/api/admin/update-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, newEmail }),
      });

      if (res.ok) {
        toast({ title: 'Atnaujinta!', description: 'Užklausa persiųsta nauju el. paštu.' });
        setEditingEmails(prev => ({ ...prev, [requestId]: '' }));
        await fetchRequests();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Nepavyko atnaujinti užklausos.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Klaida', description: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'NEW') {
      return (
        <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
          <ShieldAlert className="w-3 h-3 mr-1" />
          RESEARCH
        </Badge>
      );
    }
    if (status === 'PENDING') {
      return (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Laukiama
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
        <CheckCircle className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
     <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Užklausų Valdymo Centras</CardTitle>
              <CardDescription>Čia taisomos "pakibusios" užklausos, kurioms trūksta kontaktinio el. pašto.</CardDescription>
            </div>
            <Button 
              onClick={fetchRequests}
              variant="outline"
              size="icon"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-40">Būsena</TableHead>
                            <TableHead>Vairuotojas / Tikrinama Įmonė</TableHead>
                            <TableHead>Užklausė</TableHead>
                            <TableHead className="w-1/3">El. paštas (Veiksmas)</TableHead>
                            <TableHead className="text-right">Data</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
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
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Inbox className="h-12 w-12 text-slate-400" />
                                        <span>"Pakibusių" užklausų nerasta.</span>
                                    </div>
                                </TableCell>
                             </TableRow>
                        ) : requests.map((req) => (
                            <TableRow 
                                key={req.id} 
                                className={req.status === 'NEW' ? 'bg-red-500/5' : ''}
                            >
                                <TableCell>{getStatusBadge(req.status)}</TableCell>
                                <TableCell>
                                    <div className="font-medium text-foreground">{req.driverName}</div>
                                    <div className="text-muted-foreground text-xs">{req.targetCompany}</div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{req.requesterCompanyName || 'Nenurodyta'}</TableCell>
                                <TableCell>
                                    {req.status === 'NEW' ? (
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                type="email"
                                                placeholder="pvz. info@imone.lt"
                                                value={editingEmails[req.id] || ''}
                                                onChange={(e) => setEditingEmails(prev => ({...prev, [req.id]: e.target.value}))}
                                                disabled={actionLoading === req.id}
                                                className="h-9"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => handleFixEmail(req.id)}
                                                disabled={!editingEmails[req.id] || actionLoading === req.id}
                                            >
                                                {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span>{req.targetEmail}</span>
                                            {req.emailSource === 'ADMIN_FIX' && <Badge variant="secondary" className="bg-blue-500/20 text-blue-700">Pataisyta</Badge>}
                                            {req.emailSource === 'DIRECTORY' && <Badge variant="outline">Iš Adresų kn.</Badge>}
                                            {req.emailSource === 'AI_GUESS' && <Badge variant="outline" className="border-amber-500/50 text-amber-700">Spėjimas</Badge>}
                                        </div>
                                    )}
                                </TableCell>
                                <td className="text-right text-xs text-muted-foreground font-mono">
                                    {new Date(req.createdAt).toLocaleDateString('lt-LT')}
                                </td>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
     </Card>
  );
}

