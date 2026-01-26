"use client";

import { useState, useEffect } from 'react';
import type { Report } from '@/types';
import { getAllReports, reviewDeletionRequest, addAuditLogEntry } from '@/lib/storage';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Inbox, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewDialogState {
  isOpen: boolean;
  report: Report | null;
  decision: 'approved' | 'rejected' | null;
}

export default function DeletionRequestsTab() {
  const { t, locale } = useLanguage();
  const { user: adminUser } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState>({ isOpen: false, report: null, decision: null });
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    if (adminUser?.isAdmin) {
      const fetchRequests = async () => {
        setIsLoading(true);
        try {
          const allReports = await getAllReports(true);
          setRequests(allReports.filter(r => r.status === 'pending_delete'));
        } catch (error) {
          console.error("Error fetching deletion requests:", error);
          toast({ variant: "destructive", title: "Klaida", description: "Nepavyko gauti ištrynimo prašymų." });
        } finally {
          setIsLoading(false);
        }
      };
      fetchRequests();
    } else {
        setIsLoading(false);
    }
  }, [adminUser, toast]);

  const openReviewDialog = (report: Report, decision: 'approved' | 'rejected') => {
    setReviewDialog({ isOpen: true, report, decision });
    setReviewComment('');
  };

  const handleReviewConfirm = async () => {
    if (!reviewDialog.report || !reviewDialog.decision || !adminUser) return;
    if (reviewDialog.decision === 'rejected' && !reviewComment.trim()) {
        toast({ variant: "destructive", title: "Klaida", description: "Būtina nurodyti atmetimo priežastį." });
        return;
    }

    setIsReviewing(true);
    try {
        await reviewDeletionRequest(reviewDialog.report.id, reviewDialog.decision, reviewComment);
        
        await addAuditLogEntry({
            adminId: adminUser.id,
            adminName: adminUser.contactPerson,
            actionKey: 'report.deletionRequest.reviewed',
            details: {
                reportId: reviewDialog.report.id,
                driverFullName: reviewDialog.report.fullName,
                decision: reviewDialog.decision,
                reviewComment: reviewComment
            }
        });
        
        toast({ title: "Prašymas apdorotas", description: `Įrašo trynimo prašymas buvo ${reviewDialog.decision === 'approved' ? 'patvirtintas' : 'atmestas'}.` });
        
        setRequests(prev => prev.filter(r => r.id !== reviewDialog.report?.id));
    } catch (error) {
        console.error("Error reviewing request:", error);
        toast({ variant: "destructive", title: "Klaida", description: "Nepavyko apdoroti prašymo." });
    } finally {
        setIsReviewing(false);
        setReviewDialog({ isOpen: false, report: null, decision: null });
        setReviewComment('');
    }
  };


  if (!adminUser?.isAdmin) {
    return (
      <Card className="mt-6">
        <CardHeader><CardTitle>Prieiga negalima</CardTitle></CardHeader>
        <CardContent><p>Šis skydelis yra prieinamas tik administratoriams.</p></CardContent>
      </Card>
    );
  }

  return (
    <>
      <AlertDialog open={reviewDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setReviewDialog({ isOpen: false, report: null, decision: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewDialog.decision === 'approved' ? 'Patvirtinti įrašo ištrynimą?' : 'Atmesti įrašo ištrynimo prašymą?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewDialog.decision === 'rejected' ? 'Prašome nurodyti atmetimo priežastį.' : 'Šis veiksmas pakeis įrašo būseną į "ištrintas", bet pats įrašas liks sistemoje.'}
            </AlertDialogDescription>
             {reviewDialog.decision === 'rejected' && (
                <Textarea 
                    placeholder="Atmetimo priežastis..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="mt-4"
                />
             )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReviewing}>Atšaukti</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReviewConfirm} 
              disabled={isReviewing || (reviewDialog.decision === 'rejected' && !reviewComment.trim())}
              className={reviewDialog.decision === 'approved' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isReviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {reviewDialog.decision === 'approved' ? 'Taip, patvirtinti' : 'Atmesti prašymą'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Prašymai Ištrinti Įrašus</CardTitle>
          <CardDescription>Peržiūrėkite ir tvarkykite vartotojų pateiktus prašymus ištrinti įrašus.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vairuotojas</TableHead>
                  <TableHead>Pateikė</TableHead>
                  <TableHead>Priežastis</TableHead>
                  <TableHead>Prašymo Data</TableHead>
                  <TableHead className="text-right">Veiksmai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="text-right space-x-2">
                            <Skeleton className="h-9 w-24 inline-block" />
                            <Skeleton className="h-9 w-24 inline-block" />
                          </TableCell>
                      </TableRow>
                    ))
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <Inbox className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">Šiuo metu naujų prašymų ištrinti nėra.</p>
                        </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.fullName}</TableCell>
                      <TableCell>{report.reporterCompanyName}</TableCell>
                      <TableCell className="max-w-xs truncate">{report.deleteRequestReason}</TableCell>
                      <TableCell>{report.statusUpdatedAt ? new Date(report.statusUpdatedAt).toLocaleDateString(locale) : '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openReviewDialog(report, 'rejected')}>
                            <ThumbsDown className="mr-2 h-4 w-4"/> Atmesti
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openReviewDialog(report, 'approved')}>
                            <ThumbsUp className="mr-2 h-4 w-4"/> Patvirtinti
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
