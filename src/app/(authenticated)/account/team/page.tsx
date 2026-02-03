"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, UserPlus, ChevronDown } from "lucide-react";
import { collection, query, where, onSnapshot, orderBy, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { createInvitation, deleteTeamMember, updateMemberRole } from "./actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// Sukuriame tipą, kad TypeScript žinotų, ko tikėtis iš nario
interface TeamMember {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  companyId?: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 1. TRIUKAS: verčiame 'user' į 'any', kad TS nebeklausinėtų apie 'companyId'
  const currentUser = user as any;

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // 1. Gauname komandos narius realiu laiku
  useEffect(() => {
    // Jei nėra DB arba vartotojo companyId - nieko nedarome
    if (!db || !currentUser?.companyId) {
        setLoading(false);
        return;
    }

    try {
      // 2. TRIUKAS: (db as Firestore) pasako TS: "Aš pasitikiu, kad db čia egzistuoja"
      const usersRef = collection(db as Firestore, "users");
      
      const q = query(
        usersRef, 
        where("companyId", "==", currentUser.companyId),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TeamMember[]; // Pasakome, kad gauti duomenys atitinka TeamMember struktūrą
        
        setMembers(usersData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore error:", e);
      setLoading(false);
    }
  }, [currentUser]);

// 2. Kvietimo funkcija (PATAISYTA)
const handleInvite = async () => {
  if (!inviteEmail || !currentUser?.companyId) return;
  setIsInviting(true);
  
  try {
     const result = await createInvitation(
       inviteEmail, 
       currentUser.companyId, 
       currentUser.companyName || "Mūsų Įmonė"
     ); 

     // APSAUGA: Jei serveris visai nieko negrąžino (pvz. tinklo klaida)
     if (!result) {
       throw new Error("Serveris neatsakė (no response).");
     }

     if (result.success) {
       toast({ title: "Išsiųsta!", description: "Pakvietimas sėkmingai išsiųstas nurodytu el. paštu." });
       setInviteEmail("");
     } else {
       // Čia lūžo tavo kodas. Dabar mes saugiai skaitome error.
       toast({ variant: "destructive", title: "Klaida", description: result.error || "Nepavyko išsiųsti." });
     }
  } catch (e: any) {
    console.error("HandleInvite Error:", e);
    toast({ variant: "destructive", title: "Sistemos klaida", description: e.message || "Įvyko nenumatyta klaida." });
  } finally {
    setIsInviting(false);
  }
};

  // 3. Rolės keitimo funkcija
  const handleRoleChange = async (memberId: string, newRole: string) => {
    if(newRole !== 'admin' && newRole !== 'member') return;

    toast({ title: "Atnaujinama...", description: "Keičiama vartotojo rolė." });
    
    const result = await updateMemberRole(memberId, newRole as 'admin' | 'member');
    
    if (result.success) {
        toast({ title: "Atlikta!", description: "Vartotojo teisės pakeistos." });
    } else {
        toast({ variant: "destructive", title: "Klaida", description: result.error });
    }
  };

  // 4. Trynimo funkcija
  const handleDelete = async (memberId: string) => {
      if(!confirm("Ar tikrai norite pašalinti šį narį?")) return;
      
      const result = await deleteTeamMember(memberId);
      if (result.success) {
          toast({ title: "Ištrinta", description: "Narys pašalintas iš komandos." });
      } else {
          toast({ variant: "destructive", title: "Klaida", description: result.error });
      }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Kraunama komanda...</div>;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Komanda</h1>
        <p className="text-muted-foreground">
          Įmonė: <span className="font-semibold text-foreground">{currentUser?.companyName || "Kraunama..."}</span>
        </p>
      </div>

      {/* Kvietimo kortelė */}
      <Card>
        <CardHeader>
          <CardTitle>Pakviesti naują narį</CardTitle>
          <CardDescription>Išsiųskite pakvietimą el. paštu.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="kolega@imone.lt" 
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button onClick={handleInvite} disabled={isInviting}>
              {isInviting ? <Loader2 className="animate-spin mr-2"/> : <UserPlus className="mr-2 h-4 w-4"/>}
              Pakviesti
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Narių sąrašas */}
      <Card>
        <CardHeader>
          <CardTitle>Nariai ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/10 transition">
                
                {/* Kairė pusė */}
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{member.fullName?.[0] || member.email?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.fullName || "Be vardo"}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  
                  {member.role === 'owner' && <Badge className="bg-blue-600">Savininkas</Badge>}
                  {member.role === 'admin' && <Badge variant="secondary">Admin</Badge>}
                </div>

                {/* Dešinė pusė: Veiksmai */}
                <div className="flex items-center gap-3">
                    
                    {/* ROLĖS KEITIMAS */}
                    {member.role !== 'owner' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-[160px] justify-between" disabled={member.id === currentUser?.uid}>
                                    {member.role === 'admin' ? 'Administratorius' : 'Narys'}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuLabel>Pakeisti rolę</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={member.role || 'member'} onValueChange={(value) => handleRoleChange(member.id, value)}>
                                    <DropdownMenuRadioItem value="member">Narys</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="admin">Administratorius</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* TRYNIMO MYGTUKAS */}
                    {member.role !== 'owner' && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50"
                            onClick={() => handleDelete(member.id)}
                            disabled={member.id === currentUser?.uid}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
