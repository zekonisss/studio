
export interface UserProfile {
  id: string;
  companyName: string;
  companyCode: string;
  vatCode?: string;
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

export interface DetailedCategory {
  id: string;
  name: string;
  subcategories: string[];
  tags: string[];
}

export interface Report {
  id:string;
  reporterId: string;
  reporterCompanyName?: string;
  fullName: string;
  nationality?: string;
  birthYear?: number;
  category: string; // Main category ID e.g., "fuel_theft"
  subcategory?: string; // Selected subcategory
  tags: string[]; // Selected tags relevant to the main category
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

const unsortedCountries: { value: string, label: string }[] = [
  { value: 'AF', label: 'Afganistanas' },
  { value: 'AX', label: 'Alandų Salos' },
  { value: 'AL', label: 'Albanija' },
  { value: 'DZ', label: 'Alžyras' },
  { value: 'AS', label: 'Amerikos Samoa' },
  { value: 'AD', label: 'Andora' },
  { value: 'AO', label: 'Angola' },
  { value: 'AI', label: 'Angilija' },
  { value: 'AQ', label: 'Antarktida' },
  { value: 'AG', label: 'Antigva ir Barbuda' },
  { value: 'AR', label: 'Argentina' },
  { value: 'AM', label: 'Armėnija' },
  { value: 'AW', label: 'Aruba' },
  { value: 'AU', label: 'Australija' },
  { value: 'AT', label: 'Austrija' },
  { value: 'AZ', label: 'Azerbaidžanas' },
  { value: 'BS', label: 'Bahamos' },
  { value: 'BH', label: 'Bahreinas' },
  { value: 'BD', label: 'Bangladešas' },
  { value: 'BB', label: 'Barbadosas' },
  { value: 'BY', label: 'Baltarusija' },
  { value: 'BE', label: 'Belgija' },
  { value: 'BZ', label: 'Belizas' },
  { value: 'BJ', label: 'Beninas' },
  { value: 'BM', label: 'Bermuda' },
  { value: 'BT', label: 'Butanas' },
  { value: 'BO', label: 'Bolivija' },
  { value: 'BQ', label: 'Boneras, Sint Eustatijus ir Saba' },
  { value: 'BA', label: 'Bosnija ir Hercegovina' },
  { value: 'BW', label: 'Botsvana' },
  { value: 'BV', label: 'Buvė Sala' },
  { value: 'BR', label: 'Brazilija' },
  { value: 'IO', label: 'Indijos Vandenyno Britų Sritis' },
  { value: 'BN', label: 'Brunėjus' },
  { value: 'BG', label: 'Bulgarija' },
  { value: 'BF', label: 'Burkina Fasas' },
  { value: 'BI', label: 'Burundis' },
  { value: 'CV', label: 'Žaliasis Kyšulys' },
  { value: 'KH', label: 'Kambodža' },
  { value: 'CM', label: 'Kamerūnas' },
  { value: 'CA', label: 'Kanada' },
  { value: 'KY', label: 'Kaimanų Salos' },
  { value: 'CF', label: 'Centrinės Afrikos Respublika' },
  { value: 'TD', label: 'Čadas' },
  { value: 'CL', label: 'Čilė' },
  { value: 'CN', label: 'Kinija' },
  { value: 'CX', label: 'Kalėdų Sala' },
  { value: 'CC', label: 'Kokosų (Kilingo) Salos' },
  { value: 'CO', label: 'Kolumbija' },
  { value: 'KM', label: 'Komorai' },
  { value: 'CD', label: 'Kongas (Demokratinė Respublika)' },
  { value: 'CG', label: 'Kongas (Respublika)' },
  { value: 'CK', label: 'Kuko Salos' },
  { value: 'CR', label: 'Kosta Rika' },
  { value: 'HR', label: 'Kroatija' },
  { value: 'CU', label: 'Kuba' },
  { value: 'CW', label: 'Kiurasao' },
  { value: 'CY', label: 'Kipras' },
  { value: 'CZ', label: 'Čekija' },
  { value: 'CI', label: 'Dramblio Kaulo Krantas' },
  { value: 'DK', label: 'Danija' },
  { value: 'DJ', label: 'Džibutis' },
  { value: 'DM', label: 'Dominika' },
  { value: 'DO', label: 'Dominikos Respublika' },
  { value: 'EC', label: 'Ekvadoras' },
  { value: 'EG', label: 'Egiptas' },
  { value: 'SV', label: 'Salvadoras' },
  { value: 'GQ', label: 'Pusiaujo Gvinėja' },
  { value: 'ER', label: 'Eritrėja' },
  { value: 'EE', label: 'Estija' },
  { value: 'SZ', label: 'Esvatinis' },
  { value: 'ET', label: 'Etiopija' },
  { value: 'FK', label: 'Folklando Salos' },
  { value: 'FO', label: 'Farerų Salos' },
  { value: 'FJ', label: 'Fidžis' },
  { value: 'FI', label: 'Suomija' },
  { value: 'FR', label: 'Prancūzija' },
  { value: 'GF', label: 'Prancūzijos Gviana' },
  { value: 'PF', label: 'Prancūzijos Polinezija' },
  { value: 'TF', label: 'Prancūzijos Pietų Sritys' },
  { value: 'GA', label: 'Gabonas' },
  { value: 'GM', label: 'Gambija' },
  { value: 'GE', label: 'Gruzija' },
  { value: 'DE', label: 'Vokietija' },
  { value: 'GH', label: 'Gana' },
  { value: 'GI', label: 'Gibraltaras' },
  { value: 'GR', label: 'Graikija' },
  { value: 'GL', label: 'Grenlandija' },
  { value: 'GD', label: 'Grenada' },
  { value: 'GP', label: 'Gvadelupa' },
  { value: 'GU', label: 'Guamas' },
  { value: 'GT', label: 'Gvatemala' },
  { value: 'GG', label: 'Gernsis' },
  { value: 'GN', label: 'Gvinėja' },
  { value: 'GW', label: 'Bisau Gvinėja' },
  { value: 'GY', label: 'Gajana' },
  { value: 'HT', label: 'Haitis' },
  { value: 'HM', label: 'Herdo ir Makdonaldo Salos' },
  { value: 'VA', label: 'Vatikanas' },
  { value: 'HN', label: 'Hondūras' },
  { value: 'HK', label: 'Honkongas' },
  { value: 'HU', label: 'Vengrija' },
  { value: 'IS', label: 'Islandija' },
  { value: 'IN', label: 'Indija' },
  { value: 'ID', label: 'Indonezija' },
  { value: 'IR', label: 'Iranas' },
  { value: 'IQ', label: 'Irakas' },
  { value: 'IE', label: 'Airija' },
  { value: 'IM', label: 'Meno Sala' },
  { value: 'IL', label: 'Izraelis' },
  { value: 'IT', label: 'Italija' },
  { value: 'JM', label: 'Jamaika' },
  { value: 'JP', label: 'Japonija' },
  { value: 'JE', label: 'Džersis' },
  { value: 'JO', label: 'Jordanija' },
  { value: 'KZ', label: 'Kazachstanas' },
  { value: 'KE', label: 'Kenija' },
  { value: 'KI', label: 'Kiribatis' },
  { value: 'KP', label: 'Šiaurės Korėja' },
  { value: 'KR', label: 'Pietų Korėja' },
  { value: 'KW', label: 'Kuveitas' },
  { value: 'KG', label: 'Kirgizija' },
  { value: 'LA', label: 'Laosas' },
  { value: 'LV', label: 'Latvija' },
  { value: 'LB', label: 'Libanas' },
  { value: 'LS', label: 'Lesotas' },
  { value: 'LR', label: 'Liberija' },
  { value: 'LY', label: 'Libija' },
  { value: 'LI', label: 'Lichtenšteinas' },
  { value: 'LT', label: 'Lietuva' },
  { value: 'LU', label: 'Liuksemburgas' },
  { value: 'MO', label: 'Makao' },
  { value: 'MG', label: 'Madagaskaras' },
  { value: 'MW', label: 'Malavis' },
  { value: 'MY', label: 'Malaizija' },
  { value: 'MV', label: 'Maldyvai' },
  { value: 'ML', label: 'Malis' },
  { value: 'MT', label: 'Malta' },
  { value: 'MH', label: 'Maršalo Salos' },
  { value: 'MQ', label: 'Martinika' },
  { value: 'MR', label: 'Mauritanija' },
  { value: 'MU', label: 'Mauricijus' },
  { value: 'YT', label: 'Majotas' },
  { value: 'MX', label: 'Meksika' },
  { value: 'FM', label: 'Mikronezija' },
  { value: 'MD', label: 'Moldova' },
  { value: 'MC', label: 'Monakas' },
  { value: 'MN', label: 'Mongolija' },
  { value: 'ME', label: 'Juodkalnija' },
  { value: 'MS', label: 'Montseratas' },
  { value: 'MA', label: 'Marokas' },
  { value: 'MZ', label: 'Mozambikas' },
  { value: 'MM', label: 'Mianmaras' },
  { value: 'NA', label: 'Namibija' },
  { value: 'NR', label: 'Nauru' },
  { value: 'NP', label: 'Nepalas' },
  { value: 'NL', label: 'Nyderlandai' },
  { value: 'NC', label: 'Naujoji Kaledonija' },
  { value: 'NZ', label: 'Naujoji Zelandija' },
  { value: 'NI', label: 'Nikaragva' },
  { value: 'NE', label: 'Nigeris' },
  { value: 'NG', label: 'Nigerija' },
  { value: 'NU', label: 'Niujė' },
  { value: 'NF', label: 'Norfolko Sala' },
  { value: 'MP', label: 'Marianos Šiaurinės Salos' },
  { value: 'NO', label: 'Norvegija' },
  { value: 'OM', label: 'Omanas' },
  { value: 'PK', label: 'Pakistanas' },
  { value: 'PW', label: 'Palau' },
  { value: 'PS', label: 'Palestinos Teritorija' },
  { value: 'PA', label: 'Panama' },
  { value: 'PG', label: 'Papua Naujoji Gvinėja' },
  { value: 'PY', label: 'Paragvajus' },
  { value: 'PE', label: 'Peru' },
  { value: 'PH', label: 'Filipinai' },
  { value: 'PN', label: 'Pitkerno Salos' },
  { value: 'PL', label: 'Lenkija' },
  { value: 'PT', label: 'Portugalija' },
  { value: 'PR', label: 'Puerto Rikas' },
  { value: 'QA', label: 'Kataras' },
  { value: 'MK', label: 'Šiaurės Makedonija' },
  { value: 'RO', label: 'Rumunija' },
  { value: 'RU', label: 'Rusija (teroristinė valstybė)' },
  { value: 'RW', label: 'Ruanda' },
  { value: 'RE', label: 'Reunjonas' },
  { value: 'BL', label: 'Sen Bartelemi' },
  { value: 'SH', label: 'Šv. Elenos Sala' },
  { value: 'KN', label: 'Sent Kitsas ir Nevis' },
  { value: 'LC', label: 'Sent Lusija' },
  { value: 'MF', label: 'Sen Martenas (Prancūzijos dalis)' },
  { value: 'PM', label: 'Sen Pjeras ir Mikelonas' },
  { value: 'VC', label: 'Sent Vinsentas ir Grenadinai' },
  { value: 'WS', label: 'Samoa' },
  { value: 'SM', label: 'San Marinas' },
  { value: 'ST', label: 'San Tomė ir Prinsipė' },
  { value: 'SA', label: 'Saudo Arabija' },
  { value: 'SN', label: 'Senegalas' },
  { value: 'RS', label: 'Serbija' },
  { value: 'SC', label: 'Seišeliai' },
  { value: 'SL', label: 'Siera Leonė' },
  { value: 'SG', label: 'Singapūras' },
  { value: 'SX', label: 'Sint Martenas (Nyderlandų dalis)' },
  { value: 'SK', label: 'Slovakija' },
  { value: 'SI', label: 'Slovėnija' },
  { value: 'SB', label: 'Saliamono Salos' },
  { value: 'SO', label: 'Somalis' },
  { value: 'ZA', label: 'Pietų Afrika' },
  { value: 'GS', label: 'Pietų Džordžijos ir Pietų Sandvičo Salos' },
  { value: 'SS', label: 'Pietų Sudanas' },
  { value: 'ES', label: 'Ispanija' },
  { value: 'LK', label: 'Šri Lanka' },
  { value: 'SD', label: 'Sudanas' },
  { value: 'SR', label: 'Surinamas' },
  { value: 'SJ', label: 'Svalbardas ir Jan Majenas' },
  { value: 'SE', label: 'Švedija' },
  { value: 'CH', label: 'Šveicarija' },
  { value: 'SY', label: 'Sirija' },
  { value: 'TW', label: 'Taivanas' },
  { value: 'TJ', label: 'Tadžikistanas' },
  { value: 'TZ', label: 'Tanzanija' },
  { value: 'TH', label: 'Tailandas' },
  { value: 'TL', label: 'Rytų Timoras' },
  { value: 'TG', label: 'Togas' },
  { value: 'TK', label: 'Tokelau' },
  { value: 'TO', label: 'Tonga' },
  { value: 'TT', label: 'Trinidadas ir Tobagas' },
  { value: 'TN', label: 'Tunisas' },
  { value: 'TR', label: 'Turkija' },
  { value: 'TM', label: 'Turkmėnistanas' },
  { value: 'TC', label: 'Terkso ir Kaikoso Salos' },
  { value: 'TV', label: 'Tuvalu' },
  { value: 'UG', label: 'Uganda' },
  { value: 'UA', label: 'Ukraina' },
  { value: 'AE', label: 'Jungtiniai Arabų Emyratai' },
  { value: 'GB', label: 'Jungtinė Karalystė' },
  { value: 'UM', label: 'Jungtinių Valstijų Mažosios Tolimosios Salos' },
  { value: 'US', label: 'JAV' },
  { value: 'UY', label: 'Urugvajus' },
  { value: 'UZ', label: 'Uzbekistanas' },
  { value: 'VU', label: 'Vanuatu' },
  { value: 'VE', label: 'Venesuela' },
  { value: 'VN', label: 'Vietnamas' },
  { value: 'VG', label: 'Mergelių Salos (Didžioji Britanija)' },
  { value: 'VI', label: 'Mergelių Salos (JAV)' },
  { value: 'WF', label: 'Volisas ir Futūna' },
  { value: 'EH', label: 'Vakarų Sachara' },
  { value: 'YE', label: 'Jemenas' },
  { value: 'ZM', label: 'Zambija' },
  { value: 'ZW', label: 'Zimbabvė' },
  { value: 'OTHER', label: 'Kita / Nenurodyta' }
];

const otherOption = unsortedCountries.find(c => c.value === 'OTHER');
const sortedCountries = unsortedCountries
  .filter(c => c.value !== 'OTHER')
  .sort((a, b) => a.label.localeCompare(b.label, 'lt'));

if (otherOption) {
  sortedCountries.push(otherOption);
}
export const countries: { value: string, label: string }[] = sortedCountries;


export const detailedReportCategories: DetailedCategory[] = [
  {
    id: "fuel_theft",
    name: "Kuro / turto vagystės",
    subcategories: [
      "Kuro vagystė",
      "Įrangos ar krovinio vagystė",
      "Netinkamas įmonės turto naudojimas",
      "Kita",
    ],
    tags: [
      "Kuro vagystė",
      "Krovinio vagystė",
      "Įmonės turto vagystė",
    ],
  },
  {
    id: "driving_safety",
    name: "Vairavimo saugumas",
    subcategories: [
      "Avaringumas",
      "Pavojingas vairavimas",
      "Eismo taisyklių pažeidimai",
      "Kita",
    ],
    tags: [
      "Pasikartojantis pažeidimas",
      "Pavojingas vairavimas",
      "Rizika saugumui ar kroviniui",
    ],
  },
  {
    id: "behavior",
    name: "Psichoemocinis elgesys",
    subcategories: [
      "Netinkamas elgesys kolegų atžvilgiu",
      "Konfliktiškas elgesys su klientais",
      "Grasinimai / agresija",
      "Psichotropinių medžiagų vartojimas",
      "Kita",
    ],
    tags: [
      "Konfliktiškas asmuo",
      "Sukeltas konfliktas su klientu",
      "Neetiškas bendravimas / agresija",
    ],
  },
  {
    id: "discipline",
    name: "Darbo drausmės pažeidimai",
    subcategories: [
      "Neblaivus darbo metu",
      "Neatvykimas į darbą be pateisinamos priežasties",
      "Dažnas neatvykimas į darbą",
      "Vėlavimai / darbo laiko nesilaikymas",
      "Savavališkas maršruto keitimas",
      "Kita",
    ],
    tags: [
      "Neatsakingas požiūris į darbą",
      "Pasikartojantis pažeidimas",
      "Savavališkai paliko darbo vietą",
    ],
  },
  {
    id: "technical_damage",
    name: "Techniniai pažeidimai",
    subcategories: [
      "Transporto priemonės ar įrangos tyčinis sugadinimas",
      "Techninės priežiūros ignoravimas",
      "Nepranešimas apie gedimus / defektus",
      "Kita",
    ],
    tags: [
      "Techninis neatsakingumas",
      "Rizika saugumui ar kroviniui",
    ],
  },
  {
    id: "legal_reputation",
    name: "Teisiniai / reputaciniai klausimai (pvz., darbo inspekciją dėl netikslumų ar keršto)",
    subcategories: [
      "Kreipimasis į institucijas",
      "Darbo ginčai / teismai",
      "Pakenkta įmonės reputacijai",
      "Kita",
    ],
    tags: [
      "Buvo teisinis procesas / darbo ginčas",
      "Pakenkta įmonės reputacijai",
      "Neteisėta veikla įtariama",
    ],
  },
];


// --- MOCK DATA ---

export const MOCK_USER: UserProfile = {
  id: 'dev-user-123',
  companyName: 'UAB "DriverCheck Demo"',
  companyCode: '123456789',
  vatCode: 'LT10000000012',
  address: 'Vilniaus g. 1, Vilnius',
  contactPerson: 'Vardenis Pavardenis',
  email: 'sarunas.zekonis@gmail.com',
  phone: '+37060012345',
  paymentStatus: 'active',
  isAdmin: true,
  accountActivatedAt: new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString(),
  agreeToTerms: true,
};

export const MOCK_ADDITIONAL_USER_1: UserProfile = {
  id: 'dev-user-456',
  companyName: 'UAB "Greiti Ratai"',
  companyCode: '987654321',
  vatCode: 'LT98765432111',
  address: 'Kauno g. 2, Kaunas',
  contactPerson: 'Petras Petrauskas',
  email: 'petras@greitiratai.lt',
  phone: '+37060054321',
  paymentStatus: 'active',
  isAdmin: false,
  accountActivatedAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
  agreeToTerms: true,
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
  accountActivatedAt: new Date('2023-01-15T00:00:00.000Z').toISOString(),
  agreeToTerms: true,
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
  accountActivatedAt: undefined,
  agreeToTerms: true,
};


export const MOCK_ALL_USERS: UserProfile[] = [MOCK_USER, MOCK_ADDITIONAL_USER_1, MOCK_ADDITIONAL_USER_2, MOCK_ADDITIONAL_USER_3];

const LOCAL_STORAGE_USERS_KEY = 'driverCheckAllUsers';

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
    reporterCompanyName: 'UAB "DriverCheck Demo"',
    fullName: "Antanas Antanaitis",
    nationality: "LT",
    birthYear: 1992,
    category: "behavior", 
    subcategory: "Konfliktiškas elgesys su klientais", 
    tags: ["Konfliktiškas asmuo", "Sukeltas konfliktas su klientu"], 
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
    subcategory: "Pavojingas vairavimas", 
    tags: ["Pasikartojantis pažeidimas", "Pavojingas vairavimas"], 
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
    nationality: "PL",
    birthYear: 1985,
    category: "fuel_theft", 
    subcategory: "Kuro vagystė", 
    tags: ["Kuro vagystė"], 
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
    nationality: "UA",
    category: "technical_damage", 
    subcategory: "Transporto priemonės ar įrangos tyčinis sugadinimas", 
    tags: ["Techninis neatsakingumas"], 
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
    subcategory: "Vėlavimai / darbo laiko nesilaikymas", 
    tags: ["Neatsakingas požiūris į darbą"], 
    comment: "Vėlavo pristatyti krovinį 2 valandas be pateisinamos priežasties, grubiai bendravo su sandėlio darbuotojais.",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "angry driver",
    createdAt: new Date("2024-03-01T11:00:00Z"),
  },
];


// Helper for destructive categories, might need adjustment based on new IDs
export const DESTRUCTIVE_REPORT_MAIN_CATEGORIES: string[] = ['fuel_theft', 'discipline', 'technical_damage', 'driving_safety'];


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

const LOCAL_STORAGE_REPORTS_KEY = 'driverCheckReports'; 
const LOCAL_STORAGE_SEARCH_LOGS_KEY = 'driverCheckSearchLogs'; 


export function getReportsFromLocalStoragePublic(): Report[] {
  if (typeof window !== 'undefined') {
    const reportsJSON = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
    if (reportsJSON) {
      return JSON.parse(reportsJSON).map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt),
      }));
    }
  }
  return [];
}

export function saveReportsToLocalStoragePublic(reports: Report[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reports));
  }
}

export function getSearchLogsFromLocalStoragePublic(): SearchLog[] {
  if (typeof window !== 'undefined') {
    const logsJSON = localStorage.getItem(LOCAL_STORAGE_SEARCH_LOGS_KEY);
    if (logsJSON) {
      return JSON.parse(logsJSON).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    }
  }
  return [];
}

export function saveSearchLogsToLocalStoragePublic(logs: SearchLog[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_SEARCH_LOGS_KEY, JSON.stringify(logs));
  }
}


export const MOCK_USER_SEARCH_LOGS: SearchLog[] = [
  { id: "log1-mock-user", userId: MOCK_USER.id, searchText: "Jonas Jonaitis paieška", timestamp: new Date("2024-04-10T10:00:00Z"), resultsCount: 1 },
  { id: "log2-mock-user", userId: MOCK_USER.id, searchText: "Pavojingas vairavimas", timestamp: new Date("2024-04-09T11:20:00Z"), resultsCount: 1 },
  { id: "log3-mock-user", userId: MOCK_USER.id, searchText: "Antanas Antanaitis", timestamp: new Date("2024-04-08T15:30:00Z"), resultsCount: 1 },
];
    

  