"use client";

import { useState, useEffect } from 'react';
import type { Report } from '@/types';
import { getAllReports } from '@/lib/storage';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { getCategoryNameForDisplay } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from '@/lib/constants';

export default function EntryManagementTab() {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const reportList = await getAllReports();
        const activeReports = reportList.filter(report => !report.deletedAt);
        setReports(activeReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('admin.entries.title')}</CardTitle>
        <CardDescription>{t('admin.entries.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.entries.table.personInEntry')}</TableHead>
                <TableHead>{t('admin.entries.table.category')}</TableHead>
                <TableHead>{t('admin.entries.table.submittedByCompany')}</TableHead>
                <TableHead>{t('admin.entries.table.submissionDate')}</TableHead>
                <TableHead className="text-right">{t('admin.entries.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {t('admin.entries.noEntriesFound')}
                    </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                   <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.fullName}</TableCell>
                    <TableCell>
                      <Badge variant={DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category) ? 'destructive' : 'secondary'}>
                        {getCategoryNameForDisplay(report.category, t)}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.reporterCompanyName}</TableCell>
                    <TableCell>{new Date(report.createdAt).toLocaleDateString(t('common.localeForDate'))}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            {t('admin.entries.actions.viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            {t('admin.entries.actions.deleteEntry')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button variant="destructive" size="sm">{t('admin.entries.actions.deleteAllEntries')}</Button>
      </CardFooter>
    </Card>
  );
}
