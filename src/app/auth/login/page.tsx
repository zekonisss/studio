
"use client"; // Required for using hooks

import { LoginForm } from "@/components/auth/login-form";
import { useLanguage } from "@/contexts/language-context"; // Added

// export const metadata: Metadata = { // Metadata needs to be in server component or layout
// title: 'Prisijungimas - DriverCheck',
// description: 'Prisijunkite prie DriverCheck platformos.',
// };

export default function LoginPage() {
  const { t } = useLanguage(); // Added
  return (
    <>
      <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight text-foreground">
        {t('login.title')}
      </h2>
      <LoginForm />
    </>
  );
}
