"use client";
import { useState, useEffect } from 'react';
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from '@/hooks/use-auth';
import type { SearchLog } from '@/types';
import { getSearchLogs } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ListChecks, Loader2, Search, Inbox } from "lucide-react";
import Link from 'next/link';

export default function SearchHistoryPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [logs, setLogs] = useState<SearchLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const searchLogs = await getSearchLogs(user.id);
                setLogs(searchLogs);
            } catch (error) {
                console.error("Error fetching search logs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [user]);

    const NoHistoryView = () => (
        <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg mt-6">
            <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t('searchHistory.noHistory.title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('searchHistory.noHistory.message')}</p>
            <Button asChild className="mt-6">
                <Link href="/search">
                    <Search className="mr-2 h-4 w-4" />
                    {t('searchHistory.noHistory.performFirstSearchButton')}
                </Link>
            </Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <ListChecks className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>{t('searchHistory.pageTitle')}</CardTitle>
                            <CardDescription>{t('searchHistory.pageDescription')}</CardDescription>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href="/search">
                            <Search className="mr-2 h-4 w-4" />
                            {t('searchHistory.newSearchButton')}
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : logs.length === 0 ? (
                        <NoHistoryView />
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('searchHistory.table.title')}</CardTitle>
                                <CardDescription>{t('searchHistory.table.description')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('searchHistory.table.header.query')}</TableHead>
                                            <TableHead className="text-center">{t('searchHistory.table.header.resultsCount')}</TableHead>
                                            <TableHead className="text-right">{t('searchHistory.table.header.dateTime')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">{log.searchText}</TableCell>
                                                <TableCell className="text-center">{log.resultsCount}</TableCell>
                                                <TableCell className="text-right">{new Date(log.timestamp).toLocaleString(t('common.localeForDate'))}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
