"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { LifeBuoy, Mail } from "lucide-react";

// Čia surašyti "gudrūs" ir teisiškai saugūs atsakymai
const FAQ_CONTENT = {
  lt: {
    title: "Pagalbos centras",
    description: "Dažniausiai užduodami klausimai apie platformos veikimą, saugumą ir taisykles.",
    items: [
      {
        id: "q1",
        question: "Ar legalu kaupti informaciją apie vairuotojus?",
        answer: "Taip. Įmonės turi teisėtą interesą (BDAR 6 str. 1 d. f punktas) saugoti savo turtą ir valdyti verslo rizikas. DriverCheck veikia tik kaip techninis įrankis (duomenų tvarkytojas), padedantis įmonėms keistis profesinės veiklos vertinimo informacija. Svarbu, kad įkeldami duomenis Jūs informuotumėte savo darbuotojus apie duomenų tvarkymą."
      },
      {
        id: "q2",
        question: "Ką daryti, jei radau klaidingą įrašą apie vairuotoją?",
        answer: "Mes siekiame maksimalaus duomenų tikslumo. Jei manote, kad informacija neteisinga, susisiekite su mumis el. paštu ir pateikite įrodymus. Mes susisieksime su įrašą įkėlusia įmone ir, esant pagrindui, įrašą pašalinsime per 5 darbo dienas."
      },
      {
        id: "q3",
        question: "Ar galiu naudoti DriverCheck logotipą savo svetainėje?",
        answer: "Taip! Visiems aktyviems prenumeratoriams suteikiame teisę naudoti „Patikimas partneris“ ženkliuką. Tai parodo jūsų klientams ir kandidatams, kad taikote aukščiausius skaidrumo standartus."
      },
      {
        id: "q4",
        question: "Ar vairuotojas sužinos, kad aš jį tikrinau?",
        answer: "Ne, paieškos sistemoje yra anoniminės ir konfidencialios. Vairuotojai nėra automatiškai informuojami apie atliktas užklausas, nebent jie patys kreipiasi į mus su oficialiu BDAR užklausimu dėl savo duomenų."
      },
      {
        id: "q5",
        question: "Kiek laiko saugomi duomenys?",
        answer: "Visi įrašai apie profesinės veiklos istoriją saugomi 5 metus. Pasibaigus šiam terminui, sistema juos automatiškai ištrina, laikantis „teisės būti pamirštam“ principo."
      },
      {
        id: "q6",
        question: "Kaip veikia prenumeratos apmokėjimas?",
        answer: "Mokėjimai vykdomi saugiai per „Stripe“ platformą. Prenumerata yra metinė. Artėjant pabaigai, gausite priminimą. Sąskaitas faktūras galite atsisiųsti savo paskyros nustatymuose."
      }
    ],
    contact: {
      title: "Neradote atsakymo?",
      desc: "Mūsų komanda pasiruošusi padėti. Atsakome per 24 valandas.",
      btn: "Susisiekti el. paštu"
    }
  },
  en: {
    title: "Support Center",
    description: "Frequently asked questions about platform usage, security, and regulations.",
    items: [
      {
        id: "q1",
        question: "Is it legal to store driver information?",
        answer: "Yes. Companies have a legitimate interest (GDPR Art. 6(1)(f)) to protect their assets and manage business risks. DriverCheck acts solely as a technical tool (data processor) helping companies exchange professional performance data. However, you must inform your employees about such data processing."
      },
      {
        id: "q2",
        question: "What if I find a false record about a driver?",
        answer: "We strive for maximum accuracy. If you believe a record is incorrect, contact us with evidence. We will reach out to the uploading company and, if justified, remove the record within 5 business days."
      },
      {
        id: "q3",
        question: "Can I use the DriverCheck logo on my website?",
        answer: "Yes! All active subscribers are granted the right to use the 'Trusted Partner' badge. This demonstrates to your clients and candidates that you apply the highest standards of transparency."
      },
      {
        id: "q4",
        question: "Will the driver know I searched for them?",
        answer: "No, searches on the platform are anonymous and confidential. Drivers are not automatically notified about queries unless they submit an official GDPR request regarding their data."
      },
      {
        id: "q5",
        question: "How long is data stored?",
        answer: "All records regarding professional history are stored for 5 years. After this period, the system automatically deletes them in compliance with the 'right to be forgotten' principle."
      },
      {
        id: "q6",
        question: "How does subscription billing work?",
        answer: "Payments are processed securely via Stripe. The subscription is annual. You will receive a reminder before it expires. Invoices can be downloaded in your account settings."
      }
    ],
    contact: {
      title: "Still have questions?",
      desc: "Our team is ready to help. We usually respond within 24 hours.",
      btn: "Contact Support"
    }
  }
};

export default function SupportPage() {
  const { locale } = useLanguage();
  const content = locale === 'lt' ? FAQ_CONTENT.lt : FAQ_CONTENT.en;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="max-w-4xl mx-auto shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
             <LifeBuoy className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight">
            {content.title}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
            {content.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-8 md:px-10">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {content.items.map((faq) => (
              <AccordionItem value={faq.id} key={faq.id} className="border px-4 rounded-lg data-[state=open]:bg-muted/30">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pb-4 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center bg-muted/50 rounded-xl p-8 border">
            <h3 className="text-xl font-semibold mb-2">
              {content.contact.title}
            </h3>
            <p className="text-muted-foreground mb-6">
              {content.contact.desc}
            </p>
            <Button asChild size="lg" className="gap-2">
              <a href="mailto:support@drivercheck.lt">
                <Mail className="h-4 w-4" />
                {content.contact.btn}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
