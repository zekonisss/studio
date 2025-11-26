"use client";
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import type { SearchLog } from '@/types';
import { getSearchLogs } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export default function SearchHistoryPage() {
    const { t, locale } = useLanguage();
    const { user } = useAuth();
    const [logs, setLogs] = useState<SearchLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            getSearchLogs(user.id)
                .then(setLogs)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [user]);

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(t('common.localeForDate'), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div>
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{t('searchHistory.pageTitle')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t('searchHistory.pageDescription')}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/search">{t('searchHistory.newSearchButton')}</Link>
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{t('searchHistory.table.title')}</CardTitle>
                    <CardDescription>{t('searchHistory.table.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : logs.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('searchHistory.table.header.query')}</TableHead>
                                    <TableHead className="text-center">{t('searchHistory.table.header.resultsCount')}</TableHead>
                                    <TableHead className="text-right">{t('searchHistory.table.header.dateTime')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.searchText}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={log.resultsCount > 0 ? 'secondary' : 'destructive'}>
                                                {log.resultsCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatDate(log.timestamp as Date)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12">
                             <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">{t('searchHistory.noHistory.title')}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{t('searchHistory.noHistory.message')}</p>
                            <Button asChild className="mt-6">
                                <Link href="/search">{t('searchHistory.noHistory.performFirstSearchButton')}</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
