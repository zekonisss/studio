
import type { UserProfile, Report, SearchLog } from '@/types';

export const MOCK_USER: UserProfile = {
  id: 'dev-user-123',
  companyName: 'UAB "DriverCheck Demo"',
  companyCode: '123456789',
  vatCode: 'LT10000000012',
  address: 'Vilniaus g. 1, Vilnius',
  contactPerson: 'Sarunas Zekonis',
  email: 'sarunas.zekonis@gmail.com',
  phone: '+37060012345',
  password: 'Septoleteq1223',
  paymentStatus: 'active',
  isAdmin: true,
  registeredAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(), // Example: registered 1 year ago
  accountActivatedAt: new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString(),
  agreeToTerms: true,
  subUsers: [],
};

export const MOCK_ADDITIONAL_USER_1: UserProfile = {
  id: 'dev-user-456',
  companyName: 'UAB "Greiti Ratai"',
  companyCode: '987654321',
  vatCode: 'LT98765432111',
  address: 'Kauno g. 2, Kaunas',
  contactPerson: 'Petras Petrauskas',
  email: 'petras@greitiratai.lt',
  password: 'password123',
  paymentStatus: 'active',
  isAdmin: false,
  registeredAt: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(), // Example: registered 15 days ago
  accountActivatedAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
  agreeToTerms: true,
  subUsers: [],
};

export const MOCK_ADDITIONAL_USER_2: UserProfile = {
  id: 'dev-user-789',
  companyName: 'UAB "Saugus Kelias"',
  companyCode: '112233445',
  address: 'Klaipėdos g. 3, Klaipėda',
  contactPerson: 'Ona Onaitienė',
  email: 'ona@sauguskelias.lt',
  password: 'password123',
  paymentStatus: 'inactive',
  isAdmin: false,
  registeredAt: new Date('2023-01-10T00:00:00.000Z').toISOString(),
  accountActivatedAt: new Date('2023-01-15T00:00:00.000Z').toISOString(),
  agreeToTerms: true,
  subUsers: [],
};

export const MOCK_ADDITIONAL_USER_3: UserProfile = {
  id: 'dev-user-101',
  companyName: 'MB "Logist"',
  companyCode: '555444333',
  address: 'Panevėžio g. 10, Panevėžys',
  contactPerson: 'Laura Laurinavičė',
  email: 'laura@logist.lt',
  password: 'password123',
  paymentStatus: 'pending_verification',
  isAdmin: false,
  registeredAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), // Example: registered 5 days ago
  accountActivatedAt: undefined,
  agreeToTerms: true,
  subUsers: [],
};

export const MOCK_TEST_CLIENT_USER: UserProfile = {
  id: 'test-client-001',
  companyName: 'UAB "Test Client"',
  companyCode: '900123456',
  vatCode: 'LT90012345611',
  address: 'Testo g. 1, Kaunas',
  contactPerson: 'Klientas Testuotojas',
  email: 'test@drivercheck.lt',
  phone: '+37060000000',
  password: 'driver1',
  paymentStatus: 'active',
  isAdmin: false,
  registeredAt: new Date().toISOString(),
  accountActivatedAt: new Date().toISOString(),
  agreeToTerms: true,
  subUsers: [],
};


export const MOCK_ALL_USERS: UserProfile[] = [
  { ...MOCK_USER, subUsers: MOCK_USER.subUsers || [] },
  { ...MOCK_ADDITIONAL_USER_1, subUsers: MOCK_ADDITIONAL_USER_1.subUsers || [] },
  { ...MOCK_ADDITIONAL_USER_2, subUsers: MOCK_ADDITIONAL_USER_2.subUsers || [] },
  { ...MOCK_ADDITIONAL_USER_3, subUsers: MOCK_ADDITIONAL_USER_3.subUsers || [] },
  { ...MOCK_TEST_CLIENT_USER, subUsers: MOCK_TEST_CLIENT_USER.subUsers || [] },
];

const MOCK_DISCIPLINE_REPORT: Report = {
    id: "report-discipline-1",
    reporterId: "dev-user-123",
    reporterCompanyName: 'UAB "DriverCheck Demo"',
    fullName: "Testas Testuolis",
    nationality: "LT",
    category: "discipline", 
    tags: ["neblaivus_darbo_metu", "neatsakingas_poziuris_i_darba", "kita_tag"],
    comment: "Vairuotojas buvo rastas neblaivus darbo vietoje.",
    createdAt: new Date("2024-03-15T10:00:00Z"),
};

const initialGeneralReports: Report[] = [
  {
    id: "report-general-1",
    reporterId: "test-client-001",
    reporterCompanyName: 'UAB "Test Client"',
    fullName: "Jonas Jonaitis",
    nationality: "PL",
    birthYear: 1985,
    category: "fuel_theft",
    tags: ["kuro_vagyste", "kita_tag"],
    comment: "Vairuotojas buvo pastebėtas neteisėtai nupylinėjantis kurą iš įmonės sunkvežimio. Tai jau antras kartas per pastaruosius 6 mėnesius. Taip pat gauta informacija apie pavojingą vairavimą mieste.",
    imageUrl: "https://placehold.co/600x400.png",
    createdAt: new Date("2023-10-15T10:30:00Z"),
    dataAiHint: "truck fuel"
  },
  {
    id: "report-general-2",
    reporterId: "test-client-001",
    reporterCompanyName: 'UAB "Test Client"',
    fullName: "Petras Petraitis",
    nationality: "UA",
    category: "technical_damage",
    tags: ["techninis_neatsakingumas", "kita_tag"],
    comment: "Grįžus iš reiso, pastebėta didelė žala priekabos šonui. Vairuotojas teigia nieko nepastebejęs. Rekomenduojama atlikti nuodugnesnį tyrimą.",
    createdAt: new Date("2023-11-01T14:00:00Z"),
  },
  {
    id: "report-general-3-from-456",
    reporterId: "dev-user-456",
    reporterCompanyName: 'UAB "Greiti Ratai"',
    fullName: "Kazys Kazlauskas",
    nationality: "BY",
    birthYear: 1978,
    category: "discipline",
    tags: ["neatsakingas_poziuris_i_darba", "kita_tag"],
    comment: "Vėlavo pristatyti krovinį 2 valandas be pateisinamos priežasties, grubiai bendravo su sandėlio darbuotojais.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "angry driver",
    createdAt: new Date("2024-03-01T11:00:00Z"),
  },
  {
    id: "report-general-4-from-101",
    reporterId: "test-client-001",
    reporterCompanyName: 'UAB "Test Client"',
    fullName: "Sergejus Volkovas",
    nationality: "RU",
    birthYear: 1990,
    category: "driving_safety",
    tags: ["pavojingas_vairavimas", "dazni_ket_pazeidimai"],
    comment: "Vairuotojas kelis kartus užfiksuotas kalbantis telefonu vairuojant, nepaisant įspėjimų. Kelia pavojų sau ir aplinkiniams.",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 20)),
  },
  {
    id: "report-general-5-from-456",
    reporterId: "test-client-001",
    reporterCompanyName: 'UAB "Test Client"',
    fullName: "Andrius Kaukėnas",
    nationality: "LT",
    birthYear: 1988,
    category: "behavior",
    tags: ["grasinimai_agresija", "konfliktiskas_asmuo"],
    comment: "Gautas skundas iš kliento Vokietijoje dėl agresyvaus elgesio ir grasinimų. Klientas atsisakė priimti krovinį, kol nebus atsiųstas kitas vairuotojas.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "angry man shouting",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)),
  },
  {
    id: "report-general-6-from-001",
    reporterId: "test-client-001",
    reporterCompanyName: 'UAB "Test Client"',
    fullName: "Tomas Tomaitis",
    nationality: "PL",
    birthYear: 1995,
    category: "technical_damage",
    tags: ["techninis_neatsakingumas"],
    comment: "Grįžęs iš reiso nepranešė apie sulaužytą veidrodėlį ir įlenktą durų šoną. Žala pastebėta tik per techninę apžiūrą.",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
  },
  {
    id: "report-general-7-from-123",
    reporterId: "dev-user-123",
    reporterCompanyName: 'UAB "DriverCheck Demo"',
    fullName: "Marek Kowalski",
    nationality: "PL",
    birthYear: 1982,
    category: "legal_reputation",
    tags: ["neteiseta_veikla_itariama"],
    comment: "Gauta neoficiali informacija iš partnerių, kad vairuotojas galimai dalyvauja neteisėtoje prekyboje akcizinėmis prekėmis. Įmonė pradėjo vidinį tyrimą.",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
  },
];

if (!initialGeneralReports.find(r => r.id === MOCK_DISCIPLINE_REPORT.id)) {
    initialGeneralReports.push(MOCK_DISCIPLINE_REPORT);
}

export const MOCK_GENERAL_REPORTS: Report[] = initialGeneralReports;

export const MOCK_USER_REPORTS: Report[] = [
  {
    id: "report-user-1",
    reporterId: "dev-user-123",
    reporterCompanyName: 'UAB "DriverCheck Demo"',
    fullName: "Antanas Antanaitis",
    nationality: "LT",
    birthYear: 1992,
    category: "behavior",
    tags: ["konfliktiskas_asmuo", "kita_tag"],
    comment: "Vairuotojas buvo nemandagus su klientu, atsisakė padėti iškrauti prekes. Klientas pateikė skundą.",
    createdAt: new Date("2024-02-20T09:15:00Z"),
  },
  {
    id: "report-user-2",
    reporterId: "dev-user-123",
    reporterCompanyName: 'UAB "DriverCheck Demo"',
    fullName: "Zita Zitaite",
    nationality: "LT",
    category: "driving_safety",
    tags: ["avaringumas", "pavojingas_vairavimas", "kita_tag"],
    comment: "GPS duomenys rodo pakartotinį greičio viršijimą gyvenvietėse. Buvo įspėta, tačiau situacija kartojasi.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "speeding ticket document",
    createdAt: new Date("2024-01-10T16:45:00Z"),
  },
];

export const MOCK_USER_SEARCH_LOGS: SearchLog[] = [
  { id: "log1-mock-user", userId: MOCK_USER.id, searchText: "Jonas Jonaitis", timestamp: new Date("2024-04-10T10:00:00Z"), resultsCount: 1 },
  { id: "log2-mock-user", userId: MOCK_USER.id, searchText: "Neatsakingas vairavimas", timestamp: new Date("2024-04-09T11:20:00Z"), resultsCount: 2 }, 
  { id: "log3-mock-user", userId: MOCK_USER.id, searchText: "Antanas Antanaitis", timestamp: new Date("2024-04-08T15:30:00Z"), resultsCount: 1 },
];

    