
"use client";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { useLanguage } from "@/contexts/language-context";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  return (
    <>
      <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight text-foreground">
        {t('forgotPassword.title')}
      </h2>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {t('forgotPassword.description')}
      </p>
      <ForgotPasswordForm />
    </>
  );
}
