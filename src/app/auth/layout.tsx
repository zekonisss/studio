
import type { ReactNode } from 'react';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
       <div className="mb-8 flex items-center space-x-3">
         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-search"><circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.9-1.9"/></svg>
        <h1 className="text-4xl font-bold text-primary">DriverCheck</h1>
      </div>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl sm:p-8">
        {children}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} DriverCheck. Visos teisės saugomos.
      </p>
    </div>
  );
}
