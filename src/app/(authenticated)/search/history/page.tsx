
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SearchLog } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ListChecks, AlertTriangle, SearchCheck } from "lucide-react";
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MOCK_USER } from "@/types";

// Base mock data for search logs, used to seed localStorage for MOCK_USER if empty
const mockSearchLogsBase: SearchLog[] = [
  { id: "mocklog1", userId: "dev-user-123", searchText: "Jonas Jonaitis (Demo)", timestamp: new Date("2024-03-10T10:00:00Z"), resultsCount: 2 },
  { id: "mocklog2", userId: "dev-user-123", searchText: "AB123XYZ (Demo)", timestamp: new Date("2024-03-09T15:30:00Z"), resultsCount: 0 },
  { id: "mocklog3", userId: "dev-user-123", searchText: "Petras Petraitis (Demo)", timestamp: new Date("2024-03-09T11:20:00Z"), resultsCount: 1 },
];

const LOCAL_STORAGE_SEARCH_LOGS_KEY = 'driverShieldSearchLogs';

function getSearchLogsFromLocalStorage(): SearchLog[] {
  if (typeof window !== 'undefined') {
    const logsJSON = localStorage.getItem(LOCAL_STORAGE_SEARCH_LOGS_KEY);
    if (logsJSON) {
      return JSON.parse(logsJSON).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    }
  }
  return [];
}

function saveSearchLogsToLocalStorage(logs: SearchLog[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_SEARCH_LOGS_KEY, JSON.stringify(logs));
  }
}

export default function SearchHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSearchLogs = async () => {
      if (!user) {
        setSearchLogs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500)); 
      
      let userLogs = getSearchLogsFromLocalStorage().filter(log => log.userId === user.id);

      if (user.id === MOCK_USER.id && userLogs.length === 0) {
        // If mock user and no logs in localStorage for them, seed with base mock data
        const mockUserLogs = mockSearchLogsBase.filter(log => log.userId === MOCK_USER.id);
        if (mockUserLogs.length > 0) {
           const allLogs = getSearchLogsFromLocalStorage(); // get all logs to not overwrite others
           const otherUserLogs = allLogs.filter(log => log.userId !== MOCK_USER.id);
           saveSearchLogsToLocalStorage([...otherUserLogs, ...mockUserLogs]);
           userLogs = mockUserLogs; // Use these newly seeded logs
        }
      }
      
      setSearchLogs(userLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      setIsLoading(false);
    };

    if (!authLoading) { // Only fetch if auth state is resolved
        fetchSearchLogs();
    }
  }, [user, authLoading]);

  if (authLoading || (isLoading && !searchLogs.length)) {
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

    