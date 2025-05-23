"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SearchLog } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ListChecks, AlertTriangle, SearchCheck } from "lucide-react";
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Mock data for search logs
const mockSearchLogs: SearchLog[] = [
  { id: "log1", userId: "dev-user-123", searchText: "Jonas Jonaitis", timestamp: new Date("2024-03-10T10:00:00Z"), resultsCount: 2 },
  { id: "log2", userId: "dev-user-123", searchText: "AB123XYZ", timestamp: new Date("2024-03-09T15:30:00Z"), resultsCount: 0 },
  { id: "log3", userId: "dev-user-123", searchText: "Petras Petraitis", timestamp: new Date("2024-03-09T11:20:00Z"), resultsCount: 1 },
  { id: "log4", userId: "dev-user-123", searchText: "Ona Onaitė", timestamp: new Date("2024-03-08T17:45:00Z"), resultsCount: 5 },
];

export default function SearchHistoryPage() {
  const { user } = useAuth();
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSearchLogs = async () => {
      setIsLoading(true);
      if (user) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSearchLogs(mockSearchLogs.filter(log => log.userId === user.id));
      }
      setIsLoading(false);
    };
    fetchSearchLogs();
  }, [user]);

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
            <ListChecks className="mr-3 h-8 w-8 text-primary" />
            Paieškų Istorija
          </h1>
          <p className="text-muted-foreground mt-1">Peržiūrėkite savo ankstesnes paieškas sistemoje.</p>
        </div>
         <Button asChild>
          <Link href="/search">
            <SearchCheck className="mr-2 h-5 w-5" />
            Nauja Paieška
          </Link>
        </Button>
      </div>


      {searchLogs.length === 0 ? (
         <Card className="shadow-md text-center">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-xl">Paieškų Istorijos Nėra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Jūs dar neatlikote jokių paieškų sistemoje.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/search">Atlikti Pirmą Paiešką</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Jūsų paieškos</CardTitle>
            <CardDescription>Žemiau pateikiamos jūsų atliktos paieškos nuo naujausios iki seniausios.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Paieškos Frazė</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Rezultatų Skaičius</TableHead>
                  <TableHead className="text-right">Data ir Laikas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{log.searchText}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <Badge variant={log.resultsCount > 0 ? "default" : "outline"}>
                        {log.resultsCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{format(log.timestamp, "yyyy-MM-dd HH:mm:ss", { locale: lt })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

