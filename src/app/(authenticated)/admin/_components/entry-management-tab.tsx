"use client";

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function EntryManagementTab() {
  const { t } = useLanguage();

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
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {t('admin.entries.noEntriesFound')}
                    </TableCell>
                </TableRow>
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
