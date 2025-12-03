"use client";

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';


export default function UserManagementTab() {
  const { t } = useLanguage();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('admin.users.title')}</CardTitle>
        <CardDescription>{t('admin.users.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.users.table.companyName')}</TableHead>
                <TableHead>{t('admin.users.table.contactPerson')}</TableHead>
                <TableHead>{t('admin.users.table.email')}</TableHead>
                 <TableHead>{t('admin.users.table.registrationDate')}</TableHead>
                <TableHead>{t('admin.users.table.status')}</TableHead>
                <TableHead className="text-right">{t('admin.users.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {t('admin.users.noUsersFound')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
