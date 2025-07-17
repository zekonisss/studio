
"use client"; 

import { SignupForm } from "@/components/auth/signup-form";
import { useLanguage } from "@/contexts/language-context";

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
