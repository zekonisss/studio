"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, Users, Crown, ShieldAlert } from "lucide-react";
import { getTeamMembers, inviteTeamMember, removeTeamMember } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{name: string, used: number, max: number} | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getTeamMembers(user.id);
      if (res.success && res.members) {
        setMembers(res.members);
        // Only set company info if a company exists
        if (res.companyId) {
            setCompanyInfo({
                name: res.companyName,
                used: res.usedSeats,
                max: res.maxSeats
            });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(user){
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleInvite = async () => {
    if (!inviteEmail.includes("@")) {
        toast({ variant: "destructive", title: "Error", description: "Please enter a valid email." });
        return;
    }
    
    setIsInviting(true);
    try {
        const res = await inviteTeamMember(user!.id, inviteEmail);
        
        if (res.success) {
            console.log("INVITE LINK:", res.inviteLink);
            toast({ 
                title: "Invite Created!", 
                description: "Link (Dev Mode): " + res.inviteLink, 
                duration: 10000 
            });
            setInviteEmail("");
        } else {
            toast({ variant: "destructive", title: "Failed", description: res.error });
        }
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Server error." });
    } finally {
        setIsInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure? This will suspend the user's account access.")) return;

    try {
        const res = await removeTeamMember(user!.id, memberId);
        if (res.success) {
            toast({ title: "Done", description: "User removed." });
            loadData();
        } else {
            toast({ variant: "destructive", title: "Error", description: res.error });
        }
    } catch (e) {
        console.error(e);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  // Handle Solo Users (No Company yet)
  if (!companyInfo) {
      return (
          <div className="max-w-4xl mx-auto p-6">
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900">
                  <Crown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle>Team Management</AlertTitle>
                  <AlertDescription className="mt-2">
                      This feature is available for <strong>Team</strong> and <strong>Corporate</strong> plans.
                      <br />
                      You are currently on a Solo plan. Upgrade to manage multiple users.
                      <div className="mt-4">
                        <Button variant="default">Upgrade Plan &rarr;</Button>
                      </div>
                  </AlertDescription>
              </Alert>
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Team</h1>
            <p className="text-muted-foreground">
                Company: <span className="font-semibold text-foreground">{companyInfo.name}</span>
            </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full font-medium text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>Seats: {companyInfo.used} / {companyInfo.max}</span>
        </div>
      </div>

      {/* INVITE FORM */}
      <Card>
        <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
            <CardDescription>
                Send an invitation to add a colleague to your company account.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex gap-4">
                <Input 
                    placeholder="colleague@company.com" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button onClick={handleInvite} disabled={isInviting || companyInfo.used >= companyInfo.max}>
                    {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Invite
                </Button>
            </div>
            {companyInfo.used >= companyInfo.max && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Seat limit reached. Upgrade your plan to add more users.
                </p>
            )}
        </CardContent>
      </Card>

      {/* MEMBER LIST */}
      <Card>
          <CardHeader>
              <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                          <div className="flex items-center gap-4">
                              <Avatar>
                                  <AvatarFallback>{member.fullName?.[0]?.toUpperCase() || member.email[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                  <p className="font-medium text-sm">{member.fullName}</p>
                                  <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                              {member.role === 'owner' && <Badge variant="default" className="ml-2">Owner</Badge>}
                              {member.role === 'admin' && <Badge variant="secondary" className="ml-2">Admin</Badge>}
                              {member.status === 'suspended' && <Badge variant="destructive" className="ml-2">Suspended</Badge>}
                          </div>

                          {/* Actions (Cannot remove self/owner) */}
                          {member.role !== 'owner' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleRemove(member.id)}
                              >
                                  <Trash2 className="w-4 h-4" />
                              </Button>
                          )}
                      </div>
                  ))}

                  {members.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No members found.</p>
                  )}
              </div>
          </CardContent>
      </Card>

    </div>
  );
}
