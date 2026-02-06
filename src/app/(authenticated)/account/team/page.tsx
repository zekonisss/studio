
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, Users, Crown, ShieldAlert, MoreHorizontal, Shield, User as UserIcon } from "lucide-react";
import { getTeamMembers, inviteTeamMember, removeTeamMember, updateMemberRole } from "@/app/actions/team";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/language-context";

interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: 'owner' | 'admin' | 'member';
  status: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{name: string, used: number, max: number} | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getTeamMembers(user.id);
      if (res.success && res.members) {
        setMembers(res.members.sort((a, b) => {
            if (a.role === 'owner') return -1;
            if (b.role === 'owner') return 1;
            if (a.role === 'admin') return -1;
            if (b.role === 'admin') return 1;
            return a.fullName.localeCompare(b.fullName);
        }));
        if (res.companyId) {
            setCompanyInfo({
                name: res.companyName!,
                used: res.usedSeats!,
                max: res.maxSeats!
            });
        }
      } else if (!res.success) {
          toast({
              variant: "destructive",
              title: t('common.error'),
              description: res.error,
          });
      }
    } catch (error) {
      console.error(error);
       toast({
          variant: "destructive",
          title: t('common.error'),
          description: t('team.fetchError'),
        });
    } finally {
      setLoading(false);
    }
  }, [user, toast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInvite = async () => {
    if (!user) return;
    if (!inviteEmail.includes("@")) {
        toast({ variant: "destructive", title: t('common.error'), description: t('team.invalidEmail') });
        return;
    }
    
    setIsInviting(true);
    try {
        const res = await inviteTeamMember(user.id, inviteEmail);
        
        if (res.success) {
            toast({ 
                title: t('team.inviteSentTitle'), 
                description: t('team.inviteSentDesc', { email: inviteEmail }), 
                duration: 10000 
            });
            setInviteEmail("");
            await loadData();
        } else {
            toast({ variant: "destructive", title: t('team.inviteFail'), description: res.error });
        }
    } catch (e) {
        toast({ variant: "destructive", title: t('common.error'), description: t('team.serverError') });
    } finally {
        setIsInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!user) return;
    if (!confirm(t('team.confirmRemove'))) return;

    try {
        const res = await removeTeamMember(user.id, memberId);
        if (res.success) {
            toast({ title: t('team.actionComplete'), description: t('team.memberRemoved') });
            loadData();
        } else {
            toast({ variant: "destructive", title: t('common.error'), description: res.error });
        }
    } catch (e) {
        console.error(e);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    if (!user) return;
    try {
      const res = await updateMemberRole(user.id, memberId, newRole);
      if (res.success) {
        toast({ title: t('team.roleChanged'), description: res.message });
        loadData();
      } else {
        toast({ variant: "destructive", title: t('common.error'), description: res.error });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: t('common.error'), description: t('team.changeRoleError') });
    }
  };
  
  const getRoleBadge = (role: TeamMember['role']) => {
      switch(role) {
          case 'owner':
              return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600"><Crown className="mr-1 h-3 w-3" /> {t('admin.users.role.owner')}</Badge>;
          case 'admin':
              return <Badge variant="secondary"><Shield className="mr-1 h-3 w-3" /> {t('admin.users.role.admin')}</Badge>;
          case 'member':
              return <Badge variant="outline"><UserIcon className="mr-1 h-3 w-3" /> {t('admin.users.role.member')}</Badge>;
          default:
              return null;
      }
  }


  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  // Handle Solo Users (No Company yet)
  if (!companyInfo) {
      return (
          <div className="max-w-4xl mx-auto p-6">
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900">
                  <Crown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle>{t('team.managementTitle')}</AlertTitle>
                  <AlertDescription className="mt-2">
                      <span dangerouslySetInnerHTML={{ __html: t('team.upgradePlan.description1') }} />
                      <br />
                      {t('team.upgradePlan.description2')}
                      <div className="mt-4">
                        <Button asChild variant="default">
                          <Link href="/account?tab=payment">{t('team.upgradePlan.button')} &rarr;</Link>
                        </Button>
                      </div>
                  </AlertDescription>
              </Alert>
          </div>
      );
  }

  const canManageTeam = user?.role === 'owner' || user?.role === 'admin' || user?.isAdmin;

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('sidebar.team')}</h1>
            <p className="text-muted-foreground">
                {t('admin.users.table.companyName')}: <span className="font-semibold text-foreground">{companyInfo.name}</span>
            </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full font-medium text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{t('team.seats')} {companyInfo.used} / {companyInfo.max}</span>
        </div>
      </div>

      {/* INVITE FORM */}
       {canManageTeam && (
          <Card>
            <CardHeader>
                <CardTitle>{t('team.inviteTitle')}</CardTitle>
                <CardDescription>
                    {t('team.inviteDescription')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4">
                    <Input 
                        placeholder={t('team.invitePlaceholder')} 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Button onClick={handleInvite} disabled={isInviting || companyInfo.used >= companyInfo.max}>
                        {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                        {t('team.inviteButton')}
                    </Button>
                </div>
                {companyInfo.used >= companyInfo.max && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        {t('team.limitReached')}
                    </p>
                )}
            </CardContent>
          </Card>
        )}

      {/* MEMBER LIST */}
      <Card>
          <CardHeader>
              <CardTitle>{t('team.membersTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {members.map((member) => {
                      const showActions = canManageTeam && member.role !== 'owner' && user?.id !== member.id;
                      return (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                          <div className="flex items-center gap-4">
                              <Avatar>
                                  <AvatarFallback>{member.fullName?.[0]?.toUpperCase() || member.email[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                  <p className="font-medium text-sm">{member.fullName}</p>
                                  <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                              {getRoleBadge(member.role)}
                              {member.status === 'suspended' && <Badge variant="destructive" className="ml-2">{t('team.statusSuspended')}</Badge>}
                          </div>

                          {showActions ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{t('team.changeRole')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup value={member.role} onValueChange={(value) => handleRoleChange(member.id, value as 'admin' | 'member')}>
                                        <DropdownMenuRadioItem value="member">{t('admin.users.role.member')}</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="admin">{t('admin.users.role.admin')}</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-500 focus:bg-red-50 focus:text-red-600" onClick={() => handleRemove(member.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>{t('team.removeMember')}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                              <div className="w-8" />
                          )}
                      </div>
                  )})}

                  {members.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">{t('team.noMembersFound')}</p>
                  )}
              </div>
          </CardContent>
      </Card>

    </div>
  );
}

    