
export interface UserProfile {
  id: string;
  companyName: string;
  companyCode: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentStatus: 'active' | 'inactive' | 'pending_verification';
  // Raw Firebase User object can be included if needed
  // firebaseUser?: any; 
}

export interface Report {
  id: string;
  reporterId: string; // links to UserProfile.id
  reporterCompanyName?: string; // Denormalized for display
  fullName: string; // Full name of the person being reported
  birthYear?: number;
  category: string; // e.g., 'fuel_theft', 'equipment_damage', 'misconduct'
  tags: string[];
  comment: string;
  imageUrl?: string;
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
  | 'zala_irangai' 
  | 'netinkamas_elgesys' 
  | 'greicio_virijimas'
  | 'kita';

export const reportCategories: { value: ReportCategory, label: string }[] = [
  { value: 'kuro_vagyste', label: 'Kuro vagystė' },
  { value: 'zala_irangai', label: 'Žala įrangai' },
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

// Mock user for development
export const MOCK_USER: UserProfile = {
  id: 'dev-user-123',
  companyName: 'UAB "Bandomoji Įmonė"',
  companyCode: '123456789',
  address: 'Vilniaus g. 1, Vilnius',
  contactPerson: 'Vardenis Pavardenis',
  email: 'test@example.com',
  phone: '+37060012345',
  paymentStatus: 'active',
};
