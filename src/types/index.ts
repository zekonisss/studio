

export interface UserProfile {
  id: string;
  companyName: string;
  companyCode: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentStatus: 'active' | 'inactive' | 'pending_verification';
  isAdmin?: boolean;
}

export interface Report {
  id:string;
  reporterId: string;
  reporterCompanyName?: string;
  fullName: string;
  birthYear?: number;
  category: string;
  tags: string[];
  comment: string;
  imageUrl?: string;
  dataAiHint?: string;
  createdAt: Date;
}

export interface SearchLog {
  id: string;
  userId: string;
  searchText: string;
  timestamp: Date;
  resultsCount: number;
}

export type ReportCategory =
  | 'kuro_vagyste'
  | 'zala_technikai'
  | 'netinkamas_elgesys'
  | 'greicio_virijimas'
  | 'kita';

export const reportCategories: { value: ReportCategory, label: string }[] = [
  { value: 'kuro_vagyste', label: 'Kuro vagystė' },
  { value: 'zala_technikai', label: 'Žala technikai' },
  { value: 'netinkamas_elgesys', label: 'Netinkamas elgesys' },
  { value: 'greicio_virijimas', label: 'Greičio viršijimas' },
  { value: 'kita', label: 'Kita' },
];

export type ReportTag =
  | 'pasikartojantis'
  | 'pavojingas_vairavimas'
  | 'konfliktiskas'
  | 'rekomenduojama_patikrinti';

export const reportTags: { value: ReportTag, label: string }[] = [
  { value: 'pasikartojantis', label: 'Pasikartojantis pažeidimas' },
  { value: 'pavojingas_vairavimas', label: 'Pavojingas vairavimas' },
  { value: 'konfliktiskas', label: 'Konfliktiškas asmuo' },
  { value: 'rekomenduojama_patikrinti', label: 'Rekomenduojama papildomai patikrinti' },
];

// --- MOCK DATA ---

export const MOCK_USER: UserProfile = {
  id: 'dev-user-123',
  companyName: 'UAB "DriverShield Demo"', // Updated company name for clarity
  companyCode: '123456789',
  address: 'Vilniaus g. 1, Vilnius',
  contactPerson: 'Vardenis Pavardenis',
  email: 'sarunas.zekonis@gmail.com',
  phone: '+37060012345',
  paymentStatus: 'active',
  isAdmin: true,
};

export const MOCK_ADDITIONAL_USER_1: UserProfile = {
  id: 'dev-user-456',
  companyName: 'UAB "Greiti Ratai"',
  companyCode: '987654321',
  address: 'Kauno g. 2, Kaunas',
  contactPerson: 'Petras Petrauskas',
  email: 'petras@greitiratai.lt',
  phone: '+37060054321',
  paymentStatus: 'active',
  isAdmin: false,
};

export const MOCK_ADDITIONAL_USER_2: UserProfile = {
  id: 'dev-user-789',
  companyName: 'UAB "Saugus Kelias"',
  companyCode: '112233445',
  address: 'Klaipėdos g. 3, Klaipėda',
  contactPerson: 'Ona Onaitienė',
  email: 'ona@sauguskelias.lt',
  phone: '+37060098765',
  paymentStatus: 'inactive',
  isAdmin: false,
};

export const MOCK_ALL_USERS: UserProfile[] = [MOCK_USER, MOCK_ADDITIONAL_USER_1, MOCK_ADDITIONAL_USER_2];


// Base reports specifically by MOCK_USER (previously mockUserReportsBase)
export const MOCK_USER_REPORTS: Report[] = [
  {
    id: "report-user-1",
    reporterId: "dev-user-123", // MOCK_USER ID
    reporterCompanyName: 'UAB "DriverShield Demo"',
    fullName: "Antanas Antanaitis",
    birthYear: 1992,
    category: "netinkamas_elgesys",
    tags: ["konfliktiskas"],
    comment: "Vairuotojas buvo nemandagus su klientu, atsisakė padėti iškrauti prekes. Klientas pateikė skundą.",
    createdAt: new Date("2024-02-20T09:15:00Z"),
  },
  {
    id: "report-user-2",
    reporterId: "dev-user-123", // MOCK_USER ID
    reporterCompanyName: 'UAB "DriverShield Demo"',
    fullName: "Zita Zitaite",
    category: "greicio_virijimas",
    tags: ["pasikartojantis", "pavojingas_vairavimas"],
    comment: "GPS duomenys rodo pakartotinį greičio viršijimą gyvenvietėse. Buvo įspėta, tačiau situacija kartojasi.",
    imageUrl: "https://placehold.co/300x200.png",
    dataAiHint: "speeding ticket",
    createdAt: new Date("2024-01-10T16:45:00Z"),
  },
];

// General mock reports, can be from various reporters (previously mockReportsBase)
export const MOCK_GENERAL_REPORTS: Report[] = [
  {
    id: "report-general-1",
    reporterId: "user-generic-1",
    reporterCompanyName: "UAB Logistika LT",
    fullName: "Jonas Jonaitis",
    birthYear: 1985,
    category: "kuro_vagyste",
    tags: ["pasikartojantis", "pavojingas_vairavimas"],
    comment: "Vairuotojas buvo pastebėtas neteisėtai nupylinėjantis kurą iš įmonės sunkvežimio. Tai jau antras kartas per pastaruosius 6 mėnesius. Taip pat gauta informacija apie pavojingą vairavimą mieste.",
    imageUrl: "https://placehold.co/600x400.png",
    createdAt: new Date("2023-10-15T10:30:00Z"),
    dataAiHint: "truck fuel"
  },
  {
    id: "report-general-2",
    reporterId: "user-generic-2",
    reporterCompanyName: "UAB Greiti Pervežimai",
    fullName: "Petras Petraitis",
    category: "zala_technikai",
    tags: ["rekomenduojama_patikrinti"],
    comment: "Grįžus iš reiso, pastebėta didelė žala priekabos šonui. Vairuotojas teigia nieko nepastebejęs. Rekomenduojama atlikti nuodugnesnį tyrimą.",
    createdAt: new Date("2023-11-01T14:00:00Z"),
  },
];

// Base mock data for search logs of MOCK_USER (previously mockSearchLogsBase)
export const MOCK_USER_SEARCH_LOGS: SearchLog[] = [
  { id: "mocklog1", userId: "dev-user-123", searchText: "Jonas Jonaitis (Demo)", timestamp: new Date("2024-03-10T10:00:00Z"), resultsCount: 2 },
  { id: "mocklog2", userId: "dev-user-123", searchText: "AB123XYZ (Demo)", timestamp: new Date("2024-03-09T15:30:00Z"), resultsCount: 0 },
  { id: "mocklog3", userId: "dev-user-123", searchText: "Petras Petraitis (Demo)", timestamp: new Date("2024-03-09T11:20:00Z"), resultsCount: 1 },
];

// Helper to combine and deduplicate reports by ID
export const combineAndDeduplicateReports = (...reportArrays: Report[][]): Report[] => {
  const combined = reportArrays.flat();
  const uniqueReportsMap = new Map<string, Report>();
  combined.forEach(report => {
    if (!uniqueReportsMap.has(report.id)) {
      uniqueReportsMap.set(report.id, report);
    }
  });
  return Array.from(uniqueReportsMap.values()).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
};
