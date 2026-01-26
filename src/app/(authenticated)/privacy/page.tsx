"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

const PRIVACY_CONTENT = {
  lt: {
    title: "Privatumo politika",
    subtitle: "Kaip DriverCheck renka, naudoja ir saugo duomenis.",
    cardTitle: "Privatumo ir duomenų apsaugos nuostatos",
    date: "Atnaujinta: 2026-01-24",
    intro: "Mes vertiname Jūsų pasitikėjimą ir įsipareigojame saugoti Jūsų bei Jūsų įkeliamų duomenų privatumą laikantis Bendrojo duomenų apsaugos reglamento (BDAR).",
    sections: [
      {
        title: "1. Duomenų valdytojas ir tvarkytojas",
        text: "Svarbu atskirti dvi situacijas:\n• Kai Jūs registruojatės ir mokate už paslaugas, Jūsų paskyros duomenų Valdytojas yra DriverCheck.\n• Kai Jūs įkeliate informaciją apie vairuotojus, Jūs esate duomenų Valdytojas, o DriverCheck veikia tik kaip techninis duomenų Tvarkytojas."
      },
      {
        title: "2. Renkami duomenys",
        text: "Mes renkame šią informaciją:\n• Paskyros duomenys: Įmonės pavadinimas, kodas, atstovo kontaktai, el. paštas.\n• Mokėjimų duomenys: Tvarkomi per licencijuotą partnerį „Stripe“ (mes nekaupiame pilnų kortelių numerių).\n• Registro duomenys: Jūsų įkelta informacija apie vairuotojus (vardas, pavardė, gimimo metai, veiklos istorija).",
        highlight: true
      },
      {
        title: "3. Duomenų perdavimas trečiosioms šalims",
        text: "Platformos veikimui užtikrinti pasitelkiame patikimus paslaugų teikėjus (duomenų tvarkytojus):\n• „Google Cloud / Firebase“ (serveriai ir duomenų bazė, ES regionas) – duomenų saugojimui.\n• „Stripe“ – mokėjimų administravimui.\nMes neparduodame ir neperduodame Jūsų duomenų trečiosioms šalims rinkodaros tikslais."
      },
      {
        title: "4. Duomenų saugojimo terminai",
        text: "Vairuotojų profesinės veiklos vertinimo įrašai sistemoje saugomi 5 (penkerius) metus, vėliau automatiškai trinami. Paskyros ir mokėjimų istorija saugoma tiek, kiek reikalauja buhalterinės apskaitos įstatymai (dažniausiai 10 metų)."
      },
      {
        title: "5. Jūsų teisės",
        text: "Jūs turite teisę susipažinti su savo duomenimis, reikalauti juos ištaisyti arba ištrinti („teisė būti pamirštam“), bei nesutikti su duomenų tvarkymu. Dėl vairuotojų duomenų ištaisymo prašome kreiptis tiesiogiai į įmonę, kuri įkėlė įrašą, arba į mus adresu: support@drivercheck.lt"
      }
    ]
  },
  en: {
    title: "Privacy Policy",
    subtitle: "How DriverCheck collects, uses, and protects data.",
    cardTitle: "Privacy and Data Protection Policy",
    date: "Updated: 2026-01-24",
    intro: "We value your trust and are committed to protecting your privacy and the data you upload in compliance with the General Data Protection Regulation (GDPR).",
    sections: [
      {
        title: "1. Data Controller and Processor",
        text: "It is important to distinguish between two scenarios:\n• When you register and pay for services, DriverCheck is the Controller of your account data.\n• When you upload information about drivers, You act as the Data Controller, and DriverCheck acts solely as the technical Data Processor."
      },
      {
        title: "2. Collected Data",
        text: "We collect the following information:\n• Account Data: Company name, code, representative contacts, email.\n• Payment Data: Processed via licensed partner Stripe (we do not store full credit card numbers).\n• Registry Data: Information you upload about drivers (name, surname, year of birth, professional history).",
        highlight: true
      },
      {
        title: "3. Data Sharing with Third Parties",
        text: "To ensure Platform functionality, we engage trusted service providers (data processors):\n• Google Cloud / Firebase (servers and database, EU region) – for data storage.\n• Stripe – for payment administration.\nWe do not sell or transfer your data to third parties for marketing purposes."
      },
      {
        title: "4. Data Retention Periods",
        text: "Driver professional performance records are stored in the system for 5 (five) years, after which they are automatically deleted. Account and payment history is stored as required by accounting laws (typically 10 years)."
      },
      {
        title: "5. Your Rights",
        text: "You have the right to access your data, request rectification or deletion ('right to be forgotten'), and object to processing. For correction of driver data, please contact the company that uploaded the record directly, or contact us at: support@drivercheck.lt"
      }
    ]
  }
};

export default function PrivacyPage() {
  const { locale } = useLanguage();
  const content = locale === 'lt' ? PRIVACY_CONTENT.lt : PRIVACY_CONTENT.en;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{content.title}</h1>
          <p className="text-muted-foreground mt-1">{content.subtitle}</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Spausdinti / PDF
            </Button>
        </div>
      </div>

      <Card className="border-t-4 border-t-blue-600 shadow-lg">
        <CardHeader className="bg-muted/20 pb-6">
            <div className="flex items-center gap-3 mb-2">
                <Lock className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-2xl">{content.cardTitle}</CardTitle>
            </div>
            <CardDescription className="text-base">
                {content.date}
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-300px)] p-6 md:p-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <div className="space-y-8 print:space-y-4">
                
                <p className="text-lg font-medium text-foreground border-b pb-4">
                    {content.intro}
                </p>

                {content.sections.map((section, index) => (
                    <section key={index}>
                        <h3 className="text-lg font-bold text-foreground mb-3">
                            {section.title}
                        </h3>
                        <div className={`whitespace-pre-line ${section.highlight ? "bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800" : ""}`}>
                            {section.text}
                        </div>
                    </section>
                ))}
                
                 <div className="pt-8 text-xs text-muted-foreground text-center print:hidden">
                    <p>© {new Date().getFullYear()} DriverCheck. Visos teisės saugomos.</p>
                </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
