import { UserSearch } from "lucide-react";

export default function UnauthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <div className="absolute top-8 flex items-center gap-2 text-lg font-semibold text-primary">
                <UserSearch className="h-7 w-7" />
                <span>DriverCheck</span>
            </div>
            {children}
        </div>
    );
}
