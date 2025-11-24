import { UserSearch } from "lucide-react";
import Link from "next/link";

export default function UnauthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Link href="/login" className="absolute top-8 flex items-center gap-2 text-lg font-semibold text-primary cursor-pointer">
                <UserSearch className="h-7 w-7" />
                <span>DriverCheck</span>
            </Link>
            {children}
        </div>
    );
}
