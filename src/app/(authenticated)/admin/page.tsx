
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.replace('/dashboard'); // Redirect non-admins to dashboard
    }
  }, [user, loading, router]);

  if (loading || !user || !user.isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <ShieldAlert className="mr-3 h-8 w-8 text-primary" />
          Administratoriaus Skydas
        </h1>
      </div>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Sveiki, Administratoriau!</CardTitle>
          <CardDescription>
            Čia bus rodomi administratoriaus įrankiai ir parinktys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Šiuo metu administratoriaus skydelis yra kūrimo stadijoje. Ateityje čia rasite įvairias valdymo funkcijas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
