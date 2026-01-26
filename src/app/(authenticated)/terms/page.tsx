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
    cardTitle: "Bendrosios Paslaugų Teikimo Sąlygos",
    date: "Redakcija: 2026 m. Sausio 24 d.",
    sections: [
      {
        title: "1. Duomenų tvarkymo principai ir terminai",
        items: [
          { label: "1.1. Saugojimo terminas:", text: "Visi Platformoje užregistruoti įrašai apie nusižengimus yra saugomi 5 (penkerius) metus nuo įrašo sukūrimo datos. Suėjus šiam terminui, duomenys yra automatiškai ir negrįžtamai pašalinami iš sistemos." },
          { label: "1.2. Duomenų tikslumas ir skundai:", text: "Jei duomenų subjektas (vairuotojas) ar kita suinteresuota šalis pateikia pagrįstus įrodymus, kad Platformoje esantis įrašas yra netikslus, melagingas ar klaidinantis, Paslaugų teikėjas pasilieka teisę per 5 darbo dienas vienašališkai pašalinti tokį įrašą." },
          { label: "1.3. Draudžiamas turinys:", text: "Į komentarus ar kitus laukus griežtai draudžiama vesti asmens kodus, tikslius gyvenamosios vietos adresus, sveikatos duomenis ar kitą perteklinę informaciją. Vartotojas (įmonė) atsako už tai, kad įrašas atitiktų BDAR duomenų kiekio mažinimo (data minimization) principą." }
        ]
      },
      {
        title: "2. „DriverCheck“ ženklas ir reputacija",
        items: [
          { label: "2.1. Marketingo teisės:", text: "Vartotojas, turintis aktyvią Platformos prenumeratą, turi teisę naudoti „DriverCheck“ logotipą ir žymą „Patikimas partneris“ savo įmonės svetainėje, el. pašto parašuose ar darbo skelbimuose, siekiant informuoti klientus ir kandidatus apie atsakingą personalo atrankos procesą." },
          { label: "2.2. Teisės pasibaigimas:", text: "Pasibaigus prenumeratos galiojimui arba pažeidus šias Taisykles, Vartotojas privalo per 3 darbo dienas pašalinti „DriverCheck“ vizualinę medžiagą iš visų viešų kanalų." }
        ]
      },
      {
        title: "3. Įrašų pobūdis ir naudojimas",
        items: [
          { label: "3.1. Konsultacinis pobūdis:", text: "Visi Platformoje esantys įrašai yra išimtinai informacinio pobūdžio. Faktas, kad duomenų subjektas (vairuotojas) yra minimas Platformoje, savaime nėra ir negali būti traktuojamas kaip rekomendacija neįdarbinti šio asmens ar nutraukti su juo darbo santykius." },
          { label: "3.2. Ugdymas ir prevencija:", text: "Platformos tikslas – padėti Vartotojui identifikuoti sritis, kuriose vairuotojui gali reikėti papildomo dėmesio. Rekomenduojama gautą informaciją naudoti planuojant tikslinius darbuotojų mokymus (pvz., kuro taupymo kursai, saugaus eismo mokymai) ar nustatant bandomojo laikotarpio priežiūros gaires, o ne kaip automatinį atmetimo kriterijų." },
          { label: "3.3. Sprendimų priėmimas:", text: "Vartotojas (įmonė) galutinį sprendimą dėl bendradarbiavimo priima savarankiškai, įvertinęs visumą. Platforma tarnauja kaip rizikos valdymo ir kompetencijų kėlimo įrankis." }
        ]
      },
      {
        title: "4. Vartotojo atsakomybė ir identifikavimo ribos",
        items: [
          { label: "4.1. Duomenų Valdytojo statusas:", text: "Naudodamasis Platforma, Vartotojas patvirtina, kad jis veikia kaip duomenų Valdytojas ir savarankiškai užtikrina visų teisinių prievolių, kylančių iš BDAR, vykdymą (įskaitant teisėto intereso vertinimą). Paslaugų teikėjas veikia tik kaip techninis Duomenų Tvarkytojas." },
          { label: "4.2. Asmens identifikavimo ribotumai:", text: "Siekiant maksimalaus asmens duomenų saugumo ir laikantis BDAR nuostatų, Platformoje nerenkami unikalūs asmens kodai. Asmens identifikavimas vykdomas pagal vardą, pavardę ir gimimo metus. Vartotojas supranta ir prisiima riziką, kad dėl galimų bendravardžių sutapimų, sistema negali garantuoti 100% identifikavimo tikslumo. Vartotojas privalo imtis papildomų priemonių (pvz., pokalbio metu), kad įsitikintų, jog Platformoje rastas įrašas tikrai priklauso vertinamam kandidatui.", highlight: true },
          { label: "4.3. Atsakomybė už sprendimus:", text: "Paslaugų teikėjas neprisiima atsakomybės už Vartotojo priimtus verslo sprendimus ar galimą žalą, kilusią dėl klaidingo asmens identifikavimo, jei Vartotojas neatliko papildomo patikrinimo." }
        ]
      }
    ]
  },
  en: {
    title: "Terms of Service",
    subtitle: "Official terms and conditions for using the DriverCheck platform.",
    cardTitle: "General Terms of Service",
    date: "Effective Date: January 24, 2026",
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
  // PATAISYTA: Naudojame 'locale' vietoje 'language'
  const { locale } = useLanguage(); 
  
  // Logika: Jei locale yra 'lt', rodome LT, visais kitais atvejais (en, pl, ru...) rodome EN
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
