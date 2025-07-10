
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SearchLog } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ListChecks, AlertTriangle, SearchCheck } from "lucide-react";
import { format } from 'date-fns';
import { lt, enUS } from 'date-fns/locale'; 
import { Button } from "@/components/ui/button";
import Link from "next/link";
import * as storage from '@/lib/storage';
import { useLanguage } from "@/contexts/language-context"; 


export default function SearchHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dateLocale = locale === 'en' ? enUS : lt;

  useEffect(() => {
    const fetchSearchLogs = async () => {
      if (!user) {
        setSearchLogs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const userLogs = await storage.getSearchLogs(user.id);
        setSearchLogs(userLogs);
      } catch(error) {
        console.error("Failed to fetch search logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
        fetchSearchLogs();
    }
  }, [user, authLoading]);

  if (authLoading || isLoading) {
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
            {t('searchHistory.pageTitle')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('searchHistory.pageDescription')}</p>
        </div>
         <Button asChild>
          <Link href="/search">
            <SearchCheck className="mr-2 h-5 w-5" />
            {t('searchHistory.newSearchButton')}
          </Link>
        </Button>
      </div>


      {searchLogs.length === 0 ? (
         <Card className="shadow-md text-center">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-xl">{t('searchHistory.noHistory.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('searchHistory.noHistory.message')}
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/search">{t('searchHistory.noHistory.performFirstSearchButton')}</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{t('searchHistory.table.title')}</CardTitle>
            <CardDescription>{t('searchHistory.table.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">{t('searchHistory.table.header.query')}</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">{t('searchHistory.table.header.resultsCount')}</TableHead>
                  <TableHead className="text-right">{t('searchHistory.table.header.dateTime')}</TableHead>
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
                    <TableCell className="text-right text-muted-foreground">{format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss", { locale: dateLocale })}</TableCell>
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
