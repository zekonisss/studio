"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import type { UserProfile } from '@/types';
import { getAllUsers } from '@/lib/storage';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, ChevronDown, ChevronRight, Users, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AdminUserDetailsModal } from './modals/admin-user-details-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { changeUserStatus } from '../actions';

interface GroupedUsers {
  [companyName: string]: UserProfile[];
}

export default function UserManagementTab() {
  const { t, locale } = useLanguage();
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  const fetchUsers = async () => {
    if (!adminUser?.isAdmin) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const userList = await getAllUsers();
      setUsers(userList);
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
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUser]);

  const handleViewDetails = (userToView: UserProfile) => {
    setSelectedUser(userToView);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (userToUpdate: UserProfile, newStatus: UserProfile['paymentStatus']) => {
    if (!adminUser || !adminUser.isAdmin) {
      toast({ variant: "destructive", title: "Klaida", description: "Neturite teisių atlikti šio veiksmo." });
      return;
    }
    
    const oldStatus = userToUpdate.paymentStatus;
    if (oldStatus === newStatus) return;

    try {
      const result = await changeUserStatus(adminUser.id, userToUpdate.id, newStatus);
      
      if (result.success) {
        toast({
          title: t('admin.users.toast.statusChanged.title'),
          description: t('admin.users.toast.statusChanged.description', { 
              companyName: userToUpdate.companyName, 
              email: userToUpdate.email, 
              status: t(`admin.users.status.${newStatus}`) 
          }),
        });
        await fetchUsers();
      } else {
        throw new Error(result.error || 'Nežinoma klaida keičiant būseną');
      }

    } catch (error: any) {
        console.error("Error updating user status:", error);
        toast({
            variant: "destructive",
            title: "Klaida",
            description: error.message || "Nepavyko atnaujinti vartotojo būsenos.",
        });
    }
  };


  const getStatusBadge = (status: UserProfile['paymentStatus']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-primary hover:bg-primary/80">{t('admin.users.status.active')}</Badge>;
      case 'trial':
        return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600">{t('admin.users.status.trial')}</Badge>;
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

  const groupedUsers = useMemo(() => {
    return users.reduce((acc: GroupedUsers, user) => {
      const companyName = user.companyName || "Unassigned";
      if (!acc[companyName]) {
        acc[companyName] = [];
      }
      acc[companyName].push(user);
      return acc;
    }, {});
  }, [users]);
  
  const companyNames = Object.keys(groupedUsers).sort((a, b) => a.localeCompare(b));

  const toggleCompanyExpansion = (companyName: string) => {
    setExpandedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyName)) {
        newSet.delete(companyName);
      } else {
        newSet.add(companyName);
      }
      return newSet;
    });
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
    <>
      <AdminUserDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
      />
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('admin.users.title')}</CardTitle>
          <CardDescription>{t('admin.users.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Įmonė</TableHead>
                  <TableHead>Savininkas / Kontaktas</TableHead>
                  <TableHead className="text-center">Narių sk.</TableHead>
                  <TableHead className="text-center">Būsena</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : companyNames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {t('admin.users.noUsersFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  companyNames.map(companyName => {
                    const companyUsers = groupedUsers[companyName];
                    const owner = companyUsers.find(u => u.role === 'owner') || companyUsers[0];
                    const isExpanded = expandedCompanies.has(companyName);
                    const mainStatus = companyUsers.some(u => u.paymentStatus === 'active') ? 'active' : owner.paymentStatus;
                    
                    return (
                      <Fragment key={companyName}>
                        <TableRow 
                          className="cursor-pointer bg-card hover:bg-accent/50"
                          onClick={() => toggleCompanyExpansion(companyName)}
                        >
                          <TableCell className="px-4">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                {companyName}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{owner.email}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                                <Users className="h-4 w-4" />
                                {companyUsers.length}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge(mainStatus)}</TableCell>
                        </TableRow>

                        {isExpanded && companyUsers.map(user => (
                          <TableRow key={user.id} className="bg-muted/30 hover:bg-muted/60">
                            <TableCell></TableCell>
                            <TableCell className="pl-12">
                                <div>{user.contactPerson}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                            </TableCell>
                            <TableCell>
                              {user.role === 'owner' && <Badge variant="secondary">Savininkas</Badge>}
                              {user.role === 'admin' && <Badge variant="outline">Admin</Badge>}
                              {user.role === 'member' && <Badge variant="outline">Narys</Badge>}
                            </TableCell>
                            <TableCell className="text-center">{getStatusBadge(user.paymentStatus)}</TableCell>
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
                                  <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                                      {t('admin.users.actions.viewProfile')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuGroup>
                                    <DropdownMenuLabel>{t('admin.users.actions.changeStatus')}</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleStatusChange(user, 'active')} disabled={user.paymentStatus === 'active'}>
                                            {t('admin.users.status.active')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(user, 'trial')} disabled={user.paymentStatus === 'trial'}>
                                            {t('admin.users.status.trial')}
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
                        ))}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
