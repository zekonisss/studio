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

---

# Kaip Sukonfigūruoti Firebase Admin Prieigą

Kad veiktų serverio funkcijos, tokios kaip masinis duomenų importas, projektui reikalingi administratoriaus prisijungimo duomenys. Juos reikia įrašyti į `.env` failą.

### 1. Service Account (Aptarnavimo Paskyros) Suradimas

*   Nueikite į **Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com).
*   Įsitikinkite, kad kairiajame viršutiniame kampe pasirinktas teisingas projektas (tas pats, kurį naudojate Firebase).
*   Paieškos juostoje įveskite **"IAM & Admin"** ir pasirinkite atitinkamą paslaugą.
*   Kairiajame meniu pasirinkite **"Service Accounts"**.

### 2. Reikiamų Duomenų Surinkimas

Iš Service Accounts sąrašo jums reikės duomenų iš paskyros, kurios pavadinimas baigiasi `@...iam.gserviceaccount.com`. Dažniausiai tai bus "Firebase Admin SDK" paskyra.

#### a) Projekto ID (`FIREBASE_PROJECT_ID`)

*   Jūsų Google Cloud projekto ID matomas `Google Cloud Console` viršuje arba projekto nustatymų puslapyje. Įrašykite jį į `.env` failą.

#### b) Service Account El. Paštas (`FIREBASE_CLIENT_EMAIL`)

*   "Service Accounts" sąraše nusikopijuokite visą el. pašto adresą, kuris baigiasi `@...iam.gserviceaccount.com`. Įrašykite jį į `.env` failą.

#### c) Privataus Rakto (Private Key) Sukūrimas ir Kopijavimas (`FIREBASE_PRIVATE_KEY`)

*   Paspauskite ant savo Service Account el. pašto adreso sąraše.
*   Puslapio viršuje pasirinkite **"KEYS"** skiltį.
*   Spauskite **"ADD KEY"** -> **"Create new key"**.
*   Pasirinkite **JSON** tipą ir spauskite **"CREATE"**.
*   Jūsų kompiuteris atsisiųs JSON failą. **Saugokite jį, jis yra slaptas!**
*   Atidarykite atsisiųstą JSON failą su tekstiniu redaktoriumi (`Notepad`, `VS Code` ir pan.). Failo turinys atrodys maždaug taip:
    ```json
    {
      "type": "service_account",
      "project_id": "tavo-projekto-id",
      "private_key_id": "...",
      "private_key": "-----BEGIN PRIVATE KEY-----\\n...ILGAS IR SUDĖTINGAS RAKTAS...\\n-----END PRIVATE KEY-----\\n",
      "client_email": "...",
      "client_id": "...",
      ...
    }
    ```
*   Nusikopijuokite **visą** `private_key` reikšmę. Būtent, viską nuo `-----BEGIN PRIVATE KEY-----` iki pat `-----END PRIVATE KEY-----\n`.
*   Įklijuokite šią reikšmę į `.env` failą ties `FIREBASE_PRIVATE_KEY`.

### 3. Svarbi Pastaba

Užpildžius `.env` failą, pakeitimai įsigalios tik **perkrovus serverį**. `Firebase Studio` aplinkoje tai dažniausiai įvyksta automatiškai išsaugojus failą. Jei dirbate lokaliai, sustabdykite (`Ctrl+C`) ir vėl paleiskite savo programą (`npm run dev`).