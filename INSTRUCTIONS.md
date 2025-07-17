
# Kaip Atsisiųsti Projektą į Savo Kompiuterį

Šios instrukcijos paaiškina, kaip perkelti visus projekto failus iš `Firebase Studio` į savo asmeninį kompiuterį naudojant `Git` ir `GitHub`.

## Žingsniai

### 1. GitHub Repozitorijos Sukūrimas

*   Nueikite į [github.com](https://github.com) ir prisijunkite.
*   Spauskite **"New"** mygtuką, kad sukurtumėte naują repozitoriją.
*   **Repository name:** `drivercheck-app` (arba kitas Jums patinkantis pavadinimas).
*   Pasirinkite **"Private"** (privati), jei nenorite, kad kodas būtų viešas.
*   **Svarbu:** NEPAŽYMĖKITE varnelių ties "Add a README file", "Add .gitignore", ar "Choose a license". Repozitorija turi būti visiškai tuščia.
*   Spauskite **"Create repository"**.
*   Naujame puslapyje, skiltyje "...or push an existing repository from the command line", nukopijuokite repozitorijos URL adresą. Jis atrodys maždaug taip: `https://github.com/JUSU_VARDAS/drivercheck-app.git`.

### 2. Projekto Išsiuntimas iš Firebase Studio į GitHub

Atidarykite terminalą `Firebase Studio` aplinkoje ir nuosekliai vykdykite šias komandas:

```bash
# 1. Inicijuokite Git repozitoriją projekto aplanke
git init

# 2. Pridėkite visus projekto failus
git add .

# 3. Įrašykite pirminį failų "snapshot" (commit)
git commit -m "Initial project commit from Firebase Studio"

# 4. Pakeiskite numatytąją šakos (branch) pavadinimą į "main"
git branch -M main

# 5. Susiekite savo projektą su GitHub repozitorija
# (Pakeiskite URL į tą, kurį nukopijavote iš GitHub)
git remote add origin https://github.com/JUSU_VARDAS/drivercheck-app.git

# 6. Išsiųskite visus failus į GitHub
git push -u origin main
```

*Kai vykdysite `git push` komandą, terminalas gali paprašyti Jūsų suvesti savo `GitHub` vartotojo vardą ir slaptažodį (arba *Personal Access Token*).*

### 3. Projekto Atsisiuntimas (klonavimas) į Jūsų Kompiuterį

Dabar, kai kodas yra `GitHub`, galite jį lengvai atsisiųsti į savo kompiuterį.

*   Atidarykite terminalą (pvz., `Terminal`, `PowerShell`, `Git Bash`) savo kompiuteryje.
*   Nueikite į aplanką, kuriame norite laikyti projektą (pvz., `cd Documents/Projects`).
*   Vykdykite šią komandą (vėlgi, naudokite savo nukopijuotą URL):

```bash
git clone https://github.com/JUSU_VARDAS/drivercheck-app.git
```

**Viskas!** Jūsų kompiuteryje, nurodytame aplanke, atsiras `drivercheck-app` katalogas su visais projekto failais.
