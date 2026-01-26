"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSearch } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-lg text-center p-8">
            <CardHeader>
                <div className="flex justify-center items-center gap-3 mb-4">
                    <UserSearch className="h-12 w-12 text-primary" />
                    <CardTitle className="text-5xl font-bold">DriverCheck</CardTitle>
                </div>
                <CardDescription className="text-lg">
                    Sveiki atvykę! Prisijunkite arba registruokitės.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button size="lg" asChild>
                    <Link href="/login">Prisijungti</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                    <Link href="/signup">Registruotis</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
