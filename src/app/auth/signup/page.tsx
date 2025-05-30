
"use client"; // Make it a client component to use hooks

import { SignupForm } from "@/components/auth/signup-form";
// import type { Metadata } from 'next'; // Metadata export removed as it's a client component now
import { useLanguage } from "@/contexts/language-context";

// Metadata should be handled in a parent server component (layout) or via useEffect for client components
// export const metadata: Metadata = {
// title: 'Registracija - DriverCheck',
// description: 'Sukurkite naują DriverCheck paskyrą.',
// };

export default function SignupPage() {
  const { t } = useLanguage();
  return (
    <>
      <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight text-foreground">
        {t('signup.title')}
      </h2>
      <SignupForm />
    </>
  );
}
