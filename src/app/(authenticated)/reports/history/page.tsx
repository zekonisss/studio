"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, History as HistoryIcon, User, CalendarDays, Tag, MessageSquare, AlertTriangle, Trash2, Eye, PlusCircle } from "lucide-react";
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";


// Mock data for reports
const mockUserReports: Report[] = [
  {
    id: "report-user-1",
    reporterId: "dev-user-123",
    reporterCompanyName: 'UAB "Bandomoji Įmonė"',
    fullName: "Antanas Antanaitis",
    birthYear: 1992,
    category: "netinkamas_elgesys",
    tags: ["konfliktiskas"],
    comment: "Vairuotojas buvo nemandagus su klientu, atsisakė padėti iškrauti prekes. Klientas pateikė skundą.",
    createdAt: new Date("2024-02-20T09:15:00Z"),
  },
  {
    id: "report-user-2",
    reporterId: "dev-user-123",
    reporterCompanyName: 'UAB "Bandomoji Įmonė"',
    fullName: "Zita Zitaite",
    category: "greicio_virijimas",
    tags: ["pasikartojantis", "pavojingas_vairavimas"],
    comment: "GPS duomenys rodo pakartotinį greičio viršijimą gyvenvietėse. Buvo įspėta, tačiau situacija kartojasi.",
    imageUrl: "https://placehold.co/300x200.png",
    createdAt: new Date("2024-01-10T16:45:00Z"),
  },
];

export default function ReportHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      if (user) {
        // Simulate API call to fetch reports by user.reporterId
        await new Promise(resolve => setTimeout(resolve, 1000));
        setReports(mockUserReports.filter(r => r.reporterId === user.id));
      }
      setIsLoading(false);
    };
    fetchReports();
  }, [user]);

  const handleDeleteReport = async (reportId: string) => {
    setDeletingId(reportId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setReports(prevReports => prevReports.filter(report => report.id !== reportId));
    toast({
      title: "Pranešimas pašalintas",
      description: "Pasirinktas pranešimas buvo sėkmingai pašalintas.",
    });
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <HistoryIcon className="mr-3 h-8 w-8 text-primary" />
            Mano Pranešimų Istorija
          </h1>
          <p className="text-muted-foreground mt-1">Peržiūrėkite ir tvarkykite savo pateiktus pranešimus.</p>
        </div>
        <Button asChild>
          <Link href="/reports/add">
            <PlusCircle className="mr-2 h-5 w-5" />
            Pridėti Naują Pranešimą
          </Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card className="shadow-md text-center">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-xl">Pranešimų Nerasta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Jūs dar nesate pateikę jokių pranešimų.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/reports/add">Sukurti Pirmą Pranešimą</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <Card key={report.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center mb-1">
                      <User className="mr-2 h-5 w-5 text-primary" />
                      {report.fullName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Pranešta: {format(report.createdAt, "yyyy-MM-dd HH:mm", { locale: lt })}
                    </CardDescription>
                  </div>
                  <Badge variant={report.category === 'kuro_vagyste' || report.category === 'zala_irangai' ? 'destructive' : 'secondary'}>
                    {report.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-2 space-y-3">
                <p className="text-muted-foreground line-clamp-3"><MessageSquare className="inline h-4 w-4 mr-1.5 relative -top-0.5" />{report.comment}</p>
                {report.tags && report.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {report.tags.map(tag => (
                      <Badge key={tag} variant="outline"><Tag className="inline h-3 w-3 mr-1" />{tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-4">
                 <Button variant="ghost" size="sm" asChild>
                  <Link href={`/reports/view/${report.id}`}> {/* Placeholder view page */}
                    <Eye className="mr-2 h-4 w-4" />
                    Peržiūrėti
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={deletingId === report.id}>
                      {deletingId === report.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Pašalinti
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ar tikrai norite pašalinti šį pranešimą?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Šis veiksmas yra negrįžtamas. Pranešimas apie <span className="font-semibold">{report.fullName}</span> bus visam laikui pašalintas iš sistemos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteReport(report.id)} className="bg-destructive hover:bg-destructive/90">
                        Taip, pašalinti
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
