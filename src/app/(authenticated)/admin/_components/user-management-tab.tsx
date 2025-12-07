"use client";

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/types';
import { getAllUsers } from '@/lib/storage';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2 } from 'lucide-react';

export default function UserManagementTab() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const userList = await getAllUsers();
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const getStatusBadge = (status: UserProfile['paymentStatus']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">{t('admin.users.status.active')}</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-500">{t('admin.users.status.pending_verification')}</Badge>;
      case 'pending_payment':
        return <Badge variant="secondary" className="bg-orange-500">{t('admin.users.status.pending_payment')}</Badge>;
      case 'inactive':
        return <Badge variant="destructive">{t('admin.users.status.inactive')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {t('admin.users.noUsersFound')}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.companyName}</TableCell>
                    <TableCell>{user.contactPerson}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{new Date(user.registeredAt).toLocaleDateString(t('common.localeForDate'))}</TableCell>
                    <TableCell>{getStatusBadge(user.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('admin.users.table.actions')}</DropdownMenuLabel>
                          <DropdownMenuItem>
                            {t('admin.users.actions.viewProfile')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem>
                            {t('admin.users.actions.activate')}
                          </DropdownMenuItem>
                           <DropdownMenuItem>
                            {t('admin.users.actions.deactivate')}
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
    </Card>
  );
}
