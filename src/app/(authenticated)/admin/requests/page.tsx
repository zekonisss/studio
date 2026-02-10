'use client';

import { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Send, 
  Search,
  RefreshCw,
  Eye,
  CornerUpRight,
  User 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';


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
      }
    } catch (error) {
      console.error('Failed to fetch', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleFixEmail = async (requestId: string) => {
    const newEmail = editingEmails[requestId];
    if (!newEmail || !newEmail.includes('@')) {
      toast({ variant: 'destructive', title: 'Klaida', description: 'Prašome įvesti validų el. paštą.'});
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
        setEditingEmails(prev => ({ ...prev, [requestId]: '' }));
        await fetchRequests();
        toast({ title: 'Sėkmė', description: 'El. paštas atnaujintas.'});
      } else {
        throw new Error('Nepavyko atnaujinti.');
      }
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Klaida', description: error.message || 'Klaida siunčiant.' });
    } finally {
      setActionLoading(null);
    }
  };

  const getRowStatus = (req: any) => {
    if (req.status === 'NEW') {
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
              Čia matote visas užklausas. <span className="text-destructive font-semibold">Raudonos</span> reikalauja Jūsų dėmesio.
            </CardDescription>
          </div>
          <Button onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'mr-2'}`} />
            <span className={loading ? 'sr-only' : ''}>Atnaujinti</span>
          </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
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
                        <TableCell><div className="h-5 w-24 bg-muted rounded-md animate-pulse"></div></TableCell>
                        <TableCell><div className="h-5 w-40 bg-muted rounded-md animate-pulse"></div></TableCell>
                        <TableCell><div className="h-5 w-full bg-muted rounded-md animate-pulse"></div></TableCell>
                        <TableCell><div className="h-5 w-16 mx-auto bg-muted rounded-md animate-pulse"></div></TableCell>
                        <TableCell><div className="h-5 w-20 ml-auto bg-muted rounded-md animate-pulse"></div></TableCell>
                    </TableRow>
                 ))
              ) : requests.map((req) => {
                const rowStatus = getRowStatus(req);
                const isActionNeeded = rowStatus === 'ACTION_NEEDED';

                return (
                  <TableRow key={req.id} className={cn(isActionNeeded && 'bg-destructive/10')}>
                    <TableCell>
                      {rowStatus === 'ACTION_NEEDED' && <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1.5" />VEIKSMAS</Badge>}
                      {rowStatus === 'PENDING' && <Badge variant="secondary"><Clock className="w-3 h-3 mr-1.5" />LAUKIAMA</Badge>}
                      {rowStatus === 'COMPLETED' && <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1.5" />ATLIKTA</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">{req.driverName}</div>
                      <div className="text-muted-foreground text-xs flex items-center gap-2 mt-1">
                        <Search className="w-3 h-3" />
                        {req.targetCompany}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isActionNeeded ? (
                        <div className="flex gap-2">
                          <Input 
                            type="email" 
                            placeholder="Įveskite el. paštą..."
                            value={editingEmails[req.id] || req.targetEmail || ''}
                            onChange={(e) => setEditingEmails(prev => ({ ...prev, [req.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleFixEmail(req.id); }}
                            className="h-9"
                          />
                          <Button 
                            size="sm"
                            onClick={() => handleFixEmail(req.id)}
                            disabled={actionLoading === req.id}
                            title="Išsaugoti ir Siųsti"
                          >
                             {actionLoading === req.id ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                          </Button>
                        </div>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col gap-1 cursor-help">
                                <span className="font-mono text-sm truncate">{req.targetEmail}</span>
                                <div className="flex gap-2 text-xs">
                                   {req.emailSource === 'ADMIN_FIX' && <Badge variant="outline" className="text-blue-600 border-blue-200"><User className="w-3 h-3 mr-1"/>Adminas</Badge>}
                                   {req.emailSource === 'DIRECTORY' && <Badge variant="outline" className="text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1"/>Duomenų bazė</Badge>}
                                   {req.emailSource === 'AI_SEARCH' && <Badge variant="outline" className="text-purple-600 border-purple-200">🤖 AI</Badge>}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent><p>{req.targetEmail}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-3">
                        <TooltipProvider>
                           <Tooltip><TooltipTrigger><Eye className={`w-5 h-5 ${req.lastActive ? 'text-blue-500' : 'text-muted-foreground/50'}`} /></TooltipTrigger><TooltipContent>{req.lastActive ? `Matyta: ${new Date(req.lastActive).toLocaleDateString()}` : 'Dar neperžiūrėta'}</TooltipContent></Tooltip>
                           <Tooltip><TooltipTrigger><CornerUpRight className={`w-5 h-5 ${req.emailSource === 'DELEGATED' ? 'text-green-500' : 'text-muted-foreground/50'}`} /></TooltipTrigger><TooltipContent>{req.emailSource === 'DELEGATED' ? 'Persiųsta kolegai' : 'Neperadresuota'}</TooltipContent></Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-mono text-sm">{new Date(req.createdAt).toISOString().split('T')[0]}</div>
                      <div className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {requests.length === 0 && !loading && (
                 <TableRow>
                    <TableCell colSpan={5} className="p-12 text-center text-muted-foreground">
                        Viskas švaru! Jokių naujų užklausų. 🚀
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
