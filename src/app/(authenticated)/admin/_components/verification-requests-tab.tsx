
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, AlertTriangle, Clock, CheckCircle, Send, Loader2, Search, Eye, Mail, CornerDownRight, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { VerificationRequest } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export default function VerificationRequestsTab() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/all-requests?t=' + new Date().getTime(), { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Klaida', description: 'Nepavyko gauti užklausų sąrašo.'});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmailInputChange = (requestId: string, value: string) => {
    setEmailInputs(prev => ({ ...prev, [requestId]: value }));
  };

  const handleUpdateEmail = async (requestId: string) => {
    const newEmail = emailInputs[requestId];
    if (!newEmail || !newEmail.includes('@')) {
      toast({ variant: 'destructive', title: 'Klaida', description: 'Prašome įvesti teisingą el. pašto adresą.' });
      return;
    }

    setUpdatingId(requestId);
    try {
      const response = await fetch('/api/admin/update-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, newEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Serverio klaida');
      
      toast({ title: 'Pavyko!', description: 'Užklausa atnaujinta ir laiškas sėkmingai išsiųstas.' });
      fetchRequests(); // Re-fetch the data to show the updated state
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Klaida', description: error.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePreview = (token: string | undefined) => {
    if (!token) {
        toast({
            variant: "destructive",
            title: "Klaida",
            description: "Šiai užklausai trūksta patvirtinimo rakto (token).",
        });
        return;
    }
    const url = `${window.location.origin}/verify?token=${token}`;
    window.open(url, '_blank');
  };
  
  const getStatusBadge = (status: VerificationRequest['status']) => {
    const upperCaseStatus = status?.toUpperCase();
    
    switch (upperCaseStatus) {
      case 'NEW':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />{t('admin.requests.status.new')}</Badge>;
      case 'RESEARCH':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />REIKIA PERŽIŪROS</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20"><Clock className="mr-1 h-3 w-3" />{t('admin.requests.status.pending')}</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20"><CheckCircle className="mr-1 h-3 w-3" />{t('admin.requests.status.completed')}</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline">{t('admin.requests.status.expired')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Patikros Užklausos</CardTitle>
          <CardDescription>Čia matomos visos sistemos vartotojų sukurtos patikros užklausos.</CardDescription>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="icon" disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          <span className="sr-only">Atnaujinti</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Vairuotojas</TableHead>
                <TableHead>Tikrinama Įmonė</TableHead>
                <TableHead>Kontaktinis El. Paštas</TableHead>
                <TableHead>Sekimas</TableHead>
                <TableHead>Būsena</TableHead>
                <TableHead className="text-right">Veiksmai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-9 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Naujų užklausų nerasta.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow 
                    key={req.id} 
                    className={cn(
                      (req.status?.toUpperCase() === 'NEW' || req.status?.toUpperCase() === 'RESEARCH') && 'bg-red-50 dark:bg-red-900/10'
                    )}
                  >
                    <TableCell className="font-mono text-xs">
                      {format(new Date(req.createdAt), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">{req.driverName}</TableCell>
                    <TableCell>{req.targetCompany}</TableCell>
                    <TableCell>
                      {req.targetEmail ? (
                        <div>{req.targetEmail}</div>
                      ) : (
                        <div className="flex items-center gap-2">
                           <Input
                              type="email"
                              placeholder="Įveskite el. paštą..."
                              value={emailInputs[req.id] || ''}
                              onChange={(e) => handleEmailInputChange(req.id, e.target.value)}
                              disabled={updatingId === req.id}
                              className="h-9"
                           />
                           <Button
                              size="icon"
                              variant="secondary"
                              className="h-9 w-9 shrink-0"
                              onClick={() => handleUpdateEmail(req.id)}
                              disabled={updatingId === req.id || !emailInputs[req.id]}
                           >
                              {updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                           </Button>
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground uppercase mt-1">{req.emailSource}</div>
                    </TableCell>
                    <TableCell>
                        <TooltipProvider>
                            {req.emailStatus === 'OPENED' && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="flex items-center gap-1.5 text-green-600">
                                            <Eye className="h-4 w-4" />
                                            <span className="font-semibold">Perskaityta</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {req.openedAt ? `Atidaryta: ${new Date(req.openedAt).toLocaleString(locale)}` : 'Atidarymo data nenustatyta'}
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {(req.emailStatus === 'SENT' || req.emailStatus === 'DELIVERED') && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <span>Išsiųsta</span>
                                </div>
                            )}
                             {req.emailStatus === 'BOUNCED' && (
                                <Tooltip>
                                     <TooltipTrigger>
                                        <div className="flex items-center gap-1.5 text-destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>Grįžo</span>
                                        </div>
                                     </TooltipTrigger>
                                     <TooltipContent>
                                        <p>Laiškas nepasiekė adresato.</p>
                                     </TooltipContent>
                                </Tooltip>
                            )}
                            {req.delegateEmail && (
                                <div className="flex items-center gap-1 text-xs text-blue-600 mt-1" title={`Persiųsta: ${req.delegateEmail}`}>
                                    <CornerDownRight className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{req.delegateEmail}</span>
                                </div>
                            )}
                        </TooltipProvider>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handlePreview(req.token)}>
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Peržiūrėti kaip įmonė</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
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
