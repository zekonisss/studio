'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Define the shape of a request object based on the API response
interface VerificationRequest {
  id: string;
  createdAt: string;
  driverName: string;
  targetCompany: string;
  targetEmail: string | null;
  status: 'NEW' | 'PENDING' | 'COMPLETED' | 'EXPIRED';
  emailSource: string;
}

export function VerificationRequestsTab() {
  const { t, locale } = useLanguage();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/all-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error(error);
      // In a real app, you'd show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);
  
  const getStatusBadge = (status: VerificationRequest['status']) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Reikia Veiksmo</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20"><Clock className="mr-1 h-3 w-3" />Laukiama</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20"><CheckCircle className="mr-1 h-3 w-3" />Atsakyta</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline">Pasibaigęs galiojimas</Badge>;
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
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Naujų užklausų nerasta.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id} className={cn(req.status === 'NEW' && 'bg-red-50 dark:bg-red-900/10')}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(req.createdAt), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">{req.driverName}</TableCell>
                    <TableCell>{req.targetCompany}</TableCell>
                    <TableCell>
                      <div>{req.targetEmail || <span className="text-muted-foreground italic">Nenurodytas</span>}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{req.emailSource}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Peržiūrėti</Button>
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
