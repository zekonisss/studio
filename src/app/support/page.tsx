import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldQuestion, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const faqItems = [
  {
    question: "Kaip užsiregistruoti DriverShield platformoje?",
    answer: "Norėdami užsiregistruoti, pagrindiniame puslapyje spauskite 'Registruotis', užpildykite reikiamus įmonės ir kontaktinius duomenis, sutikite su taisyklėmis ir patvirtinkite el. paštą.",
  },
  {
    question: "Kiek kainuoja DriverShield prenumerata?",
    answer: "Metinė DriverShield prenumerata kainuoja 1188 €. Prieiga prie sistemos suteikiama tik po sėkmingo mokėjimo.",
  },
  {
    question: "Kokią informaciją galiu rasti apie vairuotojus?",
    answer: "Paieškos rezultatuose galite matyti vairuotojo vardą, pavardę, gimimo metus (jei pateikta), pranešimų kategorijas, žymas, komentarus ir pridėtus failus/nuotraukas, jei tokių yra.",
  },
  {
    question: "Ar galiu redaguoti ar ištrinti kitų vartotojų įvestą informaciją?",
    answer: "Ne, Jūs galite peržiūrėti visus pranešimus, tačiau redaguoti ar ištrinti galite tik savo pačių įvestą informaciją.",
  },
  {
    question: "Kaip užtikrinamas duomenų saugumas?",
    answer: "Mes naudojame standartines saugumo priemones duomenims apsaugoti. Visa informacija perduodama šifruotais kanalais. Tačiau, Jūs taip pat esate atsakingi už savo prisijungimo duomenų saugumą.",
  },
  {
    question: "Ką daryti, jei pamiršau slaptažodį?",
    answer: "Prisijungimo lange spauskite nuorodą 'Pamiršau slaptažodį' ir sekite instrukcijas el. paštu slaptažodžiui atkurti.",
  },
];

export default function SupportPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <LifeBuoy className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">Pagalba ir Dažniausiai Užduodami Klausimai</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Raskite atsakymus į dažniausiai kylančius klausimus apie DriverShield platformą.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card">
                <AccordionTrigger className="p-4 text-left font-medium text-lg text-foreground hover:no-underline">
                  <div className="flex items-center">
                    <ShieldQuestion className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                    {item.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-base text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center border-t pt-8">
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Nerandate Atsakymo?</h3>
            <p className="text-muted-foreground mb-6">
              Jei turite daugiau klausimų ar reikia pagalbos, susisiekite su mūsų palaikymo komanda.
            </p>
            <Button size="lg" asChild>
              <Link href="mailto:pagalba@drivershield.eu">
                Susisiekti El. Paštu
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
