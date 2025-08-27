"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

export default function PendingApprovalPage() {
  const { t } = useLanguage();

  return (
    <Card className="shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl mt-4">Registracija Sėkminga!</CardTitle>
        <CardDescription>
          Jūsų paskyra buvo sėkmingai sukurta ir laukia administratoriaus patvirtinimo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground">
          Kai tik Jūsų tapatybė bus patvirtinta, gausite pranešimą el. paštu su instrukcijomis, kaip užbaigti paskyros aktyvavimą ir atlikti apmokėjimą. Šis procesas paprastai užtrunka iki 1 darbo dienos.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/auth/login">Grįžti į Prisijungimo langą</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
