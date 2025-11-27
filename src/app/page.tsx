import { Button } from "@/components/ui/button";
import { UserSearch } from "lucide-react";
import Link from "next/link";

export default function RootPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <div className="flex flex-col items-center gap-4">
            <UserSearch className="h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold">Sveiki atvykę į DriverCheck</h1>
            <p className="max-w-md text-muted-foreground">
                Platforma, skirta padėti įmonėms valdyti rizikas ir tikrinti vairuotojų informaciją.
            </p>
            <div className="mt-6 flex gap-4">
                <Button asChild>
                    <Link href="/login">Prisijungti</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/signup">Registruotis</Link>
                </Button>
            </div>
             <div className="absolute bottom-8 flex gap-6 text-sm text-muted-foreground">
                <Link href="/support" className="hover:text-primary transition-colors">Pagalba</Link>
                <Link href="/privacy" className="hover:text-primary transition-colors">Privatumo Politika</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Naudojimosi Taisyklės</Link>
            </div>
        </div>
    </div>
  );
}
