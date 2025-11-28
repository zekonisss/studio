# Kaip Atnaujinti ir Atsisiųsti Projektą į Savo Kompiuterį

Šios instrukcijos paaiškina, kaip perkelti visus projekto failus iš `Firebase Studio` į savo `GitHub` repozitoriją ir tuomet atsisiųsti juos į asmeninį kompiuterį.

## 1 Žingsnis: Projekto Išsiuntimas iš Firebase Studio į GitHub

Jūsų GitHub repozitorija yra `https://github.com/zekonisss/studio.git`.

Atidarykite terminalą `Firebase Studio` aplinkoje ir nuosekliai vykdykite šias komandas:

```bash
# 1. Pridėkite visus projekto pakeitimus (naujus ir redaguotus failus)
git add .

# 2. Įrašykite pakeitimus su prasmingu komentaru
# Pakeiskite "Final code update" į savo norimą komentarą
git commit -m "Final code update from Firebase Studio"

# 3. Pakeiskite numatytąją šakos (branch) pavadinimą į "master", jei to dar nepadarėte
# Jūsų repozitorijoje pagrindinė šaka yra "master"
git branch -M master

# 4. Susiekite savo projektą su GitHub repozitorija (jei dar nesusieta)
# Pirmiausia patikrinkite, ar jau yra susiejimas:
# git remote -v
# Jei nieko nerodo arba rodo neteisingą adresą, įvykdykite šią komandą:
# git remote add origin https://github.com/zekonisss/studio.git

# 5. Išsiųskite visus failus į GitHub "master" šaką
# Naudokite --force, jei norite perrašyti istoriją (naudoti atsargiai)
git push origin master
```

**Svarbu:** Kai vykdysite `git push` komandą, terminalas gali paprašyti jūsų suvesti savo `GitHub` vartotojo vardą ir slaptažodį (arba *Personal Access Token*, kuris dabar yra rekomenduojamas būdas).

## 2 Žingsnis: Projekto Atsisiuntimas (klonavimas) į Jūsų Kompiuterį

Dabar, kai kodas yra `GitHub`, galite jį lengvai atsisiųsti į savo kompiuterį.

*   Atidarykite terminalą (pvz., `Terminal`, `PowerShell`, `Git Bash`) savo kompiuteryje.
*   Nueikite į aplanką, kuriame norite laikyti projektą (pvz., `cd Documents/Projects`).
*   Vykdykite šią komandą:

```bash
git clone https://github.com/zekonisss/studio.git
```

*   Jei jau turite seną projekto versiją, pirma nueikite į projekto aplanką (`cd studio`) ir įvykdykite komandą, kad atsisiųstumėte naujausius pakeitimus:

```bash
git pull origin master
```

**Viskas!** Jūsų kompiuteryje, nurodytame aplanke, atsiras `studio` katalogas su visais naujausiais projekto failais.
