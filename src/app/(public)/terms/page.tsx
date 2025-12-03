import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <ScrollText className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">Naudojimosi Taisyklės</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            DriverCheck platformos naudojimosi sąlygos ir nuostatos.
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-primary prose-a:text-accent hover:prose-a:text-accent/80">
          <h2>1. Bendrosios Nuostatos</h2>
          <p>
            Šios Naudojimosi Taisyklės (toliau – Taisyklės) reglamentuoja naudojimąsi DriverCheck internetine platforma (toliau – Platforma), kurią teikia [Jūsų Įmonės Pavadinimas] (toliau – Teikėjas). Naudodamiesi Platforma, Jūs (toliau – Vartotojas) sutinkate su šiomis Taisyklėmis.
          </p>

          <h2>2. Paskyros Registracija ir Naudojimas</h2>
          <p>
            Norint naudotis Platforma, Vartotojas privalo užsiregistruoti, pateikdamas tikslią ir teisingą informaciją. Vartotojas yra atsakingas už savo prisijungimo duomenų saugumą ir konfidencialumą.
            Vartotojas privalo turėti aktyvų metinį mokėjimą, kad galėtų naudotis visomis Platformos funkcijomis.
          </p>

          <h2>3. Atsakomybė už Turinį</h2>
          <p>
            Vartotojas yra visiškai atsakingas už visą informaciją, kurią jis įkelia, pateikia ar kitaip perduoda per Platformą (toliau – Turinys). Vartotojas garantuoja, kad jo pateikiamas Turinys yra tikslus, teisėtas ir nepažeidžia trečiųjų šalių teisių bei galiojančių teisės aktų, įskaitant Bendrąjį duomenų apsaugos reglamento (BDAR).
            Teikėjas neatsako už Vartotojo pateikiamo Turinio tikslumą, teisėtumą ar patikimumą.
          </p>
          
          <h2>4. Platformos Naudojimas</h2>
          <p>
            Vartotojas įsipareigoja naudoti Platformą tik teisėtiems tikslams ir laikantis šių Taisyklių bei galiojančių teisės aktų. Draudžiama naudoti Platformą kenkėjiškai veiklai, nepageidaujamų pranešimų siuntimui, trečiųjų šalių teisių pažeidimui ar kitai neteisėtai veiklai.
          </p>

          <h2>5. Intelektinė Nuosavybė</h2>
          <p>
            Visa intelektinė nuosavybė, susijusi su Platforma (įskaitant programinę įrangą, dizainą, tekstus, logotipus), priklauso Teikėjui arba jo licencijų davėjams.
          </p>
          
          <h2>6. Taisyklių Keitimas</h2>
          <p>
            Teikėjas pasilieka teisę bet kada keisti šias Taisykles. Apie pakeitimus Vartotojai bus informuojami Platformoje arba el. paštu. Tolesnis naudojimasis Platforma po Taisyklių pakeitimo reiškia sutikimą su pakeistomis Taisyklėmis.
          </p>
          
          <h2>7. Kontaktai</h2>
          <p>
            Jei turite klausimų dėl šių Taisyklių, prašome susisiekti su mumis el. paštu: [Jūsų Kontaktinis El. Paštas].
          </p>
          <p className="text-sm text-muted-foreground mt-8">
            Paskutinį kartą atnaujinta: {new Date().toLocaleDateString('lt-LT')}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}