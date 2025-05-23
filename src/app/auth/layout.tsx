import type { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="mb-8 flex items-center space-x-3">
         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
        <h1 className="text-4xl font-bold text-primary">DriverShield</h1>
      </div>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl sm:p-8">
        {children}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} DriverShield. Visos teisės saugomos.
      </p>
    </div>
  );
}
