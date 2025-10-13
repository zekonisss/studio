
import { z } from 'zod';

export const SignupFormSchema = z.object({
  email: z.string().email({ message: "Neteisingas el. pašto formatas." }),
  password: z.string().min(8, { message: "Slaptažodis turi būti bent 8 simbolių ilgio." }),
  confirmPassword: z.string().min(8, { message: "Slaptažodis turi būti bent 8 simbolių ilgio." }),
  companyName: z.string().min(2, { message: "Įmonės pavadinimas turi būti bent 2 simbolių ilgio." }),
  companyCode: z.string().regex(/^\d{9}$/, { message: "Įmonės kodas turi būti 9 skaitmenys." }),
  vatCode: z.string().optional(),
  address: z.string().min(5, { message: "Adresas turi būti bent 5 simbolių ilgio." }),
  contactPerson: z.string().min(3, { message: "Kontaktinis asmuo turi būti bent 3 simbolių ilgio." }),
  phone: z.string().regex(/^\+?\d{7,15}$/, { message: "Neteisingas telefono numerio formatas." }),
  agreeToTerms: z.boolean().refine(val => val === true, { message: "Privalote sutikti su taisyklėmis." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Slaptažodžiai nesutampa.",
  path: ["confirmPassword"],
});

export type SignupFormValuesExtended = z.infer<typeof SignupFormSchema>;

export const LoginSchema = z.object({
  email: z.string().email({ message: "Neteisingas el. pašto formatas." }),
  password: z.string().min(1, { message: "Slaptažodis yra privalomas." }),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;

export const ReportSchema = z.object({
  fullName: z.string().min(3, { message: "Vardas ir pavardė turi būti bent 3 simbolių ilgio." }),
  nationality: z.string().optional(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional().or(z.literal('')),
  category: z.string().min(1, { message: "Pagrindinė kategorija yra privaloma." }), // Main category ID
  tags: z.array(z.string()).optional(),
  comment: z.string().min(10, { message: "Komentaras turi būti bent 10 simbolių ilgio." }),
  image: z.any().optional(), // For file input
});

export type ReportFormValues = z.infer<typeof ReportSchema>;

export const SearchSchema = z.object({
  query: z.string().min(3, { message: "Paieškos frazė turi būti bent 3 simbolių ilgio." }),
});

export type SearchFormValues = z.infer<typeof SearchSchema>;
