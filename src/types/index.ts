
export interface UserProfile {
  id: string;
  companyName: string;
  companyCode: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentStatus: 'active' | 'inactive' | 'pending_verification' | 'pending_payment';
  isAdmin?: boolean;
  accountActivatedAt?: string; // Date ISO string when the account was last set to 'active'
  password?: string; 
  agreeToTerms?: boolean;
}

export interface Report {
  id:string;
  reporterId: string;
  reporterCompanyName?: string;
  fullName: string;
  birthYear?: number;
  category: string; // Should match ReportCategoryValue
  tags: string[]; // Should match ReportTagValue elements
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

export type ReportCategoryValue =
  | 'kuro_vagyste'
  | 'avaringumas'
  | 'neblaivumas_darbe'
  | 'technikos_pazeidimai'
  | 'netinkamas_elgesys_darbe'
  | 'neaiskinamas_neatvykimas'
  | 'kreipimasis_institucijos'
  | 'kita';

export const reportCategories: { value: ReportCategoryValue, label: string }[] = [
  { value: 'kuro_vagyste', label: 'Kuro vagystė' },
  { value: 'avaringumas', label: 'Avaringumas' },
  { value: 'neblaivumas_darbe', label: 'Neblaivumas darbo metu' },
  { value: 'technikos_pazeidimai', label: 'Technikos pažeidimai' },
  { value: 'netinkamas_elgesys_darbe', label: 'Netinkamas elgesys darbe' },
  { value: 'neaiskinamas_neatvykimas', label: 'Nepaaiškinamas neatvykimas į darbą' },
  { value: 'kreipimasis_institucijos', label: 'Kreipimasis į institucijas' },
  { value: 'kita', label: 'Kita' },
];

export type ReportTagValue =
  | 'pasikartojantis'
  | 'pavojingas_vairavimas'
  | 'konfliktiskas'
  | 'rekomenduojama_patikrinti'
  | 'pakenkta_reputacijai'
  | 'konfliktas_su_klientu'
  | 'neatsakingas_poziuris';

export const reportTags: { value: ReportTagValue, label: string }[] = [
  { value: 'pasikartojantis', label: 'Pasikartojantis pažeidimas' },
  { value: 'pavojingas_vairavimas', label: 'Pavojingas vairavimas' },
  { value: 'konfliktiskas', label: 'Konfliktiškas asmuo' },
  { value: 'rekomenduojama_patikrinti', label: 'Rekomenduojama papildomai patikrinti' },
  { value: 'pakenkta_reputacijai', label: 'Pakenkta įmonės reputacijai' },
  { value: 'konfliktas_su_klientu', label: 'Sukeltas konfliktas su klientu' },
  { value: 'neatsakingas_poziuris', label: 'Neatsakingas požiūris į darbą' },
];

// --- MOCK DATA ---

export const MOCK_USER: UserProfile = {
  id: 'dev-user-123',
  companyName: 'UAB "DriverShield Demo"',
  companyCode: '123456789',
  address: 'Vilniaus g. 1, Vilnius',
  contactPerson: 'Vardenis Pavardenis',
  email: 'sarunas.zekonis@gmail.com',
  phone: '+37060012345',
  paymentStatus: 'active',
  isAdmin: true,
  accountActivatedAt: new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString(), // Activated 11 months ago
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
  accountActivatedAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), // Activated 10 days ago
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
  accountActivatedAt: new Date('2023-01-15T00:00:00.000Z').toISOString(), // Was active, now inactive
};

export const MOCK_ADDITIONAL_USER_3: UserProfile = {
  id: 'dev-user-101',
  companyName: 'MB "Logist"',
  companyCode: '555444333',
  address: 'Panevėžio g. 10, Panevėžys',
  contactPerson: 'Laura Laurinavičė',
  email: 'laura@logist.lt',
  phone: '+37060011122',
  paymentStatus: 'pending_verification',
  isAdmin: false,
  accountActivatedAt: undefined, // Not yet active
};


export const MOCK_ALL_USERS: UserProfile[] = [MOCK_USER, MOCK_ADDITIONAL_USER_1, MOCK_ADDITIONAL_USER_2, MOCK_ADDITIONAL_USER_3];

const LOCAL_STORAGE_USERS_KEY = 'driverShieldAllUsers';

export function getAllUsers(): UserProfile[] {
  let combinedUsers: UserProfile[] = [...MOCK_ALL_USERS.map(u => ({...u}))]; 
  if (typeof window !== 'undefined') {
    const storedUsersJSON = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (storedUsersJSON) {
      try {
        const localUsers: UserProfile[] = JSON.parse(storedUsersJSON);
        const usersMap = new Map<string, UserProfile>();
        
        MOCK_ALL_USERS.forEach(user => usersMap.set(user.id, {...user}));
        localUsers.forEach(user => usersMap.set(user.id, user)); 
        combinedUsers = Array.from(usersMap.values());
      } catch (e) {
        console.error("Failed to parse users from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_USERS_KEY);
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(MOCK_ALL_USERS));
    }
  }
  return combinedUsers;
}

export function saveAllUsers(users: UserProfile[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  }
}


export const MOCK_USER_REPORTS: Report[] = [
  {
    id: "report-user-1",
    reporterId: "dev-user-123",
    reporterCompanyName: 'UAB "DriverShield Demo"',
    fullName: "Antanas Antanaitis",
    birthYear: 1992,
    category: "netinkamas_elgesys_darbe", // Updated
    tags: ["konfliktiskas", "konfliktas_su_klientu"], // Updated
    comment: "Vairuotojas buvo nemandagus su klientu, atsisakė padėti iškrauti prekes. Klientas pateikė skundą.",
    createdAt: new Date("2024-02-20T09:15:00Z"),
  },
  {
    id: "report-user-2",
    reporterId: "dev-user-123",
    reporterCompanyName: 'UAB "DriverShield Demo"',
    fullName: "Zita Zitaite",
    category: "avaringumas", // Updated (was greicio_virijimas)
    tags: ["pasikartojantis", "pavojingas_vairavimas"],
    comment: "GPS duomenys rodo pakartotinį greičio viršijimą gyvenvietėse. Buvo įspėta, tačiau situacija kartojasi.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "speeding ticket document",
    createdAt: new Date("2024-01-10T16:45:00Z"),
  },
];

export const MOCK_GENERAL_REPORTS: Report[] = [
  {
    id: "report-general-1",
    reporterId: "user-generic-1",
    reporterCompanyName: "UAB Logistika LT",
    fullName: "Jonas Jonaitis",
    birthYear: 1985,
    category: "kuro_vagyste",
    tags: ["pasikartojantis", "pavojingas_vairavimas", "neatsakingas_poziuris"], // Updated
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
    category: "technikos_pazeidimai", // Updated
    tags: ["rekomenduojama_patikrinti", "neatsakingas_poziuris"], // Updated
    comment: "Grįžus iš reiso, pastebėta didelė žala priekabos šonui. Vairuotojas teigia nieko nepastebejęs. Rekomenduojama atlikti nuodugnesnį tyrimą.",
    createdAt: new Date("2023-11-01T14:00:00Z"),
  },
  {
    id: "report-general-3-from-456",
    reporterId: "dev-user-456", // MOCK_ADDITIONAL_USER_1 ID
    reporterCompanyName: 'UAB "Greiti Ratai"',
    fullName: "Kazys Kazlauskas",
    birthYear: 1978,
    category: "netinkamas_elgesys_darbe", // Updated
    tags: ["konfliktiskas", "pakenkta_reputacijai"], // Updated
    comment: "Vėlavo pristatyti krovinį 2 valandas be pateisinamos priežasties, grubiai bendravo su sandėlio darbuotojais.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "angry driver",
    createdAt: new Date("2024-03-01T11:00:00Z"),
  },
];

export const MOCK_USER_SEARCH_LOGS: SearchLog[] = [
  { id: "mocklog1", userId: "dev-user-123", searchText: "Jonas Jonaitis (Demo)", timestamp: new Date("2024-03-10T10:00:00Z"), resultsCount: 2 },
  { id: "mocklog2", userId: "dev-user-123", searchText: "AB123XYZ (Demo)", timestamp: new Date("2024-03-09T15:30:00Z"), resultsCount: 0 },
  { id: "mocklog3", userId: "dev-user-123", searchText: "Petras Petraitis (Demo)", timestamp: new Date("2024-03-09T11:20:00Z"), resultsCount: 1 },
];

export const combineAndDeduplicateReports = (...reportArrays: Report[][]): Report[] => {
  const combined = reportArrays.flat();
  const uniqueReportsMap = new Map<string, Report>();
  combined.forEach(report => {
    if (!uniqueReportsMap.has(report.id)) {
      uniqueReportsMap.set(report.id, { ...report, createdAt: new Date(report.createdAt) });
    }
  });
  return Array.from(uniqueReportsMap.values()).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

