import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">Privatumo Politika</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Kaip DriverCheck renka, naudoja ir saugo jūsų asmens duomenis.
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-primary prose-a:text-accent hover:prose-a:text-accent/80">
          <h2>1. Įžanga</h2>
          <p>
            Ši Privatumo Politika paaiškina, kaip [Jūsų Įmonės Pavadinimas] (toliau – Mes, Mūsų) renka, naudoja, saugo ir atskleidžia Jūsų (toliau – Vartotojas) asmens duomenis, kai naudojatės DriverCheck internetine platforma (toliau – Platforma). Mes įsipareigojame saugoti Jūsų privatumą ir tvarkyti asmens duomenis laikantis Bendrojo duomenų apsaugos reglamento (BDAR) ir kitų taikomų teisės aktų.
          </p>

          <h2>2. Renkami Asmens Duomenys</h2>
          <p>
            Registruojantis ir naudojantis Platforma, mes galime rinkti šiuos asmens duomenis:
          </p>
          <ul>
            <li>Įmonės pavadinimas, kodas, adresas.</li>
            <li>Kontaktinio asmens vardas, pavardė, el. pašto adresas, telefono numeris.</li>
            <li>Prisijungimo duomenys (el. pašto adresas, slaptažodis).</li>
            <li>Mokėjimo informacija (tvarkoma per trečiosios šalies mokėjimų apdorojimo paslaugų teikėją, pvz., Stripe).</li>
            <li>Vartotojo įkelta informacija apie vairuotojus (vardas, pavardė, gimimo metai, kategorijos, žymos, komentarai, nuotraukos/failai).</li>
            <li>Naudojimosi Platforma duomenys (paieškų istorija, IP adresai, naršyklės tipas, prisijungimo laikas).</li>
          </ul>

          <h2>3. Asmens Duomenų Naudojimo Tikslai</h2>
          <p>Jūsų asmens duomenys naudojami šiais tikslais:</p>
          <ul>
            <li>Platformos teikimui ir administravimui.</li>
            <li>Vartotojo tapatybės nustatymui ir paskyros valdymui.</li>
            <li>Mokėjimų apdorojimui.</li>
            <li>Susisiekimui su Vartotoju dėl Platformos naudojimo ar svarbių pranešimų.</li>
            <li>Platformos tobulinimui ir personalizavimui.</li>
            <li>Teisinių įsipareigojimų vykdymui.</li>
          </ul>
          
          <h2>4. Duomenų Subjektų Teisės</h2>
          <p>
            Jūs turite teisę:
          </p>
          <ul>
            <li>Susipažinti su savo asmens duomenimis.</li>
            <li>Reikalauti ištaisyti netikslius duomenis.</li>
            <li>Reikalauti ištrinti duomenis („teisė būti pamirštam“).</li>
            <li>Apriboti duomenų tvarkymą.</li>
            <li>Nesutikti su duomenų tvarkymu.</li>
            <li>Į duomenų perkeliamumą.</li>
          </ul>
          <p>Norėdami pasinaudoti šiomis teisėmis, susisiekite su mumis žemiau nurodytais kontaktais.</p>

          <h2>5. Duomenų Saugojimas ir Saugumas</h2>
          <p>
            Mes imamės tinkamų techninių ir organizacinių priemonių Jūsų asmens duomenims apsaugoti nuo neteisėtos prieigos, pakeitimo, atskleidimo ar sunaikinimo. Duomenys saugomi tiek laiko, kiek tai būtina tikslams, kuriems jie buvo surinkti, pasiekti, arba kaip reikalauja teisės aktai.
          </p>
          
          <h2>6. Privatumo Politikos Pakeitimai</h2>
          <p>
            Mes galime periodiškai atnaujinti šią Privatumo Politiką. Apie esminius pakeitimus informuosime Platformoje arba el. paštu.
          </p>
          
          <h2>7. Kontaktai</h2>
          <p>
            Jei turite klausimų dėl šios Privatumo Politikos ar Jūsų asmens duomenų tvarkymo, prašome susisiekti su mumis el. paštu: [Jūsų Kontaktinis El. Paštas].
          </p>
           <p className="text-sm text-muted-foreground mt-8">
            Paskutinį kartą atnaujinta: {new Date().toLocaleDateString('lt-LT')}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
