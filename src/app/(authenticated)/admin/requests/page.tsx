
"use client";

import { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Send, 
  Search,
  RefreshCw,
  Inbox,
  Loader2,
  Eye,
  CornerUpRight,
  User,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  const getRowStatus = (req: any): 'ACTION_NEEDED' | 'COMPLETED' | 'PENDING' => {
    if (!req.targetEmail || req.targetEmail.trim() === '') {
      return 'ACTION_NEEDED';
    }
    if (req.status === 'COMPLETED') {
      return 'COMPLETED';
    }
    return 'PENDING';
  };

  return (
     <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Užklausų Valdymo Centras</CardTitle>
              <CardDescription>
                Čia matote visas užklausas. <span className="text-red-500 font-semibold">Raudonos</span> reikalauja Jūsų dėmesio.
              </CardDescription>
            </div>
            <Button 
              onClick={fetchRequests}
              variant="outline"
              size="icon"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <TooltipProvider>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-40">Būsena</TableHead>
                            <TableHead>Vairuotojas / Tikrinama Įmonė</TableHead>
                            <TableHead className="w-1/3">El. paštas (Veiksmas)</TableHead>
                            <TableHead className="text-center">Info</TableHead>
                            <TableHead className="text-right">Laikas</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                           [...Array(5)].map((_, i) => (
                             <TableRow key={i}>
                               <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                               <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                               <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                               <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                               <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                             </TableRow>
                           ))
                        ) : requests.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Inbox className="h-12 w-12 text-slate-400" />
                                        <span>Viskas švaru! Jokių užklausų. 🚀</span>
                                    </div>
                                </TableCell>
                             </TableRow>
                        ) : requests.map((req) => {
                            const rowStatus = getRowStatus(req);
                            const isActionNeeded = rowStatus === 'ACTION_NEEDED';

                            return (
                            <TableRow 
                                key={req.id} 
                                className={cn(isActionNeeded && 'bg-red-500/5 border-l-4 border-red-500')}
                            >
                                <TableCell className="align-top">
                                  {rowStatus === 'ACTION_NEEDED' && (
                                    <Badge variant="destructive" className="bg-red-500 text-white shadow-lg shadow-red-500/20">
                                      <AlertTriangle className="w-3 h-3 mr-1.5" /> REIKIA VEIKSMO
                                    </Badge>
                                  )}
                                  {rowStatus === 'PENDING' && (
                                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                                      <Clock className="w-3 h-3 mr-1.5" /> LAUKIAMA
                                    </Badge>
                                  )}
                                  {rowStatus === 'COMPLETED' && (
                                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                      <CheckCircle className="w-3 h-3 mr-1.5" /> ATLIKTA
                                    </Badge>
                                  )}
                                </TableCell>

                                <TableCell className="align-top">
                                    <div className="font-bold text-base">{req.driverName}</div>
                                    <div className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                                        <div className="bg-muted p-1 rounded">
                                            <Search className="w-3 h-3" />
                                        </div>
                                        {req.targetCompany}
                                    </div>
                                </TableCell>

                                <TableCell className="align-top">
                                    {isActionNeeded ? (
                                        <div className="flex gap-2 animate-pulse">
                                            <Input
                                                type="email"
                                                placeholder="Įveskite surastą el. paštą..."
                                                className="border-red-500/30 focus:border-red-500"
                                                value={editingEmails[req.id] || ''}
                                                onChange={(e) => setEditingEmails(prev => ({...prev, [req.id]: e.target.value}))}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleFixEmail(req.id); }}
                                            />
                                            <Button
                                                size="icon"
                                                onClick={() => handleFixEmail(req.id)}
                                                disabled={actionLoading === req.id || !editingEmails[req.id]}
                                                className="bg-red-600 hover:bg-red-500 text-white"
                                                title="Išsaugoti ir Siųsti"
                                            >
                                               {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    ) : (
                                      <div className="flex flex-col gap-1">
                                          <span className="font-mono text-sm break-all">{req.targetEmail}</span>
                                          <div className="flex gap-2 text-xs text-muted-foreground">
                                             {req.emailSource === 'ADMIN_FIX' && <span className="text-blue-500 flex items-center gap-1"><User className="w-3 h-3"/> Adminas taisė</span>}
                                             {req.emailSource === 'DIRECTORY' && <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Iš DB</span>}
                                             {req.emailSource === 'AI_GUESS' && <span className="text-purple-500 flex items-center gap-1">🤖 AI Spėjimas</span>}
                                          </div>
                                      </div>
                                    )}
                                </TableCell>
                                
                                <TableCell className="align-middle text-center">
                                    <div className="flex justify-center gap-4">
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Eye className={cn("w-5 h-5", req.lastActive ? 'text-blue-500' : 'text-muted-foreground/50')} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {req.lastActive ? `Matyta: ${new Date(req.lastActive).toLocaleDateString()}` : 'Dar neperžiūrėta'}
                                        </TooltipContent>
                                      </Tooltip>
                                       <Tooltip>
                                        <TooltipTrigger>
                                          <CornerUpRight className={cn("w-5 h-5", req.emailSource === 'DELEGATED' ? 'text-green-500' : 'text-muted-foreground/50')} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                           {req.emailSource === 'DELEGATED' ? 'Įmonė persiuntė kolegai' : 'Nebuvo peradresuota'}
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                </td>

                                <td className="p-4 align-top text-right">
                                  <div className="text-sm font-mono">{new Date(req.createdAt).toISOString().split('T')[0]}</div>
                                  <div className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </td>
                            </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
              </TooltipProvider>
            </div>
        </CardContent>
     </Card>
  );
}
