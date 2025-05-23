import { SignupForm } from "@/components/auth/signup-form";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registracija - DriverShield',
  description: 'Sukurkite naują DriverShield paskyrą.',
};

export default function SignupPage() {
  return (
    <>
      <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight text-foreground">
        Sukurkite naują paskyrą
      </h2>
      <SignupForm />
    </>
  );
}
