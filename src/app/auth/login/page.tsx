import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prisijungimas - DriverShield',
  description: 'Prisijunkite prie DriverShield platformos.',
};

export default function LoginPage() {
  return (
    <>
      <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight text-foreground">
        Prisijunkite prie savo paskyros
      </h2>
      <LoginForm />
    </>
  );
}
