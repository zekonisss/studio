"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

// Čia saugome tekstus
const TERMS_CONTENT = {
  lt: {
    title: "Naudojimosi taisyklės",
    subtitle: "Oficialios DriverCheck platformos naudojimo sąlygos ir privatumo nuostatos.",
    cardTitle: "NAUDOJIMOSI TAISYKLĖS IR PASLAUGŲ TEIKIMO SUTARTIS",
    date: "Galioja nuo: 2026 m. sausio 24 d.",
    intro: "Šios taisyklės (toliau – „Taisyklės“) nustato naudojimosi „DriverCheck“ platforma (toliau – „Platforma“) sąlygas. Registruodamasis Platformoje arba ja naudodamasis, Vartotojas (Juridinis asmuo) patvirtina, kad susipažino su šiomis Taisyklėmis, jas suprato ir įsipareigoja jų laikytis.",
    sections: [
      {
        title: "1. BENDROSIOS NUOSTATOS",
        items: [
          { label: "1.1. Paslaugos teikėjas:", text: "Platformą administruoja ir paslaugas teikia [Tavo Įmonės Pavadinimas / Arba tavo vardas, jei veiki pagal IV], (toliau – „Paslaugų teikėjas“)." },
          { label: "1.2. Vartotojas:", text: "Juridinis asmuo (transporto ar logistikos įmonė), užsiregistravęs Platformoje ir įsigijęs prenumeratą (toliau – „Vartotojas“)." },
          { label: "1.3. Paskirtis:", text: "Platforma yra B2B įrankis, skirtas kaupti ir dalintis atsiliepimais apie vairuotojų profesinę veiklą rizikos valdymo tikslais." }
        ]
      },
      {
        title: "2. PASKYROS SAUGUMAS IR NAUDOJIMO RIBOJIMAI (SVARBU)",
        items: [
          { label: "2.1. Viena paskyra – viena įmonė:", text: "Paskyra yra skirta naudoti tik ją įsigijusios įmonės vidaus reikmėms." },
          { label: "2.2. Draudimas dalintis:", text: "Prisijungimo duomenys yra griežtai konfidencialūs. Vartotojui griežtai draudžiama perduoti prisijungimo duomenis tretiesiems asmenims (kitoms įmonėms, partneriams ar dukterinėms įmonėms, kurios neturi atskiros prenumeratos)." },
          { label: "2.3. Domeno taisyklė:", text: "Jei įmonė registruojasi su korporatyviniu el. paštu (pvz., @manvesta.lt), visi papildomi tos paskyros vartotojai privalo turėti tą patį el. pašto domeną." },
          { label: "2.4. Saugumo stebėsena:", text: "Siekiant užkirsti kelią piktnaudžiavimui, Paslaugų teikėjas turi teisę techninėmis priemonėmis fiksuoti vartotojų IP adresus, įrenginių identifikatorius ir sesijų skaičių." },
          { label: "2.5. Pažeidimo pasekmės:", text: "Sistemai užfiksavus, kad ta pačia paskyra vienu metu naudojamasi iš skirtingų geografinių lokacijų arba įrenginių (indikacija, kad slaptažodžiu dalinamasi), Paslaugų teikėjas turi teisę nedelsiant ir be įspėjimo blokuoti paskyrą negrąžinant sumokėto narystės mokesčio.", highlight: true }
        ]
      },
      {
        title: "3. APMOKĖJIMAS IR PRENUMERATA",
        items: [
          { label: "3.1. Mokėjimai:", text: "Paslaugos teikiamos prenumeratos pagrindu. Mokėjimai apdorojami per trečiosios šalies operatorių („Stripe“). Vartotojas sutinka, kad narystės mokestis būtų nuskaičiuojamas automatiškai (SEPA Direct Debit arba kortele) pagal pasirinktą planą." },
          { label: "3.2. Sąskaitos:", text: "PVM sąskaitos faktūros generuojamos automatiškai ir siunčiamos Vartotojo nurodytu el. paštu." },
          { label: "3.3. Nutraukimas:", text: "Vartotojas gali bet kada nutraukti prenumeratą savo paskyros nustatymuose. Nutraukus prenumeratą, prieiga prie Platformos išlieka iki apmokėto laikotarpio pabaigos. Pinigai už nepanaudotą laikotarpio dalį nėra grąžinami." }
        ]
      },
      {
        title: "4. DUOMENŲ TVARKYMO PRINCIPAI",
        items: [
          { label: "4.1. Saugojimo terminas:", text: "Visi Platformoje užregistruoti įrašai apie nusižengimus yra saugomi 5 (penkerius) metus nuo įrašo sukūrimo datos. Suėjus šiam terminui, duomenys yra automatiškai ir negrįžtamai pašalinami." },
          { label: "4.2. Duomenų tikslumas:", text: "Jei duomenų subjektas (vairuotojas) pateikia pagrįstus įrodymus, kad įrašas yra netikslus ar melagingas, Paslaugų teikėjas pasilieka teisę per 5 darbo dienas vienašališkai pašalinti tokį įrašą." },
          { label: "4.3. Draudžiamas turinys:", text: "Griežtai draudžiama į sistemą vesti asmens kodus, tikslius gyvenamosios vietos adresus, sveikatos duomenis ar kitą perteklinę informaciją. Vartotojas atsako už tai, kad įrašas atitiktų BDAR duomenų kiekio mažinimo (data minimization) principą." }
        ]
      },
      {
        title: "5. ĮRAŠŲ POBŪDIS IR ATSAKOMYBĖ",
        items: [
          { label: "5.1. Vartotojo atsakomybė:", text: "Naudodamasis Platforma, Vartotojas patvirtina, kad jis veikia kaip duomenų Valdytojas. Vartotojas prisiima visą teisinę atsakomybę už savo įkeltų atsiliepimų turinį, tikrumą ir teisėtumą. Paslaugų teikėjas veikia tik kaip techninis tarpininkas (duomenų Tvarkytojas) ir netikrina faktinių aplinkybių." },
          { label: "5.2. Konsultacinis pobūdis:", text: "Platformoje esanti informacija yra rekomendacinio pobūdžio. Faktas, kad vairuotojas yra minimas Platformoje, negali būti traktuojamas kaip vienintelė priežastis neįdarbinti asmens." },
          { label: "5.3. Identifikavimo rizika:", text: "Asmens identifikavimas vykdomas pagal vardą, pavardę ir gimimo metus (be asmens kodo). Vartotojas supranta riziką dėl galimų bendravardžių sutapimų ir įsipareigoja atlikti papildomą patikrinimą prieš priimdamas sprendimus.", highlight: true }
        ]
      },
       {
        title: "6. „DRIVERCHECK“ ŽENKLO NAUDOJIMAS",
        items: [
          { label: "6.1. Marketingo teisės:", text: "Aktyvią prenumeratą turintis Vartotojas turi teisę naudoti „DriverCheck“ logotipą ir žymą „Patikimas partneris“ savo svetainėje ar darbo skelbimuose." },
          { label: "6.2. Teisės pasibaigimas:", text: "Nutraukus prenumeratą arba pažeidus šias Taisykles, Vartotojas privalo per 3 darbo dienas pašalinti visą „DriverCheck“ vizualinę medžiagą." }
        ]
      },
      {
        title: "7. BAIGIAMOSIOS NUOSTATOS",
        items: [
          { label: "7.1. Platformos prieinamumas:", text: "Paslaugų teikėjas siekia užtikrinti 99% Platformos pasiekiamumą, tačiau neatsako už laikinus sutrikimus dėl techninių profilaktikos darbų ar trečiųjų šalių (serverių tiekėjų) gedimų." },
          { label: "7.2. Taisyklių keitimas:", text: "Paslaugų teikėjas turi teisę vienašališkai keisti šias Taisykles, apie tai informuodamas Vartotojus el. paštu prieš 14 dienų. Tolesnis naudojimasis Platforma reiškia sutikimą su pakeitimais." },
          { label: "7.3. Ginčų sprendimas:", text: "Visi ginčiai sprendžiami derybų būdu. Nepavykus susitarti, ginčai sprendžiami Lietuvos Respublikos teismuose pagal Paslaugų teikėjo buveinės vietą." }
        ]
      }
    ]
  },
  en: {
    title: "Terms of Service",
    subtitle: "Official terms and conditions for using the DriverCheck platform.",
    cardTitle: "General Terms of Service",
    date: "Effective Date: January 24, 2026",
    intro: "These rules ('Rules') set out the terms and conditions for using the 'DriverCheck' platform ('Platform'). By registering on or using the Platform, the User (Legal Entity) confirms that they have read, understood and agree to be bound by these Rules.",
    sections: [
      {
        title: "1. Data Processing Principles and Retention",
        items: [
          { label: "1.1. Retention Period:", text: "All incident reports registered on the Platform are stored for 5 (five) years from the date of creation. Upon expiration of this period, data is automatically and permanently deleted from the system." },
          { label: "1.2. Data Accuracy and Disputes:", text: "If a data subject (driver) or other interested party provides valid evidence that a record on the Platform is inaccurate, false, or misleading, the Service Provider reserves the right to unilaterally remove such record within 5 business days." },
          { label: "1.3. Prohibited Content:", text: "It is strictly forbidden to enter personal identification numbers (SSN), exact residential addresses, health data, or other excessive information into comments or other fields. The User (Company) is responsible for ensuring the entry complies with the GDPR data minimization principle." }
        ]
      },
      {
        title: "2. DriverCheck Brand and Reputation",
        items: [
          { label: "2.1. Marketing Rights:", text: "A User with an active Platform subscription has the right to use the DriverCheck logo and 'Trusted Partner' badge on their company website, email signatures, or job postings to inform clients and candidates about their responsible recruitment process." },
          { label: "2.2. Termination of Rights:", text: "Upon expiration of the subscription or violation of these Terms, the User must remove DriverCheck visual materials from all public channels within 3 business days." }
        ]
      },
      {
        title: "3. Nature of Records and Usage",
        items: [
          { label: "3.1. Advisory Nature:", text: "All records on the Platform are for informational purposes only. The fact that a data subject (driver) is mentioned on the Platform does not and cannot be treated as a recommendation not to hire the person or to terminate their employment." },
          { label: "3.2. Education and Prevention:", text: "The Platform's goal is to help the User identify areas where a driver may need additional attention. It is recommended to use the information to plan targeted training (e.g., eco-driving, safety courses) or set probation guidelines, rather than as an automatic rejection criterion." },
          { label: "3.3. Decision Making:", text: "The User (Company) makes the final decision on cooperation independently, evaluating the situation as a whole. The Platform serves as a tool for risk management and competence improvement." }
        ]
      },
      {
        title: "4. User Responsibility and Identification Limits",
        items: [
          { label: "4.1. Data Controller Status:", text: "By using the Platform, the User confirms they act as a Data Controller and independently ensure compliance with all legal obligations arising from GDPR (including legitimate interest assessment). The Service Provider acts solely as a technical Data Processor." },
          { label: "4.2. Identification Limitations:", text: "To ensure maximum personal data security and compliance with GDPR, the Platform does not collect unique personal identification numbers. Identification is based on name, surname, and year of birth. The User understands and accepts the risk that due to potential namesakes, the system cannot guarantee 100% identification accuracy. The User must take additional measures (e.g., during the interview) to verify that the record found on the Platform truly belongs to the candidate in question.", highlight: true },
          { label: "4.3. Liability for Decisions:", text: "The Service Provider assumes no liability for the User's business decisions or potential damages resulting from mistaken identity if the User failed to perform additional verification." }
        ]
      }
    ]
  }
};

export default function TermsPage() {
  const { locale } = useLanguage();
  const content = locale === 'lt' ? TERMS_CONTENT.lt : TERMS_CONTENT.en;

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
                Print / PDF
            </Button>
        </div>
      </div>

      <Card className="border-t-4 border-t-primary shadow-lg">
        <CardHeader className="bg-muted/20 pb-8">
            <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">{content.cardTitle}</CardTitle>
            </div>
            <CardDescription className="text-base">
                {content.date}
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-300px)] p-6 md:p-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <div className="space-y-8 print:space-y-4">
                {content.intro && (
                  <p className="text-base font-medium text-foreground border-b pb-4">
                      {content.intro}
                  </p>
                )}
                {content.sections.map((section, index) => (
                    <section key={index}>
                        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                            {section.title}
                        </h3>
                        <ul className="list-disc pl-5 space-y-2">
                            {section.items.map((item, i) => (
                                <li key={i} className={item.highlight ? "bg-amber-500/10 p-2 rounded border border-amber-500/20" : ""}>
                                    <strong>{item.label}</strong> {item.text}
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
                
                 <div className="pt-8 text-xs text-muted-foreground text-center print:hidden">
                    <p>© 2026 DriverCheck. All rights reserved.</p>
                </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
