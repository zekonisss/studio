
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];


export const SignupFormSchema = z.object({
  email: z.string().email({ message: "Neteisingas el. pašto formatas." }),
  password: z.string().min(8, { message: "Slaptažodis turi būti bent 8 simbolių ilgio." }),
  companyName: z.string().min(2, { message: "Įmonės pavadinimas turi būti bent 2 simbolių ilgio." }),
  companyCode: z.string().regex(/^\d{9}$/, { message: "Įmonės kodas turi būti 9 skaitmenys." }),
  vatCode: z.string().optional(),
  address: z.string().min(5, { message: "Adresas turi būti bent 5 simbolių ilgio." }),
  contactPerson: z.string().min(3, { message: "Kontaktinis asmuo turi būti bent 3 simbolių ilgio." }),
  position: z.string().min(2, { message: "Pareigos turi būti bent 2 simbolių ilgio." }),
  phone: z.string().regex(/^\+?\d{7,15}$/, { message: "Neteisingas telefono numerio formatas." }),
  agreeToTerms: z.boolean().refine(val => val === true, { message: "Privalote sutikti su taisyklėmis." }),
});


export const LoginSchema = z.object({
  email: z.string().email({ message: "Neteisingas el. pašto formatas." }),
  password: z.string().min(1, { message: "Slaptažodis yra privalomas." }),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;

export const ReportSchema = z.object({
  fullName: z.string().min(3, { message: "Vardas ir pavardė turi būti bent 3 simbolių ilgio." }),
  nationality: z.string().optional(),
  birthYear: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional()
  ),
  category: z.string().min(1, { message: "Pagrindinė kategorija yra privaloma." }), // Main category ID
  tags: z.array(z.string()).optional(),
  comment: z.string().min(10, { message: "Komentaras turi būti bent 10 simbolių ilgio." }),
  image: z.any()
    .optional()
    .refine(
        (file) => !file || file.size <= MAX_FILE_SIZE,
        `Maksimalus failo dydis yra 5MB.`
    )
    .refine(
        (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
        "Palaikomi formatai: .jpg, .png, .webp ir .pdf"
    ),
});

export type ReportFormValues = z.infer<typeof ReportSchema>;

export const SearchSchema = z.object({
  query: z.string().min(3, { message: "Paieškos frazė turi būti bent 3 simbolių ilgio." }),
});

export type SearchFormValues = z.infer<typeof SearchSchema>;
