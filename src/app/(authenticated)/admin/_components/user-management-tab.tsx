"use client";

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/types';
import { getAllUsers, updateUserProfile, addAuditLogEntry } from '@/lib/server/actions';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AdminUserDetailsModal } from './modals/admin-user-details-modal';
import { ScrollArea } from '@/components/ui/scroll-area';

type PaymentStatus = 'active' | 'inactive' | 'pending_verification' | 'pending_payment';

export function UserManagementTab() {
  const { t } = useLanguage();
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const handleStatusChange = async (user: UserProfile, newStatus: PaymentStatus) => {
    if (!adminUser) return;
    try {
      await updateUserProfile(user.id, { paymentStatus: newStatus });
      await addAuditLogEntry({
        adminId: adminUser.id,
        adminName: adminUser.contactPerson,
        actionKey: 'userStatusChanged',
        details: { userId: user.id, userEmail: user.email, companyName: user.companyName, oldStatus: user.paymentStatus, newStatus },
      });
      toast({
        title: t('admin.users.toast.statusChanged.title'),
        description: t('admin.users.toast.statusChanged.description', {
          companyName: user.companyName,
          email: user.email,
          status: t(`admin.users.status.${newStatus}`),
        }),
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleViewProfile = (user: UserProfile) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };
  
  const getStatusVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending_payment':
      case 'pending_verification': return 'secondary';
      case 'inactive': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (users.length === 0) {
    return <p>{t('admin.users.noUsersFound')}</p>;
  }

  return (
    <div>
        <ScrollArea className="h-[60vh]">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>{t('admin.users.table.companyName')}</TableHead>
                <TableHead>{t('admin.users.table.contactPerson')}</TableHead>
                <TableHead>{t('admin.users.table.email')}</TableHead>
                <TableHead>{t('admin.users.table.status')}</TableHead>
                <TableHead className="text-right">{t('admin.users.table.actions')}</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {users.map((user) => (
                <TableRow key={user.id}>
                <TableCell className="font-medium">{user.companyName}</TableCell>
                <TableCell>{user.contactPerson}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                    <Badge variant={getStatusVariant(user.paymentStatus)}>
                    {t(`admin.users.status.${user.paymentStatus}`)}
                    </Badge>
                </TableCell>
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
                        <DropdownMenuItem onClick={() => handleViewProfile(user)}>
                          {t('admin.users.actions.viewProfile')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(user, 'active')}>
                          {t('admin.users.actions.activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(user, 'pending_payment')}>
                           {t('admin.users.toast.identityVerified.title')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(user, 'pending_verification')}>
                           {t('admin.users.actions.setPendingVerification')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(user, 'inactive')}>
                          {t('admin.users.actions.deactivate')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </ScrollArea>
        {selectedUser && (
            <AdminUserDetailsModal
            user={selectedUser}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onUserUpdate={fetchUsers}
            />
        )}
    </div>
  );
}
