"use client";

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/types';
import { getAllUsers, updateUserProfile } from '@/lib/storage';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addAuditLogEntry } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';

export default function UserManagementTab() {
  const { t } = useLanguage();
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const userList = await getAllUsers();
      setUsers(userList.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Klaida",
        description: "Nepavyko gauti vartotojų sąrašo. Patikrinkite saugumo taisykles.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser?.isAdmin) {
      fetchUsers();
    } else {
        setIsLoading(false);
    }
  }, [adminUser]);

  const handleStatusChange = async (userToUpdate: UserProfile, newStatus: UserProfile['paymentStatus']) => {
    if (!adminUser || !adminUser.isAdmin) return;

    const oldStatus = userToUpdate.paymentStatus;
    if (oldStatus === newStatus) return;

    try {
      await updateUserProfile(userToUpdate.id, { paymentStatus: newStatus });
      toast({
        title: t('admin.users.toast.statusChanged.title'),
        description: t('admin.users.toast.statusChanged.description', { 
            companyName: userToUpdate.companyName, 
            email: userToUpdate.email, 
            status: t(`admin.users.status.${newStatus}`) 
        }),
      });

      // Log audit entry
      await addAuditLogEntry({
          adminId: adminUser.id,
          adminName: adminUser.contactPerson,
          actionKey: 'user.status.changed',
          details: { 
              userId: userToUpdate.id,
              userEmail: userToUpdate.email,
              companyName: userToUpdate.companyName,
              oldStatus: oldStatus,
              newStatus: newStatus
          }
      });
      
      // Refresh the list by updating the state locally
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userToUpdate.id ? { ...u, paymentStatus: newStatus } : u
        )
      );

    } catch (error) {
        console.error("Error updating user status:", error);
        toast({
            variant: "destructive",
            title: "Klaida",
            description: "Nepavyko atnaujinti vartotojo būsenos.",
        });
    }
  };

  const getStatusBadge = (status: UserProfile['paymentStatus']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">{t('admin.users.status.active')}</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600">{t('admin.users.status.pending_verification')}</Badge>;
      case 'pending_payment':
        return <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600">{t('admin.users.status.pending_payment')}</Badge>;
      case 'inactive':
        return <Badge variant="destructive">{t('admin.users.status.inactive')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!adminUser?.isAdmin) {
    return (
         <Card className="mt-6">
              <CardHeader>
                  <CardTitle>Prieiga negalima</CardTitle>
              </CardHeader>
              <CardContent>
                  <p>Šis skydelis yra prieinamas tik administratoriams.</p>
              </CardContent>
         </Card>
    )
}

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('admin.users.title')}</CardTitle>
        <CardDescription>{t('admin.users.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
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
                          <DropdownMenuLabel>{t('admin.users.actions.userActions')}</DropdownMenuLabel>
                           <DropdownMenuItem>
                                {t('admin.users.actions.viewProfile')}
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuGroup>
                            <DropdownMenuLabel>{t('admin.users.actions.changeStatus')}</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'active')} disabled={user.paymentStatus === 'active'}>
                                    {t('admin.users.status.active')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'pending_payment')} disabled={user.paymentStatus === 'pending_payment'}>
                                    {t('admin.users.status.pending_payment')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'pending_verification')} disabled={user.paymentStatus === 'pending_verification'}>
                                    {t('admin.users.status.pending_verification')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'inactive')} disabled={user.paymentStatus === 'inactive'}>
                                    {t('admin.users.status.inactive')}
                                </DropdownMenuItem>
                           </DropdownMenuGroup>
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
